"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Upload, Link2, X, Loader2, GripVertical } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "./Input";
import { Button } from "./Button";

export interface GalleryImage {
  url: string;
  alt: string;
  key?: string;
  width?: number;
  height?: number;
  variants?: Record<string, string>;
}

interface ImageGalleryInputProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  storeId: string;
  folder: "products" | "categories" | "stores" | "banners";
  label?: string;
  hint?: string;
  defaultAlt?: string;
  max?: number;
  disabled?: boolean;
}

export function ImageGalleryInput({
  value,
  onChange,
  storeId,
  folder,
  label,
  hint,
  defaultAlt = "",
  max,
  disabled,
}: ImageGalleryInputProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const atMax = typeof max === "number" && value.length >= max;

  async function uploadMany(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    const added: GalleryImage[] = [];
    try {
      for (const file of files) {
        if (typeof max === "number" && value.length + added.length >= max) break;
        const body = new FormData();
        body.append("file", file);
        body.append("storeId", storeId);
        body.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Failed: ${file.name}`);
          continue;
        }
        added.push({
          url: data.url,
          alt: defaultAlt,
          key: data.key,
          width: data.width,
          height: data.height,
          variants: data.variants,
        });
      }
      if (added.length) onChange([...value, ...added]);
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    uploadMany(files);
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    uploadMany(files);
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (atMax) return;
    onChange([...value, { url, alt: defaultAlt }]);
    setUrlDraft("");
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateAlt(idx: number, alt: string) {
    onChange(value.map((img, i) => (i === idx ? { ...img, alt } : img)));
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((img, idx) => (
            <li
              key={idx}
              draggable={!disabled}
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) reorder(dragIndex, idx);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className="relative group w-24"
            >
              <div className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <Input
                value={img.alt}
                onChange={(e) => updateAlt(idx, e.target.value)}
                placeholder="Alt text"
                className="mt-1 !text-xs !py-1"
              />
              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    aria-label="Remove image"
                    className="absolute top-1 right-1 w-5 h-5 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                  <div
                    className="absolute top-1 left-1 w-5 h-5 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 cursor-grab"
                    title="Drag to reorder"
                  >
                    <GripVertical size={10} />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!atMax && (
        <>
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => !disabled && !uploading && fileRef.current?.click()}
            className={[
              "flex flex-col items-center justify-center gap-1 px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              dragActive
                ? "border-gray-500 bg-gray-50"
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
              uploading || disabled ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin text-gray-500" />
                <span className="text-xs text-gray-500">Uploading…</span>
              </>
            ) : (
              <>
                <Upload size={16} className="text-gray-400" />
                <span className="text-xs text-gray-600">
                  Drop images or click to upload (multi)
                </span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onFileChange}
              disabled={disabled || uploading}
            />
          </div>

          <div className="flex gap-2">
            <Input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="…or paste image URL"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addUrl();
                }
              }}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addUrl}
              disabled={disabled || !urlDraft.trim()}
              leftIcon={<Link2 size={14} />}
            >
              Add
            </Button>
          </div>
        </>
      )}

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
