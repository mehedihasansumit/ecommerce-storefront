"use client";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  bn: "বাংলা",
};

interface LangTabsProps {
  languages: string[];
  active: string;
  onChange: (lang: string) => void;
  labels?: Record<string, string>;
  className?: string;
}

export function LangTabs({
  languages,
  active,
  onChange,
  labels,
  className,
}: LangTabsProps) {
  if (languages.length <= 1) return null;
  const map = { ...LANGUAGE_LABELS, ...labels };

  return (
    <div
      role="tablist"
      className={[
        "flex gap-1 border-b border-gray-200",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {languages.map((lang) => {
        const isActive = lang === active;
        return (
          <button
            key={lang}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(lang)}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {map[lang] ?? lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
