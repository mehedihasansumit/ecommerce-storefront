import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  color?: string;
  showCount?: boolean;
}

export function StarRating({
  rating,
  count,
  size = 12,
  color = "#FBBF24",
  showCount = false,
}: StarRatingProps) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }, (_, i) => {
        let name: React.ComponentProps<typeof Ionicons>["name"] = "star-outline";
        if (i < full) name = "star";
        else if (i === full && half) name = "star-half";
        return <Ionicons key={i} name={name} size={size} color={color} />;
      })}
      {showCount && count != null && (
        <Text style={[styles.count, { fontSize: size - 1 }]}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 1 },
  count: { color: "#9CA3AF", marginLeft: 3 },
});
