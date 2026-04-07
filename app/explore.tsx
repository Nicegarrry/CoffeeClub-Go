import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { Fonts, Spacing, LetterSpacing } from '../src/constants/theme';
import { useSocialFeed } from '../src/hooks/useBrews';
import { FeedCard } from '../src/components/social/FeedCard';
import type { BrewWithUser } from '../src/types/database';

function FeedHeader() {
  const { colors, isDark, toggle } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.glass, borderBottomColor: colors.border }]}>
      <View style={styles.headerSpacer} />
      <Text style={[styles.headerTitle, { color: colors.accent }]}>Feed</Text>
      <View style={styles.headerRight}>
        <Pressable hitSlop={10} style={[styles.bellBtn, { backgroundColor: colors.accentSoft }]}>
          <Text style={styles.bellIcon}>{'\uD83D\uDD14'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyFeed() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyEmoji]}>{'☕'}</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No brews yet
      </Text>
      <Text style={[styles.emptyBody, { color: colors.textSub }]}>
        Follow people to see their brews
      </Text>
      <Pressable
        onPress={() => router.push('/search' as any)}
        style={[styles.discoverBtn, { backgroundColor: colors.accent }]}
      >
        <Text style={[styles.discoverText, { color: '#FFF' }]}>Discover</Text>
      </Pressable>
    </View>
  );
}

export default function ExploreScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { brews, loading, refresh } = useSocialFeed();

  const handlePressUser = useCallback(
    (userId: string) => router.push(`/user/${userId}` as any),
    [router],
  );

  const handlePressBrew = useCallback(
    (brewId: string) => router.push(`/brew/${brewId}` as any),
    [router],
  );

  const handlePressComment = useCallback(
    (brewId: string) => router.push(`/brew/${brewId}` as any),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: BrewWithUser }) => (
      <FeedCard
        brew={item}
        onPressUser={handlePressUser}
        onPressBrew={handlePressBrew}
        onPressComment={handlePressComment}
      />
    ),
    [handlePressUser, handlePressBrew, handlePressComment],
  );

  const keyExtractor = useCallback((item: BrewWithUser) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <FeedHeader />
      <FlatList
        data={brews}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={!loading ? <EmptyFeed /> : null}
        ListFooterComponent={<View style={styles.bottomSpacer} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: LetterSpacing.display,
  },
  headerRight: {
    width: 36,
    alignItems: 'flex-end',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },
  listContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  discoverBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  discoverText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 112,
  },
});
