import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import type { StoryWithUser } from '../types/database';

const SEEN_KEY = '@coffeeclub:seen-stories';

/** @deprecated Use StoryGroup instead */
export interface StoryData {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastBrewAction: string;
  isSponsored: false;
}

export interface StoryGroup {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  stories: StoryWithUser[];
  hasUnseen: boolean;
}

interface CreateStoryInput {
  photoUri?: string | null;
  caption: string;
  type: 'brew' | 'checkin' | 'bean' | 'general';
  brewId?: string | null;
  beanId?: string | null;
}

async function loadSeenIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore parse errors
  }
  return new Set();
}

async function persistSeenIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore write errors
  }
}

export function useStories() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const fetchStories = useCallback(async () => {
    if (!user) {
      setStoryGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const seen = await loadSeenIds();
      setSeenIds(seen);

      // Get followed user ids
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followedIds = (followData ?? []).map((f) => f.following_id);
      // Include own id so user sees their own stories
      const userIds = [...followedIds, user.id];

      // Fetch non-expired stories
      const { data: storyData, error } = await supabase
        .from('stories')
        .select('*, user:users(id, username, display_name, avatar_url)')
        .in('user_id', userIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!storyData || storyData.length === 0) {
        setStoryGroups([]);
        setLoading(false);
        return;
      }

      // Group by user_id
      const groupMap = new Map<string, StoryWithUser[]>();
      for (const row of storyData as StoryWithUser[]) {
        const existing = groupMap.get(row.user_id);
        if (existing) {
          existing.push(row);
        } else {
          groupMap.set(row.user_id, [row]);
        }
      }

      const groups: StoryGroup[] = [];
      for (const [userId, stories] of groupMap) {
        const first = stories[0];
        if (!first.user) continue;

        groups.push({
          userId,
          username: first.user.username,
          displayName: first.user.display_name,
          avatarUrl: first.user.avatar_url,
          stories,
          hasUnseen: stories.some((s) => !seen.has(s.id)),
        });
      }

      // Put own stories first, then sort by unseen first, then newest
      groups.sort((a, b) => {
        if (a.userId === user.id) return -1;
        if (b.userId === user.id) return 1;
        if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
        return 0;
      });

      setStoryGroups(groups);
    } catch (err) {
      console.error('[useStories] fetch error:', err);
      setStoryGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const markSeen = useCallback(
    async (storyId: string) => {
      setSeenIds((prev) => {
        const next = new Set(prev);
        next.add(storyId);
        persistSeenIds(next);
        return next;
      });

      // Update hasUnseen in groups
      setStoryGroups((prev) =>
        prev.map((group) => ({
          ...group,
          hasUnseen: group.stories.some(
            (s) => s.id !== storyId && !seenIds.has(s.id),
          ),
        })),
      );
    },
    [seenIds],
  );

  const createStory = useCallback(
    async (input: CreateStoryInput) => {
      if (!user) return;

      let photoUrl: string | null = null;

      if (input.photoUri) {
        // Upload to story-photos bucket
        const response = await fetch(input.photoUri);
        const blob = await response.blob();
        const ext = input.photoUri.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('story-photos')
          .upload(path, blob, {
            contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
            upsert: false,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from('story-photos').getPublicUrl(path);
          photoUrl = data.publicUrl;
        }
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        photo_url: photoUrl,
        caption: input.caption,
        type: input.type,
        brew_id: input.brewId ?? null,
        bean_id: input.beanId ?? null,
        expires_at: expiresAt,
      });

      if (error) {
        console.error('[useStories] create error:', error);
        throw error;
      }

      // Refresh stories list
      await fetchStories();
    },
    [user, fetchStories],
  );

  return { storyGroups, loading, refresh: fetchStories, markSeen, createStory };
}
