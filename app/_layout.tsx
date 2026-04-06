import React, { useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fraunces_700Bold, Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../src/hooks/useTheme';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';
import AuthScreen from './auth';

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { isDark, colors } = useTheme();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {session ? <Slot /> : <AuthScreen />}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Fraunces_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container} onLayout={onLayoutReady}>
      <ThemeProvider>
        <AuthProvider>
          <InnerLayout />
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
