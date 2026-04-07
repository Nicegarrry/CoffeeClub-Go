import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Brewly from '../ui/Brewly';
import { useBrewCoach } from '../../hooks/useBrewCoach';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Spacing } from '../../constants/theme';
import type { DbBrew } from '../../types/database';

interface Props {
  brews: DbBrew[];
}

/** Render a compact rating trend like "2.0 -> 3.5 -> 4.0" using dots. */
function RatingTrend({ brews }: { brews: DbBrew[] }) {
  const { colors } = useTheme();

  // Show up to 5 most recent, oldest first
  const recent = [...brews]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .slice(-5);

  return (
    <View style={styles.trendRow}>
      {recent.map((brew, i) => {
        const filled = Math.round(brew.rating);
        const stars = Array.from({ length: 5 }, (_, j) =>
          j < filled ? '\u2605' : '\u2606',
        ).join('');

        return (
          <View key={brew.id} style={styles.trendItem}>
            {i > 0 && (
              <Text style={[styles.trendArrow, { color: colors.textFaint }]}>
                {'\u2192'}
              </Text>
            )}
            <Text style={[styles.trendStars, { color: colors.accent }]}>
              {stars}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function BrewlyDialIn({ brews }: Props) {
  const { getDialInInsight } = useBrewCoach();

  const insight = useMemo(() => getDialInInsight(brews), [brews, getDialInInsight]);

  if (!insight) return null;

  return (
    <View>
      <Brewly
        message={insight.message}
        detail={insight.detail}
        mood={insight.mood}
        visible
      />
      {brews.length >= 3 && (
        <View style={styles.trendContainer}>
          <RatingTrend brews={brews} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trendContainer: {
    paddingHorizontal: Spacing.gutter + 44, // align with bubble (avatar + nub offset)
    marginTop: -4,
    marginBottom: Spacing.cardGap,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendArrow: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginHorizontal: 4,
  },
  trendStars: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: -0.5,
  },
});
