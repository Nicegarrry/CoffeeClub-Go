import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/hooks/useAuth';
import { useCafeDetail } from '../../src/hooks/useCafes';
import { supabase } from '../../src/services/supabase';
import { hapticLight, hapticSelection } from '../../src/services/device';
import CheckInSheet from '../../src/components/cafe/CheckInSheet';
import { Fonts, Radius, Spacing, Elevation, LetterSpacing } from '../../src/constants/theme';
import type { CafeReviewWithUser } from '../../src/types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 180;
const REVIEW_TAGS = ['wifi', 'seating', 'vibes', 'pour-over-friendly', 'quiet'];

export default function CafeDetailScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cafe, reviews, checkins, loading, refresh } = useCafeDetail(id ?? '');

  const [checkInVisible, setCheckInVisible] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = useCallback(async () => {
    if (!user || reviewRating === 0) return;
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('cafe_reviews').insert({
        user_id: user.id,
        cafe_id: id,
        rating: reviewRating,
        body: reviewBody.trim(),
        tags: reviewTags,
      });
      if (error) throw error;
      hapticLight();
      setReviewRating(0);
      setReviewBody('');
      setReviewTags([]);
      setReviewExpanded(false);
      refresh();
    } catch (err) {
      console.error('Submit review error:', err);
    } finally {
      setSubmittingReview(false);
    }
  }, [user, id, reviewRating, reviewBody, reviewTags, refresh]);

  const toggleTag = useCallback(
    (tag: string) => {
      hapticSelection();
      setReviewTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    },
    [],
  );

  if (loading || !cafe) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Cover photo or gradient placeholder */}
        {cafe.cover_photo_url ? (
          <Image source={{ uri: cafe.cover_photo_url }} style={styles.cover} />
        ) : (
          <LinearGradient
            colors={[colors.accent, colors.accentSoft, colors.bgCard2]}
            style={styles.cover}
          />
        )}

        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + 8 }]}
          hitSlop={12}
        >
          <View style={[styles.backBtnBg, { backgroundColor: colors.glass }]}>
            <Text style={[styles.backArrow, { color: colors.text }]}>{'\u2190'}</Text>
          </View>
        </Pressable>

        {/* Info section */}
        <View style={[styles.infoSection, { backgroundColor: colors.bg }]}>
          <Text style={[styles.cafeName, { color: colors.text }]}>{cafe.name}</Text>
          {cafe.address ? (
            <Text style={[styles.address, { color: colors.textSub }]}>{cafe.address}</Text>
          ) : null}
          {cafe.description ? (
            <Text style={[styles.description, { color: colors.textSub }]}>{cafe.description}</Text>
          ) : null}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {cafe.avg_rating > 0 ? `\u2605 ${cafe.avg_rating.toFixed(1)}` : '\u2014'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textFaint }]}>Rating</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.accent }]}>{cafe.review_count}</Text>
              <Text style={[styles.statLabel, { color: colors.textFaint }]}>Reviews</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.accent }]}>{cafe.checkin_count}</Text>
              <Text style={[styles.statLabel, { color: colors.textFaint }]}>Check-ins</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                hapticLight();
                setCheckInVisible(true);
              }}
              style={styles.actionBtnWrapper}
            >
              <LinearGradient
                colors={['#D4A050', '#E8C97A', '#D4A050']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>Check In</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                hapticLight();
                setReviewExpanded((prev) => !prev);
              }}
              style={[styles.reviewBtn, { borderColor: colors.accent }]}
            >
              <Text style={[styles.reviewBtnText, { color: colors.accent }]}>
                {reviewExpanded ? 'Cancel' : 'Leave Review'}
              </Text>
            </Pressable>
          </View>

          {/* Review form */}
          {reviewExpanded && (
            <View style={[styles.reviewForm, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.reviewFormTitle, { color: colors.text }]}>Your Review</Text>

              {/* Star picker */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => {
                      hapticSelection();
                      setReviewRating(star);
                    }}
                    hitSlop={4}
                  >
                    <Text
                      style={[
                        styles.starPick,
                        { color: reviewRating >= star ? '#E8B730' : colors.textFaint },
                      ]}
                    >
                      {reviewRating >= star ? '\u2605' : '\u2606'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Body */}
              <TextInput
                style={[styles.reviewInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                placeholder="What did you think?"
                placeholderTextColor={colors.textFaint}
                value={reviewBody}
                onChangeText={setReviewBody}
                multiline
                numberOfLines={3}
              />

              {/* Tag chips */}
              <View style={styles.tagRow}>
                {REVIEW_TAGS.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: reviewTags.includes(tag) ? colors.accent : 'transparent',
                        borderColor: reviewTags.includes(tag) ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        { color: reviewTags.includes(tag) ? '#FFFFFF' : colors.textSub },
                      ]}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmitReview}
                disabled={submittingReview || reviewRating === 0}
              >
                <LinearGradient
                  colors={
                    reviewRating > 0
                      ? ['#D4A050', '#E8C97A', '#D4A050']
                      : [colors.disabledAccent, colors.disabledAccent, colors.disabledAccent]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  <Text style={styles.submitBtnText}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Reviews section */}
          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} colors={colors} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Check-in sheet */}
      <CheckInSheet
        cafeId={id ?? ''}
        cafeName={cafe.name}
        visible={checkInVisible}
        onClose={() => setCheckInVisible(false)}
        onCheckedIn={refresh}
      />
    </View>
  );
}

