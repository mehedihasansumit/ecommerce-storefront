"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Search, Trash2, HardDrive } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  Select,
  Field,
  Badge,
  EmptyState,
  ConfirmDialog,
  PageHeader,
} from "@/shared/components/ui";
import type { OrphanBlob, ScanResult } from "../types";

interface StoreOption {
  id: string;
  name: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function BlobCleanupClient({ stores }: { stores: StoreOption[] }) {
  const [storeId, setStoreId] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleScan() {
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/maintenance/blobs/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeId ? { storeId } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResult(data as ScanResult);
      if (data.orphans.length === 0) {
        toast.success("No unused files found");
      } else {
        toast.success(`Found ${data.orphans.length} unused file(s)`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function handleDelete() {
    if (!result || result.orphans.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/maintenance/blobs/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(storeId ? { storeId } : {}),
          keys: result.orphans.map((o) => o.key),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success(
        `Deleted ${data.deleted} file(s)${data.skipped ? `, skipped ${data.skipped}` : ""}`
      );
      setResult(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const orphans: OrphanBlob[] = result?.orphans ?? [];

  return (
    <div>
      <PageHeader
        title="Storage Cleanup"
        description="Find and remove uploaded files no longer referenced by any product, store, category, or campaign. Files modified in the last 24 hours are skipped."
      />

      <Card padding="lg" className="mb-6">
        <CardHeader
          title="Scan for unused files"
          description="Choose a store to scan, or scan all stores at once."
        />
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-sm">
            <Field label="Store">
              <Select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                disabled={scanning || deleting}
              >
                <option value="">All stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button
            variant="primary"
            leftIcon={<Search size={16} />}
            onClick={handleScan}
            loading={scanning}
          >
            Scan
          </Button>
        </div>
      </Card>

      {result && (
        <Card padding="lg">
          <CardHeader
            title="Results"
            description={`Scanned ${result.scannedCount} file(s) · ${result.referencedCount} referenced key(s)`}
            action={
              orphans.length > 0 ? (
                <Button
                  variant="danger-outline"
                  leftIcon={<Trash2 size={16} />}
                  onClick={() => setConfirmOpen(true)}
                  loading={deleting}
                >
                  Delete {orphans.length} file(s)
                </Button>
              ) : undefined
            }
          />

          {orphans.length === 0 ? (
            <EmptyState
              icon={HardDrive}
              title="No unused files"
              description="Every file in storage is referenced by a record."
            />
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Badge>{orphans.length} unused</Badge>
                <Badge>{formatBytes(result.totalBytes)} reclaimable</Badge>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2">Key</th>
                      <th className="px-3 py-2 text-right">Size</th>
                      <th className="px-3 py-2 text-right">Last modified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {orphans.map((o) => (
                      <tr key={o.key}>
                        <td className="px-3 py-2 font-mono text-xs break-all text-gray-700 dark:text-gray-300">
                          {o.key}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap text-gray-500">
                          {formatBytes(o.size)}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap text-gray-500">
                          {o.lastModified
                            ? new Date(o.lastModified).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        tone="danger"
        title="Delete unused files?"
        description={`This permanently deletes ${orphans.length} file(s) (${formatBytes(
          result?.totalBytes ?? 0
        )}) from storage. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
