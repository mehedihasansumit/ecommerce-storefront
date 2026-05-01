import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";

function getStatusColors(
  status: string,
  successColor: string,
  errorColor: string,
  surfaceColor: string,
  textSecondaryColor: string
): { bg: string; text: string } {
  switch (status) {
    case "pending":    return { bg: "#FEF3C7", text: "#92400E" };
    case "confirmed":  return { bg: "#DBEAFE", text: "#1E40AF" };
    case "processing": return { bg: "#EDE9FE", text: "#5B21B6" };
    case "shipped":    return { bg: "#CFFAFE", text: "#0E7490" };
    case "delivered":  return { bg: successColor + "22", text: successColor };
    case "cancelled":  return { bg: errorColor + "18", text: errorColor };
    default:           return { bg: surfaceColor, text: textSecondaryColor };
  }
}

interface StatusPillProps {
  status: string;
  label?: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  const theme = useTheme();
  const c = getStatusColors(status, theme.success, theme.error, theme.surface, theme.textSecondary);

  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>
        {label ?? status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
