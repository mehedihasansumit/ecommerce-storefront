"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Upload, Link2, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "./Input";

type Mode = "upload" | "url";

export interface UploadedImage {
  url: string;
  key?: string;
  width?: number;
  height?: number;
  variants?: Record<string, string>;
}

interface ImageInputProps {
  value: string;
  onChange: (url: string, meta?: Omit<UploadedImage, "url">) => void;
  storeId: string;
  folder: "products" | "categories" | "stores" | "banners";
  label?: string;
  hint?: string;
  error?: string;
  aspect?: "square" | "16/9" | "auto";
  disabled?: boolean;
}

const ASPECT: Record<NonNullable<ImageInputProps["aspect"]>, string> = {
  square: "aspect-square",
  "16/9": "aspect-video",
  auto: "aspect-[4/3]",
};

export function ImageInput({
  value,
  onChange,
  storeId,
  folder,
  label,
  hint,
  error,
  aspect = "auto",
  disabled,
}: ImageInputProps) {
  const [mode, setMode] = useState<Mode>(value ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("storeId", storeId);
      body.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url, {
        key: data.key,
        width: data.width,
        height: data.height,
        variants: data.variants,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function clear() {
    onChange("");
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="inline-flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg text-xs">
        <TabButton active={mode === "upload"} onClick={() => setMode("upload")}>
          <Upload size={12} /> Upload
        </TabButton>
        <TabButton active={mode === "url"} onClick={() => setMode("url")}>
          <Link2 size={12} /> URL
        </TabButton>
      </div>

      {value && (
        <div
          className={`relative group w-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${ASPECT[aspect]}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={clear}
              aria-label="Remove image"
              className="absolute top-1 right-1 w-6 h-6 bg-white/90 hover:bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {mode === "upload" ? (
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
            "flex flex-col items-center justify-center gap-1 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            dragActive
              ? "border-gray-500 bg-gray-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
            uploading || disabled ? "opacity-60 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin text-gray-500" />
              <span className="text-xs text-gray-500">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={18} className="text-gray-400" />
              <span className="text-xs text-gray-600">
                Drop image or click to upload
              </span>
              <span className="text-[10px] text-gray-400">
                PNG, JPG, WebP, AVIF · max 5MB
              </span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
            disabled={disabled || uploading}
          />
        </div>
      ) : (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          disabled={disabled}
        />
      )}

      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors",
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
