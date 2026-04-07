import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { DbEquipmentCatalog } from '../types/database';

export function useEquipmentCatalog(type?: DbEquipmentCatalog['type']) {
  const [items, setItems] = useState<DbEquipmentCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('equipment_catalog')
      .select('*')
      .order('popularity_rank', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data } = await query;
    setItems((data as DbEquipmentCatalog[]) ?? []);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const search = useCallback(async (term: string): Promise<DbEquipmentCatalog[]> => {
    if (!term.trim()) return items;

    let query = supabase
      .from('equipment_catalog')
      .select('*')
      .or(`brand.ilike.%${term}%,model.ilike.%${term}%`)
      .order('popularity_rank', { ascending: true })
      .limit(20);

    if (type) {
      query = query.eq('type', type);
    }

    const { data } = await query;
    return (data as DbEquipmentCatalog[]) ?? [];
  }, [type, items]);

  return { items, loading, search, refetch: fetchItems };
}
