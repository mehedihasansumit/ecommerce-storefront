import type { HTMLAttributes, ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  children: ReactNode;
}

const PADDINGS: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({ padding = "lg", className, children, ...rest }: CardProps) {
  return (
    <div
      className={[
        "bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700",
        PADDINGS[padding],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, description, action, className, ...rest }: CardHeaderProps) {
  return (
    <div
      className={[
        "flex items-start justify-between gap-4 mb-4",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
