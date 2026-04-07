import React, { useMemo } from 'react';
import Brewly from '../ui/Brewly';
import { useBrewCoach } from '../../hooks/useBrewCoach';

interface Props {
  brew: {
    dose?: number;
    yield?: number;
    time?: number;
    method?: string;
    grind?: number;
    rating?: number;
    brew_type?: string;
  };
  visible: boolean;
  onDismiss: () => void;
}

export default function BrewlyFeedback({ brew, visible, onDismiss }: Props) {
  const { analyzeExtraction } = useBrewCoach();

  const feedback = useMemo(() => analyzeExtraction(brew), [brew, analyzeExtraction]);

  // Silence is the default -- don't render when there's nothing to say
  if (!feedback || !visible) return null;

  return (
    <Brewly
      message={feedback.message}
      detail={feedback.detail}
      mood={feedback.mood}
      visible={visible}
      onDismiss={onDismiss}
    />
  );
}
