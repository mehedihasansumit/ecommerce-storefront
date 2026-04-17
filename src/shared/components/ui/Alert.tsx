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
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: Info,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    icon: CheckCircle2,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: TriangleAlert,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
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
