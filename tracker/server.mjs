// @ts-check
/**
 * Visit tracker: answers POST /api/track without going through Next.js
 * (ADR 0006). Next's own overhead is ~2.5 ms of CPU per request, so tracking
 * through it topped out near 500 requests/s on this 2-core server; this plain
 * Node server does the same job in a fraction of that.
 *
 * Nginx sends /api/track here and falls back to the Next app's route if this
 * process is down, so tracking never breaks the storefront.
 *
 * Env: DATABASE_URL, JWT_SECRET, TRACKER_PORT (default 5003).
 */
import http from "node:http";
import postgres from "postgres";
import { jwtVerify } from "jose";
import { buildDomainMap, customerIdFor, hostnameOf, parseEvents, readCookie } from "./core.mjs";

const PORT = Number(process.env.TRACKER_PORT) || 5003;
const FLUSH_MS = 2000;
const MAX_BATCH = 1000;
const MAX_BODY_BYTES = 32 * 1024;
const DOMAINS_REFRESH_MS = 60_000;
const UNKNOWN_HOST_REFRESH_MS = 10_000;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const sql = postgres(process.env.DATABASE_URL, { max: 2, idle_timeout: 30, connect_timeout: 10, prepare: false });
const jwtKey = process.env.JWT_SECRET ? new TextEncoder().encode(process.env.JWT_SECRET) : null;
if (!jwtKey) console.warn("[tracker] JWT_SECRET not set: every event is saved as anonymous");

// ---------- stores: hostname -> storeId, refreshed every minute ----------

/** @type {Map<string, string>} */
let domains = new Map();
let domainsLoadedAt = 0;

async function loadDomains() {
  try {
    const rows = await sql`select id, domains from stores where is_active = true`;
    domains = buildDomainMap(rows);
    domainsLoadedAt = Date.now();
  } catch (err) {
    console.error("[tracker] could not load store domains:", err instanceof Error ? err.message : err);
  }
}

async function storeIdFor(host) {
  const hostname = hostnameOf(host);
  let id = domains.get(hostname);
  // A store added in the last minute: look again, but not more than every 10 s.
  if (!id && Date.now() - domainsLoadedAt > UNKNOWN_HOST_REFRESH_MS) {
    await loadDomains();
    id = domains.get(hostname);
  }
  return id ?? null;
}

// ---------- events: buffered, one INSERT every FLUSH_MS ----------

/** @type {import("./core.mjs").TrackRow[]} */
let buffer = [];
let flushing = false;

async function flush() {
  if (flushing || buffer.length === 0) return;
  flushing = true;
  const batch = buffer.splice(0, MAX_BATCH);
  try {
    const rows = batch.map((e) => ({
      store_id: e.storeId,
      event_type: e.eventType,
      product_id: e.productId,
      product_name: e.productName,
      category_id: e.categoryId,
      search_query: e.searchQuery,
      session_id: e.sessionId,
      user_id: e.userId,
    }));
    await sql`insert into activity_events ${sql(rows)}`;
  } catch (err) {
    console.error(`[tracker] dropped ${batch.length} events:`, err instanceof Error ? err.message : err);
  } finally {
    flushing = false;
  }
  if (buffer.length >= MAX_BATCH) void flush();
}

// ---------- HTTP ----------

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function userIdFor(cookieHeader, storeId) {
  const token = readCookie(cookieHeader, "customer-token");
  if (!token || !jwtKey) return null;
  try {
    const { payload } = await jwtVerify(token, jwtKey);
    return customerIdFor(payload, storeId);
  } catch {
    return null;
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/healthz") return send(res, 200, { ok: true, buffered: buffer.length });
  if (req.method !== "POST" || !req.url?.startsWith("/api/track")) return send(res, 404, { ok: false });

  let size = 0;
  /** @type {Buffer[]} */
  const chunks = [];
  req.on("data", (c) => {
    size += c.length;
    if (size > MAX_BODY_BYTES) {
      send(res, 413, { ok: false });
      req.destroy();
    } else chunks.push(c);
  });
  req.on("end", async () => {
    if (res.writableEnded) return;
    try {
      const storeId = await storeIdFor(req.headers.host);
      if (!storeId) return send(res, 400, { ok: false });
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "null");
      const rows = parseEvents(body, storeId, await userIdFor(req.headers.cookie, storeId));
      if (!rows) return send(res, 400, { ok: false });
      buffer.push(...rows);
      if (buffer.length >= MAX_BATCH) void flush();
      send(res, 202, { ok: true });
    } catch {
      send(res, 400, { ok: false });
    }
  });
});

await loadDomains();
setInterval(() => void loadDomains(), DOMAINS_REFRESH_MS).unref();
setInterval(() => void flush(), FLUSH_MS).unref();
server.listen(PORT, "127.0.0.1", () => console.log(`[tracker] listening on 127.0.0.1:${PORT}`));

// Deploys stop the container with SIGTERM: save what is buffered first.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, async () => {
    server.close();
    for (let i = 0; i < 50 && (buffer.length > 0 || flushing); i++) {
      if (flushing) await new Promise((r) => setTimeout(r, 100));
      else await flush();
    }
    await sql.end({ timeout: 5 });
    process.exit(0);
  });
}
