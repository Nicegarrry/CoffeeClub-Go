import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { askBrewly, AiResponse } from '../../services/ai';
import Brewly from '../ui/Brewly';

interface Props {
  cafeName: string;
  cafeDescription?: string;
  userBeans?: Array<{ name: string; roaster: string; origin: string }>;
  visible?: boolean;
}

const STORAGE_PREFIX = '@coffeeclub:cafe-tips-seen:';

export default function BrewlyOrderTip({
  cafeName,
  cafeDescription,
  userBeans,
  visible = true,
}: Props) {
  const [tip, setTip] = useState<AiResponse | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    const storageKey = `${STORAGE_PREFIX}${cafeName}`;

    (async () => {
      const seen = await AsyncStorage.getItem(storageKey);
      if (seen || cancelled) return;

      const beanInfo = (userBeans ?? [])
        .slice(0, 3)
        .map((b) => b.origin || b.name)
        .join(', ');

      const prompt = `I'm at ${cafeName}. ${cafeDescription ?? ''}. Based on my coffee preferences (I like ${beanInfo || 'a variety of coffees'}), what should I order? Be specific and fun.`;

      const response = await askBrewly(prompt, {});
      if (cancelled || !response) return;

      setTip(response);
      setDismissed(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [cafeName, visible]);

  const handleDismiss = async () => {
    setDismissed(true);
    await AsyncStorage.setItem(`${STORAGE_PREFIX}${cafeName}`, 'true');
  };

  if (!visible || dismissed || !tip) return null;

  return (
    <Brewly
      message={tip.message}
      detail={tip.detail}
      mood="excited"
      onDismiss={handleDismiss}
      visible
    />
  );
}
