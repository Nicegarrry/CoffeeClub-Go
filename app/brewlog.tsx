import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme';
import { Fonts } from '../src/constants/theme';

export default function BrewLogScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.center}>
        <Text style={styles.emoji}>☕</Text>
        <Text style={[styles.heading, { color: colors.text }]}>Brew Log</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>
          Your brewing history
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
  },
});
