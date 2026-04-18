import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

type Tone = "info" | "success" | "warning" | "error";

interface AlertProps {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const TONES: Record<Tone, { bg: string; border: string; text: string; icon: typeof Info }> = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-800 dark:text-blue-300",
    icon: Info,
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-300",
    icon: TriangleAlert,
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: AlertCircle,
  },
};

export function Alert({ tone = "info", title, children, icon, className }: AlertProps) {
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={[
        "flex gap-2.5 p-3 border rounded-lg text-sm",
        t.bg,
        t.border,
        t.text,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="shrink-0 pt-0.5">{icon ?? <Icon size={16} />}</div>
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-sm leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
