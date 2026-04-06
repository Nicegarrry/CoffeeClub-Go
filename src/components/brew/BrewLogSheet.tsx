import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
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
import { beans } from '../../constants/mockData';
import { pickImage } from '../../services/device';
import { hapticLight, hapticSelection } from '../../services/device';
import type { QuickLogData, DetailData } from '../../hooks/useBrewLogger';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const QUICK_HEIGHT = SCREEN_HEIGHT * 0.7;
const DETAIL_HEIGHT = SCREEN_HEIGHT * 0.92;

const BREW_METHODS = ['Espresso', 'Latte', 'Flat white', 'Filter', 'Pour over', 'Cold brew', 'Other'];
const TASTING_NOTES = ['Chocolatey', 'Fruity', 'Floral', 'Nutty', 'Acidic', 'Smooth', 'Bitter', 'Caramel', 'Bright'];

const NAME_SUGGESTIONS_MORNING = ['Morning espresso', 'Sunrise brew', 'Early bird', 'Wake-up shot', 'Dawn cup'];
const NAME_SUGGESTIONS_MIDDAY = ['Late morning latte', 'Mid-morning flat white', 'Brunch brew', 'Office espresso'];
const NAME_SUGGESTIONS_AFTERNOON = ['Afternoon pick-me-up', 'Post-lunch latte', '3pm espresso', 'Midday boost'];
const NAME_SUGGESTIONS_EVENING = ['Evening brew', 'After-dinner cup', 'Night cap', 'Sunset espresso', 'Wind-down pour over'];

function getNameSuggestions(): string[] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return NAME_SUGGESTIONS_MORNING;
  if (hour >= 9 && hour < 12) return NAME_SUGGESTIONS_MIDDAY;
  if (hour >= 12 && hour < 15) return NAME_SUGGESTIONS_AFTERNOON;
  return NAME_SUGGESTIONS_EVENING;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// --- Star Rating Component ---
