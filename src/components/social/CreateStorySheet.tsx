import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Spacing } from '../../constants/theme';
import { pickImage, hapticLight, hapticSelection } from '../../services/device';
import { useStories } from '../../hooks/useStories';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type StoryType = 'brew' | 'checkin' | 'bean' | 'general';

const STORY_TYPES: { type: StoryType; label: string; icon: string }[] = [
  { type: 'brew', label: 'Brew', icon: '\u2615' },
  { type: 'checkin', label: 'Check-in', icon: '\uD83D\uDCCD' },
  { type: 'bean', label: 'Bean', icon: '\uD83E\uDED8' },
  { type: 'general', label: 'General', icon: '\uD83D\uDCF8' },
];

export default function CreateStorySheet({ visible, onClose, onCreated }: Props) {
  const { colors } = useTheme();
  const { createStory } = useStories();

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  const [selectedType, setSelectedType] = useState<StoryType>('brew');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (visible) {
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
  }, [visible, translateY, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePickPhoto = useCallback(async () => {
    const uri = await pickImage();
    if (uri) setPhotoUri(uri);
  }, []);

  const handlePost = useCallback(async () => {
    if (posting) return;
    setPosting(true);
    try {
      await createStory({
        photoUri,
        caption,
        type: selectedType,
      });
      await hapticLight();
      // Reset form
      setSelectedType('brew');
      setPhotoUri(null);
      setCaption('');
      onCreated();
      onClose();
    } catch (err) {
      console.error('[CreateStorySheet] post error:', err);
    } finally {
      setPosting(false);
    }
  }, [posting, createStory, photoUri, caption, selectedType, onCreated, onClose]);

  const handleClose = useCallback(() => {
    if (!posting) onClose();
  }, [posting, onClose]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
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

        <Text style={[styles.title, { color: colors.text }]}>New Story</Text>

        {/* Type Selector */}
        <View style={styles.typeRow}>
          {STORY_TYPES.map((item) => {
            const isSelected = selectedType === item.type;
            return (
              <Pressable
                key={item.type}
                onPress={() => {
                  hapticSelection();
                  setSelectedType(item.type);
                }}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: isSelected ? colors.accentSoft : colors.bgCard2,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={styles.typeIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    { color: isSelected ? colors.accent : colors.textSub },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Photo Picker */}
        <Pressable
          onPress={handlePickPhoto}
          style={[
            styles.photoZone,
            { backgroundColor: colors.bgCard2, borderColor: colors.border },
          ]}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={[styles.cameraIcon, { color: colors.textFaint }]}>
                {'\uD83D\uDCF7'}
              </Text>
              <Text style={[styles.photoHint, { color: colors.textFaint }]}>
                Tap to add photo
              </Text>
            </View>
          )}
        </Pressable>

        {/* Caption */}
        <TextInput
          style={[
            styles.captionInput,
            {
              color: colors.text,
              backgroundColor: colors.bgCard2,
              borderColor: colors.border,
            },
          ]}
          value={caption}
          onChangeText={setCaption}
          placeholder="What's brewing?"
          placeholderTextColor={colors.textFaint}
          multiline
          numberOfLines={2}
          maxLength={200}
        />

        {/* Post Button */}
        <Pressable onPress={handlePost} disabled={posting} style={styles.postBtnWrapper}>
          <LinearGradient
            colors={
              posting
                ? [colors.disabledAccent, colors.disabledAccent]
                : ['#D4A050', '#E8C97A', '#D4A050']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.postBtn}
          >
            <Text style={styles.postBtnText}>
              {posting ? 'Posting...' : 'Post Story'}
            </Text>
          </LinearGradient>
        </Pressable>
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
  title: {
    fontFamily: Fonts.display,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.gutter,
    gap: 10,
    marginBottom: 16,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  typeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  typeLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },
  photoZone: {
    marginHorizontal: Spacing.gutter,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
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
  captionInput: {
    marginHorizontal: Spacing.gutter,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: Fonts.body,
    marginBottom: 16,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  postBtnWrapper: {
    marginHorizontal: Spacing.gutter,
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
});
