import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DbMachine, DbGrinder, DbBean } from '../types/database';

// ─── Machines ────────────────────────────────────────────────────────────────

const MACHINES_CACHE_KEY = '@coffeeclub:machines';

export function useMachines() {
  const { user } = useAuth();
  const [machines, setMachines] = useState<DbMachine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMachines = useCallback(async () => {
    if (!user) {
      setMachines([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('cc_machines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list = (data ?? []) as DbMachine[];
      setMachines(list);
      await AsyncStorage.setItem(MACHINES_CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('useMachines fetch error:', err);
      // Fall back to cache
      try {
        const cached = await AsyncStorage.getItem(MACHINES_CACHE_KEY);
        if (cached) setMachines(JSON.parse(cached));
      } catch {
        // ignore cache read failure
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Load cache first for instant UI
    AsyncStorage.getItem(MACHINES_CACHE_KEY)
      .then((cached) => {
        if (cached) setMachines(JSON.parse(cached));
      })
      .catch(() => {});
    fetchMachines();
  }, [fetchMachines]);

  const activeMachine = machines.find((m) => m.is_active) ?? machines[0] ?? null;

  const create = useCallback(
    async (data: Omit<DbMachine, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return;
      try {
        const { error } = await supabase
          .from('cc_machines')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
        await fetchMachines();
      } catch (err) {
        console.error('useMachines create error:', err);
      }
    },
    [user, fetchMachines],
  );

  const update = useCallback(
    async (id: string, data: Partial<DbMachine>) => {
      try {
        const { error } = await supabase.from('cc_machines').update(data).eq('id', id);
        if (error) throw error;
        await fetchMachines();
      } catch (err) {
        console.error('useMachines update error:', err);
      }
    },
    [fetchMachines],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('cc_machines').delete().eq('id', id);
        if (error) throw error;
        await fetchMachines();
      } catch (err) {
        console.error('useMachines remove error:', err);
      }
    },
    [fetchMachines],
  );

  const setActive = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        // Deactivate all
        await supabase
          .from('cc_machines')
          .update({ is_active: false })
          .eq('user_id', user.id);
        // Activate selected
        const { error } = await supabase
          .from('cc_machines')
          .update({ is_active: true })
          .eq('id', id);
        if (error) throw error;
        await fetchMachines();
      } catch (err) {
        console.error('useMachines setActive error:', err);
      }
    },
    [user, fetchMachines],
  );

  return { machines, loading, activeMachine, create, update, remove, setActive };
}

// ─── Grinders ────────────────────────────────────────────────────────────────

const GRINDERS_CACHE_KEY = '@coffeeclub:grinders';

export function useGrinders() {
  const { user } = useAuth();
  const [grinders, setGrinders] = useState<DbGrinder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrinders = useCallback(async () => {
    if (!user) {
      setGrinders([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('cc_grinders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list = (data ?? []) as DbGrinder[];
      setGrinders(list);
      await AsyncStorage.setItem(GRINDERS_CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('useGrinders fetch error:', err);
      try {
        const cached = await AsyncStorage.getItem(GRINDERS_CACHE_KEY);
        if (cached) setGrinders(JSON.parse(cached));
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    AsyncStorage.getItem(GRINDERS_CACHE_KEY)
      .then((cached) => {
        if (cached) setGrinders(JSON.parse(cached));
      })
      .catch(() => {});
    fetchGrinders();
  }, [fetchGrinders]);

  const activeGrinder = grinders.find((g) => g.is_active) ?? grinders[0] ?? null;

  const create = useCallback(
    async (data: Omit<DbGrinder, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return;
      try {
        const { error } = await supabase
          .from('cc_grinders')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
        await fetchGrinders();
      } catch (err) {
        console.error('useGrinders create error:', err);
      }
    },
    [user, fetchGrinders],
  );

  const update = useCallback(
    async (id: string, data: Partial<DbGrinder>) => {
      try {
        const { error } = await supabase.from('cc_grinders').update(data).eq('id', id);
        if (error) throw error;
        await fetchGrinders();
      } catch (err) {
        console.error('useGrinders update error:', err);
      }
    },
    [fetchGrinders],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('cc_grinders').delete().eq('id', id);
        if (error) throw error;
        await fetchGrinders();
      } catch (err) {
        console.error('useGrinders remove error:', err);
      }
    },
    [fetchGrinders],
  );

  const setActive = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await supabase
          .from('cc_grinders')
          .update({ is_active: false })
          .eq('user_id', user.id);
        const { error } = await supabase
          .from('cc_grinders')
          .update({ is_active: true })
          .eq('id', id);
        if (error) throw error;
        await fetchGrinders();
      } catch (err) {
        console.error('useGrinders setActive error:', err);
      }
    },
    [user, fetchGrinders],
  );

  return { grinders, loading, activeGrinder, create, update, remove, setActive };
}

// ─── Beans ───────────────────────────────────────────────────────────────────

const BEANS_CACHE_KEY = '@coffeeclub:beans';

export function useBeans() {
  const { user } = useAuth();
  const [beans, setBeans] = useState<DbBean[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBeans = useCallback(async () => {
    if (!user) {
      setBeans([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('cc_beans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list = (data ?? []) as DbBean[];
      setBeans(list);
      await AsyncStorage.setItem(BEANS_CACHE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('useBeans fetch error:', err);
      try {
        const cached = await AsyncStorage.getItem(BEANS_CACHE_KEY);
        if (cached) setBeans(JSON.parse(cached));
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    AsyncStorage.getItem(BEANS_CACHE_KEY)
      .then((cached) => {
        if (cached) setBeans(JSON.parse(cached));
      })
      .catch(() => {});
    fetchBeans();
  }, [fetchBeans]);

  const activeBean = beans.find((b) => b.is_active) ?? beans[0] ?? null;

  const create = useCallback(
    async (data: Omit<DbBean, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return;
      try {
        const { error } = await supabase
          .from('cc_beans')
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
        await fetchBeans();
      } catch (err) {
        console.error('useBeans create error:', err);
      }
    },
    [user, fetchBeans],
  );

  const update = useCallback(
    async (id: string, data: Partial<DbBean>) => {
      try {
        const { error } = await supabase.from('cc_beans').update(data).eq('id', id);
        if (error) throw error;
        await fetchBeans();
      } catch (err) {
        console.error('useBeans update error:', err);
      }
    },
    [fetchBeans],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('cc_beans').delete().eq('id', id);
        if (error) throw error;
        await fetchBeans();
      } catch (err) {
        console.error('useBeans remove error:', err);
      }
    },
    [fetchBeans],
  );

  const setActive = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await supabase
          .from('cc_beans')
          .update({ is_active: false })
          .eq('user_id', user.id);
        const { error } = await supabase
          .from('cc_beans')
          .update({ is_active: true })
          .eq('id', id);
        if (error) throw error;
        await fetchBeans();
      } catch (err) {
        console.error('useBeans setActive error:', err);
      }
    },
    [user, fetchBeans],
  );

  const decrementStock = useCallback(
    async (id: string, grams: number) => {
      const bean = beans.find((b) => b.id === id);
      if (!bean) return;
      const newStock = Math.max(0, bean.stock_grams - grams);
      try {
        const { error } = await supabase
          .from('cc_beans')
          .update({ stock_grams: newStock })
          .eq('id', id);
        if (error) throw error;
        await fetchBeans();
      } catch (err) {
        console.error('useBeans decrementStock error:', err);
      }
    },
    [beans, fetchBeans],
  );

  return { beans, loading, activeBean, create, update, remove, setActive, decrementStock };
}
