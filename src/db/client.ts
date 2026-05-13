import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __pgClient: ReturnType<typeof postgres> | undefined;
}

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | undefined;

function buildDb(): DrizzleDb {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client =
    global.__pgClient ??
    postgres(url, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
      prepare: false,
    });

  if (process.env.NODE_ENV !== "production") {
    global.__pgClient = client;
  }

  return drizzle(client, { schema, casing: "snake_case" });
}

// Proxy defers DB init to first use — prevents build-time throw when
// DATABASE_URL is not set (Next.js static analysis imports this module).
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    _db ??= buildDb();
    const val = (_db as any)[prop];
    return typeof val === "function" ? val.bind(_db) : val;
  },
});

export type Db = DrizzleDb;
export { schema };
