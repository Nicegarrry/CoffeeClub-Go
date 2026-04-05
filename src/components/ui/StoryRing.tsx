import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Fonts } from '../../constants/theme';

interface StoryRingProps {
  avatar?: string;
  name: string;
  seen?: boolean;
  onPress?: () => void;
  isAddButton?: boolean;
  isSponsored?: boolean;
}

const RING_SIZE = 72;
const AVATAR_SIZE = 64;
const RING_WIDTH = 2.5;

export function StoryRing({
  avatar,
  name,
  seen = false,
  onPress,
  isAddButton = false,
  isSponsored = false,
}: StoryRingProps) {
  const { colors } = useTheme();

  const renderAvatar = () => {
    if (isAddButton) {
      return (
        <View style={[styles.addButton, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.addIcon, { color: colors.accent }]}>+</Text>
        </View>
      );
    }
    return (
      <Image
        source={{ uri: avatar }}
        style={styles.avatar}
      />
    );
  };

  const renderRing = () => {
    if (isAddButton) {
      return (
        <View style={[styles.ringOuter, { borderColor: colors.accent, borderWidth: RING_WIDTH, borderStyle: 'dashed' }]}>
          <View style={styles.ringInner}>{renderAvatar()}</View>
        </View>
      );
    }

    if (seen) {
      return (
        <View style={[styles.ringOuter, { borderColor: colors.storyRingSeen, borderWidth: RING_WIDTH }]}>
          <View style={styles.ringInner}>{renderAvatar()}</View>
        </View>
      );
    }

    return (
      <LinearGradient
        colors={colors.storyRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientRing}
      >
        <View style={[styles.ringInner, { backgroundColor: colors.bg }]}>
          {renderAvatar()}
        </View>
      </LinearGradient>
    );
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {renderRing()}
      <Text
        style={[
          styles.name,
          { color: isSponsored ? colors.accent : colors.textSub },
        ]}
        numberOfLines={1}
      >
        {isSponsored ? 'Sponsored' : name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 76,
  },
  gradientRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  addButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 28,
    fontFamily: Fonts.bodyMedium,
    marginTop: -2,
  },
  name: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 6,
    maxWidth: 72,
    textAlign: 'center',
  },
});
