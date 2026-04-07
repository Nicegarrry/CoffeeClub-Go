import { useMemo } from 'react';
import type { DbBrew, DbBean } from '../types/database';

export interface BrewStats {
  totalBrews: number;
  thisWeek: number;
  thisMonth: number;
  avgRating: number;
  streakDays: number;
  topMethod: string | null;
  topBean: { id: string; name: string } | null;
  ratingTrend: 'up' | 'down' | 'stable';
  methodDistribution: Array<{ method: string; count: number }>;
}

export function useBrewStats(brews: DbBrew[], beans?: DbBean[]): BrewStats {
  return useMemo(() => {
    const now = Date.now();
    const dayMs = 86_400_000;

    const totalBrews = brews.length;

    const thisWeek = brews.filter(
      (b) => now - new Date(b.created_at).getTime() < 7 * dayMs,
    ).length;

    const thisMonth = brews.filter(
      (b) => now - new Date(b.created_at).getTime() < 30 * dayMs,
    ).length;

    // Average rating excluding 0s
    const rated = brews.filter((b) => b.rating > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, b) => sum + b.rating, 0) / rated.length
        : 0;

    // Streak: consecutive days with at least 1 brew, counting back from today
    const toDay = (d: string) => Math.floor(new Date(d).getTime() / dayMs);
    const today = Math.floor(now / dayMs);
    const brewDays = new Set(brews.map((b) => toDay(b.created_at)));
    let streakDays = 0;
    for (let d = today; brewDays.has(d); d--) {
      streakDays++;
    }

    // Top method
    const methodCounts = new Map<string, number>();
    for (const b of brews) {
      methodCounts.set(b.brew_type, (methodCounts.get(b.brew_type) ?? 0) + 1);
    }
    const methodDistribution = [...methodCounts.entries()]
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);
    const topMethod = methodDistribution[0]?.method ?? null;

    // Top bean
    const beanCounts = new Map<string, number>();
    for (const b of brews) {
      if (b.bean_id) {
        beanCounts.set(b.bean_id, (beanCounts.get(b.bean_id) ?? 0) + 1);
      }
    }
    let topBean: BrewStats['topBean'] = null;
    if (beanCounts.size > 0) {
      const topBeanId = [...beanCounts.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0][0];
      const beanRecord = beans?.find((bn) => bn.id === topBeanId);
      topBean = { id: topBeanId, name: beanRecord?.name ?? 'Unknown' };
    }

    // Rating trend: last 5 vs previous 5
    const sorted = [...brews].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const last5 = sorted.slice(0, 5).filter((b) => b.rating > 0);
    const prev5 = sorted.slice(5, 10).filter((b) => b.rating > 0);
    const avgLast =
      last5.length > 0
        ? last5.reduce((s, b) => s + b.rating, 0) / last5.length
        : 0;
    const avgPrev =
      prev5.length > 0
        ? prev5.reduce((s, b) => s + b.rating, 0) / prev5.length
        : 0;
    let ratingTrend: BrewStats['ratingTrend'] = 'stable';
    if (prev5.length > 0 && last5.length > 0) {
      const diff = avgLast - avgPrev;
      if (diff > 0.3) ratingTrend = 'up';
      else if (diff < -0.3) ratingTrend = 'down';
    }

    return {
      totalBrews,
      thisWeek,
      thisMonth,
      avgRating,
      streakDays,
      topMethod,
      topBean,
      ratingTrend,
      methodDistribution,
    };
  }, [brews, beans]);
}
