import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Spacing, LetterSpacing } from '../../constants/theme';

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: colors.text, letterSpacing: LetterSpacing.display }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSub }]}>{subtitle}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={[styles.action, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.actionText, { color: colors.accent }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

// Preset empty states
export function EmptyBrews({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      emoji="☕"
      title="No brews yet"
      subtitle="Log your first brew to start tracking your coffee journey"
      actionLabel="Log a brew"
      onAction={onAction}
    />
  );
}

export function EmptyBeans({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      emoji="🫘"
      title="No beans added"
      subtitle="Add your current beans to track stock and pair with brews"
      actionLabel="Add beans"
      onAction={onAction}
    />
  );
}

export function EmptySocial() {
  return (
    <EmptyState
      emoji="👋"
      title="No activity nearby"
      subtitle="Follow other coffee lovers to see what they're brewing"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  action: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
});
