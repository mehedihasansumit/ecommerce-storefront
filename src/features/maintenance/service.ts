import {
  listFiles,
  deleteFile,
  variantKey,
  urlToKey,
} from "@/shared/lib/storage";
import { MaintenanceRepository } from "./repository";
import type { ScanResult, DeleteResult } from "./types";

const VARIANT_SUFFIXES = ["w400", "w800", "w1200", "w2000"] as const;

// Skip blobs modified within this window — protects files that were just
// uploaded but not yet saved to a DB record (upload-then-save flow).
const AGE_GUARD_MS = 24 * 60 * 60 * 1000;

/**
 * Builds the set of object-storage keys still referenced by the database.
 * Each raw value (URL, bare key, or JSON-stringified blob) is tokenized and each
 * token run through urlToKey. For every resolved original key, the derived variant
 * keys are also added so responsive variants are never treated as orphans.
 */
function buildReferencedSet(rawValues: string[]): Set<string> {
  const referenced = new Set<string>();
  const add = (key: string) => {
    referenced.add(key);
    for (const suffix of VARIANT_SUFFIXES) {
      referenced.add(variantKey(key, suffix));
    }
  };

  for (const raw of rawValues) {
    // Direct value (bare key or single URL)
    const direct = urlToKey(raw);
    if (direct) add(direct);

    // Embedded references inside HTML / JSON / multi-value strings
    for (const token of raw.split(/[\s"'<>()\\[\],]+/)) {
      if (!token) continue;
      const key = urlToKey(token);
      if (key) add(key);
    }
  }

  return referenced;
}

export const MaintenanceService = {
  async scanOrphans({ storeId }: { storeId?: string }): Promise<ScanResult> {
    const rawValues = await MaintenanceRepository.collectReferencedValues(storeId);
    const referenced = buildReferencedSet(rawValues);

    const blobs = await listFiles(storeId ? `${storeId}/` : undefined);

    // Safety guard: refuse to report everything as orphan when the reference set is
    // empty but the bucket has objects — this usually means a failed/empty DB read.
    if (referenced.size === 0 && blobs.length > 0) {
      throw new Error(
        "No referenced files found while storage is non-empty — aborting to avoid deleting in-use files."
      );
    }

    const cutoff = Date.now() - AGE_GUARD_MS;
    const orphans = blobs.filter((b) => {
      if (referenced.has(b.key)) return false;
      const modified = b.lastModified ? b.lastModified.getTime() : 0;
      return modified < cutoff;
    });

    const totalBytes = orphans.reduce((sum, b) => sum + b.size, 0);

    return {
      orphans,
      totalBytes,
      referencedCount: referenced.size,
      scannedCount: blobs.length,
    };
  },

  async deleteOrphans({
    storeId,
    keys,
  }: {
    storeId?: string;
    keys: string[];
  }): Promise<DeleteResult> {
    // Recompute the reference set as a defense against races (a record saved
    // between scan and delete must not have its blob removed).
    const rawValues = await MaintenanceRepository.collectReferencedValues(storeId);
    const referenced = buildReferencedSet(rawValues);

    const blobs = await listFiles(storeId ? `${storeId}/` : undefined);
    const blobMeta = new Map(blobs.map((b) => [b.key, b]));
    const cutoff = Date.now() - AGE_GUARD_MS;

    let deleted = 0;
    let skipped = 0;
    const toDelete: string[] = [];

    for (const key of keys) {
      // Respect store scope when one is set.
      if (storeId && !key.startsWith(`${storeId}/`)) {
        skipped++;
        continue;
      }
      if (referenced.has(key)) {
        skipped++;
        continue;
      }
      const meta = blobMeta.get(key);
      const modified = meta?.lastModified ? meta.lastModified.getTime() : 0;
      if (modified >= cutoff) {
        // newer than guard window (or no longer present) — skip
        skipped++;
        continue;
      }
      toDelete.push(key);
    }

    const results = await Promise.allSettled(toDelete.map((k) => deleteFile(k)));
    for (const r of results) {
      if (r.status === "fulfilled") deleted++;
      else skipped++;
    }

    return { deleted, skipped };
  },
};
