import { useMemo } from 'react';
import type { DbBrew, DbBean } from '../types/database';

export interface TasteProfile {
  // Radar chart axes (0-100 scale)
  fruity: number;
  chocolate: number;
  nutty: number;
  floral: number;
  spicy: number;
  sweet: number;
  // Preferences
  preferredRoast: string;
  preferredOrigin: string;
  preferredProcess: string;
  methodBreakdown: Array<{ method: string; percentage: number }>;
  totalBrews: number;
}

const AXIS_KEYWORDS: Record<string, string[]> = {
  fruity: ['fruity', 'berry', 'citrus', 'tropical', 'stone fruit', 'apple', 'blueberry'],
  chocolate: ['chocolate', 'cocoa', 'dark chocolate', 'milk chocolate', 'brownie'],
  nutty: ['nutty', 'almond', 'hazelnut', 'walnut', 'peanut', 'pecan'],
  floral: ['floral', 'jasmine', 'rose', 'lavender', 'hibiscus', 'tea-like'],
  spicy: ['spicy', 'cinnamon', 'clove', 'pepper', 'ginger', 'cardamom'],
  sweet: ['sweet', 'caramel', 'honey', 'vanilla', 'toffee', 'brown sugar', 'syrup', 'maple'],
};

function mostFrequent(items: string[]): string {
  if (items.length === 0) return 'N/A';
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function useTasteProfile(brews: DbBrew[], beans: DbBean[]): TasteProfile {
  return useMemo(() => {
    const beanMap = new Map(beans.map((b) => [b.id, b]));

    // Collect tasting notes from beans used in brews
    const allNotes: string[] = [];
    const roasts: string[] = [];
    const origins: string[] = [];
    const processes: string[] = [];
    const methodCounts: Record<string, number> = {};

    for (const brew of brews) {
      // Method breakdown
      methodCounts[brew.brew_type] = (methodCounts[brew.brew_type] ?? 0) + 1;

      // Bean-derived data
      if (brew.bean_id) {
        const bean = beanMap.get(brew.bean_id);
        if (bean) {
          allNotes.push(...bean.tasting_notes.map((n) => n.toLowerCase()));
          roasts.push(bean.roast_level);
          origins.push(bean.origin);
          processes.push(bean.process);
        }
      }

      // Also include brew's own tasting notes
      if (brew.tasting_notes.length > 0) {
        allNotes.push(...brew.tasting_notes.map((n) => n.toLowerCase()));
      }
    }

    // Count notes per axis
    const axisCounts: Record<string, number> = {};
    for (const axis of Object.keys(AXIS_KEYWORDS)) {
      axisCounts[axis] = 0;
      for (const note of allNotes) {
        if (AXIS_KEYWORDS[axis].some((kw) => note.includes(kw))) {
          axisCounts[axis]++;
        }
      }
    }

    // Normalize to 0-100 (max axis = 100)
    const maxCount = Math.max(...Object.values(axisCounts), 1);
    const normalized = (axis: string) => Math.round((axisCounts[axis] / maxCount) * 100);

    // Method breakdown as percentages
    const totalBrews = brews.length;
    const methodBreakdown = Object.entries(methodCounts)
      .map(([method, count]) => ({
        method,
        percentage: totalBrews > 0 ? Math.round((count / totalBrews) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return {
      fruity: normalized('fruity'),
      chocolate: normalized('chocolate'),
      nutty: normalized('nutty'),
      floral: normalized('floral'),
      spicy: normalized('spicy'),
      sweet: normalized('sweet'),
      preferredRoast: mostFrequent(roasts),
      preferredOrigin: mostFrequent(origins),
      preferredProcess: mostFrequent(processes),
      methodBreakdown,
      totalBrews,
    };
  }, [brews, beans]);
}
