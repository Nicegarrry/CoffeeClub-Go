import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Fonts } from '../../constants/theme';
import { hapticLight, hapticSelection } from '../../services/device';
import type { DbMachine, DbGrinder, DbBean } from '../../types/database';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// --- Chip ---
function Chip({
  label,
  selected,
  onPress,
  accentColor,
  faintColor,
  borderColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accentColor: string;
  faintColor: string;
  borderColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accentColor : 'transparent',
          borderColor: selected ? accentColor : borderColor,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : faintColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// --- Color Dot ---
const BEAN_COLORS = ['#5C3D2E', '#7B5B3A', '#A0724A', '#C49A6C', '#D4B896', '#3E6B48'];

function ColorDot({
  color,
  selected,
  onPress,
  borderColor,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
  borderColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.colorDot,
        { backgroundColor: color, borderColor: selected ? '#FFFFFF' : borderColor },
        selected && styles.colorDotSelected,
      ]}
    />
  );
}

// --- Types ---
interface SetupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'machine' | 'grinder' | 'bean';
  editItem?: DbMachine | DbGrinder | DbBean | null;
  onSaveMachine?: (data: Partial<DbMachine>) => void;
  onSaveGrinder?: (data: Partial<DbGrinder>) => void;
  onSaveBean?: (data: Partial<DbBean>) => void;
  onDelete?: (id: string) => void;
}

// --- Machine form state ---
interface MachineForm {
  name: string;
  brand: string;
  type: 'espresso' | 'filter' | 'both';
  burr_size: string;
  notes: string;
}

// --- Grinder form state ---
interface GrinderForm {
  name: string;
  brand: string;
  burr_type: 'flat' | 'conical' | 'blade';
  notes: string;
}

// --- Bean form state ---
interface BeanForm {
  name: string;
  roaster: string;
  origin: string;
  process: 'washed' | 'natural' | 'honey';
  roast_level: 'light' | 'light-med' | 'medium' | 'medium-dark' | 'dark';
  tasting_notes: string[];
  stock_grams: number;
  color: string;
}

const MACHINE_TYPES = ['Espresso', 'Filter', 'Both'] as const;
const BURR_TYPES = ['Flat', 'Conical', 'Blade'] as const;
const PROCESSES = ['Washed', 'Natural', 'Honey'] as const;
const ROAST_LEVELS = ['Light', 'Light-Med', 'Medium', 'Medium-Dark', 'Dark'] as const;
const TASTING_OPTIONS = [
  'Chocolatey', 'Fruity', 'Floral', 'Nutty', 'Acidic',
  'Smooth', 'Bitter', 'Caramel', 'Bright',
];

