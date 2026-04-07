import { useCallback } from 'react';
import { askBrewly, type AiContext } from '../services/ai';
import type { DbBean, DbBrew, DbMachine, DbGrinder } from '../types/database';

export interface BrewFeedback {
  type: 'good' | 'adjust' | 'neutral';
  message: string;
  detail?: string;
  mood: 'happy' | 'thinking' | 'excited' | 'concerned';
}

// ─── Espresso helpers ───────────────────────────────────────────────────────

const ESPRESSO_TYPES = new Set(['espresso', 'latte', 'flat white']);

function isEspresso(brewType: string): boolean {
  return ESPRESSO_TYPES.has(brewType);
}

function isPourOver(brewType: string): boolean {
  return brewType === 'pour over' || brewType === 'filter';
}

// ─── Rule-based analysis ────────────────────────────────────────────────────

function analyzeEspresso(
  time: number,
  dose: number,
  yieldG: number,
): BrewFeedback | null {
  const ratio = yieldG / dose;
  const ratioInRange = ratio >= 1.8 && ratio <= 2.2;

  if (time < 20 && ratioInRange) {
    return {
      type: 'adjust',
      message: 'Running fast! Finer by 1-2 clicks',
      detail:
        'A sub-20s shot at a standard ratio means the water is flowing through too quickly. Tighten the grind to add resistance.',
      mood: 'concerned',
    };
  }

  if (time > 35 && ratioInRange) {
    return {
      type: 'adjust',
      message: 'Choking! Coarsen 1 click',
      detail:
        'Over 35 seconds with a normal ratio signals too much resistance. Open up the grind slightly to let water through.',
      mood: 'concerned',
    };
  }

  if (time >= 24 && time <= 30 && ratioInRange) {
    return {
      type: 'good',
      message: 'Nailed it!',
      detail: `${time}s at 1:${ratio.toFixed(1)} is textbook. Enjoy that cup.`,
      mood: 'excited',
    };
  }

  return null;
}

function analyzePourOver(time: number): BrewFeedback | null {
  if (time > 300) {
    return {
      type: 'adjust',
      message: "Grind coarser -- that's stalling",
      detail:
        'Draw-downs over 5 minutes mean your grounds are too fine, causing the bed to clog. Step coarser 2-3 clicks.',
      mood: 'concerned',
    };
  }

  if (time < 120) {
    return {
      type: 'adjust',
      message: 'Way too fast -- go finer',
      detail:
        'Under 2 minutes means water is rushing through without extracting properly. Tighten the grind.',
      mood: 'concerned',
    };
  }

  return null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useBrewCoach() {
  /**
   * Analyze a brew's extraction data with offline rules.
   * Returns null when there's nothing worth saying (silence is default).
   */
  const analyzeExtraction = useCallback(
    (brew: {
      dose?: number | null;
      yield?: number | null;
      time?: number | null;
      method?: string;
      grind?: number | null;
      brew_type?: string;
    }): BrewFeedback | null => {
      const type = brew.brew_type ?? brew.method ?? '';
      const time = brew.time ?? 0;
      const dose = brew.dose ?? 0;
      const yieldG = brew.yield ?? 0;

      if (isEspresso(type) && time > 0 && dose > 0 && yieldG > 0) {
        return analyzeEspresso(time, dose, yieldG);
      }

      if (isPourOver(type) && time > 0) {
        return analyzePourOver(time);
      }

      return null;
    },
    [],
  );

  /**
   * Ask Brewly AI for a starting recipe based on bean + equipment.
   */
  const getBeanTip = useCallback(
    async (
      bean: DbBean,
      equipment: { machine?: DbMachine | null; grinder?: DbGrinder | null },
    ): Promise<BrewFeedback | null> => {
      const prompt = `Suggest a starting recipe for ${bean.name} from ${bean.roaster}, ${bean.origin}, ${bean.roast_level} roast, ${bean.process} process. User has ${equipment.grinder?.name ?? 'unknown grinder'} and ${equipment.machine?.name ?? 'unknown brewer'}.`;

      const ctx: AiContext = {
        bean: {
          name: bean.name,
          origin: bean.origin,
          roast: bean.roast_level,
          process: bean.process,
        },
        equipment: {
          grinder: equipment.grinder?.name,
          machine: equipment.machine?.name,
        },
      };

      const response = await askBrewly(prompt, ctx);
      if (!response) return null;

      return {
        type: 'neutral',
        message: response.message,
        detail: response.detail,
        mood: response.mood,
      };
    },
    [],
  );

  /**
   * Look at the last 3+ brews for a bean and spot a dial-in trend.
   */
  const getDialInInsight = useCallback(
    (brews: DbBrew[]): BrewFeedback | null => {
      if (brews.length < 3) return null;

      // Sort newest first
      const sorted = [...brews].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      const latest = sorted[0];
      const previous = sorted.slice(1);
      const avgRating =
        previous.reduce((sum, b) => sum + b.rating, 0) / previous.length;

      // Ratings improving?
      if (latest.rating > avgRating) {
        return {
          type: 'good',
          message: 'Getting closer!',
          detail: `Your latest shot rated ${latest.rating} vs a ${avgRating.toFixed(1)} average. Keep this grind setting.`,
          mood: 'happy',
        };
      }

      // Ratings declining? Find the best brew and suggest its grind.
      const best = sorted.reduce((a, b) => (b.rating > a.rating ? b : a));
      const latestIdx = sorted.indexOf(latest);
      const secondIdx = sorted.length > 1 ? 1 : 0;
      const declining =
        sorted.length >= 3 &&
        sorted[0].rating <= sorted[1].rating &&
        sorted[1].rating <= sorted[2].rating &&
        sorted[0].rating < sorted[2].rating;

      if (declining && best.grind_setting) {
        return {
          type: 'adjust',
          message: `Try going back to grind ${best.grind_setting}`,
          detail: `Your best shot (${best.rating}/5) used grind setting ${best.grind_setting}. Recent brews have been trending down.`,
          mood: 'thinking',
        };
      }

      return null;
    },
    [],
  );

  return { analyzeExtraction, getBeanTip, getDialInInsight };
}
