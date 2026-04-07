import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedBrewIds, setBookmarkedBrewIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('brew_id')
          .eq('user_id', user.id);

        if (error) throw error;
        setBookmarkedBrewIds((data ?? []).map((b) => b.brew_id));
      } catch (err) {
        console.error('useBookmarks fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const isBookmarked = useCallback(
    (brewId: string) => bookmarkedBrewIds.includes(brewId),
    [bookmarkedBrewIds],
  );

  const toggle = useCallback(async (brewId: string) => {
    if (!user) return;

    const wasBookmarked = bookmarkedBrewIds.includes(brewId);

    // Optimistic update
    setBookmarkedBrewIds((prev) =>
      wasBookmarked ? prev.filter((id) => id !== brewId) : [...prev, brewId],
    );

    try {
      if (wasBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('brew_id', brewId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, brew_id: brewId });
        if (error) throw error;
      }
    } catch (err) {
      console.error('useBookmarks toggle error:', err);
      // Revert
      setBookmarkedBrewIds((prev) =>
        wasBookmarked ? [...prev, brewId] : prev.filter((id) => id !== brewId),
      );
    }
  }, [user, bookmarkedBrewIds]);

  return { isBookmarked, toggle, bookmarkedBrewIds, loading };
}
