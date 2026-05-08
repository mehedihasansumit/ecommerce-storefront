/**
 * LourHausLogo — the dial mark, theme-aware.
 *
 * Usage:
 *   <LourHausLogo size={40} />               // full dial, follows OS theme
 *   <LourHausLogo size={32} variant="mark" /> // pediment-only icon
 *   <LourHausLogo size={64} theme="dark" />   // force dark variant
 */

import Image from "next/image";

type Variant = "dial" | "mark";
type Theme = "light" | "dark" | "auto";

interface Props {
  size?: number;
  variant?: Variant;
  theme?: Theme;
  className?: string;
  priority?: boolean;
}

const SRC: Record<Variant, Record<"light" | "dark", string>> = {
  dial: {
    light: "/lour-haus/lh-dial-light.svg",
    dark: "/lour-haus/lh-dial-dark.svg",
  },
  mark: {
    light: "/lour-haus/lh-mark-light.svg",
    dark: "/lour-haus/lh-mark-dark.svg",
  },
};

export default function LourHausLogo({
  size = 40,
  variant = "dial",
  theme = "auto",
  className,
  priority,
}: Props) {
  if (theme === "auto") {
    return (
      <span
        className={className}
        style={{ display: "inline-block", width: size, height: size }}
        aria-label="lour haus"
        role="img"
      >
        <Image
          src={SRC[variant].light}
          alt=""
          width={size}
          height={size}
          priority={priority}
          className="block dark:hidden"
        />
        <Image
          src={SRC[variant].dark}
          alt=""
          width={size}
          height={size}
          priority={priority}
          className="hidden dark:block"
        />
      </span>
    );
  }

  return (
    <Image
      src={SRC[variant][theme]}
      alt="lour haus"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
