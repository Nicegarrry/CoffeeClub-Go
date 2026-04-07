import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useBeans } from '../../src/hooks/useSetup';
import { useBeanDetail } from '../../src/hooks/useBeanDetail';
import { Fonts, Spacing, Radius, LetterSpacing, Elevation } from '../../src/constants/theme';
import { hapticLight } from '../../src/services/device';
import type { DbBrew } from '../../src/types/database';

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StarDisplay({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 3; i++) {
    stars.push(
      <Text key={i} style={styles.star}>
        {i <= rating ? '\u2605' : '\u2606'}
      </Text>,
    );
  }
  return <View style={styles.starsRow}>{stars}</View>;
}

function formatRatio(brew: DbBrew): string {
  if (brew.dose_in_grams != null && brew.yield_out_grams != null) {
    return `${brew.dose_in_grams}g : ${brew.yield_out_grams}g`;
  }
  if (brew.dose_in_grams != null) return `${brew.dose_in_grams}g in`;
  return '--';
}

function StockIndicator({ grams, colors }: { grams: number; colors: any }) {
  const isEmpty = grams <= 0;
  const isLow = grams < 50;
  const pillColor = isEmpty ? '#E05050' : isLow ? '#E09040' : '#4CAF50';
  const label = isEmpty ? 'Empty' : isLow ? `${grams}g (Low)` : `${grams}g`;

  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: pillColor }]}>{label}</Text>
      <Text style={[styles.statLabel, { color: colors.textFaint }]}>STOCK</Text>
    </View>
  );
}

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { remove } = useBeans();
  const { bean, brews, brewCount, avgRating, loading } = useBeanDetail(id!);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Bean', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(id!);
          router.back();
        },
      },
    ]);
  }, [id, remove]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!bean) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingWrap}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: colors.accent }]}>Back</Text>
          </Pressable>
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>Bean not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const beanColor = bean.color || colors.accent;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: colors.accent }]}>Back</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {bean.name}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[beanColor, colors.bgCard2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCircleOuter}
          >
            <View style={[styles.heroCircle, { backgroundColor: beanColor }]} />
          </LinearGradient>

          <Text style={[styles.heroName, { color: colors.text }]}>{bean.name}</Text>
          <Text style={[styles.heroRoaster, { color: colors.textSub }]}>{bean.roaster}</Text>

          <View style={styles.badgeRow}>
            {bean.origin ? (
              <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>{bean.origin}</Text>
              </View>
            ) : null}
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.badgeText, { color: colors.accent }]}>{bean.process}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.badgeText, { color: colors.accent }]}>{bean.roast_level}</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.text }]}>{brewCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textFaint }]}>BREWS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {avgRating > 0 ? avgRating.toFixed(1) : '--'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textFaint }]}>AVG RATING</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StockIndicator grams={bean.stock_grams} colors={colors} />
        </View>

        {/* Edit / Delete actions */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => Alert.alert('Edit', 'Edit functionality coming soon.')}
          >
            <Text style={[styles.actionBtnText, { color: colors.accent }]}>Edit</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionBtnText, { color: '#E05050' }]}>Delete</Text>
          </Pressable>
        </View>

        {/* Tasting notes */}
        {bean.tasting_notes && bean.tasting_notes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>TASTING NOTES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {bean.tasting_notes.map((note, idx) => (
                <View key={idx} style={[styles.chip, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.chipText, { color: colors.accent }]}>{note}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Brew history */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>BREW HISTORY</Text>
          {brews.length === 0 ? (
            <Text style={[styles.noBrewsText, { color: colors.textFaint }]}>
              No brews yet with this bean
            </Text>
          ) : (
            brews.map((brew) => (
              <Pressable
                key={brew.id}
                onPress={() => router.push(`/brew/${brew.id}`)}
                style={[
                  styles.brewCard,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                  },
                  Elevation.card,
                ]}
              >
                <View style={styles.brewCardTop}>
                  <View style={styles.brewCardInfo}>
                    <Text style={[styles.brewCardName, { color: colors.text }]} numberOfLines={1}>
                      {brew.name}
                    </Text>
                    <Text style={[styles.brewCardDate, { color: colors.textSub }]}>
                      {relativeTime(brew.created_at)}
                    </Text>
                  </View>
                  <View style={styles.brewCardRight}>
                    <StarDisplay rating={brew.rating} />
                    <Text style={[styles.brewCardRatio, { color: colors.textSub }]}>
                      {formatRatio(brew)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Brew with this bean button */}
        <View style={styles.ctaWrap}>
          <Pressable
            onPress={() => {
              hapticLight();
              // Navigate to brew log -- the brewlog screen can pick up the bean
              router.push('/brewlog');
            }}
          >
            <LinearGradient
              colors={[colors.accent, colors.accent + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>Brew with this bean</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
  },
  backBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: LetterSpacing.display,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.sectionGap,
    paddingHorizontal: Spacing.gutter,
  },
  heroCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  heroName: {
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: LetterSpacing.display,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroRoaster: {
    fontFamily: Fonts.body,
    fontSize: 14,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    textTransform: 'capitalize',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.gutter,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: LetterSpacing.uppercase,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: Spacing.gutter,
    marginBottom: Spacing.sectionGap,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deleteBtn: {
    borderColor: '#E05050',
  },
  actionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.gutter,
    marginBottom: Spacing.sectionGap,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: LetterSpacing.uppercase,
    marginBottom: 10,
  },

  // Tasting chips
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    marginRight: 8,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },

  // Brew history
  noBrewsText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  brewCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 14,
    marginBottom: Spacing.cardGap,
  },
  brewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brewCardInfo: {
    flex: 1,
  },
  brewCardName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  brewCardDate: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  brewCardRight: {
    alignItems: 'flex-end',
  },
  brewCardRatio: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  star: {
    color: '#F4D060',
    fontSize: 14,
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: Spacing.gutter,
    marginBottom: Spacing.sectionGap,
  },
  ctaButton: {
    paddingVertical: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
