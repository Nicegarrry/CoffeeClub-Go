/**
 * Abstracted device services layer.
 * All native feature calls go through here so we can swap in
 * Capacitor/native modules later without touching components.
 */
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

export async function pickImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

export async function hapticLight() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function hapticMedium() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function hapticSelection() {
  await Haptics.selectionAsync();
}

// Stubs for future native features
export async function requestPushPermission(): Promise<boolean> {
  console.log('[device] Push notifications not yet implemented');
  return false;
}

export async function openCamera(): Promise<string | null> {
  console.log('[device] Camera capture not yet implemented — use pickImage()');
  return null;
}
