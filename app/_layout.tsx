import React, { useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fraunces_700Bold, Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../src/hooks/useTheme';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { useBrewLogger } from '../src/hooks/useBrewLogger';
import TabBar from '../src/components/layout/TabBar';
import BrewLogSheet from '../src/components/brew/BrewLogSheet';
import AuthScreen from './auth';
import OnboardingScreen from './onboarding';

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { isDark, colors } = useTheme();
  const { session, loading } = useAuth();
  const { isComplete: onboardingComplete } = useOnboarding();
  const brewLogger = useBrewLogger();

  if (loading || onboardingComplete === null) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthScreen />
      </View>
    );
  }

  if (!onboardingComplete) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Slot />
      <TabBar onPressAdd={brewLogger.open} />
      <BrewLogSheet
        isOpen={brewLogger.isOpen}
        showDetails={brewLogger.showDetails}
        quickLogData={brewLogger.quickLogData}
        detailData={brewLogger.detailData}
        onClose={brewLogger.close}
        onSubmit={brewLogger.submit}
        onToggleDetails={brewLogger.toggleDetails}
        setQuickField={brewLogger.setQuickField}
        setDetailField={brewLogger.setDetailField}
      />
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
