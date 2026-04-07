import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface StoryData {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastBrewAction: string;
  isSponsored: false;
}

const MOCK_STORIES: StoryData[] = [
  {
    userId: 'mock-1',
    username: 'barista_joe',
    displayName: 'Joe',
    avatarUrl: null,
    lastBrewAction: 'Espresso',
    isSponsored: false,
  },
  {
    userId: 'mock-2',
    username: 'coffee_kate',
    displayName: 'Kate',
    avatarUrl: null,
    lastBrewAction: 'Pour Over',
    isSponsored: false,
  },
  {
    userId: 'mock-3',
    username: 'latte_art_sam',
    displayName: 'Sam',
    avatarUrl: null,
    lastBrewAction: 'Latte',
    isSponsored: false,
  },
];

export function useStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStories(MOCK_STORIES);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // Get followed user ids
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (followError) throw followError;

        const followedIds = (followData ?? []).map((f) => f.following_id);

        if (followedIds.length === 0) {
          setStories(MOCK_STORIES);
          setLoading(false);
          return;
        }

        // Get brews from the last 24 hours by followed users
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: brewData, error: brewError } = await supabase
          .from('brews')
          .select('user_id, name, created_at, user:users(id, username, display_name, avatar_url)')
          .in('user_id', followedIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false });

        if (brewError) throw brewError;

        if (!brewData || brewData.length === 0) {
          setStories(MOCK_STORIES);
          setLoading(false);
          return;
        }

        // Deduplicate: keep only the most recent brew per user
        const seenUsers = new Set<string>();
        const storyList: StoryData[] = [];

        for (const row of brewData as any[]) {
          if (seenUsers.has(row.user_id)) continue;
          seenUsers.add(row.user_id);

          const u = row.user;
          if (!u) continue;

          storyList.push({
            userId: u.id,
            username: u.username,
            displayName: u.display_name,
            avatarUrl: u.avatar_url,
            lastBrewAction: row.name,
            isSponsored: false,
          });
        }

        setStories(storyList.length > 0 ? storyList : MOCK_STORIES);
      } catch (err) {
        console.error('useStories error:', err);
        setStories(MOCK_STORIES);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return { stories, loading };
}
