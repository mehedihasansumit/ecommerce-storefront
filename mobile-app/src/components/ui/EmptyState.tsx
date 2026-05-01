import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "./Button";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  icon: IoniconsName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
        <Ionicons name={icon} size={48} color={theme.textTertiary} />
      </View>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      {!!description && (
        <Text style={[styles.description, { color: theme.textTertiary }]}>{description}</Text>
      )}
      {!!actionLabel && !!onAction && (
        <Button onPress={onAction} variant="primary" size="md" style={styles.action}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  action: {
    marginTop: 8,
    alignSelf: "center",
    paddingHorizontal: 28,
  },
});
