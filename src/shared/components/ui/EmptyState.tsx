import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
          <Icon size={22} />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
