import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Brewly from '../ui/Brewly';
import { useBrewCoach, type BrewFeedback } from '../../hooks/useBrewCoach';
import { useMachines, useGrinders } from '../../hooks/useSetup';
import type { DbBean } from '../../types/database';

const SEEN_KEY_PREFIX = '@coffeeclub:bean-tips-seen:';

interface Props {
  bean: DbBean;
}

export default function BrewlyBeanTip({ bean }: Props) {
  const { getBeanTip } = useBrewCoach();
  const { activeMachine } = useMachines();
  const { activeGrinder } = useGrinders();

  const [feedback, setFeedback] = useState<BrewFeedback | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [alreadySeen, setAlreadySeen] = useState(true); // assume seen until checked

  const storageKey = `${SEEN_KEY_PREFIX}${bean.id}`;

  // Check if tip was already shown for this bean
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((val) => {
        if (!cancelled && !val) {
          setAlreadySeen(false);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // Fetch tip only if not already seen
  useEffect(() => {
    if (alreadySeen) return;
    let cancelled = false;

    getBeanTip(bean, { machine: activeMachine, grinder: activeGrinder }).then(
      (result) => {
        if (!cancelled && result) {
          setFeedback(result);
          AsyncStorage.setItem(storageKey, '1').catch(() => {});
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [alreadySeen, bean, activeMachine, activeGrinder, getBeanTip, storageKey]);

  if (alreadySeen || dismissed || !feedback) return null;

  return (
    <Brewly
      message={feedback.message}
      detail={feedback.detail}
      mood={feedback.mood}
      visible
      onDismiss={() => setDismissed(true)}
    />
  );
}
