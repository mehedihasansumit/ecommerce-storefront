import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, type ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type ButtonVariant = "primary" | "brand" | "secondary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const bg =
    variant === "primary" ? "#111827" :
    variant === "brand"   ? theme.primaryColor :
    variant === "danger"  ? "#EF4444" :
    theme.cardBg;

  const textColor =
    variant === "secondary" ? theme.primaryColor : "#fff";

  const borderStyle =
    variant === "secondary"
      ? { borderWidth: 1.5, borderColor: "#E5E7EB" }
      : {};

  const pad =
    size === "sm" ? { paddingVertical: 8,  paddingHorizontal: 16 } :
    size === "lg" ? { paddingVertical: 16, paddingHorizontal: 24 } :
                    { paddingVertical: 14, paddingHorizontal: 20 };

  const fontSize = size === "sm" ? 13 : size === "lg" ? 16 : 15;
  const fontWeight = size === "sm" ? "600" : "700";

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        pad,
        { backgroundColor: bg },
        borderStyle,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.label, { color: textColor, fontSize, fontWeight }]}>
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
  },
  label: {
    letterSpacing: -0.1,
  },
  disabled: {
    opacity: 0.5,
  },
});
