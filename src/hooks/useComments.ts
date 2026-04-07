import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import type { CommentWithUser } from '../types/database';

const cacheKey = (brewId: string) => `@coffeeclub:comments:${brewId}`;

export function useComments(brewId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!brewId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:users(id, username, display_name, avatar_url)')
        .eq('brew_id', brewId)
        .order('created_at');

      if (error) throw error;

      const result = (data ?? []) as CommentWithUser[];
      setComments(result);

      // Cache
      await AsyncStorage.setItem(cacheKey(brewId), JSON.stringify(result));
    } catch (err) {
      console.error('useComments fetch error:', err);
      // Try loading from cache on failure
      try {
        const cached = await AsyncStorage.getItem(cacheKey(brewId));
        if (cached) setComments(JSON.parse(cached));
      } catch { /* ignore cache read errors */ }
    } finally {
      setLoading(false);
    }
  }, [brewId]);

  useEffect(() => {
    // Load cache first for instant UI
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey(brewId));
        if (cached) setComments(JSON.parse(cached));
      } catch { /* ignore */ }
    })();

    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(async (body: string) => {
    if (!user || !brewId || !body.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ brew_id: brewId, user_id: user.id, body: body.trim() })
        .select('*, user:users(id, username, display_name, avatar_url)')
        .single();

      if (error) throw error;

      const newComment = data as CommentWithUser;
      setComments((prev) => [...prev, newComment]);

      // Create notification for brew owner (if not self)
      const { data: brew } = await supabase
        .from('brews')
        .select('user_id')
        .eq('id', brewId)
        .single();

      if (brew && brew.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: brew.user_id,
          type: 'comment',
          actor_id: user.id,
          brew_id: brewId,
          read: false,
        });
      }
    } catch (err) {
      console.error('useComments addComment error:', err);
    }
  }, [user, brewId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return;

    const prev = comments;
    setComments((c) => c.filter((item) => item.id !== commentId));

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('useComments deleteComment error:', err);
      setComments(prev);
    }
  }, [user, comments]);

  return { comments, loading, addComment, deleteComment, refresh: fetchComments };
}
