import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import type { DbUser } from '../types/database';

// ─── Follow / Unfollow ──────────────────────────────────────────────────────

export function useFollow(userId: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.id === userId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('cc_follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle();

        if (error) throw error;
        setIsFollowing(!!data);
      } catch (err) {
        console.error('useFollow check error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, userId]);

  const toggle = useCallback(async () => {
    if (!user || user.id === userId) return;

    const wasFollowing = isFollowing;
    // Optimistic update
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from('cc_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cc_follows')
          .insert({ follower_id: user.id, following_id: userId });
        if (error) throw error;
      }
    } catch (err) {
      console.error('useFollow toggle error:', err);
      // Revert on error
      setIsFollowing(wasFollowing);
    }
  }, [user, userId, isFollowing]);

  return { isFollowing, loading, toggle };
}

// ─── Followers ───────────────────────────────────────────────────────────────

export function useFollowers(userId: string) {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('cc_follows')
          .select('follower:cc_users!cc_follows_follower_id_fkey(id, username, display_name, avatar_url, bio, location, created_at)')
          .eq('following_id', userId);

        if (error) throw error;

        const list = (data ?? [])
          .map((row: any) => row.follower as DbUser)
          .filter(Boolean);
        setUsers(list);
        setCount(list.length);
      } catch (err) {
        console.error('useFollowers error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return { users, count, loading };
}

// ─── Following ───────────────────────────────────────────────────────────────

export function useFollowing(userId: string) {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('cc_follows')
          .select('following:cc_users!cc_follows_following_id_fkey(id, username, display_name, avatar_url, bio, location, created_at)')
          .eq('follower_id', userId);

        if (error) throw error;

        const list = (data ?? [])
          .map((row: any) => row.following as DbUser)
          .filter(Boolean);
        setUsers(list);
        setCount(list.length);
      } catch (err) {
        console.error('useFollowing error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return { users, count, loading };
}
