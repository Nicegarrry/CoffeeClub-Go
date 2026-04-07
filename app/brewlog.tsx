import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  ScrollView,
  Image,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { useMyBrews } from '../src/hooks/useBrews';
import { useBeans } from '../src/hooks/useSetup';
import { Fonts, Spacing, Radius, Elevation } from '../src/constants/theme';
import type { DbBrew } from '../src/types/database';
import * as Haptics from 'expo-haptics';

// ─── Helpers ────────────────────────────────────────────────────────────────

function startOfDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatSectionTitle(dateKey: string): string {
  const today = new Date();
  const todayKey = startOfDay(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = startOfDay(yesterday);

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function groupBrewsByDay(brews: DbBrew[]): { title: string; data: DbBrew[] }[] {
  const map = new Map<string, DbBrew[]>();
  for (const brew of brews) {
    const key = startOfDay(new Date(brew.created_at));
    const arr = map.get(key);
    if (arr) arr.push(brew);
    else map.set(key, [brew]);
  }
  return Array.from(map.entries()).map(([key, data]) => ({
    title: formatSectionTitle(key),
    data,
  }));
}

function formatRatio(dose: number | null, yieldOut: number | null): string {
  if (dose == null || yieldOut == null) return '';
  return `${Math.round(dose)}:${Math.round(yieldOut)}g`;
}

function getStreakDays(brews: DbBrew[]): number {
  if (brews.length === 0) return 0;
  const brewDays = new Set(brews.map((b) => startOfDay(new Date(b.created_at))));
  let streak = 0;
  const cursor = new Date();
  // Allow starting from today or yesterday
  if (!brewDays.has(startOfDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!brewDays.has(startOfDay(cursor))) return 0;
  }
  while (brewDays.has(startOfDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const METHOD_EMOJI: Record<string, string> = {
  espresso: '\u2615',
  latte: '\uD83E\uDD5B',
  'flat white': '\u2615',
  filter: '\uD83E\uDED6',
  'pour over': '\uD83E\uDED6',
  'cold brew': '\uD83E\uDDCA',
  other: '\u2615',
};

const BREW_TYPE_LABELS = ['All', 'Espresso', 'Latte', 'Flat White', 'Filter', 'Pour Over', 'Cold Brew'];

// ─── Components ─────────────────────────────────────────────────────────────

function RatingDots({ rating, accentColor, faintColor }: { rating: number; accentColor: string; faintColor: string }) {
  return (
    <View style={styles.ratingRow}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.ratingDot,
            { backgroundColor: i < rating ? accentColor : faintColor },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function BrewLogScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { brews, loading, refresh } = useMyBrews();
  const { beans } = useBeans();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState(false);

  const beanMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of beans) m.set(b.id, b.name);
    return m;
  }, [beans]);

  const filteredBrews = useMemo(() => {
    let list = brews;
    if (activeFilter !== 'All') {
      const target = activeFilter.toLowerCase();
      list = list.filter((b) => b.brew_type === target);
    }
    if (ratingFilter) {
      list = list.filter((b) => b.rating === 3);
    }
    return list;
  }, [brews, activeFilter, ratingFilter]);

  const sections = useMemo(() => groupBrewsByDay(filteredBrews), [filteredBrews]);

  const stats = useMemo(() => {
    const count = brews.length;
    const avgRating = count > 0 ? brews.reduce((s, b) => s + b.rating, 0) / count : 0;
    const streak = getStreakDays(brews);
    const stars = '\u2605'.repeat(Math.round(avgRating)) + '\u2606'.repeat(3 - Math.round(avgRating));
    return { count, stars, streak };
  }, [brews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleChipPress = useCallback((label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter((prev) => (prev === label ? 'All' : label));
  }, []);

  const handleRatingChipPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRatingFilter((prev) => !prev);
  }, []);

  const handleBrewPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/brew/${id}` as any);
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: DbBrew }) => {
      const beanName = item.bean_id ? beanMap.get(item.bean_id) ?? '' : '';
      const ratio = formatRatio(item.dose_in_grams, item.yield_out_grams);
      const emoji = METHOD_EMOJI[item.brew_type] ?? '\u2615';
      const typeLabel = item.brew_type.charAt(0).toUpperCase() + item.brew_type.slice(1);
      const detail = [typeLabel, ratio].filter(Boolean).join(' \u00B7 ');

      return (
        <Pressable
          onPress={() => handleBrewPress(item.id)}
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: colors.bgCard,
              shadowColor: colors.shadow,
              opacity: pressed ? 0.85 : 1,
            },
            Elevation.card,
          ]}
        >
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.emojiThumb, { backgroundColor: colors.accentSoft }]}>
              <Text style={styles.emojiText}>{emoji}</Text>
            </View>
          )}

          <View style={styles.cardCenter}>
            <Text style={[styles.brewName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {beanName ? (
              <Text style={[styles.beanName, { color: colors.textSub }]} numberOfLines={1}>
                {beanName}
              </Text>
            ) : null}
            <Text style={[styles.brewDetail, { color: colors.textFaint }]} numberOfLines={1}>
              {detail}
            </Text>
          </View>

          <RatingDots rating={item.rating} accentColor={colors.accent} faintColor={colors.border} />
        </Pressable>
      );
    },
    [beanMap, colors, handleBrewPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <Text style={[styles.sectionHeader, { color: colors.textSub }]}>{section.title}</Text>
    ),
    [colors],
  );

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Stats row */}
        {brews.length > 0 && (
          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: colors.textSub }]}>
              {stats.count} brew{stats.count !== 1 ? 's' : ''} {'\u00B7'} avg {stats.stars} {'\u00B7'} {stats.streak}-day streak
            </Text>
          </View>
        )}

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {BREW_TYPE_LABELS.map((label) => {
            const isActive = activeFilter === label;
            return (
              <Pressable
                key={label}
                onPress={() => handleChipPress(label)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.accent : colors.bgCard2,
                    borderColor: isActive ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? '#FFFFFF' : colors.textSub },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={handleRatingChipPress}
            style={[
              styles.chip,
              {
                backgroundColor: ratingFilter ? colors.accent : colors.bgCard2,
                borderColor: ratingFilter ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: ratingFilter ? '#FFFFFF' : colors.textSub },
              ]}
            >
              {'\u2605\u2605\u2605'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    ),
    [brews.length, stats, activeFilter, ratingFilter, colors, handleChipPress, handleRatingChipPress],
  );

  const EmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>{'\u2615'}</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No brews yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSub }]}>Log your first brew</Text>
      </View>
    ),
    [colors],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>Brew Log</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!loading ? EmptyComponent : null}
        contentContainerStyle={sections.length === 0 && !loading ? styles.emptyList : styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    paddingHorizontal: Spacing.gutter,
    paddingTop: 8,
    paddingBottom: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },

  // Stats
  statsRow: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 8,
    paddingBottom: 4,
  },
  statsText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },

  // Filter chips
  chipScroll: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },

  // Section header
  sectionHeader: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sectionGap,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.gutter,
    marginBottom: Spacing.cardGap,
    padding: 12,
    borderRadius: Radius.card,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  emojiThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  cardCenter: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  brewName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  beanName: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 1,
  },
  brewDetail: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },

  // Rating dots
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
  },
});
