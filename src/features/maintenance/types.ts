export interface OrphanBlob {
  key: string;
  size: number;
  lastModified?: Date;
}

export interface ScanResult {
  orphans: OrphanBlob[];
  totalBytes: number;
  referencedCount: number;
  scannedCount: number;
}

export interface DeleteResult {
  deleted: number;
  skipped: number;
}
