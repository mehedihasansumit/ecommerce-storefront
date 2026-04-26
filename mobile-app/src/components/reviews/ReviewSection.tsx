import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useReviews, useCreateReview, useReviewEligibility } from "@/hooks/useReviews";
import { useAuthStore } from "@/store/auth.store";
import { useTenantStore } from "@/store/tenant.store";
import type { IReview } from "@/shared/types/review";

function StarRow({
  rating,
  onPress,
  size = 16,
  color = "#FBBF24",
}: {
  rating: number;
  onPress?: (r: number) => void;
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onPress?.(n)}
          disabled={!onPress}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Text style={{ fontSize: size, color: n <= rating ? color : "#D1D5DB" }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: IReview }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.reviewerName}>{review.reviewerName}</Text>
        <StarRow rating={review.rating} size={12} />
      </View>
      {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
      <Text style={styles.reviewComment}>{review.comment}</Text>
      <Text style={styles.reviewDate}>
        {new Date(review.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
}

function WriteReviewForm({
  productId,
  primaryColor,
  onSuccess,
}: {
  productId: string;
  primaryColor: string;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const { mutateAsync, isPending } = useCreateReview(productId);

  async function submit() {
    if (!comment.trim()) {
      setError("Comment is required");
      return;
    }
    setError("");
    try {
      await mutateAsync({ rating, title: title.trim(), comment: comment.trim() });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to submit review");
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Write a Review</Text>

      <View style={styles.formRow}>
        <Text style={styles.formLabel}>Rating</Text>
        <StarRow rating={rating} onPress={setRating} size={24} color={primaryColor} />
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Title (optional)</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Summarize your experience"
          maxLength={80}
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.formLabel}>Comment *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={comment}
          onChangeText={setComment}
          placeholder="Share your thoughts..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: primaryColor }, isPending && styles.disabled]}
        onPress={submit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function ReviewSection({
  productId,
  primaryColor,
}: {
  productId: string;
  primaryColor: string;
}) {
  const { data: reviews, isLoading } = useReviews(productId);
  const { data: eligibility } = useReviewEligibility(productId);
  const isLoggedIn = !!useAuthStore((s) => s.user);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.section}>
        <ActivityIndicator color={primaryColor} />
      </View>
    );
  }

  const approved = (reviews ?? []).filter((r) => r.isApproved);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Reviews {approved.length > 0 ? `(${approved.length})` : ""}
        </Text>
        {isLoggedIn && eligibility?.eligible && !showForm && (
          <TouchableOpacity onPress={() => setShowForm(true)}>
            <Text style={[styles.writeLink, { color: primaryColor }]}>Write Review</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <WriteReviewForm
          productId={productId}
          primaryColor={primaryColor}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {approved.length === 0 && !showForm && (
        <Text style={styles.empty}>No reviews yet. Be the first!</Text>
      )}

      {approved.map((review) => (
        <ReviewCard key={review._id} review={review} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: 20, borderTopWidth: 1, borderTopColor: "#F3F4F6", gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  writeLink: { fontSize: 13, fontWeight: "600" },
  empty: { fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingVertical: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 10,
    padding: 14,
    gap: 4,
    backgroundColor: "#FAFAFA",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewerName: { fontSize: 13, fontWeight: "700", color: "#111827" },
  reviewTitle: { fontSize: 13, fontWeight: "600", color: "#374151" },
  reviewComment: { fontSize: 13, color: "#6B7280", lineHeight: 20 },
  reviewDate: { fontSize: 11, color: "#9CA3AF" },
  form: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  formTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  formRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formField: { gap: 4 },
  formLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  errorText: { fontSize: 12, color: "#EF4444" },
  submitBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.6 },
});
