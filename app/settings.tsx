import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/hooks/useAuth';
import { getSetting, setSetting } from '../src/services/db';
import { hapticSelection } from '../src/services/device';
import { Fonts, Spacing, LetterSpacing } from '../src/constants/theme';

/* ─── Setting Row ─────────────────────────────────────────────── */

function SettingRow({
  label,
  right,
  onPress,
  danger,
}: {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();

  const content = (
    <View
      style={[
        styles.row,
        { borderBottomColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.rowLabel,
          { color: danger ? '#D94040' : colors.text },
        ]}
      >
        {label}
      </Text>
      {right ?? (
        onPress ? (
          <Text style={[styles.chevron, { color: colors.textFaint }]}>
            ›
          </Text>
        ) : null
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

/* ─── Section Header ──────────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        styles.sectionHeader,
        { color: colors.textFaint },
      ]}
    >
      {title}
    </Text>
  );
}

/* ─── Settings Screen ─────────────────────────────────────────── */

export default function SettingsScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { signOut } = useAuth();
  const router = useRouter();

  // Local state for persisted settings
  const [pushEnabled, setPushEnabled] = useState(false);
  const [brewlyEnabled, setBrewlyEnabled] = useState(true);
  const [visibilityPublic, setVisibilityPublic] = useState(true);

  useEffect(() => {
    (async () => {
      const push = await getSetting('push_notifications', false);
      const brewly = await getSetting('brewly_enabled', true);
      const vis = await getSetting('default_visibility', 'public');
      setPushEnabled(push);
      setBrewlyEnabled(brewly);
      setVisibilityPublic(vis === 'public');
    })();
  }, []);

  /* ── handlers ── */

  const handleToggleDark = () => {
    hapticSelection();
    toggle();
  };

  const handlePush = (val: boolean) => {
    hapticSelection();
    setPushEnabled(val);
    setSetting('push_notifications', val);
  };

  const handleBrewly = (val: boolean) => {
    hapticSelection();
    setBrewlyEnabled(val);
    setSetting('brewly_enabled', val);
  };

  const handleVisibility = (val: boolean) => {
    hapticSelection();
    setVisibilityPublic(val);
    setSetting('default_visibility', val ? 'public' : 'private');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleExport = () => {
    Alert.alert('Export Data', 'Coming soon');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Coming soon');
  };

  const handleTerms = () => {
    Alert.alert('Terms of Service', 'Coming soon');
  };

  /* ── themed switch props ── */

  const switchTrack = { false: colors.border, true: colors.accent };
  const switchThumb = isDark ? '#F2EBDD' : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            hapticSelection();
            router.back();
          }}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Text style={[styles.backArrow, { color: colors.accent }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Appearance ── */}
        <SectionHeader title="APPEARANCE" />
        <SettingRow
          label="Dark Mode"
          right={
            <Switch
              value={isDark}
              onValueChange={handleToggleDark}
              trackColor={switchTrack}
              thumbColor={switchThumb}
            />
          }
        />

        {/* ── Notifications ── */}
        <SectionHeader title="NOTIFICATIONS" />
        <SettingRow
          label="Push Notifications"
          right={
            <Switch
              value={pushEnabled}
              onValueChange={handlePush}
              trackColor={switchTrack}
              thumbColor={switchThumb}
            />
          }
        />
        <SettingRow
          label="Brewly Nudges"
          right={
            <Switch
              value={brewlyEnabled}
              onValueChange={handleBrewly}
              trackColor={switchTrack}
              thumbColor={switchThumb}
            />
          }
        />

        {/* ── Privacy ── */}
        <SectionHeader title="PRIVACY" />
        <SettingRow
          label="Default Brew Visibility"
          right={
            <Pressable
              onPress={() => handleVisibility(!visibilityPublic)}
              style={[
                styles.segmented,
                { borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.segmentOption,
                  visibilityPublic && {
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: visibilityPublic
                        ? '#FFFFFF'
                        : colors.textSub,
                    },
                  ]}
                >
                  Public
                </Text>
              </View>
              <View
                style={[
                  styles.segmentOption,
                  !visibilityPublic && {
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: !visibilityPublic
                        ? '#FFFFFF'
                        : colors.textSub,
                    },
                  ]}
                >
                  Private
                </Text>
              </View>
            </Pressable>
          }
        />

        {/* ── Account ── */}
        <SectionHeader title="ACCOUNT" />
        <SettingRow
          label="Edit Profile"
          onPress={() => router.push('/profile')}
        />
        <SettingRow label="Export Data" onPress={handleExport} />
        <SettingRow
          label="Sign Out"
          danger
          onPress={handleSignOut}
        />

        {/* ── About ── */}
        <SectionHeader title="ABOUT" />
        <SettingRow
          label="Version"
          right={
            <Text style={[styles.rowValue, { color: colors.textSub }]}>
              1.0.0
            </Text>
          }
        />
        <SettingRow label="Privacy Policy" onPress={handlePrivacyPolicy} />
        <SettingRow label="Terms of Service" onPress={handleTerms} />

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
  },
  backArrow: {
    fontSize: 24,
    fontFamily: Fonts.body,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bodySemiBold,
  },
  scroll: {
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: Fonts.bodySemiBold,
    letterSpacing: LetterSpacing.uppercase,
    textTransform: 'uppercase',
    marginTop: Spacing.sectionGap,
    marginBottom: 4,
    paddingHorizontal: Spacing.gutter,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: Spacing.gutter,
    borderBottomWidth: 0.5,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: Fonts.body,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: Fonts.body,
  },
  chevron: {
    fontSize: 20,
    fontFamily: Fonts.body,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segmentOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: Fonts.bodySemiBold,
  },
});
