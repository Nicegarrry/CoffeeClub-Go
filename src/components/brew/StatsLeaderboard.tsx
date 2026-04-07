import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Radius, Elevation, Spacing } from '../../constants/theme';
import type { BrewStats } from '../../hooks/useBrewStats';
import type { DbBrew } from '../../types/database';

interface StatsLeaderboardProps {
  stats: BrewStats;
  brews?: DbBrew[];
}

const BADGES = [
  { key: 'first', emoji: '\u2615', label: 'First Brew', test: (s: BrewStats) => s.totalBrews >= 1 },
  { key: 'warrior', emoji: '\u2694\uFE0F', label: 'Week Warrior', test: (s: BrewStats) => s.thisWeek >= 7 },
  { key: 'explorer', emoji: '\uD83C\uDF0D', label: 'Bean Explorer', test: (_s: BrewStats, brews?: DbBrew[]) => {
    if (!brews) return false;
    const unique = new Set(brews.map((b) => b.bean_id).filter(Boolean));
    return unique.size >= 5;
  }},
  { key: 'streak', emoji: '\uD83D\uDD25', label: 'Streak Master', test: (s: BrewStats) => s.streakDays >= 7 },
  { key: 'fifty', emoji: '\uD83C\uDFC6', label: 'Half Century', test: (s: BrewStats) => s.totalBrews >= 50 },
] as const;

export default function StatsLeaderboard({ stats, brews }: StatsLeaderboardProps) {
  const { colors } = useTheme();
  const topMethods = stats.methodDistribution.slice(0, 4);
  const maxCount = topMethods[0]?.count ?? 1;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          shadowColor: colors.shadow,
          ...Elevation.card,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.bodySemiBold }]}>
        Your Stats
      </Text>

      {/* Method distribution */}
      {topMethods.map((item, index) => {
        const ratio = item.count / maxCount;
        const opacity = 1 - index * 0.2;
        return (
          <View key={item.method} style={styles.barRow}>
            <Text
              style={[
                styles.barLabel,
                { color: colors.textSub, fontFamily: Fonts.bodyMedium },
              ]}
              numberOfLines={1}
            >
              {item.method}
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.max(ratio * 100, 8)}%`,
                    backgroundColor: colors.accent,
                    opacity,
                    borderRadius: Radius.pill,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.barCount,
                { color: colors.text, fontFamily: Fonts.bodySemiBold },
              ]}
            >
              {item.count}
            </Text>
          </View>
        );
      })}

      {/* Achievement badges */}
      <Text
        style={[
          styles.badgesTitle,
          { color: colors.textSub, fontFamily: Fonts.bodySemiBold },
        ]}
      >
        Achievements
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesRow}
      >
        {BADGES.map((badge) => {
          const earned = badge.test(stats, brews);
          return (
            <View key={badge.key} style={[styles.badge, { opacity: earned ? 1 : 0.3 }]}>
              <View
                style={[
                  styles.badgeCircle,
                  {
                    backgroundColor: earned ? colors.accent : colors.bgCard2,
                  },
                ]}
              >
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              </View>
              <Text
                style={[
                  styles.badgeLabel,
                  { color: colors.textSub, fontFamily: Fonts.body },
                ]}
                numberOfLines={1}
              >
                {badge.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: 16,
  },
  title: {
    fontSize: 16,
    marginBottom: 14,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    width: 80,
    fontSize: 13,
  },
  barTrack: {
    flex: 1,
    height: 14,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
    marginHorizontal: 8,
  },
  barFill: {
    height: 14,
  },
  barCount: {
    width: 28,
    fontSize: 13,
    textAlign: 'right',
  },
  badgesTitle: {
    fontSize: 14,
    marginTop: Spacing.sectionGap - 8,
    marginBottom: 12,
  },
  badgesRow: {
    gap: 14,
    paddingRight: 4,
  },
  badge: {
    alignItems: 'center',
    width: 64,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});
