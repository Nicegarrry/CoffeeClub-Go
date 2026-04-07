import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts } from '../../constants/theme';
import type { DbBrew } from '../../types/database';

interface BrewCalendarProps {
  brews: DbBrew[];
}

const CELL_SIZE = 12;
const CELL_GAP = 2;
const WEEKS = 12;
const DAYS = 7;
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];
const LABEL_WIDTH = 18;

export default function BrewCalendar({ brews }: BrewCalendarProps) {
  const { colors } = useTheme();

  const grid = useMemo(() => {
    // Build a map of date string -> brew count for the last 12 weeks
    const counts: Record<string, number> = {};
    for (const brew of brews) {
      const date = brew.created_at.slice(0, 10); // YYYY-MM-DD
      counts[date] = (counts[date] ?? 0) + 1;
    }

    // Calculate the grid: 12 weeks ending today
    const today = new Date();
    const cells: Array<{ key: string; count: number; col: number; row: number }> = [];

    for (let w = WEEKS - 1; w >= 0; w--) {
      for (let d = 0; d < DAYS; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + (today.getDay() - d)));
        // Adjust so row 0 = Sunday
        const offset = w * 7 + (6 - d) + (6 - today.getDay());
        const cellDate = new Date(today);
        cellDate.setDate(today.getDate() - offset);

        if (cellDate > today) continue;

        const dateStr = cellDate.toISOString().slice(0, 10);
        const col = WEEKS - 1 - w;
        cells.push({ key: dateStr, count: counts[dateStr] ?? 0, col, row: d });
      }
    }

    return cells;
  }, [brews]);

  function getCellColor(count: number): string {
    if (count === 0) return colors.bgCard2;
    if (count === 1) return colors.accentSoft;
    if (count === 2) return colors.accent + '80'; // 0.5 opacity via hex
    return colors.accent;
  }

  const gridWidth = WEEKS * (CELL_SIZE + CELL_GAP) + LABEL_WIDTH;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.grid, { width: gridWidth }]}>
        {/* Day labels */}
        {DAY_LABELS.map((label, i) => (
          <View
            key={`label-${i}`}
            style={[
              styles.dayLabel,
              { top: i * (CELL_SIZE + CELL_GAP), width: LABEL_WIDTH },
            ]}
          >
            <Text style={[styles.dayLabelText, { color: colors.textSub, fontFamily: Fonts.body }]}>
              {label}
            </Text>
          </View>
        ))}

        {/* Cells */}
        {grid.map((cell) => (
          <View
            key={cell.key}
            style={[
              styles.cell,
              {
                backgroundColor: getCellColor(cell.count),
                left: LABEL_WIDTH + cell.col * (CELL_SIZE + CELL_GAP),
                top: cell.row * (CELL_SIZE + CELL_GAP),
              },
            ]}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  grid: {
    height: DAYS * (CELL_SIZE + CELL_GAP),
    position: 'relative',
  },
  dayLabel: {
    position: 'absolute',
    left: 0,
    height: CELL_SIZE,
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: 9,
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
});
