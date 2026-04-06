import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Spacing, LetterSpacing } from '../../constants/theme';

export function Header() {
  const { colors, isDark, toggle } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.glass, borderBottomColor: colors.border }]}>
      <View style={styles.spacer} />
      <Text style={[styles.title, { color: colors.accent }]}>
        {'☕ coffeeclub'}
      </Text>
      <View style={styles.rightSection}>
        <Pressable onPress={toggle} hitSlop={10} style={[styles.toggleButton, { backgroundColor: colors.accentSoft }]}>
          <Text style={styles.toggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spacer: {
    width: 36,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: LetterSpacing.display,
  },
  rightSection: {
    width: 36,
    alignItems: 'flex-end',
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIcon: {
    fontSize: 18,
  },
});
