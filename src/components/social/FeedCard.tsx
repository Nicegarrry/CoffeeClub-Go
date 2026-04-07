import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  Share,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useLike } from '../../hooks/useLikes';
import { Fonts, Spacing, Radius } from '../../constants/theme';
import { hapticSelection } from '../../services/device';
import type { BrewWithUser } from '../../types/database';

interface FeedCardProps {
  brew: BrewWithUser;
  onPressUser: (userId: string) => void;
  onPressBrew: (brewId: string) => void;
  onPressComment: (brewId: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

function buildRatio(brew: BrewWithUser): string | null {
  if (brew.dose_in_grams != null && brew.yield_out_grams != null) {
    return `${brew.dose_in_grams}:${brew.yield_out_grams}g`;
  }
  return null;
}

function buildStars(rating: number): string {
  return '\u2605'.repeat(Math.round(rating));
}

const placeholderGradients: [string, string, string][] = [
  ['#2C1A08', '#5C3D2E', '#7B5B3A'],
  ['#1A2C3D', '#2E4A5C', '#3A6B7B'],
  ['#2C0F1A', '#5C2E3D', '#7B3A5B'],
  ['#1A2C0F', '#3D5C2E', '#5B7B3A'],
];

export function FeedCard({ brew, onPressUser, onPressBrew, onPressComment }: FeedCardProps) {
  const { colors } = useTheme();
  const { isLiked, likeCount, toggle } = useLike(brew.id);

  const username = brew.user?.username ?? 'user';
  const avatarLetter = (brew.user?.display_name ?? username).charAt(0).toUpperCase();
  const ratio = buildRatio(brew);
  const stars = brew.rating > 0 ? buildStars(brew.rating) : null;
  const gradientIdx = brew.id.charCodeAt(0) % placeholderGradients.length;

  const handleLike = useCallback(async () => {
    await hapticSelection();
    toggle();
  }, [toggle]);

  const handleComment = useCallback(async () => {
    await hapticSelection();
    onPressComment(brew.id);
  }, [brew.id, onPressComment]);

  const handleShare = useCallback(async () => {
    await hapticSelection();
    try {
      await Share.share({ message: `Check out this brew: ${brew.name}` });
    } catch {
      // user cancelled
    }
  }, [brew.name]);

  const handleBookmark = useCallback(async () => {
    await hapticSelection();
    // Bookmark functionality placeholder
  }, []);

  // Detail line: brew_type + ratio + stars
  const detailParts: string[] = [
    brew.brew_type.charAt(0).toUpperCase() + brew.brew_type.slice(1),
  ];
  if (ratio) detailParts.push(ratio);
  if (stars) detailParts.push(stars);
  const detailLine = detailParts.join(' \u00B7 ');

  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
      {/* Author row */}
      <Pressable
        onPress={() => onPressUser(brew.user_id)}
        style={styles.authorRow}
      >
        {brew.user?.avatar_url ? (
          <Image
            source={{ uri: brew.user.avatar_url }}
            style={[styles.avatar, { backgroundColor: colors.bgCard2 }]}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.bgCard2 }]}>
            <Text style={[styles.avatarLetter, { color: colors.accent }]}>
              {avatarLetter}
            </Text>
          </View>
        )}
        <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
          {username}
        </Text>
        <Text style={[styles.timeText, { color: colors.textFaint }]}>
          {' \u00B7 '}{formatRelativeTime(brew.created_at)}
        </Text>
      </Pressable>

      {/* Photo / Placeholder */}
      <Pressable onPress={() => onPressBrew(brew.id)}>
        {brew.photo_url ? (
          <Image
            source={{ uri: brew.photo_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={placeholderGradients[gradientIdx]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.photo}
          >
            <Text style={styles.placeholderEmoji}>{'\u2615'}</Text>
          </LinearGradient>
        )}
      </Pressable>

      {/* Action row */}
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          <Pressable onPress={handleLike} hitSlop={6} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, { color: isLiked ? '#E05050' : colors.textFaint }]}>
              {isLiked ? '\u2665' : '\u2661'}
            </Text>
            {likeCount > 0 && (
              <Text style={[styles.actionCount, { color: colors.textSub }]}>
                {likeCount}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={handleComment} hitSlop={6} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, { color: colors.textFaint }]}>
              {'\uD83D\uDCAC'}
            </Text>
          </Pressable>

          <Pressable onPress={handleShare} hitSlop={6} style={styles.actionBtn}>
            <Text style={[styles.shareText, { color: colors.textFaint }]}>
              Share
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={handleBookmark} hitSlop={6} style={styles.actionBtn}>
          <Text style={[styles.actionIcon, { color: colors.textFaint }]}>
            {'\uD83D\uDD16'}
          </Text>
        </Pressable>
      </View>

      {/* Title */}
      <Pressable onPress={() => onPressBrew(brew.id)}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {brew.name}
        </Text>
      </Pressable>

      {/* Detail line */}
      <Text style={[styles.detail, { color: colors.textSub }]} numberOfLines={1}>
        {detailLine}
      </Text>

      {/* Tasting notes */}
      {brew.tasting_notes && brew.tasting_notes.length > 0 && (
        <Text style={[styles.notes, { color: colors.textFaint }]} numberOfLines={1}>
          {brew.tasting_notes.map((n) => `#${n.toLowerCase().replace(/\s+/g, '')}`).join(' ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: Spacing.sectionGap,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  username: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    marginLeft: 8,
  },
  timeText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
    opacity: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionCount: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },
  shareText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  detail: {
    fontFamily: Fonts.body,
    fontSize: 13,
    paddingHorizontal: 14,
    marginTop: 3,
  },
  notes: {
    fontFamily: Fonts.body,
    fontSize: 12,
    paddingHorizontal: 14,
    marginTop: 4,
    paddingBottom: 14,
  },
});
