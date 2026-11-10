"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button, ConfirmDialog } from "@/shared/components/ui";

interface Props {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`"${productName}" deleted.`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete product.");
      }
    } catch {
      toast.error("Failed to delete product.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        loading={loading}
        className="text-admin-text-muted hover:text-red-600 dark:hover:text-red-400"
        aria-label={`Delete ${productName}`}
        title="Delete product"
      >
        {!loading && <Trash2 aria-hidden className="w-4 h-4" />}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        tone="danger"
        title="Delete product?"
        description={`"${productName}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}
