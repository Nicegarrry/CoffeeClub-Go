import { useState, useCallback } from 'react';
import { saveBrewLocally, type StoredBrew } from '../services/db';
import { uploadBrewPhoto } from '../services/storage';
import { supabase } from '../services/supabase';
import { beans } from '../constants/mockData';

export interface QuickLogData {
  photo: string | null;
  name: string;
  rating: number;
}

export interface DetailData {
  method: string;
  doseIn: number | null;
  yieldOut: number | null;
  brewTime: string | null;
  grindSetting: number | null;
  tastingNotes: string[];
  beanId: number | null;
}

function generateDefaultName(): string {
  const hour = new Date().getHours();
  // Pick the first bean as the "active" bean for smart naming
  const activeBean = beans.length > 0 ? beans[0] : null;
  const beanWord = activeBean ? activeBean.name.split(' ')[0] : null;

  if (hour >= 5 && hour < 9) {
    return beanWord ? `Morning ${beanWord}` : 'Morning espresso';
  }
  if (hour >= 9 && hour < 12) {
    return 'Late morning latte';
  }
  if (hour >= 12 && hour < 15) {
    return 'Afternoon pick-me-up';
  }
  return 'Evening brew';
}

const defaultQuickLog: QuickLogData = {
  photo: null,
  name: '',
  rating: 0,
};

const defaultDetail: DetailData = {
  method: 'Espresso',
  doseIn: null,
  yieldOut: null,
  brewTime: null,
  grindSetting: null,
  tastingNotes: [],
  beanId: null,
};

export function useBrewLogger() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [quickLogData, setQuickLogData] = useState<QuickLogData>(defaultQuickLog);
  const [detailData, setDetailData] = useState<DetailData>(defaultDetail);

  const open = useCallback(() => {
    setQuickLogData({
      photo: null,
      name: generateDefaultName(),
      rating: 0,
    });
    setDetailData({ ...defaultDetail });
    setShowDetails(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setShowDetails(false);
    setQuickLogData(defaultQuickLog);
    setDetailData({ ...defaultDetail });
  }, []);

  const resetForm = useCallback(() => {
    setQuickLogData({
      photo: null,
      name: generateDefaultName(),
      rating: 0,
    });
    setDetailData({ ...defaultDetail });
    setShowDetails(false);
  }, []);

  const setQuickField = useCallback(
    <K extends keyof QuickLogData>(key: K, value: QuickLogData[K]) => {
      setQuickLogData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setDetailField = useCallback(
    <K extends keyof DetailData>(key: K, value: DetailData[K]) => {
      setDetailData((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  const submit = useCallback(async () => {
    const brewId = Date.now().toString();
    const brew: StoredBrew = {
      id: brewId,
      name: quickLogData.name,
      rating: quickLogData.rating,
      photo: quickLogData.photo,
      method: detailData.method,
      doseIn: detailData.doseIn,
      yieldOut: detailData.yieldOut,
      brewTime: detailData.brewTime,
      grindSetting: detailData.grindSetting,
      tastingNotes: detailData.tastingNotes,
      beanId: detailData.beanId,
      createdAt: new Date().toISOString(),
      synced: false,
    };
    console.log('[BrewLogger] Submitting brew:', brew);

    // Save locally first (offline-first)
    await saveBrewLocally(brew);

    // Attempt Supabase sync
    try {
      let photoUrl: string | null = null;
      if (quickLogData.photo) {
        photoUrl = await uploadBrewPhoto(quickLogData.photo, brewId);
      }

      // Parse brew time to seconds
      let brewTimeSeconds: number | null = null;
      if (detailData.brewTime) {
        const parts = detailData.brewTime.split(':');
        brewTimeSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }

      const { error } = await supabase.from('cc_brews').insert({
        name: quickLogData.name,
        rating: quickLogData.rating,
        photo_url: photoUrl,
        brew_type: detailData.method.toLowerCase(),
        dose_in_grams: detailData.doseIn,
        yield_out_grams: detailData.yieldOut,
        brew_time_seconds: brewTimeSeconds,
        grind_setting: detailData.grindSetting?.toString() ?? null,
        tasting_notes: detailData.tastingNotes,
        bean_id: detailData.beanId?.toString() ?? null,
        is_public: true,
      });

      if (error) {
        console.warn('[BrewLogger] Supabase insert failed, brew saved locally:', error.message);
      } else {
        console.log('[BrewLogger] Brew synced to Supabase');
      }
    } catch (err) {
      console.warn('[BrewLogger] Supabase sync failed, brew saved locally:', err);
    }

    close();
  }, [quickLogData, detailData, close]);

  return {
    isOpen,
    quickLogData,
    detailData,
    showDetails,
    open,
    close,
    submit,
    resetForm,
    setQuickField,
    setDetailField,
    toggleDetails,
  };
}
