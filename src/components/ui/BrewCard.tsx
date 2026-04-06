import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Elevation, LetterSpacing, Spacing } from '../../constants/theme';
import type { Brew } from '../../constants/mockData';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BrewCardProps {
  brew: Brew;
  gradientColors: [string, string, string];
  onPress?: () => void;
}

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Text key={i} style={styles.star}>
        {i <= rating ? '★' : '☆'}
      </Text>
    );
  }
  return <View style={styles.starsRow}>{stars}</View>;
}

export function BrewCard({ brew, gradientColors, onPress }: BrewCardProps) {
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
      style={[styles.card, { shadowColor: colors.shadow }, animatedStyle]}
    >
      <Image source={{ uri: brew.img }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.0)', gradientColors[1] + 'BB', gradientColors[2] + 'EE']}
        style={styles.gradient}
      />
      {/* Method pill */}
      <View style={styles.methodPill}>
        <Text style={styles.methodText}>{brew.method}</Text>
      </View>
      {/* Star rating */}
      <View style={styles.ratingContainer}>
        <StarRating rating={brew.rating} />
      </View>
      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.brewName}>{brew.label}</Text>
        <Text style={styles.brewSub} numberOfLines={1}>{brew.sub}</Text>
        <Text style={styles.brewTime}>{brew.time}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    aspectRatio: 1,
    ...Elevation.card,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  methodPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  methodText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.uppercase,
  },
  ratingContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  star: {
    color: '#F4D060',
    fontSize: 14,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.gutter,
  },
  brewName: {
    color: '#FFFFFF',
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: LetterSpacing.display,
    marginBottom: 3,
  },
  brewSub: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: Fonts.body,
    fontSize: 12,
    marginBottom: 2,
  },
  brewTime: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: Fonts.body,
    fontSize: 11,
  },
});
