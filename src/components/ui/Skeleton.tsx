import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface SkeletonProps {
  width: number;
  height: number;
  borderRadius: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.accentSoft,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

// Preset compositions
export function SkeletonBrewCard({ size = 350 }: { size?: number } = {}) {
  return <Skeleton width={size} height={size} borderRadius={22} />;
}

export function SkeletonStoryRing() {
  return <Skeleton width={64} height={64} borderRadius={32} />;
}

export function SkeletonBeanCard() {
  return <Skeleton width={152} height={180} borderRadius={20} />;
}
