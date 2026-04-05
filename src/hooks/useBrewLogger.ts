import { useState, useCallback } from 'react';
import { saveBrewLocally, type StoredBrew } from '../services/db';
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
    const brew: StoredBrew = {
      id: Date.now().toString(),
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
    await saveBrewLocally(brew);
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