export default function SetupSheet({
  isOpen,
  onClose,
  mode,
  editItem,
  onSaveMachine,
  onSaveGrinder,
  onSaveBean,
  onDelete,
}: SetupSheetProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const saveScale = useSharedValue(1);

  // Machine form
  const [machineForm, setMachineForm] = useState<MachineForm>({
    name: '', brand: '', type: 'espresso', burr_size: '', notes: '',
  });

  // Grinder form
  const [grinderForm, setGrinderForm] = useState<GrinderForm>({
    name: '', brand: '', burr_type: 'flat', notes: '',
  });

  // Bean form
  const [beanForm, setBeanForm] = useState<BeanForm>({
    name: '', roaster: '', origin: '', process: 'washed', roast_level: 'medium',
    tasting_notes: [], stock_grams: 250, color: BEAN_COLORS[0],
  });

  // Populate form when editing
  useEffect(() => {
    if (editItem && mode === 'machine') {
      const m = editItem as DbMachine;
      setMachineForm({ name: m.name, brand: m.brand, type: m.type, burr_size: m.burr_size, notes: m.notes });
    } else if (editItem && mode === 'grinder') {
      const g = editItem as DbGrinder;
      setGrinderForm({ name: g.name, brand: g.brand, burr_type: g.burr_type, notes: g.notes });
    } else if (editItem && mode === 'bean') {
      const b = editItem as DbBean;
      setBeanForm({
        name: b.name, roaster: b.roaster, origin: b.origin, process: b.process,
        roast_level: b.roast_level, tasting_notes: [...b.tasting_notes],
        stock_grams: b.stock_grams, color: b.color,
      });
    } else {
      // Reset forms
      setMachineForm({ name: '', brand: '', type: 'espresso', burr_size: '', notes: '' });
      setGrinderForm({ name: '', brand: '', burr_type: 'flat', notes: '' });
      setBeanForm({
        name: '', roaster: '', origin: '', process: 'washed', roast_level: 'medium',
        tasting_notes: [], stock_grams: 250, color: BEAN_COLORS[0],
      });
    }
  }, [editItem, mode, isOpen]);

  // Animation
  useEffect(() => {
    if (isOpen) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(SCREEN_HEIGHT - SHEET_HEIGHT, {
        damping: 22,
        stiffness: 200,
        mass: 0.8,
      });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isOpen, translateY, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const saveBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  const handleSave = useCallback(() => {
    saveScale.value = withTiming(0.97, { duration: 80 }, () => {
      saveScale.value = withSpring(1, { damping: 15 });
      runOnJS(doSave)();
    });
    hapticLight();
  }, [mode, machineForm, grinderForm, beanForm, editItem, onSaveMachine, onSaveGrinder, onSaveBean, onClose]);

  function doSave() {
    if (mode === 'machine') {
      onSaveMachine?.(machineForm);
    } else if (mode === 'grinder') {
      onSaveGrinder?.(grinderForm);
    } else {
      onSaveBean?.(beanForm);
    }
    onClose();
  }

  const handleDelete = useCallback(() => {
    if (!editItem) return;
    Alert.alert(
      'Delete item',
      `Are you sure you want to delete "${(editItem as any).name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(editItem.id);
            onClose();
          },
        },
      ],
    );
  }, [editItem, onDelete, onClose]);

  const toggleTastingNote = useCallback((note: string) => {
    hapticSelection();
    setBeanForm((prev) => {
      const notes = prev.tasting_notes.includes(note)
        ? prev.tasting_notes.filter((n) => n !== note)
        : [...prev.tasting_notes, note];
      return { ...prev, tasting_notes: notes };
    });
  }, []);

  const isEditing = !!editItem;
  const title = isEditing
    ? `Edit ${mode}`
    : `Add ${mode}`;

  const canSave =
    (mode === 'machine' && machineForm.name.trim().length > 0) ||
    (mode === 'grinder' && grinderForm.name.trim().length > 0) ||
    (mode === 'bean' && beanForm.name.trim().length > 0);

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { height: SHEET_HEIGHT, backgroundColor: colors.bgCard },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.textFaint }]} />
        </View>

        {/* Title */}
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </Text>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Machine Form */}
          {mode === 'machine' && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={machineForm.name}
                onChangeText={(t) => setMachineForm((p) => ({ ...p, name: t }))}
                placeholder="e.g. Breville Barista Express"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Brand</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={machineForm.brand}
                onChangeText={(t) => setMachineForm((p) => ({ ...p, brand: t }))}
                placeholder="e.g. Breville"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Type</Text>
              <View style={styles.chipWrap}>
                {MACHINE_TYPES.map((mt) => (
                  <Chip
                    key={mt}
                    label={mt}
                    selected={machineForm.type === mt.toLowerCase()}
                    onPress={() => {
                      hapticSelection();
                      setMachineForm((p) => ({ ...p, type: mt.toLowerCase() as MachineForm['type'] }));
                    }}
                    accentColor={colors.accent}
                    faintColor={colors.textSub}
                    borderColor={colors.border}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Burr size</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={machineForm.burr_size}
                onChangeText={(t) => setMachineForm((p) => ({ ...p, burr_size: t }))}
                placeholder="e.g. 67mm flat"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={machineForm.notes}
                onChangeText={(t) => setMachineForm((p) => ({ ...p, notes: t }))}
                placeholder="Any notes..."
                placeholderTextColor={colors.textFaint}
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {/* Grinder Form */}
          {mode === 'grinder' && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={grinderForm.name}
                onChangeText={(t) => setGrinderForm((p) => ({ ...p, name: t }))}
                placeholder="e.g. Comandante C40"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Brand</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={grinderForm.brand}
                onChangeText={(t) => setGrinderForm((p) => ({ ...p, brand: t }))}
                placeholder="e.g. Comandante"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Burr type</Text>
              <View style={styles.chipWrap}>
                {BURR_TYPES.map((bt) => (
                  <Chip
                    key={bt}
                    label={bt}
                    selected={grinderForm.burr_type === bt.toLowerCase()}
                    onPress={() => {
                      hapticSelection();
                      setGrinderForm((p) => ({ ...p, burr_type: bt.toLowerCase() as GrinderForm['burr_type'] }));
                    }}
                    accentColor={colors.accent}
                    faintColor={colors.textSub}
                    borderColor={colors.border}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={grinderForm.notes}
                onChangeText={(t) => setGrinderForm((p) => ({ ...p, notes: t }))}
                placeholder="Any notes..."
                placeholderTextColor={colors.textFaint}
                multiline
                numberOfLines={3}
              />
            </>
          )}

          {/* Bean Form */}
          {mode === 'bean' && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={beanForm.name}
                onChangeText={(t) => setBeanForm((p) => ({ ...p, name: t }))}
                placeholder="e.g. Ethiopia Yirgacheffe"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Roaster</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={beanForm.roaster}
                onChangeText={(t) => setBeanForm((p) => ({ ...p, roaster: t }))}
                placeholder="e.g. Onyx Coffee Lab"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Origin</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                value={beanForm.origin}
                onChangeText={(t) => setBeanForm((p) => ({ ...p, origin: t }))}
                placeholder="e.g. Ethiopia"
                placeholderTextColor={colors.textFaint}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Process</Text>
              <View style={styles.chipWrap}>
                {PROCESSES.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={beanForm.process === p.toLowerCase()}
                    onPress={() => {
                      hapticSelection();
                      setBeanForm((prev) => ({ ...prev, process: p.toLowerCase() as BeanForm['process'] }));
                    }}
                    accentColor={colors.accent}
                    faintColor={colors.textSub}
                    borderColor={colors.border}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Roast level</Text>
              <View style={styles.chipWrap}>
                {ROAST_LEVELS.map((rl) => (
                  <Chip
                    key={rl}
                    label={rl}
                    selected={beanForm.roast_level === rl.toLowerCase()}
                    onPress={() => {
                      hapticSelection();
                      setBeanForm((prev) => ({ ...prev, roast_level: rl.toLowerCase() as BeanForm['roast_level'] }));
                    }}
                    accentColor={colors.accent}
                    faintColor={colors.textSub}
                    borderColor={colors.border}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Tasting notes</Text>
              <View style={styles.chipWrap}>
                {TASTING_OPTIONS.map((note) => (
                  <Chip
                    key={note}
                    label={note}
                    selected={beanForm.tasting_notes.includes(note)}
                    onPress={() => toggleTastingNote(note)}
                    accentColor={colors.accent}
                    faintColor={colors.textSub}
                    borderColor={colors.border}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Stock (grams)</Text>
              <View style={styles.stockRow}>
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setBeanForm((p) => ({ ...p, stock_grams: Math.max(0, p.stock_grams - 50) }));
                  }}
                  style={[styles.stockBtn, { backgroundColor: colors.bgCard2, borderColor: colors.border }]}
                >
                  <Text style={[styles.stockBtnText, { color: colors.accent }]}>-50</Text>
                </Pressable>
                <TextInput
                  style={[styles.stockInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
                  value={String(beanForm.stock_grams)}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    if (!isNaN(n)) setBeanForm((p) => ({ ...p, stock_grams: n }));
                    else if (t === '') setBeanForm((p) => ({ ...p, stock_grams: 0 }));
                  }}
                  keyboardType="number-pad"
                />
                <Pressable
                  onPress={() => {
                    hapticLight();
                    setBeanForm((p) => ({ ...p, stock_grams: p.stock_grams + 50 }));
                  }}
                  style={[styles.stockBtn, { backgroundColor: colors.bgCard2, borderColor: colors.border }]}
                >
                  <Text style={[styles.stockBtnText, { color: colors.accent }]}>+50</Text>
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSub }]}>Color</Text>
              <View style={styles.colorRow}>
                {BEAN_COLORS.map((c) => (
                  <ColorDot
                    key={c}
                    color={c}
                    selected={beanForm.color === c}
                    onPress={() => {
                      hapticSelection();
                      setBeanForm((p) => ({ ...p, color: c }));
                    }}
                    borderColor={colors.border}
                  />
                ))}
              </View>
            </>
          )}

          {/* Save Button */}
          <AnimatedPressable
            onPress={canSave ? handleSave : undefined}
            style={[styles.saveBtnWrapper, saveBtnStyle]}
            disabled={!canSave}
          >
            <LinearGradient
              colors={canSave ? ['#D4A050', '#E8C97A', '#D4A050'] : [colors.disabledAccent, colors.disabledAccent, colors.disabledAccent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Save changes' : `Add ${mode}`}
              </Text>
            </LinearGradient>
          </AnimatedPressable>

          {/* Delete Button */}
          {isEditing && (
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Delete {mode}</Text>
            </Pressable>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: Fonts.body,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  stockBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bodySemiBold,
  },
  stockInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  colorDotSelected: {
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  saveBtnWrapper: {
    marginTop: 20,
    marginBottom: 4,
  },
  saveBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  deleteBtnText: {
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
    color: '#CC4444',
  },
});
