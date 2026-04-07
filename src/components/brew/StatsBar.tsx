import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Radius, Elevation } from '../../constants/theme';
import type { BrewStats } from '../../hooks/useBrewStats';

interface StatsBarProps {
  stats: BrewStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const { colors } = useTheme();

  const trendArrow =
    stats.ratingTrend === 'up'
      ? { symbol: '\u2191', color: '#4CAF50' }
      : stats.ratingTrend === 'down'
        ? { symbol: '\u2193', color: '#E53935' }
        : { symbol: '\u2192', color: colors.textSub };

  const streakLabel =
    stats.streakDays > 0 ? 'keep going!' : 'brew today!';

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
      {/* Brews this week */}
      <View style={styles.column}>
        <Text style={[styles.value, { color: colors.text, fontFamily: Fonts.display }]}>
          {stats.thisWeek}
        </Text>
        <Text style={[styles.label, { color: colors.textSub, fontFamily: Fonts.body }]}>
          this week
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Average rating */}
      <View style={styles.column}>
        <Text style={[styles.value, { color: colors.text, fontFamily: Fonts.display }]}>
          {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '--'}
        </Text>
        <Text style={[styles.label, { color: colors.textSub, fontFamily: Fonts.body }]}>
          <Text style={{ color: trendArrow.color }}>{trendArrow.symbol}</Text> avg rating
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Streak */}
      <View style={styles.column}>
        <Text style={[styles.value, { color: colors.text, fontFamily: Fonts.display }]}>
          {stats.streakDays > 0 ? `${stats.streakDays}\uD83D\uDD25` : '0'}
        </Text>
        <Text style={[styles.label, { color: colors.textSub, fontFamily: Fonts.body }]}>
          {streakLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.card,
    padding: 16,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    lineHeight: 26,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
  },
});
