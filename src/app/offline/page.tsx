"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-sm">
        <div className="mb-6 flex justify-center">
          <svg
            className="w-24 h-24 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12v.01M9.172 9.172A4 4 0 0112 8m0 0a4 4 0 012.828 1.172M12 8V4m0 16v-4"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re offline
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          No internet connection. Check your network and try again.
        </p>
        <button
          onClick={() => {
            const back = document.referrer && !document.referrer.includes("/offline")
              ? document.referrer
              : "/";
            window.location.href = back;
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          style={{ backgroundColor: "var(--color-primary, #3B82F6)" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
