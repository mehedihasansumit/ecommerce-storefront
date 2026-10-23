import "dotenv/config";
import { StoreService } from "../src/features/stores/service";
import {
  applyThemePins,
  computeDroppedLegacyPins,
  computeLegacyThemePins,
  removeThemePins,
} from "../src/features/stores/legacy-theme";

/**
 * Keep the pre-redesign success, error and sale-badge colours on EXISTING stores;
 * stores created later get the new defaults. Every other colour (on-primary, muted
 * text, card/surface, link, price...) takes the new contrast-safe value.
 *
 * For each store, each of those colours the store has not set itself and whose value
 * changed is written into the store's theme (light and `dark`). Colours a store already
 * sets are never touched. Idempotent: a second run changes nothing.
 *
 * --remove-dropped-pins: also remove what the first, wider version of this script
 * pinned (on-primary, muted text, cards, link, ...). A value is removed only when it
 * exactly equals what that version wrote. Use it only on a DB where that version ran
 * (ecommerce_uux); production never ran it.
 *
 * Merge-time data migration for production: dry-run first, then run with --allow-db.
 *
 * Usage:
 *   npx tsx scripts/pin-legacy-theme-defaults.ts --dry-run
 *   npx tsx scripts/pin-legacy-theme-defaults.ts
 *   npx tsx scripts/pin-legacy-theme-defaults.ts --remove-dropped-pins [--dry-run]
 *   npx tsx scripts/pin-legacy-theme-defaults.ts --allow-db=<db name>   # any DB other than ecommerce_uux
 */

const DEFAULT_ALLOWED_DB = "ecommerce_uux";

function databaseName(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, "")) || null;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const removeDropped = args.includes("--remove-dropped-pins");
  const allowDb = args.find((a) => a.startsWith("--allow-db="))?.slice("--allow-db=".length);

  const dbName = databaseName(process.env.DATABASE_URL);
  if (!dbName) {
    console.error("DATABASE_URL is missing or has no database name.");
    process.exit(1);
  }
  if (dbName !== DEFAULT_ALLOWED_DB && dbName !== allowDb) {
    console.error(
      `Refusing to run against database "${dbName}". Only "${DEFAULT_ALLOWED_DB}" is allowed by default; ` +
        `pass --allow-db=${dbName} to confirm.`
    );
    process.exit(1);
  }

  console.log(`${dryRun ? "[dry run] " : ""}Database: ${dbName}`);
  const stores = await StoreService.getAll();
  let changedStores = 0;

  for (const store of stores) {
    const show = (mode: "light" | "dark", key: string) => {
      const src = (mode === "dark" ? store.theme.dark : store.theme) as Record<string, unknown> | undefined;
      return (src?.[key] as string | undefined) ?? "(unset)";
    };
    const removed = removeDropped ? computeDroppedLegacyPins(store.theme) : { light: {}, dark: {} };
    const base = removeThemePins(store.theme, removed);
    const pins = computeLegacyThemePins(base);

    const lines: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      for (const k of Object.keys(removed[mode])) lines.push(`    remove ${mode}.${k}: ${show(mode, k)} -> (unset)`);
      for (const [k, v] of Object.entries(pins[mode])) lines.push(`    pin    ${mode}.${k}: ${show(mode, k)} -> ${v}`);
    }
    if (lines.length === 0) {
      console.log(`- ${store.slug}: nothing to change`);
      continue;
    }
    changedStores++;
    console.log(`- ${store.slug}:`);
    for (const l of lines) console.log(l);
    if (!dryRun) {
      await StoreService.update(store._id, { theme: applyThemePins(base, pins) });
    }
  }

  console.log(
    `${dryRun ? "[dry run] would update" : "Updated"} ${changedStores} of ${stores.length} store(s).`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
