import "dotenv/config";
import postgres from "postgres";
import { rewriteMediaUrls } from "../src/shared/lib/media-url-rewrite";

/**
 * Points stored media references at the bucket's public CDN domain (Cloudflare R2
 * custom domain) instead of the app's /api/media proxy. New uploads already get
 * the public URL from storage.publicUrlFor once S3_PUBLIC_URL is set; this moves
 * the rows written before that.
 *
 * Finds every text / varchar / text[] / jsonb column in the public schema that
 * holds "/api/media/" and rewrites those values in one transaction. External URLs
 * and already-rewritten values are left alone, so a second run changes nothing.
 *
 * Run after the objects are in R2 (scripts/copy-media-to-r2.ts) and after a
 * pg_dump. Dry run first.
 *
 * Usage:
 *   S3_PUBLIC_URL=https://media.example.com npx tsx scripts/rewrite-media-urls.ts --allow-db=<db> --dry-run
 *   S3_PUBLIC_URL=https://media.example.com npx tsx scripts/rewrite-media-urls.ts --allow-db=<db>
 */

const MARKER = "/api/media/";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const allowDb = args.find((a) => a.startsWith("--allow-db="))?.slice("--allow-db=".length);
  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");

  if (!publicBase || !/^https?:\/\//.test(publicBase)) {
    console.error("S3_PUBLIC_URL must be set to the bucket's public base URL (https://...).");
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  const dbName = url ? decodeURIComponent(new URL(url).pathname.slice(1)) : "";
  if (!dbName || dbName !== allowDb) {
    console.error(`Refusing to run against "${dbName || "?"}". Pass --allow-db=${dbName || "<db>"} to confirm.`);
    process.exit(1);
  }

  const sql = postgres(url!, { max: 1 });
  try {
    const columns = await sql<{ table_name: string; column_name: string; data_type: string }[]>`
      select table_name, column_name, data_type
      from information_schema.columns
      where table_schema = 'public'
        and data_type in ('text', 'character varying', 'jsonb', 'ARRAY')
        and table_name not like '__drizzle%'
      order by table_name, column_name`;

    let total = 0;
    await sql.begin(async (tx) => {
      for (const { table_name: table, column_name: column, data_type: type } of columns) {
        const rows = await tx.unsafe<{ id: string; value: unknown }[]>(
          `select ctid::text as id, "${column}" as value from "${table}" where "${column}"::text like $1`,
          [`%${MARKER}%`]
        );
        let changed = 0;
        for (const row of rows) {
          const next = rewriteMediaUrls(row.value, publicBase);
          if (JSON.stringify(next) === JSON.stringify(row.value)) continue;
          changed++;
          if (dryRun) continue;
          const param = type === "jsonb" ? tx.json(next as never) : (next as string | string[]);
          await tx.unsafe(`update "${table}" set "${column}" = $1 where ctid = $2::tid`, [param as never, row.id]);
        }
        if (changed) console.log(`${table}.${column}: ${changed} row(s)`);
        total += changed;
      }
      if (dryRun) throw new DryRun();
    }).catch((err) => {
      if (!(err instanceof DryRun)) throw err;
    });

    console.log(`${dryRun ? "[dry run] would rewrite" : "Rewrote"} ${total} value(s) to ${publicBase}/...`);
  } finally {
    await sql.end();
  }
}

class DryRun extends Error {}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
