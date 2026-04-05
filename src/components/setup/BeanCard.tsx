import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts } from '../../constants/theme';
import type { Bean } from '../../constants/mockData';

interface BeanCardProps {
  bean: Bean;
  onPress?: () => void;
}

const ROAST_DOT_COLORS: Record<string, string> = {
  Light: '#D4A050',
  Medium: '#8B5E34',
  Dark: '#4A2E10',
  'Light-Med': '#B87340',
};

export function BeanCard({ bean, onPress }: BeanCardProps) {
  const { colors } = useTheme();
  const stockPercent = bean.stock / bean.max;
  const isLow = bean.stock < 150;
  const barColor = isLow ? '#E07832' : colors.accent;

  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Roast pill */}
      <View style={[styles.roastPill, { backgroundColor: colors.accentSoft }]}>
        <View style={[styles.roastDot, { backgroundColor: ROAST_DOT_COLORS[bean.roast] || colors.accent }]} />
        <Text style={[styles.roastText, { color: colors.textSub }]}>{bean.roast}</Text>
      </View>

      {/* Bean info */}
      <Text style={[styles.beanName, { color: colors.text }]} numberOfLines={2}>
        {bean.name}
      </Text>
      <Text style={[styles.roaster, { color: colors.textSub }]} numberOfLines={1}>
        {bean.roaster}
      </Text>
      <Text style={[styles.notes, { color: colors.textFaint }]} numberOfLines={1}>
        {bean.notes}
      </Text>

      {/* Stock bar */}
      <View style={styles.stockSection}>
        <View style={[styles.stockBarBg, { backgroundColor: colors.accentSoft }]}>
          <View
            style={[
              styles.stockBarFill,
              {
                backgroundColor: barColor,
                width: `${Math.min(stockPercent * 100, 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.stockText, { color: isLow ? '#E07832' : colors.textSub }]}>
          {bean.stock}g left
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 152,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  roastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  roastDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  roastText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  beanName: {
    fontFamily: Fonts.display,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 3,
  },
  roaster: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    marginBottom: 2,
  },
  notes: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginBottom: 12,
  },
  stockSection: {
    marginTop: 'auto',
  },
  stockBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
  },
});
