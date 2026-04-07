import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/hooks/useAuth';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { useEquipmentCatalog } from '../src/hooks/useEquipmentCatalog';
import { useMachines, useGrinders } from '../src/hooks/useSetup';
import { Fonts, Spacing, LetterSpacing } from '../src/constants/theme';
import { pickImage } from '../src/services/device';
import { hapticLight, hapticSelection } from '../src/services/device';
import type { DbEquipmentCatalog } from '../src/types/database';

const METHODS = [
  { name: 'Espresso', emoji: '\u2615' },
  { name: 'Pour Over', emoji: '\uD83E\uDED6' },
  { name: 'AeroPress', emoji: '\uD83E\uDDEB' },
  { name: 'French Press', emoji: '\uD83C\uDFDA\uFE0F' },
  { name: 'Moka Pot', emoji: '\u2615' },
  { name: 'Cold Brew', emoji: '\uD83E\uDDCA' },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { updateProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const { create: createMachine } = useMachines();
  const { create: createGrinder } = useGrinders();
  const grinderCatalog = useEquipmentCatalog('grinder');
  const machineCatalog = useEquipmentCatalog('espresso_machine');

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  // Step 2 state
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Step 3 state
  const [selectedGrinder, setSelectedGrinder] = useState<DbEquipmentCatalog | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<DbEquipmentCatalog | null>(null);
  const [grinderSearch, setGrinderSearch] = useState('');
  const [machineSearch, setMachineSearch] = useState('');
  const [grinderResults, setGrinderResults] = useState<DbEquipmentCatalog[]>([]);
  const [machineResults, setMachineResults] = useState<DbEquipmentCatalog[]>([]);

  const handlePickAvatar = useCallback(async () => {
    const uri = await pickImage();
    if (uri) setAvatarUri(uri);
  }, []);

  const handleGrinderSearch = useCallback(async (term: string) => {
    setGrinderSearch(term);
    if (!term.trim()) {
      setGrinderResults([]);
      return;
    }
    const results = await grinderCatalog.search(term);
    setGrinderResults(results);
  }, [grinderCatalog.search]);

  const handleMachineSearch = useCallback(async (term: string) => {
    setMachineSearch(term);
    if (!term.trim()) {
      setMachineResults([]);
      return;
    }
    const results = await machineCatalog.search(term);
    setMachineResults(results);
  }, [machineCatalog.search]);

  const handleNext = useCallback(async () => {
    hapticLight();
    if (step === 0) {
      // Save profile updates
      const updates: Record<string, string> = {};
      if (displayName.trim()) updates.display_name = displayName.trim();
      if (avatarUri) updates.avatar_url = avatarUri;
      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
      }
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else {
      // Finish onboarding
      setSaving(true);
      try {
        if (selectedMethod) {
          await updateProfile({ preferred_method: selectedMethod });
        }
        if (selectedGrinder) {
          await createGrinder({
            name: `${selectedGrinder.brand} ${selectedGrinder.model}`,
            brand: selectedGrinder.brand,
            burr_type: 'flat',
            notes: selectedGrinder.detail || '',
            is_active: true,
          });
        }
        if (selectedMachine) {
          await createMachine({
            name: `${selectedMachine.brand} ${selectedMachine.model}`,
            brand: selectedMachine.brand,
            type: 'espresso',
            burr_size: '',
            notes: selectedMachine.detail || '',
            is_active: true,
          });
        }
        await completeOnboarding();
      } catch (err) {
        console.error('Onboarding finish error:', err);
      } finally {
        setSaving(false);
      }
    }
  }, [step, displayName, avatarUri, selectedMethod, selectedGrinder, selectedMachine, updateProfile, createGrinder, createMachine, completeOnboarding]);

  const handleSkip = useCallback(() => {
    hapticSelection();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setSaving(true);
      const finish = async () => {
        try {
          if (selectedMethod) {
            await updateProfile({ preferred_method: selectedMethod });
          }
          await completeOnboarding();
        } finally {
          setSaving(false);
        }
      };
      finish();
    }
  }, [step, selectedMethod, updateProfile, completeOnboarding]);

  const canNext = step === 0 ? displayName.trim().length > 0 : step === 1 ? !!selectedMethod : true;

  const STEP_HEADERS = [
    { emoji: '\uD83D\uDC4B', title: 'Welcome!', subtitle: 'Tell us a bit about yourself' },
    { emoji: '\u2615', title: 'Your Method', subtitle: 'How do you brew most often?' },
    { emoji: '\u2699\uFE0F', title: 'Your Gear', subtitle: 'Add your equipment (optional)' },
  ];

  const header = STEP_HEADERS[step];

  const renderEquipmentItem = useCallback(
    (item: DbEquipmentCatalog, selected: DbEquipmentCatalog | null, onSelect: (item: DbEquipmentCatalog) => void) => {
      const isSelected = selected?.id === item.id;
      return (
        <Pressable
          onPress={() => { hapticSelection(); onSelect(item); }}
          style={[
            styles.equipRow,
            { borderColor: colors.border, backgroundColor: isSelected ? colors.accentSoft : colors.bgCard },
            isSelected && { borderLeftColor: colors.accent, borderLeftWidth: 3 },
          ]}
        >
          <Text style={[styles.equipName, { color: colors.text }]}>{item.brand} {item.model}</Text>
          {!!item.detail && <Text style={[styles.equipDetail, { color: colors.textSub }]}>{item.detail}</Text>}
        </Pressable>
      );
    },
    [colors],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Step indicator */}
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === step ? colors.accent : colors.border },
            ]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>{header.emoji}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{header.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSub }]}>{header.subtitle}</Text>
      </View>

      {/* Step content */}
      <View style={styles.content}>
        {step === 0 && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.stepContainer}>
            <Pressable onPress={handlePickAvatar} style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <Text style={styles.avatarPlaceholderText}>+</Text>
                </View>
              )}
              <Text style={[styles.avatarLabel, { color: colors.accent }]}>Add photo</Text>
            </Pressable>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, color: colors.text, borderColor: colors.border }]}
              placeholder="Display name"
              placeholderTextColor={colors.textFaint}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </KeyboardAvoidingView>
        )}

        {step === 1 && (
          <View style={styles.methodGrid}>
            {METHODS.map((m) => {
              const isSelected = selectedMethod === m.name;
              return (
                <Pressable
                  key={m.name}
                  onPress={() => { hapticSelection(); setSelectedMethod(m.name); }}
                  style={[
                    styles.methodCard,
                    {
                      backgroundColor: isSelected ? colors.accentSoft : colors.bgCard,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={styles.methodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.methodName, { color: colors.text }]}>{m.name}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 2 && (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <View style={styles.equipContainer}>
                {/* Grinder section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Grinder</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgCard, color: colors.text, borderColor: colors.border }]}
                  placeholder="Search grinders..."
                  placeholderTextColor={colors.textFaint}
                  value={grinderSearch}
                  onChangeText={handleGrinderSearch}
                  autoCorrect={false}
                />
                {selectedGrinder && !grinderSearch && (
                  <View style={[styles.equipRow, { borderColor: colors.accent, backgroundColor: colors.accentSoft, borderLeftWidth: 3, borderLeftColor: colors.accent }]}>
                    <Text style={[styles.equipName, { color: colors.text }]}>{selectedGrinder.brand} {selectedGrinder.model}</Text>
                  </View>
                )}
                {(grinderSearch ? grinderResults : grinderCatalog.items.slice(0, 8)).map((item) =>
                  <View key={item.id}>{renderEquipmentItem(item, selectedGrinder, setSelectedGrinder)}</View>
                )}

                {/* Machine section */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.sectionGap }]}>Your Brewer / Machine</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bgCard, color: colors.text, borderColor: colors.border }]}
                  placeholder="Search machines..."
                  placeholderTextColor={colors.textFaint}
                  value={machineSearch}
                  onChangeText={handleMachineSearch}
                  autoCorrect={false}
                />
                {selectedMachine && !machineSearch && (
                  <View style={[styles.equipRow, { borderColor: colors.accent, backgroundColor: colors.accentSoft, borderLeftWidth: 3, borderLeftColor: colors.accent }]}>
                    <Text style={[styles.equipName, { color: colors.text }]}>{selectedMachine.brand} {selectedMachine.model}</Text>
                  </View>
                )}
                {(machineSearch ? machineResults : machineCatalog.items.slice(0, 8)).map((item) =>
                  <View key={item.id}>{renderEquipmentItem(item, selectedMachine, setSelectedMachine)}</View>
                )}
              </View>
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Bottom actions */}
      <View style={styles.actions}>
        {step > 0 && (
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.accent }]}>Skip</Text>
          </Pressable>
        )}
        <Pressable onPress={canNext && !saving ? handleNext : undefined} disabled={!canNext || saving}>
          <LinearGradient
            colors={canNext ? ['#D4A050', '#E8C97A', '#D4A050'] : [colors.disabledAccent, colors.disabledAccent, colors.disabledAccent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{step === 2 ? 'Finish' : 'Next'}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    letterSpacing: LetterSpacing.display,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    marginTop: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.gutter,
  },
  stepContainer: { flex: 1 },
  // Avatar
  avatarWrap: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: { fontSize: 32, color: '#999' },
  avatarLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    marginTop: 8,
  },
  // Input
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  // Method grid
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.cardGap,
    marginTop: 16,
  },
  methodCard: {
    width: '48%',
    height: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodEmoji: { fontSize: 24, marginBottom: 4 },
  methodName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  // Equipment
  equipContainer: { paddingBottom: 24 },
  sectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 17,
    marginBottom: 10,
    marginTop: 16,
  },
  equipRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  equipName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
  },
  equipDetail: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 2,
  },
  // Actions
  actions: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 16,
    paddingTop: 8,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
  },
  button: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
});
