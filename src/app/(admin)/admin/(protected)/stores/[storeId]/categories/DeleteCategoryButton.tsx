"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryButton({ categoryId, categoryName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${categoryName}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete category.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-admin-text-subtle hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
      title="Delete category"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
