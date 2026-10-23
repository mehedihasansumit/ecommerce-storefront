"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { Avatar, Button, Modal, type AvatarPosition } from "@/shared/components/ui";

const DEFAULT_POSITION: AvatarPosition = { x: 50, y: 50, zoom: 1 };
const VIEWPORT = 220;

interface AvatarUploaderProps {
  name: string;
  initialUrl: string | null;
  initialPosition: AvatarPosition;
}

export default function AvatarUploader({ name, initialUrl, initialPosition }: AvatarUploaderProps) {
  const t = useTranslations("account");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [position, setPosition] = useState<AvatarPosition>(initialPosition ?? DEFAULT_POSITION);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function openEditor() {
    setUrl(initialUrl);
    setPosition(initialPosition ?? DEFAULT_POSITION);
    setOpen(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/account/avatar/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? t("photoUploadFailed"));
        return;
      }
      setUrl(data.url as string);
      setPosition(DEFAULT_POSITION);
    } catch {
      toast.error(t("photoUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!url) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, baseX: position.x, baseY: position.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragState.current;
    if (!drag) return;
    // Dragging the image right reveals its left side → object-position x decreases.
    const dx = ((e.clientX - drag.startX) / VIEWPORT) * 100;
    const dy = ((e.clientY - drag.startY) / VIEWPORT) * 100;
    setPosition((p) => ({
      ...p,
      x: Math.min(100, Math.max(0, drag.baseX - dx)),
      y: Math.min(100, Math.max(0, drag.baseY - dy)),
    }));
  }

  function onPointerUp() {
    dragState.current = null;
  }

  async function handleSave() {
    if (!url) return;
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url, avatarPosition: position }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? t("photoUploadFailed"));
        return;
      }
      toast.success(t("photoUpdated"));
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t("photoUploadFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="relative group rounded-full focus-ring shrink-0"
        aria-label={t("editPhoto")}
      >
        <Avatar src={initialUrl} position={initialPosition} name={name} size="lg" />
        <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("editPhoto")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button variant="brand" onClick={handleSave} loading={saving} disabled={!url || uploading}>
              {t("savePhoto")}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-4">
          {/* Circular editing viewport */}
          <div
            className="relative overflow-hidden rounded-full border border-border-subtle bg-surface touch-none"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                draggable={false}
                className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                style={{
                  objectPosition: `${position.x}% ${position.y}%`,
                  transform: `scale(${position.zoom})`,
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-tertiary gap-2">
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs">{t("uploadPhoto")}</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {url && <p className="text-xs text-text-tertiary">{t("dragToReposition")}</p>}

          {/* Zoom */}
          {url && (
            <label className="w-full max-w-xs flex items-center gap-3 text-xs text-text-secondary">
              {t("zoom")}
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={position.zoom}
                onChange={(e) => setPosition((p) => ({ ...p, zoom: Number(e.target.value) }))}
                className="flex-1 accent-[var(--color-primary)]"
                aria-label={t("zoom")}
              />
            </label>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={uploading}
            leftIcon={<ImagePlus size={16} />}
          >
            {url ? t("changePhoto") : t("uploadPhoto")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </Modal>
    </>
  );
}
