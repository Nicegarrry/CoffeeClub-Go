import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { Fonts } from '../../constants/theme';
import type { TasteProfile } from '../../hooks/useTasteProfile';

interface TasteRadarProps {
  profile: TasteProfile;
  size?: number;
}

const AXES = ['fruity', 'chocolate', 'nutty', 'floral', 'spicy', 'sweet'] as const;
const LABELS = ['Fruity', 'Chocolate', 'Nutty', 'Floral', 'Spicy', 'Sweet'];
const CENTER = 100;
const MAX_RADIUS = 80;
const GRID_LEVELS = [0.33, 0.66, 1.0];

function polarToXY(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

function getHexPoints(scale: number): string {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const [x, y] = polarToXY(i * 60, MAX_RADIUS * scale);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function TasteRadar({ profile, size = 200 }: TasteRadarProps) {
  const { colors } = useTheme();

  // Build the data polygon
  const dataPoints = AXES.map((axis, i) => {
    const value = profile[axis] / 100;
    const [x, y] = polarToXY(i * 60, MAX_RADIUS * value);
    return `${x},${y}`;
  }).join(' ');

  // Label positions (pushed slightly beyond the grid)
  const labelPositions = AXES.map((_, i) => {
    const [x, y] = polarToXY(i * 60, MAX_RADIUS + 18);
    return { x, y };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Concentric hexagonal grid */}
        {GRID_LEVELS.map((level) => (
          <Polygon
            key={level}
            points={getHexPoints(level)}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines from center to each vertex */}
        {Array.from({ length: 6 }).map((_, i) => {
          const [x, y] = polarToXY(i * 60, MAX_RADIUS);
          return (
            <Line
              key={`axis-${i}`}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill={colors.accent}
          fillOpacity={0.2}
          stroke={colors.accent}
          strokeWidth={2}
        />

        {/* Center dot */}
        <Circle cx={CENTER} cy={CENTER} r={2} fill={colors.textSub} />

        {/* Axis labels */}
        {LABELS.map((label, i) => (
          <SvgText
            key={label}
            x={labelPositions[i].x}
            y={labelPositions[i].y}
            fontSize={10}
            fontFamily={Fonts.body}
            fill={colors.textSub}
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
