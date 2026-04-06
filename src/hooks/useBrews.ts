import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DbBrew, BrewWithUser } from '../types/database';

// ─── My Brews ────────────────────────────────────────────────────────────────

const MY_BREWS_CACHE_KEY = '@coffeeclub:my-brews';

export function useMyBrews() {
  const { user } = useAuth();
  const [brews, setBrews] = useState<DbBrew[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBrews([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('cc_brews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      const list = (data ?? []) as DbBrew[];
      setBrews(list);
      await AsyncStorage.setItem(MY_BREWS_CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('useMyBrews fetch error:', err);
      try {
        const cached = await AsyncStorage.getItem(MY_BREWS_CACHE_KEY);
        if (cached) setBrews(JSON.parse(cached));
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    AsyncStorage.getItem(MY_BREWS_CACHE_KEY)
      .then((cached) => {
        if (cached) setBrews(JSON.parse(cached));
      })
      .catch(() => {});
    refresh();
  }, [refresh]);

  const addBrew = useCallback(
    async (brew: Omit<DbBrew, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return;

      // Optimistic update with a temporary entry
      const optimistic: DbBrew = {
        ...brew,
        id: `temp-${Date.now()}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };
      setBrews((prev) => [optimistic, ...prev]);

      try {
        const { error } = await supabase
          .from('cc_brews')
          .insert({ ...brew, user_id: user.id });
        if (error) throw error;
        // Re-fetch to get the real row with server-generated id
        await refresh();
      } catch (err) {
        console.error('useMyBrews addBrew error:', err);
        // Revert optimistic update
        setBrews((prev) => prev.filter((b) => b.id !== optimistic.id));
      }
    },
    [user, refresh],
  );

  return { brews, loading, refresh, addBrew };
}

// ─── Social Feed ─────────────────────────────────────────────────────────────

const SOCIAL_FEED_CACHE_KEY = '@coffeeclub:social-feed';

export function useSocialFeed() {
  const { user } = useAuth();
  const [brews, setBrews] = useState<BrewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setBrews([]);
      setLoading(false);
      return;
    }
    try {
      // Get list of followed user ids
      const { data: followData } = await supabase
        .from('cc_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followedIds = (followData ?? []).map((f) => f.following_id);

      let query = supabase
        .from('cc_brews')
        .select('*, user:cc_users(id, username, display_name, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      // If user follows people, filter to their brews; otherwise show discovery feed
      if (followedIds.length > 0) {
        query = query.in('user_id', followedIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      const list = (data ?? []) as BrewWithUser[];
      setBrews(list);
      await AsyncStorage.setItem(SOCIAL_FEED_CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('useSocialFeed fetch error:', err);
      try {
        const cached = await AsyncStorage.getItem(SOCIAL_FEED_CACHE_KEY);
        if (cached) setBrews(JSON.parse(cached));
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Load cache first
    AsyncStorage.getItem(SOCIAL_FEED_CACHE_KEY)
      .then((cached) => {
        if (cached) setBrews(JSON.parse(cached));
      })
      .catch(() => {});

    refresh();

    // Set up realtime subscription
    if (user) {
      const channel = supabase
        .channel('social-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'cc_brews' },
          async (payload) => {
            const newBrew = payload.new as DbBrew;
            // Only include public brews from other users
            if (!newBrew.is_public || newBrew.user_id === user.id) return;

            // Fetch the user data for this brew
            try {
              const { data: userData } = await supabase
                .from('cc_users')
                .select('id, username, display_name, avatar_url')
                .eq('id', newBrew.user_id)
                .single();

              if (userData) {
                const brewWithUser: BrewWithUser = {
                  ...newBrew,
                  user: userData,
                };
                setBrews((prev) => [brewWithUser, ...prev]);
              }
            } catch {
              // Ignore — will appear on next refresh
            }
          },
        )
        .subscribe();

      channelRef.current = channel;
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, refresh]);

  return { brews, loading, refresh };
}
