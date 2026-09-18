import { RatingStars } from '@app/ui-kit';
import React, { useState } from 'react';
import { Button, Text, TextArea, XStack, YStack, Separator } from 'tamagui';

export type ReviewItem = {
  _id: string;
  rating: number;
  text: string;
  helpful: number;
  createdAt: number;
  userId: string;
};

export type Breakdown = {
  average: number;
  count: number;
  distribution: Record<number, number>;
};

export type ReviewSectionProps = {
  productId: string;
  reviews: ReviewItem[] | undefined;
  breakdown: Breakdown | undefined;
  onSubmit: (input: { rating: number; text: string }) => Promise<void>;
  onHelpful: (reviewId: string) => void;
  isAuthenticated: boolean;
};

export function ReviewSection({ reviews, breakdown, onSubmit, onHelpful, isAuthenticated }: ReviewSectionProps) {
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const avg = breakdown?.average ?? 0;
  const count = breakdown?.count ?? 0;

  const handleSubmit = async () => {
    setError(null);
    if (!isAuthenticated) {
      setError('Please log in to submit a review.');
      return;
    }
    if (text.trim().length < 3) {
      setError('Write at least 3 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ rating, text: text.trim() });
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <YStack gap="$3">
      <Text fontSize="$5" fontWeight="700">Ratings & Reviews</Text>

      {count === 0 ? (
        <YStack backgroundColor="$surface" padding="$4" borderRadius="$3" borderWidth={1} borderColor="$borderColor" alignItems="center" gap="$2">
          <RatingStars rating={0} reviewCount={0} />
          <Text color="$textSecondary">No reviews yet — be the first!</Text>
        </YStack>
      ) : (
        <YStack backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor" gap="$2">
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$7" fontWeight="700">{avg.toFixed(1)}</Text>
            <YStack>
              <RatingStars rating={avg} reviewCount={count} />
              <Text fontSize="$2" color="$textSecondary">{count} reviews</Text>
            </YStack>
          </XStack>
          <YStack gap="$1" marginTop="$2">
            {[5, 4, 3, 2, 1].map((star) => {
              const c = breakdown?.distribution?.[star] ?? 0;
              const pct = count > 0 ? (c / count) * 100 : 0;
              return (
                <XStack key={star} alignItems="center" gap="$2">
                  <Text width={30} fontSize="$2">{star} ★</Text>
                  <YStack flex={1} height={8} backgroundColor="$neutral200" borderRadius="$full" overflow="hidden">
                    <YStack width={`${pct}%`} height="100%" backgroundColor="$warning" />
                  </YStack>
                  <Text width={30} fontSize="$2" color="$textSecondary">{c}</Text>
                </XStack>
              );
            })}
          </YStack>
        </YStack>
      )}

      {/* Submit form */}
      <YStack gap="$2" backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor">
        <Text fontWeight="600">Write a review</Text>
        <XStack gap="$1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Text key={s} onPress={() => setRating(s)} fontSize="$5" color={s <= rating ? '$warning' : '$neutral300'} style={{ cursor: 'pointer' } as unknown as Record<string, unknown>}>
              ★
            </Text>
          ))}
        </XStack>
        <TextArea placeholder="Share your fit, quality and comfort..." value={text} onChangeText={setText} minHeight={80} borderColor="$borderColor" />
        {error && <Text color="$error" fontSize="$2">{error}</Text>}
        <Button backgroundColor="$primary" onPress={handleSubmit} disabled={submitting} opacity={submitting ? 0.6 : 1}>
          <Text color="white" fontWeight="600">{submitting ? 'Submitting...' : 'Submit review'}</Text>
        </Button>
        {!isAuthenticated && <Text fontSize="$2" color="$textSecondary">Log in to submit.</Text>}
      </YStack>

      <Separator borderColor="$borderColor" />

      {/* List */}
      {reviews === undefined ? (
        <Text color="$textSecondary">Loading reviews...</Text>
      ) : reviews.length === 0 ? (
        <Text color="$textSecondary">No reviews yet.</Text>
      ) : (
        <YStack gap="$3">
          {reviews.map((r) => (
            <YStack key={r._id} backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor" gap="$1">
              <XStack alignItems="center" justifyContent="space-between">
                <RatingStars rating={r.rating} showCount={false} starSize={14} />
                <Text fontSize="$2" color="$textSecondary">{new Date(r.createdAt).toLocaleDateString()}</Text>
              </XStack>
              <Text fontSize="$3" color="$textPrimary">{r.text}</Text>
              <XStack alignItems="center" gap="$2" marginTop="$1">
                <Text fontSize="$2" color="$textSecondary" onPress={() => onHelpful(r._id)} style={{ cursor: 'pointer' } as unknown as Record<string, unknown>}>
                  Helpful ({r.helpful}) ↑
                </Text>
              </XStack>
            </YStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}
