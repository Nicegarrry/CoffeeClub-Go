import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { Fonts, Spacing } from '../src/constants/theme';
import { Header } from '../src/components/layout/Header';
import { BrewCard } from '../src/components/ui/BrewCard';
import { EmptySocial } from '../src/components/ui/EmptyState';
import { useSocialFeed } from '../src/hooks/useBrews';
import { useLike } from '../src/hooks/useLikes';
import type { BrewWithUser } from '../src/types/database';

const brewGradients: [string, string, string][] = [
  ['#2C1A08', '#5C3D2E', '#7B5B3A'],
  ['#1A2C3D', '#2E4A5C', '#3A6B7B'],
  ['#2C0F1A', '#5C2E3D', '#7B3A5B'],
  ['#1A2C0F', '#3D5C2E', '#5B7B3A'],
];

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function LikeButton({ brewId }: { brewId: string }) {
  const { isLiked, likeCount, toggle } = useLike(brewId);
  const { colors } = useTheme();

  return (
    <View style={styles.likeRow}>
      <Pressable onPress={toggle} hitSlop={8} style={styles.likeBtn}>
        <Text style={[styles.likeHeart, { color: isLiked ? '#E05050' : colors.textFaint }]}>
          {isLiked ? '\u2665' : '\u2661'}
        </Text>
      </Pressable>
      <Text style={[styles.likeCount, { color: colors.textSub }]}>
        {likeCount > 0 ? likeCount : ''}
      </Text>
    </View>
  );
}

function FeedItem({ brew, index }: { brew: BrewWithUser; index: number }) {
  const { colors } = useTheme();
  const router = useRouter();

  const gradientColors = brewGradients[index % brewGradients.length];

  const brewCardData = {
    id: brew.id as any,
    img: brew.photo_url ?? 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    label: brew.name,
    method: brew.brew_type,
    sub: brew.tasting_notes?.join(', ') ?? '',
    rating: brew.rating,
    time: formatRelativeTime(brew.created_at),
  };

  return (
    <View style={styles.feedItem}>
      {/* User attribution row */}
      <Pressable
        onPress={() => router.push(`/user/${brew.user_id}` as any)}
        style={styles.userRow}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.avatarLetter, { color: colors.accent }]}>
            {(brew.user?.display_name ?? brew.user?.username ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
            {brew.user?.display_name ?? 'Unknown'}
          </Text>
          <Text style={[styles.username, { color: colors.textFaint }]} numberOfLines={1}>
            @{brew.user?.username ?? 'user'} · {formatRelativeTime(brew.created_at)}
          </Text>
        </View>
      </Pressable>

      {/* Brew Card */}
      <Pressable onPress={() => router.push(`/brew/${brew.id}` as any)}>
        <BrewCard
          brew={brewCardData}
          gradientColors={gradientColors}
        />
      </Pressable>

      {/* Like row */}
      <LikeButton brewId={brew.id} />
    </View>
  );
}

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { brews, loading, refresh } = useSocialFeed();

  const renderItem = useCallback(
    ({ item, index }: { item: BrewWithUser; index: number }) => (
      <FeedItem brew={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: BrewWithUser) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <Header />
      <FlatList
        data={brews}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={loading}
        ListEmptyComponent={!loading ? <EmptySocial /> : null}
        ListFooterComponent={<View style={styles.bottomSpacer} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
  },
  feedItem: {
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  displayName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  username: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 1,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 4,
  },
  likeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  likeHeart: {
    fontSize: 22,
  },
  likeCount: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    marginLeft: 6,
  },
  bottomSpacer: {
    height: 112,
  },
});
