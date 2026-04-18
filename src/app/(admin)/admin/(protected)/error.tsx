"use client";

import { useEffect } from "react";

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
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold mb-2">
          {isDbError ? "Database Unavailable" : "Something went wrong"}
        </h2>
        <p className="text-admin-text-muted text-sm mb-6">
          {isDbError
            ? "Could not connect to the database. Make sure MongoDB is running."
            : error.message}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
