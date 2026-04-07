import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useAuth';

const ONBOARDING_KEY = '@coffeeclub:onboarding_complete';

// Shared across all hook instances so layout + screen stay in sync
const listeners = new Set<(v: boolean) => void>();

export function useOnboarding() {
  const { profile } = useAuth();
  const [isComplete, setIsComplete] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    listeners.add(setIsComplete);
    return () => { listeners.delete(setIsComplete); };
  }, []);

  useEffect(() => {
    checkOnboarding();
  }, [profile]);

  async function checkOnboarding() {
    const flag = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (flag === 'true') {
      setIsComplete(true);
      return;
    }
    // Also check if profile already has preferred_method (existing user)
    if (profile?.preferred_method) {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsComplete(true);
      return;
    }
    setIsComplete(false);
  }

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    listeners.forEach((fn) => fn(true));
  }, []);

  return { isComplete, completeOnboarding };
}
