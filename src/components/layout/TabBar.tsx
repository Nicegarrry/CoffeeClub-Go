import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { Fonts } from '../../constants/theme';
import { hapticLight } from '../../services/device';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Tab {
  key: string;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { key: 'home', label: 'Home', icon: '\u2302' },
  { key: 'explore', label: 'Explore', icon: '\u25CB' },
  { key: 'log', label: 'Log', icon: '\u25A6' },
  { key: 'profile', label: 'Profile', icon: '\u25CF' },
];

interface TabBarProps {
  activeTab?: string;
  onTabPress?: (key: string) => void;
  onPressAdd: () => void;
}

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <AnimatedPressable onPress={handlePress} style={[styles.tabItem, animatedStyle]}>
      {isActive && (
        <View style={[styles.activeBackground, { backgroundColor: colors.accentSoft }]} />
      )}
      <Text
        style={[
          styles.tabIcon,
          { color: isActive ? colors.accent : colors.textFaint },
        ]}
      >
        {tab.icon}
      </Text>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? colors.accent : colors.textFaint,
            fontFamily: isActive ? Fonts.bodySemiBold : Fonts.body,
          },
        ]}
      >
        {tab.label}
      </Text>
      {isActive && (
        <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
      )}
    </AnimatedPressable>
  );
}

export default function TabBar({ activeTab = 'home', onTabPress, onPressAdd }: TabBarProps) {
  const { colors } = useTheme();
  const addScale = useSharedValue(1);

  const addAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));

  const handleAddPress = () => {
    addScale.value = withSpring(0.88, { damping: 12 }, () => {
      addScale.value = withSpring(1);
    });
    hapticLight();
    onPressAdd();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.pill, { backgroundColor: colors.tabBg }]}>
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => {
              hapticLight();
              onTabPress?.(tab.key);
            }}
          />
        ))}
      </View>

      <AnimatedPressable onPress={handleAddPress} style={[styles.addWrapper, addAnimatedStyle]}>
        <LinearGradient
          colors={['#D4A050', '#E8C97A', '#D4A050']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addButton}
        >
          <Text style={styles.addIcon}>+</Text>
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 8,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    position: 'relative',
  },
  activeBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  tabIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: Fonts.body,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  addWrapper: {
    width: 56,
    height: 56,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#D4A050',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  addIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -2,
  },
});
