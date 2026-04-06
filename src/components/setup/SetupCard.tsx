import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Fonts, Elevation, LetterSpacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface SetupCardProps {
  category: string;
  name: string;
  detail: string;
  emoji: string;
  bgColor: string;
  dotColor: string;
}

export function SetupCard({ category, name, detail, emoji, bgColor, dotColor }: SetupCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: bgColor, shadowColor: colors.shadow }]}>
      {/* Category label with dot */}
      <View style={styles.categoryRow}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.category, { color: colors.textSub }]}>
          {category.toUpperCase()}
        </Text>
      </View>

      {/* Name and detail */}
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.detail, { color: colors.textSub }]}>{detail}</Text>

      {/* Decorative emoji top-right (low opacity) */}
      <Text style={styles.emojiGhost}>{emoji}</Text>

      {/* Decorative emoji bottom-right (full) */}
      <Text style={styles.emojiMain}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    minHeight: 130,
    overflow: 'hidden',
    flex: 1,
    ...Elevation.card,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  category: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: LetterSpacing.uppercase,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 17,
    marginBottom: 2,
    letterSpacing: LetterSpacing.display,
  },
  detail: {
    fontFamily: Fonts.displayItalic,
    fontSize: 13,
  },
  emojiGhost: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontSize: 28,
    opacity: 0.12,
  },
  emojiMain: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    fontSize: 32,
  },
});
