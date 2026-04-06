import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts } from '../../constants/theme';
import type { Story } from '../../constants/mockData';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DURATION_MS = 6000;
const TICK_MS = 60;

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
}

export default function StoryViewer({ story, onClose }: StoryViewerProps) {
  const [progress, setProgress] = useState(0);
  const fadeOpacity = useSharedValue(0);

  // Fade in on mount
  useEffect(() => {
    fadeOpacity.value = withTiming(1, { duration: 300 });
  }, [fadeOpacity]);

  // Auto-advance progress bar
  useEffect(() => {
    const increment = (TICK_MS / DURATION_MS) * 100;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(interval);
          onClose();
          return 100;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [onClose]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  return (
    <Animated.View style={[styles.overlay, fadeStyle]}>
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={onClose}
      >
        <LinearGradient
          colors={['#3B1E08', '#6B3A1A', '#A86830', '#D4A050']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>

          {/* User info row */}
          <View style={styles.userRow}>
            <Image source={{ uri: story.avatar }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{story.name}</Text>
              <Text style={styles.timestamp}>just now</Text>
            </View>
            {story.isSponsored && (
              <View style={styles.sponsoredBadge}>
                <Text style={styles.sponsoredText}>SPONSORED</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Caption area */}
          <View style={styles.captionArea}>
            <Text style={styles.captionText}>{story.action}</Text>
          </View>

          {/* Tap to close pill */}
          <View style={styles.pillWrapper}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>Tap to close</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
    zIndex: 999,
    backgroundColor: '#000',
  },
  touchArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: '#FFF',
  },
  timestamp: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  sponsoredBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  sponsoredText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: '#FFF',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  captionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  captionText: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 34,
  },
  pillWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
});
