import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Dimensions, type DimensionValue, type ViewStyle } from "react-native";

const { width: SW } = Dimensions.get("window");

interface SkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <View style={[{ width, height, borderRadius, overflow: "hidden" }, style]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "#E5E7EB", opacity }]}
      />
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={sk.card}>
      <Skeleton width="100%" height={160} borderRadius={0} />
      <View style={sk.cardInfo}>
        <Skeleton width="80%" height={13} />
        <Skeleton width="55%" height={13} />
        <Skeleton width="40%" height={16} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function SkeletonHero() {
  return <Skeleton width="100%" height={SW * 0.55} borderRadius={0} />;
}

export function SkeletonOrderRow() {
  return (
    <View style={sk.orderRow}>
      <View style={sk.orderRowTop}>
        <Skeleton width={110} height={14} />
        <Skeleton width={90} height={24} borderRadius={12} />
      </View>
      <Skeleton width={130} height={12} style={{ marginTop: 8 }} />
      <Skeleton width="90%" height={12} style={{ marginTop: 6 }} />
      <Skeleton width={80} height={16} style={{ marginTop: 10 }} />
    </View>
  );
}

const sk = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
  },
  cardInfo: { padding: 12, gap: 8 },
  orderRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
