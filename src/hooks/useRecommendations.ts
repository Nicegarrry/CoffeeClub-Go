import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { askBrewly } from '../services/ai';
import type { TasteProfile } from './useTasteProfile';

export interface BeanRecommendation {
  name: string;
  roaster: string;
  origin: string;
  reason: string;
  mood: 'happy' | 'thinking' | 'excited';
}

const CACHE_KEY = '@coffeeclub:recs';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  recommendations: BeanRecommendation[];
  timestamp: number;
}

export function useRecommendations(profile: TasteProfile) {
  const [recommendations, setRecommendations] = useState<BeanRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const didFetch = useRef(false);

  useEffect(() => {
    if (profile.totalBrews === 0 || didFetch.current) return;
    didFetch.current = true;

    (async () => {
      // Check cache first
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (Date.now() - entry.timestamp < TTL_MS) {
            setRecommendations(entry.recommendations);
            return;
          }
        }
      } catch {
        // ignore cache errors
      }

      // Build prompt from top 3 axes
      const axes = [
        { name: 'fruity', value: profile.fruity },
        { name: 'chocolate', value: profile.chocolate },
        { name: 'nutty', value: profile.nutty },
        { name: 'floral', value: profile.floral },
        { name: 'spicy', value: profile.spicy },
        { name: 'sweet', value: profile.sweet },
      ]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((a) => a.name);

      const prompt = `Based on this taste profile: top flavors are ${axes.join(', ')}, preferred roast ${profile.preferredRoast}, preferred origin ${profile.preferredOrigin}. Recommend 3 beans. Return JSON array of {name, roaster, origin, reason}.`;

      setLoading(true);
      try {
        const response = await askBrewly(prompt, {});
        if (response?.message) {
          // Try to parse JSON from the response
          const jsonMatch = response.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed: BeanRecommendation[] = JSON.parse(jsonMatch[0]).map(
              (r: Omit<BeanRecommendation, 'mood'>) => ({ ...r, mood: 'excited' as const }),
            );
            setRecommendations(parsed);
            await AsyncStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ recommendations: parsed, timestamp: Date.now() }),
            );
          }
        }
      } catch (err) {
        console.error('[useRecommendations] Error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  return { recommendations, loading };
}
