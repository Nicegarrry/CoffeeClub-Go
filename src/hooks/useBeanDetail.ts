import { useMemo } from 'react';
import { useBeans } from './useSetup';
import { useMyBrews } from './useBrews';
import type { DbBean, DbBrew } from '../types/database';

interface BeanDetailResult {
  bean: DbBean | null;
  brews: DbBrew[];
  brewCount: number;
  avgRating: number;
  loading: boolean;
}

export function useBeanDetail(beanId: string): BeanDetailResult {
  const { beans, loading: beansLoading } = useBeans();
  const { brews: allBrews, loading: brewsLoading } = useMyBrews();

  const bean = useMemo(
    () => beans.find((b) => b.id === beanId) ?? null,
    [beans, beanId],
  );

  const brews = useMemo(
    () => allBrews.filter((b) => b.bean_id === beanId),
    [allBrews, beanId],
  );

  const brewCount = brews.length;

  const avgRating = useMemo(() => {
    if (brews.length === 0) return 0;
    const sum = brews.reduce((acc, b) => acc + b.rating, 0);
    return Math.round((sum / brews.length) * 10) / 10;
  }, [brews]);

  return {
    bean,
    brews,
    brewCount,
    avgRating,
    loading: beansLoading || brewsLoading,
  };
}
