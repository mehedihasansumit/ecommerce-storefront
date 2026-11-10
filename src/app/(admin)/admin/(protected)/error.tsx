"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbError =
    error.message.includes("connect ECONNREFUSED") ||
    error.message.includes("Database connection failed") ||
    error.message.includes("ECONNREFUSED");

  return (
    <div role="alert" className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold tracking-tight text-admin-text-primary mb-2">
          {isDbError ? "Database Unavailable" : "Something went wrong"}
        </h1>
        <p className="text-admin-text-muted text-sm mb-6">
          {isDbError
            ? "Could not connect to the database. Make sure Postgres is running."
            : error.message}
        </p>
        <Button variant="primary" onClick={reset} leftIcon={<RotateCcw size={16} aria-hidden />}>
          Try again
        </Button>
      </div>
    </div>
  );
}
