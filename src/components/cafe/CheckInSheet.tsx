import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useMyBrews } from '../../hooks/useBrews';
import { supabase } from '../../services/supabase';
import { hapticLight, hapticSelection } from '../../services/device';
import { Fonts, Radius, Spacing, Elevation, LetterSpacing } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.4;

interface CheckInSheetProps {
  cafeId: string;
  cafeName: string;
  visible: boolean;
  onClose: () => void;
  onCheckedIn: () => void;
}

export default function CheckInSheet({
  cafeId,
  cafeName,
  visible,
  onClose,
  onCheckedIn,
}: CheckInSheetProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { brews } = useMyBrews();
  const [selectedBrewId, setSelectedBrewId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(SCREEN_HEIGHT - SHEET_HEIGHT, {
        damping: 22,
        stiffness: 200,
        mass: 0.8,
      });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
      setSelectedBrewId(null);
    }
  }, [visible, translateY, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleCheckIn = useCallback(async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('checkins').insert({
        user_id: user.id,
        cafe_id: cafeId,
        brew_id: selectedBrewId,
      });
      if (error) throw error;
      hapticLight();
      onCheckedIn();
      onClose();
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setSubmitting(false);
    }
  }, [user, cafeId, selectedBrewId, onCheckedIn, onClose]);

  const recentBrews = brews.slice(0, 3);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { height: SHEET_HEIGHT, backgroundColor: colors.bgCard },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.textFaint }]} />
        </View>

        {/* Heading */}
        <Text style={[styles.heading, { color: colors.text }]}>I'm here!</Text>
        <Text style={[styles.cafeName, { color: colors.accent }]}>{cafeName}</Text>

        {/* Optional: link a recent brew */}
        {recentBrews.length > 0 && (
          <View style={styles.brewSection}>
            <Text style={[styles.brewLabel, { color: colors.textSub }]}>Link a brew (optional)</Text>
            <View style={styles.brewRow}>
              {recentBrews.map((brew) => (
                <Pressable
                  key={brew.id}
                  onPress={() => {
                    hapticSelection();
                    setSelectedBrewId(selectedBrewId === brew.id ? null : brew.id);
                  }}
                  style={[
                    styles.brewChip,
                    {
                      backgroundColor: selectedBrewId === brew.id ? colors.accent : 'transparent',
                      borderColor: selectedBrewId === brew.id ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.brewChipText,
                      { color: selectedBrewId === brew.id ? '#FFFFFF' : colors.textSub },
                    ]}
                    numberOfLines={1}
                  >
                    {brew.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Check In button */}
        <Pressable onPress={handleCheckIn} disabled={submitting} style={styles.btnWrapper}>
          <LinearGradient
            colors={['#D4A050', '#E8C97A', '#D4A050']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>{submitting ? 'Checking in...' : 'Check In'}</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.gutter,
    ...Elevation.sheet,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: LetterSpacing.display,
    textAlign: 'center',
    marginTop: 8,
  },
  cafeName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  brewSection: {
    marginBottom: 16,
  },
  brewLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    marginBottom: 8,
  },
  brewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  brewChip: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  brewChipText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  btnWrapper: {
    marginTop: 4,
  },
  btn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
  },
});
