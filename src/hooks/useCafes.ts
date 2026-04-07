import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { CafeWithStats, CafeReviewWithUser, DbCheckin } from '../types/database';

// ─── Cafe List ──────────────────────────────────────────────────────────────

export function useCafes() {
  const [cafes, setCafes] = useState<CafeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cafes')
        .select('*, cafe_reviews(rating), checkins(id)');

      if (searchTerm.trim()) {
        query = query.ilike('name', `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const list: CafeWithStats[] = ((data as any[]) ?? []).map((cafe) => {
        const reviews: { rating: number }[] = cafe.cafe_reviews ?? [];
        const checkins: { id: string }[] = cafe.checkins ?? [];
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return {
          ...cafe,
          cafe_reviews: undefined,
          checkins: undefined,
          avg_rating: reviews.length > 0 ? Math.round((sum / reviews.length) * 10) / 10 : 0,
          review_count: reviews.length,
          checkin_count: checkins.length,
        } as CafeWithStats;
      });

      // Sort by review_count desc (most popular first)
      list.sort((a, b) => b.review_count - a.review_count);
      setCafes(list);
    } catch (err) {
      console.error('useCafes fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return { cafes, loading, refresh, search };
}

// ─── Cafe Detail ────────────────────────────────────────────────────────────

export function useCafeDetail(cafeId: string) {
  const [cafe, setCafe] = useState<CafeWithStats | null>(null);
  const [reviews, setReviews] = useState<CafeReviewWithUser[]>([]);
  const [checkins, setCheckins] = useState<DbCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!cafeId) return;
    setLoading(true);
    try {
      // Fetch cafe with computed stats
      const { data: cafeData, error: cafeError } = await supabase
        .from('cafes')
        .select('*, cafe_reviews(rating), checkins(id)')
        .eq('id', cafeId)
        .single();

      if (cafeError) throw cafeError;

      const cafeReviews: { rating: number }[] = (cafeData as any).cafe_reviews ?? [];
      const cafeCheckins: { id: string }[] = (cafeData as any).checkins ?? [];
      const sum = cafeReviews.reduce((acc, r) => acc + r.rating, 0);

      setCafe({
        ...cafeData,
        cafe_reviews: undefined,
        checkins: undefined,
        avg_rating: cafeReviews.length > 0 ? Math.round((sum / cafeReviews.length) * 10) / 10 : 0,
        review_count: cafeReviews.length,
        checkin_count: cafeCheckins.length,
      } as CafeWithStats);

      // Fetch reviews with user info
      const { data: reviewData } = await supabase
        .from('cafe_reviews')
        .select('*, user:users!cafe_reviews_user_id_fkey(id, username, display_name, avatar_url)')
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: false });

      setReviews((reviewData ?? []) as CafeReviewWithUser[]);

      // Fetch recent checkins
      const { data: checkinData } = await supabase
        .from('checkins')
        .select('*')
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: false })
        .limit(20);

      setCheckins((checkinData ?? []) as DbCheckin[]);
    } catch (err) {
      console.error('useCafeDetail fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [cafeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cafe, reviews, checkins, loading, refresh };
}