// ─── Review Card ────────────────────────────────────────────────────────────

function ReviewCard({ review, colors }: { review: CafeReviewWithUser; colors: any }) {
  const date = new Date(review.created_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={[reviewStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={reviewStyles.header}>
        {review.user.avatar_url ? (
          <Image source={{ uri: review.user.avatar_url }} style={reviewStyles.avatar} />
        ) : (
          <View style={[reviewStyles.avatar, { backgroundColor: colors.accentSoft }]}>
            <Text style={reviewStyles.avatarFallback}>
              {(review.user.display_name || review.user.username || '?')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={reviewStyles.headerInfo}>
          <Text style={[reviewStyles.username, { color: colors.text }]}>
            {review.user.display_name || review.user.username}
          </Text>
          <Text style={[reviewStyles.date, { color: colors.textFaint }]}>{dateStr}</Text>
        </View>
        <View style={reviewStyles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Text
              key={star}
              style={{ color: review.rating >= star ? '#E8B730' : colors.textFaint, fontSize: 13 }}
            >
              {review.rating >= star ? '\u2605' : '\u2606'}
            </Text>
          ))}
        </View>
      </View>
      {review.body ? (
        <Text style={[reviewStyles.body, { color: colors.textSub }]}>{review.body}</Text>
      ) : null}
      {review.tags && review.tags.length > 0 && (
        <View style={reviewStyles.tags}>
          {review.tags.map((tag) => (
            <View key={tag} style={[reviewStyles.tag, { backgroundColor: colors.accentSoft }]}>
              <Text style={[reviewStyles.tagText, { color: colors.accent }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.gutter,
    zIndex: 10,
  },
  backBtnBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sectionGap,
  },
  cafeName: {
    fontFamily: Fonts.display,
    fontSize: 26,
    letterSpacing: LetterSpacing.display,
    marginBottom: 6,
  },
  address: {
    fontFamily: Fonts.body,
    fontSize: 14,
    marginBottom: 6,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.sectionGap,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  statValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 17,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.sectionGap,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  actionBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  reviewBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBtnText: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
  // Review form
  reviewForm: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: Spacing.sectionGap,
  },
  reviewFormTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    marginBottom: 12,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  starPick: {
    fontSize: 32,
  },
  reviewInput: {
    fontFamily: Fonts.body,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },
  submitBtn: {
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  // Reviews list
  reviewsSection: {
    marginBottom: Spacing.sectionGap,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    letterSpacing: LetterSpacing.display,
    marginBottom: 14,
  },
});

const reviewStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 14,
    marginBottom: Spacing.cardGap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarFallback: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  date: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 1,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 1,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
  },
});
