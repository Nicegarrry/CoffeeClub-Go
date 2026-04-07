import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Radius, Spacing, Elevation } from '../../constants/theme';
import type { CafeWithStats } from '../../types/database';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CafeCardProps {
  cafe: CafeWithStats;
  onPress: () => void;
}

export function CafeCard({ cafe, onPress }: CafeCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.row}>
        {/* Left: info */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {cafe.name}
          </Text>
          <Text style={[styles.address, { color: colors.textSub }]} numberOfLines={1}>
            {cafe.address}
          </Text>
          {cafe.checkin_count > 0 && (
            <Text style={[styles.checkins, { color: colors.textFaint }]}>
              {'\u2615'} {cafe.checkin_count} check-in{cafe.checkin_count !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* Right: rating */}
        <View style={styles.ratingCol}>
          {cafe.avg_rating > 0 ? (
            <View style={[styles.ratingBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.ratingText, { color: colors.accent }]}>
                {'\u2605'} {cafe.avg_rating.toFixed(1)}
              </Text>
            </View>
          ) : (
            <View style={[styles.ratingBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.ratingText, { color: colors.textFaint }]}>New</Text>
            </View>
          )}
          <Text style={[styles.reviewCount, { color: colors.textFaint }]}>
            ({cafe.review_count} review{cafe.review_count !== 1 ? 's' : ''})
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 14,
    marginBottom: Spacing.cardGap,
    ...Elevation.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    marginBottom: 3,
  },
  address: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginBottom: 4,
  },
  checkins: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  ratingCol: {
    alignItems: 'center',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginBottom: 4,
  },
  ratingText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  reviewCount: {
    fontFamily: Fonts.body,
    fontSize: 11,
  },
});
