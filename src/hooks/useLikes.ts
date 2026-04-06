import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export function useLike(brewId: string) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brewId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // Fetch count
        const { count, error: countError } = await supabase
          .from('cc_likes')
          .select('*', { count: 'exact', head: true })
          .eq('brew_id', brewId);

        if (countError) throw countError;
        setLikeCount(count ?? 0);

        // Check if current user liked it
        if (user) {
          const { data, error } = await supabase
            .from('cc_likes')
            .select('user_id')
            .eq('brew_id', brewId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;
          setIsLiked(!!data);
        }
      } catch (err) {
        console.error('useLike init error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [brewId, user]);

  const toggle = useCallback(async () => {
    if (!user || !brewId) return;

    const wasLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic update
    setIsLiked(!wasLiked);
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1);

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from('cc_likes')
          .delete()
          .eq('brew_id', brewId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cc_likes')
          .insert({ brew_id: brewId, user_id: user.id });
        if (error) throw error;
      }
    } catch (err) {
      console.error('useLike toggle error:', err);
      // Revert on error
      setIsLiked(wasLiked);
      setLikeCount(prevCount);
    }
  }, [user, brewId, isLiked, likeCount]);

  return { isLiked, likeCount, toggle };
}
