import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing, Elevation, Fonts } from '../../constants/theme';
import { hapticLight } from '../../services/device';

interface BrewlyProps {
  message: string;
  detail?: string;
  mood?: 'happy' | 'thinking' | 'excited' | 'concerned';
  onDismiss?: () => void;
  visible?: boolean;
}

const MOOD_EMOJI: Record<NonNullable<BrewlyProps['mood']>, string> = {
  happy: '\u2615',
  thinking: '\uD83E\uDD14',
  excited: '\uD83C\uDFAF',
  concerned: '\uD83D\uDE2C',
};

const AVATAR_SIZE = 36;

export default function Brewly({
  message,
  detail,
  mood = 'happy',
  onDismiss,
  visible = true,
}: BrewlyProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const translateX = useSharedValue(-50);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setExpanded(false);
      translateX.value = -50;
      opacity.value = 0;
      translateY.value = 0;

      opacity.value = withTiming(1, { duration: 300 });
      translateX.value = withSpring(0, { damping: 14, stiffness: 120 });
      translateY.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(-2, { duration: 1500 }),
            withTiming(2, { duration: 1500 }),
          ),
          -1,
          true,
        ),
      );

      runOnJS(hapticLight)();
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const styles = makeStyles(colors);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
        <Text style={styles.emoji}>{MOOD_EMOJI[mood]}</Text>
      </View>

      {/* Nub pointing to avatar */}
      <View style={[styles.nub, { borderRightColor: colors.bgCard }]} />

      {/* Speech bubble */}
      <TouchableOpacity
        activeOpacity={detail ? 0.8 : 1}
        onPress={() => detail && setExpanded(prev => !prev)}
        style={[
          styles.bubble,
          {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {/* Dismiss */}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={8} style={styles.dismiss}>
            <Text style={[styles.dismissText, { color: colors.textFaint }]}>{'\u00D7'}</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>

        {detail && expanded && (
          <Text style={[styles.detail, { color: colors.textSub }]}>{detail}</Text>
        )}

        {detail && !expanded && (
          <Text style={[styles.hint, { color: colors.textFaint }]}>Tap for more</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: Spacing.gutter,
      marginBottom: Spacing.cardGap,
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    emoji: {
      fontSize: 18,
    },
    nub: {
      width: 0,
      height: 0,
      marginTop: 12,
      borderTopWidth: 6,
      borderBottomWidth: 6,
      borderRightWidth: 8,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    bubble: {
      flex: 1,
      borderWidth: 1,
      borderRadius: Radius.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
      paddingRight: 30,
      ...Elevation.card,
    },
    dismiss: {
      position: 'absolute',
      top: 8,
      right: 10,
      zIndex: 1,
    },
    dismissText: {
      fontSize: 18,
      fontFamily: Fonts.body,
      lineHeight: 20,
    },
    message: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 20,
    },
    detail: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 6,
    },
    hint: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      marginTop: 4,
    },
  });
