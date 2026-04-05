import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, action, onAction }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSub }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: colors.accent }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 2,
  },
  action: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
});