function StarRating({
  rating,
  onRate,
  accentColor,
  faintColor,
}: {
  rating: number;
  onRate: (star: number) => void;
  accentColor: string;
  faintColor: string;
}) {
  const star1Scale = useSharedValue(1);
  const star2Scale = useSharedValue(1);
  const star3Scale = useSharedValue(1);
  const scales = [star1Scale, star2Scale, star3Scale];

  const star1Style = useAnimatedStyle(() => ({ transform: [{ scale: star1Scale.value }] }));
  const star2Style = useAnimatedStyle(() => ({ transform: [{ scale: star2Scale.value }] }));
  const star3Style = useAnimatedStyle(() => ({ transform: [{ scale: star3Scale.value }] }));
  const animStyles = [star1Style, star2Style, star3Style];

  const handleTap = (star: number) => {
    const sv = scales[star - 1];
    sv.value = withSpring(1.4, { damping: 8, stiffness: 300 }, () => {
      sv.value = withSpring(1, { damping: 12 });
    });
    hapticSelection();
    onRate(star);
  };

  return (
    <View style={starStyles.container}>
      {[1, 2, 3].map((star) => (
        <AnimatedPressable
          key={star}
          onPress={() => handleTap(star)}
          style={[starStyles.starTouch, animStyles[star - 1]]}
        >
          <Text
            style={[
              starStyles.starText,
              { color: rating >= star ? '#E8B730' : faintColor },
            ]}
          >
            {rating >= star ? '\u2605' : '\u2606'}
          </Text>
        </AnimatedPressable>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  starTouch: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 36,
  },
});

// --- Chip Component ---
function Chip({
  label,
  selected,
  onPress,
  accentColor,
  textColor,
  faintColor,
  borderColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accentColor: string;
  textColor: string;
  faintColor: string;
  borderColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        chipStyles.chip,
        {
          backgroundColor: selected ? accentColor : 'transparent',
          borderColor: selected ? accentColor : borderColor,
        },
      ]}
    >
      <Text
        style={[
          chipStyles.chipText,
          { color: selected ? '#FFFFFF' : faintColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
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
});

// --- Stepper Component ---
function Stepper({
  label,
  value,
  onIncrement,
  onDecrement,
  suffix,
  colors: c,
}: {
  label: string;
  value: number | null;
  onIncrement: () => void;
  onDecrement: () => void;
  suffix?: string;
  colors: { text: string; textSub: string; border: string; bgCard2: string; accent: string };
}) {
  return (
    <View style={stepperStyles.container}>
      <Text style={[stepperStyles.label, { color: c.textSub }]}>{label}</Text>
      <View style={[stepperStyles.row, { borderColor: c.border, backgroundColor: c.bgCard2 }]}>
        <Pressable onPress={onDecrement} style={stepperStyles.btn}>
          <Text style={[stepperStyles.btnText, { color: c.accent }]}>{'\u2212'}</Text>
        </Pressable>
        <Text style={[stepperStyles.value, { color: c.text }]}>
          {value != null ? `${value}${suffix ?? ''}` : '\u2014'}
        </Text>
        <Pressable onPress={onIncrement} style={stepperStyles.btn}>
          <Text style={[stepperStyles.btnText, { color: c.accent }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  value: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: Fonts.bodySemiBold,
  },
});

// --- Main BrewLogSheet ---
interface BrewLogSheetProps {
  isOpen: boolean;
  showDetails: boolean;
  quickLogData: QuickLogData;
  detailData: DetailData;
  onClose: () => void;
  onSubmit: () => void;
  onToggleDetails: () => void;
  setQuickField: <K extends keyof QuickLogData>(key: K, value: QuickLogData[K]) => void;
  setDetailField: <K extends keyof DetailData>(key: K, value: DetailData[K]) => void;
}

export default function BrewLogSheet({
  isOpen,
  showDetails,
  quickLogData,
  detailData,
  onClose,
  onSubmit,
  onToggleDetails,
  setQuickField,
  setDetailField,
}: BrewLogSheetProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const postScale = useSharedValue(1);
  const [isEditingName, setIsEditingName] = React.useState(false);

  const sheetHeight = showDetails ? DETAIL_HEIGHT : QUICK_HEIGHT;

  useEffect(() => {
    if (isOpen) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(SCREEN_HEIGHT - sheetHeight, {
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
  }, [isOpen, sheetHeight, translateY, overlayOpacity]);

  // Animate height change when toggling details
  useEffect(() => {
    if (isOpen) {
      translateY.value = withTiming(SCREEN_HEIGHT - sheetHeight, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [showDetails, isOpen, sheetHeight, translateY]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const postBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: postScale.value }],
  }));

  const handleBackdropPress = useCallback(() => {
    if (!showDetails) {
      onClose();
    }
  }, [showDetails, onClose]);

  const handlePickPhoto = useCallback(async () => {
    const uri = await pickImage();
    if (uri) {
      setQuickField('photo', uri);
    }
  }, [setQuickField]);

  const handlePostPress = useCallback(() => {
    postScale.value = withTiming(0.97, { duration: 80 }, () => {
      postScale.value = withSpring(1, { damping: 15 });
      runOnJS(onSubmit)();
    });
    hapticLight();
  }, [onSubmit, postScale]);

  const handleBrewTimeIncrement = useCallback(() => {
    const current = detailData.brewTime;
    let totalSeconds = 0;
    if (current) {
      const parts = current.split(':');
      totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    totalSeconds += 1;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setDetailField('brewTime', `${mins}:${secs.toString().padStart(2, '0')}`);
  }, [detailData.brewTime, setDetailField]);

  const handleBrewTimeDecrement = useCallback(() => {
    const current = detailData.brewTime;
    let totalSeconds = 0;
    if (current) {
      const parts = current.split(':');
      totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    totalSeconds = Math.max(0, totalSeconds - 1);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    setDetailField('brewTime', `${mins}:${secs.toString().padStart(2, '0')}`);
  }, [detailData.brewTime, setDetailField]);

  const handleToggleTastingNote = useCallback(
    (note: string) => {
      hapticSelection();
      const current = detailData.tastingNotes;
      if (current.includes(note)) {
        setDetailField(
          'tastingNotes',
          current.filter((n) => n !== note),
        );
      } else {
        setDetailField('tastingNotes', [...current, note]);
      }
    },
    [detailData.tastingNotes, setDetailField],
  );

  const canPost = quickLogData.name.trim().length > 0;
  const activeBeanObj = detailData.beanId != null ? beans.find((b) => b.id === detailData.beanId) : null;

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: DETAIL_HEIGHT,
            backgroundColor: colors.bgCard,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.textFaint }]} />
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          scrollEnabled={showDetails}
          bounces={false}
        >
          {/* --- Photo Zone --- */}
          <Pressable
            onPress={handlePickPhoto}
            style={[styles.photoZone, { backgroundColor: colors.bgCard2, borderColor: colors.border }]}
          >
            {quickLogData.photo ? (
              <Image source={{ uri: quickLogData.photo }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={[styles.cameraIcon, { color: colors.textFaint }]}>{'\uD83D\uDCF7'}</Text>
                <Text style={[styles.photoHint, { color: colors.textFaint }]}>Tap to add photo</Text>
              </View>
            )}
          </Pressable>

          {/* --- Name --- */}
          {isEditingName ? (
            <TextInput
              style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.accent }]}
              value={quickLogData.name}
              onChangeText={(text) => setQuickField('name', text)}
              onBlur={() => setIsEditingName(false)}
              autoFocus
              placeholder="Name your brew..."
              placeholderTextColor={colors.textFaint}
              returnKeyType="done"
              onSubmitEditing={() => setIsEditingName(false)}
            />
          ) : (
            <Pressable onPress={() => setIsEditingName(true)}>
              <Text style={[styles.nameDisplay, { color: colors.text }]}>
                {quickLogData.name || 'Tap to name...'}
              </Text>
            </Pressable>
          )}

          {/* --- Name Suggestions --- */}
          {isEditingName && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsRow}
              contentContainerStyle={styles.suggestionsContent}
            >
              {getNameSuggestions().map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    setQuickField('name', s);
                    setIsEditingName(false);
                  }}
                  style={[styles.suggestionChip, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
                >
                  <Text style={[styles.suggestionText, { color: colors.accent }]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* --- Star Rating --- */}
          <StarRating
            rating={quickLogData.rating}
            onRate={(r) => setQuickField('rating', r)}
            accentColor={colors.accent}
            faintColor={colors.textFaint}
          />

          {/* --- Post Button --- */}
          <AnimatedPressable
            onPress={canPost ? handlePostPress : undefined}
            style={[styles.postBtnWrapper, postBtnStyle]}
            disabled={!canPost}
          >
            <LinearGradient
              colors={canPost ? ['#D4A050', '#E8C97A', '#D4A050'] : [colors.disabledAccent, colors.disabledAccent, colors.disabledAccent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postBtn}
            >
              <Text style={styles.postBtnText}>
                {canPost ? 'Post brew \u2615' : 'Add a name first'}
              </Text>
            </LinearGradient>
          </AnimatedPressable>

          {/* --- Toggle Details --- */}
          <Pressable
            onPress={() => {
              hapticLight();
              onToggleDetails();
            }}
            style={styles.detailsToggle}
          >
            <Text style={[styles.detailsToggleText, { color: colors.accent }]}>
              {showDetails ? 'Hide details \u2191' : 'Add details \u2193'}
            </Text>
          </Pressable>

          {/* --- Details Section --- */}
          {showDetails && (
            <View style={styles.detailsSection}>
              {/* Brew Type Chips */}
              <Text style={[styles.sectionLabel, { color: colors.textSub }]}>Brew type</Text>
              <View style={styles.chipWrap}>
                {BREW_METHODS.map((method) => (
                  <Chip
                    key={method}
                    label={method}
                    selected={detailData.method === method}
                    onPress={() => {
                      hapticSelection();
                      setDetailField('method', method);
                    }}
                    accentColor={colors.accent}
                    textColor={colors.text}
                    faintColor={colors.textSub}
                    borderColor={colors.border}
                  />
                ))}
              </View>

              {/* Dose In / Yield Out */}
              <View style={styles.stepperRow}>
                <Stepper
                  label="Dose in (g)"
                  value={detailData.doseIn}
                  onIncrement={() => setDetailField('doseIn', (detailData.doseIn ?? 17) + 0.5)}
                  onDecrement={() => setDetailField('doseIn', Math.max(0, (detailData.doseIn ?? 18) - 0.5))}
                  suffix="g"
                  colors={colors}
                />
                <View style={{ width: 12 }} />
                <Stepper
                  label="Yield out (g)"
                  value={detailData.yieldOut}
                  onIncrement={() => setDetailField('yieldOut', (detailData.yieldOut ?? 35) + 1)}
                  onDecrement={() => setDetailField('yieldOut', Math.max(0, (detailData.yieldOut ?? 36) - 1))}
                  suffix="g"
                  colors={colors}
                />
              </View>

              {/* Brew Time */}
              <View style={styles.stepperRow}>
                <Stepper
                  label="Brew time"
                  value={null}
                  onIncrement={handleBrewTimeIncrement}
                  onDecrement={handleBrewTimeDecrement}
                  colors={colors}
                />
              </View>
              <Text style={[styles.brewTimeDisplay, { color: colors.text }]}>
                {detailData.brewTime ?? '0:00'}
              </Text>

              {/* Grind Setting */}
              <View style={styles.stepperRow}>
                <Stepper
                  label="Grind setting"
                  value={detailData.grindSetting}
                  onIncrement={() =>
                    setDetailField('grindSetting', Math.min(40, (detailData.grindSetting ?? 14) + 1))
                  }
                  onDecrement={() =>
                    setDetailField('grindSetting', Math.max(1, (detailData.grindSetting ?? 16) - 1))
                  }
                  colors={colors}
                />
              </View>

              {/* Tasting Notes */}
              <Text style={[styles.sectionLabel, { color: colors.textSub, marginTop: 16 }]}>
                Tasting notes
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tastingRow}
              >
                {TASTING_NOTES.map((note) => (
                  <Chip
                    key={note}
                    label={note}
                    selected={detailData.tastingNotes.includes(note)}
                    onPress={() => handleToggleTastingNote(note)}
                    accentColor={colors.accent}
                    textColor={colors.text}
                    faintColor={colors.textSub}
                    borderColor={colors.border}
                  />
                ))}
                <Pressable
                  style={[
                    chipStyles.chip,
                    {
                      borderColor: colors.border,
                      borderStyle: 'dashed' as const,
                    },
                  ]}
                >
                  <Text style={[chipStyles.chipText, { color: colors.textFaint }]}>+ custom</Text>
                </Pressable>
              </ScrollView>

              {/* Bean Override */}
              <Text style={[styles.sectionLabel, { color: colors.textSub, marginTop: 16 }]}>Bean</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tastingRow}
              >
                {beans.map((bean) => (
                  <Pressable
                    key={bean.id}
                    onPress={() => {
                      hapticSelection();
                      setDetailField('beanId', detailData.beanId === bean.id ? null : bean.id);
                    }}
                    style={[
                      styles.beanPill,
                      {
                        backgroundColor: detailData.beanId === bean.id ? bean.color : 'transparent',
                        borderColor: detailData.beanId === bean.id ? bean.color : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.beanPillText,
                        {
                          color: detailData.beanId === bean.id ? '#FFFFFF' : colors.textSub,
                        },
                      ]}
                    >
                      {bean.name}
                    </Text>
                    <Text
                      style={[
                        styles.beanPillSub,
                        {
                          color: detailData.beanId === bean.id ? 'rgba(255,255,255,0.7)' : colors.textFaint,
                        },
                      ]}
                    >
                      {bean.roaster}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Bottom spacer */}
              <View style={{ height: 40 }} />
            </View>
          )}
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
    // Shadow
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
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  // Photo
  photoZone: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  photoHint: {
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  // Name
  nameDisplay: {
    fontSize: 24,
    fontFamily: Fonts.display,
    textAlign: 'center',
    paddingVertical: 8,
  },
  nameInput: {
    fontSize: 24,
    fontFamily: Fonts.display,
    textAlign: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  // Suggestions
  suggestionsRow: {
    maxHeight: 44,
    marginBottom: 4,
  },
  suggestionsContent: {
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  // Post button
  postBtnWrapper: {
    marginTop: 12,
    marginBottom: 4,
  },
  postBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnText: {
    fontSize: 17,
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  // Details toggle
  detailsToggle: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailsToggleText: {
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
  },
  // Details section
  detailsSection: {
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  brewTimeDisplay: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
    marginTop: -4,
    marginBottom: 12,
  },
  tastingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4,
  },
  // Bean pills
  beanPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 8,
  },
  beanPillText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
  beanPillSub: {
    fontSize: 11,
    fontFamily: Fonts.body,
    marginTop: 1,
  },
});
