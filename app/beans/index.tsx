import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useBeans } from '../../src/hooks/useSetup';
import { Fonts, Spacing, Radius, LetterSpacing, Elevation } from '../../src/constants/theme';
import { hapticLight, hapticSelection } from '../../src/services/device';
import type { DbBean } from '../../src/types/database';

const BEAN_COLORS = ['#8B4513', '#A0522D', '#D2691E', '#CD853F', '#DEB887', '#6B3A2A', '#4A2C2A'];
const PROCESSES: DbBean['process'][] = ['washed', 'natural', 'honey'];
const ROAST_LEVELS: DbBean['roast_level'][] = ['light', 'light-med', 'medium', 'medium-dark', 'dark'];

function StockPill({ grams, colors }: { grams: number; colors: any }) {
  const isLow = grams < 50;
  const isEmpty = grams <= 0;
  const pillColor = isEmpty ? '#E05050' : isLow ? '#E09040' : '#4CAF50';
  const label = isEmpty ? 'Empty' : isLow ? 'Low' : `${grams}g`;

  return (
    <View style={[styles.stockPill, { backgroundColor: pillColor + '20' }]}>
      <Text style={[styles.stockText, { color: pillColor }]}>{label}</Text>
    </View>
  );
}

function BeanCard({ bean, colors, onPress }: { bean: DbBean; colors: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onPress();
      }}
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        Elevation.card,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.colorCircle, { backgroundColor: bean.color || colors.accent }]} />
        <View style={styles.cardCenter}>
          <Text style={[styles.beanName, { color: colors.text }]} numberOfLines={1}>
            {bean.name}
          </Text>
          <Text style={[styles.roasterName, { color: colors.textSub }]} numberOfLines={1}>
            {bean.roaster}
          </Text>
          <View style={styles.tagRow}>
            {bean.origin ? (
              <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.tagText, { color: colors.accent }]}>{bean.origin}</Text>
              </View>
            ) : null}
            <View style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.tagText, { color: colors.accent }]}>{bean.process}</Text>
            </View>
          </View>
        </View>
        <StockPill grams={bean.stock_grams} colors={colors} />
      </View>
      {bean.tasting_notes && bean.tasting_notes.length > 0 && (
        <View style={styles.notesRow}>
          {bean.tasting_notes.slice(0, 4).map((note, idx) => (
            <View key={idx} style={[styles.noteChip, { backgroundColor: colors.bgCard2 }]}>
              <Text style={[styles.noteChipText, { color: colors.textSub }]}>{note}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

export default function BeanLibraryScreen() {
  const { colors } = useTheme();
  const { beans, loading, create } = useBeans();
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [name, setName] = useState('');
  const [roasterVal, setRoasterVal] = useState('');
  const [origin, setOrigin] = useState('');
  const [process, setProcess] = useState<DbBean['process']>('washed');
  const [roastLevel, setRoastLevel] = useState<DbBean['roast_level']>('medium');
  const [stock, setStock] = useState('250');
  const [tastingNotes, setTastingNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState(BEAN_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setRoasterVal('');
    setOrigin('');
    setProcess('washed');
    setRoastLevel('medium');
    setStock('250');
    setTastingNotes('');
    setSelectedColor(BEAN_COLORS[0]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    await create({
      name: name.trim(),
      roaster: roasterVal.trim(),
      origin: origin.trim(),
      process,
      roast_level: roastLevel,
      tasting_notes: tastingNotes
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean),
      stock_grams: parseInt(stock, 10) || 0,
      color: selectedColor,
      is_active: false,
      purchase_date: null,
      roast_date: null,
    });
    setSaving(false);
    hapticLight();
    resetForm();
    setShowAdd(false);
  }, [name, roasterVal, origin, process, roastLevel, stock, tastingNotes, selectedColor, create, resetForm]);

  const renderItem = useCallback(
    ({ item }: { item: DbBean }) => (
      <BeanCard
        bean={item}
        colors={colors}
        onPress={() => router.push(`/beans/${item.id}`)}
      />
    ),
    [colors],
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.accent }]}>Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Bean Library</Text>
        <Pressable onPress={() => { hapticLight(); setShowAdd(true); }}>
          <Text style={[styles.addText, { color: colors.accent }]}>Add Bean</Text>
        </Pressable>
      </View>

      {beans.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: colors.textFaint }]}>No beans yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textFaint }]}>
            Add your first bean to start tracking
          </Text>
          <Pressable
            style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
            onPress={() => { hapticLight(); setShowAdd(true); }}
          >
            <Text style={styles.emptyBtnText}>Add Bean</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={beans}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Bean Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => { resetForm(); setShowAdd(false); }}>
                  <Text style={[styles.modalCancel, { color: colors.textSub }]}>Cancel</Text>
                </Pressable>
                <Text style={[styles.modalTitle, { color: colors.text }]}>New Bean</Text>
                <Pressable onPress={handleSave} disabled={saving || !name.trim()}>
                  <Text
                    style={[
                      styles.modalSave,
                      { color: name.trim() ? colors.accent : colors.textFaint },
                    ]}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textFaint }]}>NAME *</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Ethiopia Yirgacheffe"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textFaint }]}>ROASTER</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                value={roasterVal}
                onChangeText={setRoasterVal}
                placeholder="e.g. Onyx Coffee Lab"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textFaint }]}>ORIGIN</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                value={origin}
                onChangeText={setOrigin}
                placeholder="e.g. Ethiopia"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textFaint }]}>PROCESS</Text>
              <View style={styles.optionRow}>
                {PROCESSES.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => { hapticSelection(); setProcess(p); }}
                    style={[
                      styles.optionBtn,
                      {
                        backgroundColor: process === p ? colors.accent : colors.bgCard,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: process === p ? '#FFFFFF' : colors.textSub },
                      ]}
                    >
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textFaint }]}>ROAST LEVEL</Text>
              <View style={styles.optionRow}>
                {ROAST_LEVELS.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => { hapticSelection(); setRoastLevel(r); }}
                    style={[
                      styles.optionBtn,
                      {
                        backgroundColor: roastLevel === r ? colors.accent : colors.bgCard,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: roastLevel === r ? '#FFFFFF' : colors.textSub },
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textFaint }]}>STOCK (GRAMS)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                placeholder="250"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textFaint }]}>TASTING NOTES</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                value={tastingNotes}
                onChangeText={setTastingNotes}
                placeholder="chocolate, citrus, floral (comma separated)"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textFaint }]}>COLOR</Text>
              <View style={styles.colorRow}>
                {BEAN_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => { hapticSelection(); setSelectedColor(c); }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 0, borderColor: colors.accent },
                    ]}
                  />
                ))}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
  },
  backText: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },
  title: { fontFamily: Fonts.display, fontSize: 24, letterSpacing: LetterSpacing.display },
  addText: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },

  // List
  list: { paddingHorizontal: Spacing.gutter, paddingBottom: 60, gap: Spacing.cardGap },

  // Card
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  colorCircle: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  cardCenter: { flex: 1, marginRight: 8 },
  beanName: { fontFamily: Fonts.bodySemiBold, fontSize: 15 },
  roasterName: { fontFamily: Fonts.body, fontSize: 12, marginBottom: 4 },
  tagRow: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  tagText: { fontFamily: Fonts.bodyMedium, fontSize: 11, textTransform: 'capitalize' },
  stockPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  stockText: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
  notesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  noteChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  noteChipText: { fontFamily: Fonts.body, fontSize: 11 },

  // Empty
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 20, letterSpacing: LetterSpacing.display },
  emptySubtitle: { fontFamily: Fonts.body, fontSize: 14 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.pill, marginTop: 8 },
  emptyBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FFFFFF' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.gutter, paddingTop: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalCancel: { fontFamily: Fonts.body, fontSize: 14 },
  modalTitle: { fontFamily: Fonts.display, fontSize: 20, letterSpacing: LetterSpacing.display },
  modalSave: { fontFamily: Fonts.bodySemiBold, fontSize: 14 },

  // Form
  fieldLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 10, letterSpacing: LetterSpacing.uppercase, marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 10, fontFamily: Fonts.body, fontSize: 14 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1 },
  optionText: { fontFamily: Fonts.bodyMedium, fontSize: 12, textTransform: 'capitalize' },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16 },
});
