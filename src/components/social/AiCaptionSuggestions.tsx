import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Radius } from '../../constants/theme';
import { askBrewly } from '../../services/ai';
import { hapticSelection } from '../../services/device';

interface Props {
  brewData: {
    name?: string;
    method?: string;
    dose?: number;
    yield?: number;
    time?: number;
    beanName?: string;
    beanOrigin?: string;
    tastingNotes?: string[];
  };
  onSelect: (caption: string) => void;
  visible: boolean;
}

export default function AiCaptionSuggestions({ brewData, onSelect, visible }: Props) {
  const { colors } = useTheme();
  const [captions, setCaptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCaptions([]);
      setFailed(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setFailed(false);

      const prompt = `Generate 3 short Instagram-style captions for a coffee brew post. Bean: ${brewData.beanName ?? 'unknown'}, Method: ${brewData.method ?? 'unknown'}, Ratio: ${brewData.dose ?? '?'}:${brewData.yield ?? '?'}. Return JSON array of 3 strings.`;

      const res = await askBrewly(prompt, {
        bean: { name: brewData.beanName, origin: brewData.beanOrigin },
        brew: {
          dose: brewData.dose,
          yield: brewData.yield,
          time: brewData.time,
          method: brewData.method,
        },
      });

      if (cancelled) return;

      if (!res) {
        setFailed(true);
        setLoading(false);
        return;
      }

      try {
        const match = res.message.match(/\[[\s\S]*\]/);
        const parsed: string[] = match ? JSON.parse(match[0]) : [];
        setCaptions(parsed.slice(0, 3));
      } catch {
        setFailed(true);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [visible]);

  if (!visible || failed) return null;

  if (loading) {
    return (
      <View style={styles.row}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.pill, { backgroundColor: colors.bgCard2, borderColor: colors.border }]}
          >
            <ActivityIndicator size="small" color={colors.textFaint} />
          </View>
        ))}
      </View>
    );
  }

  if (captions.length === 0) return null;

  return (
    <View style={styles.row}>
      {captions.map((cap, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.pill, { backgroundColor: colors.bgCard2, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => { hapticSelection(); onSelect(cap); }}
        >
          <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
            {cap}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '90%',
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
});
