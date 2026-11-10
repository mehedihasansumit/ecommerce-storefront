"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button, ConfirmDialog } from "@/shared/components/ui";

interface Props {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryButton({ categoryId, categoryName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`"${categoryName}" deleted.`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete category.");
      }
    } catch {
      toast.error("Failed to delete category.");
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
        aria-label={`Delete ${categoryName}`}
        title="Delete category"
      >
        {!loading && <Trash2 aria-hidden className="w-4 h-4" />}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        tone="danger"
        title="Delete category?"
        description={`"${categoryName}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}
