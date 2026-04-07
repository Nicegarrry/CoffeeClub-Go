import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts } from '../../constants/theme';
import type { DbBrew, DbBean } from '../../types/database';

interface BadgeGridProps {
  brews: DbBrew[];
  beans: DbBean[];
}

interface BadgeDef {
  key: string;
  emoji: string;
  label: string;
  test: (brews: DbBrew[], beans: DbBean[]) => boolean;
}

const BADGES: BadgeDef[] = [
  {
    key: 'first',
    emoji: '\u2615',
    label: 'First Brew',
    test: (brews) => brews.length >= 1,
  },
  {
    key: 'warrior',
    emoji: '\uD83D\uDCAA',
    label: 'Week Warrior',
    test: (brews) => {
      // Check if any 7-day window has 7+ brews
      if (brews.length < 7) return false;
      const sorted = [...brews].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      for (let i = 0; i <= sorted.length - 7; i++) {
        const start = new Date(sorted[i].created_at).getTime();
        const end = new Date(sorted[i + 6].created_at).getTime();
        if (end - start <= 7 * 24 * 60 * 60 * 1000) return true;
      }
      return false;
    },
  },
  {
    key: 'explorer',
    emoji: '\uD83C\uDF0D',
    label: 'Bean Explorer',
    test: (brews) => {
      const unique = new Set(brews.map((b) => b.bean_id).filter(Boolean));
      return unique.size >= 5;
    },
  },
  {
    key: 'streak',
    emoji: '\uD83D\uDD25',
    label: 'Streak Master',
    test: (brews) => {
      if (brews.length < 7) return false;
      const days = new Set(brews.map((b) => b.created_at.slice(0, 10)));
      const sorted = [...days].sort();
      let streak = 1;
      let maxStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]).getTime();
        const curr = new Date(sorted[i]).getTime();
        if (curr - prev === 86400000) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      return maxStreak >= 7;
    },
  },
  {
    key: 'fifty',
    emoji: '\uD83C\uDFAF',
    label: 'Half Century',
    test: (brews) => brews.length >= 50,
  },
  {
    key: 'methods',
    emoji: '\uD83C\uDFA8',
    label: 'Method Master',
    test: (brews) => {
      const methods = new Set(brews.map((b) => b.brew_type));
      return methods.size >= 4;
    },
  },
  {
    key: 'early',
    emoji: '\uD83C\uDF05',
    label: 'Early Bird',
    test: (brews) =>
      brews.some((b) => {
        const hour = new Date(b.created_at).getHours();
        return hour < 7;
      }),
  },
  {
    key: 'night',
    emoji: '\uD83E\uDD89',
    label: 'Night Owl',
    test: (brews) =>
      brews.some((b) => {
        const hour = new Date(b.created_at).getHours();
        return hour >= 21;
      }),
  },
];

export default function BadgeGrid({ brews, beans }: BadgeGridProps) {
  const { colors } = useTheme();

  const earned = useMemo(
    () =>
      BADGES.map((badge) => ({
        ...badge,
        unlocked: badge.test(brews, beans),
      })),
    [brews, beans],
  );

  return (
    <View style={styles.grid}>
      {earned.map((badge) => (
        <View
          key={badge.key}
          style={[styles.badge, { opacity: badge.unlocked ? 1 : 0.3 }]}
        >
          <View
            style={[
              styles.circle,
              {
                backgroundColor: badge.unlocked ? colors.accent : colors.bgCard2,
              },
            ]}
          >
            <Text style={styles.emoji}>{badge.emoji}</Text>
          </View>
          <Text
            style={[styles.label, { color: colors.textSub, fontFamily: Fonts.body }]}
            numberOfLines={1}
          >
            {badge.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    alignItems: 'center',
    width: 64,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
