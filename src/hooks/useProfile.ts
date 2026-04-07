import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import type { UserProfile } from '../types/database';

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!targetId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch user row
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetId)
        .single();

      if (userError) throw userError;
      if (!userData) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Fetch counts in parallel
      const [brewRes, followerRes, followingRes, isFollowingRes] = await Promise.all([
        supabase
          .from('brews')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', targetId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetId),
        // Check if current user follows this profile (only relevant for other users)
        user && user.id !== targetId
          ? supabase
              .from('follows')
              .select('follower_id')
              .eq('follower_id', user.id)
              .eq('following_id', targetId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const combined: UserProfile = {
        ...userData,
        brew_count: brewRes.count ?? 0,
        follower_count: followerRes.count ?? 0,
        following_count: followingRes.count ?? 0,
        is_following: !!isFollowingRes.data,
      };

      setProfile(combined);
    } catch (err) {
      console.error('useProfile error:', err);
    } finally {
      setLoading(false);
    }
  }, [targetId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, loading, refresh };
}
