import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/hooks/useAuth';
import { useProfile } from '../src/hooks/useProfile';
import { useMyBrews } from '../src/hooks/useBrews';
import { useMachines, useGrinders, useBeans } from '../src/hooks/useSetup';
import { useFollowers, useFollowing } from '../src/hooks/useFollow';
import { useTasteProfile } from '../src/hooks/useTasteProfile';
import { useBrewStats } from '../src/hooks/useBrewStats';
import { pickImage } from '../src/services/device';
import { hapticLight, hapticSelection } from '../src/services/device';
import { Fonts, Spacing, Radius, LetterSpacing } from '../src/constants/theme';
import TasteRadar from '../src/components/profile/TasteRadar';
import BrewCalendar from '../src/components/profile/BrewCalendar';
import BadgeGrid from '../src/components/profile/BadgeGrid';
import type { DbBean } from '../src/types/database';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, profile: authProfile, signOut, updateProfile } = useAuth();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();
  const { brews, loading: brewsLoading } = useMyBrews();
  const { machines, activeMachine } = useMachines();
  const { grinders, activeGrinder } = useGrinders();
  const { beans } = useBeans();

  const userId = user?.id ?? '';
  const { followers } = useFollowers(userId);
  const { following } = useFollowing(userId);

  const tasteProfile = useTasteProfile(brews ?? [], beans ?? []);
  const brewStats = useBrewStats(brews ?? [], beans ?? []);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const displayProfile = profile ?? authProfile;

  const startEditing = useCallback(() => {
    hapticSelection();
    setEditName(displayProfile?.display_name ?? '');
    setEditBio(displayProfile?.bio ?? '');
    setEditLocation(displayProfile?.location ?? '');
    setEditing(true);
  }, [displayProfile]);

  const saveEdits = useCallback(async () => {
    const { error } = await updateProfile({
      display_name: editName.trim(),
      bio: editBio.trim(),
      location: editLocation.trim(),
    });
    if (error) {
      Alert.alert('Error', error);
    } else {
      setEditing(false);
      refreshProfile();
    }
  }, [editName, editBio, editLocation, updateProfile, refreshProfile]);

  const handleAvatarPress = useCallback(async () => {
    hapticLight();
    const uri = await pickImage();
    if (uri) {
      await updateProfile({ avatar_url: uri });
      refreshProfile();
    }
  }, [updateProfile, refreshProfile]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const initial = (displayProfile?.display_name ?? displayProfile?.username ?? '?')[0].toUpperCase();

  const brewCount = profile?.brew_count ?? brews?.length ?? 0;
  const followerCount = followers?.length ?? profile?.follower_count ?? 0;
  const followingCount = following?.length ?? profile?.following_count ?? 0;

  // Active bean (first one in the list)
  const activeBean: DbBean | null = beans && beans.length > 0 ? beans[0] : null;

  if (profileLoading || brewsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Header Section ─── */}
        <View style={styles.headerSection}>
          <Pressable onPress={handleAvatarPress} style={styles.avatarWrap}>
            {displayProfile?.avatar_url ? (
              <Image
                source={{ uri: displayProfile.avatar_url }}
                style={[styles.avatar, { borderColor: colors.accent }]}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
          </Pressable>

          {editing ? (
            <View style={styles.editFields}>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Display name"
                placeholderTextColor={colors.textFaint}
              />
              <TextInput
                style={[styles.editInput, styles.editBioInput, { color: colors.text, borderColor: colors.border }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Bio"
                placeholderTextColor={colors.textFaint}
                multiline
              />
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Location"
                placeholderTextColor={colors.textFaint}
              />
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: colors.textSub }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveEdits} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.infoSection}>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {displayProfile?.display_name ?? 'Coffee Lover'}
              </Text>
              <Text style={[styles.username, { color: colors.textSub }]}>
                @{displayProfile?.username ?? 'unknown'}
              </Text>
              {displayProfile?.bio ? (
                <Text style={[styles.bioText, { color: colors.textSub }]}>
                  {displayProfile.bio}
                </Text>
              ) : null}
              {displayProfile?.location ? (
                <Text style={[styles.locationText, { color: colors.textFaint }]}>
                  {'\uD83D\uDCCD'} {displayProfile.location}
                </Text>
              ) : null}
              <Pressable
                onPress={startEditing}
                style={[styles.editProfileBtn, { borderColor: colors.accent }]}
              >
                <Text style={[styles.editProfileBtnText, { color: colors.accent }]}>
                  Edit Profile
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ─── Stats Row ─── */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{brewCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>Brews</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.statItem} onPress={() => hapticSelection()}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{followerCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>Followers</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.statItem} onPress={() => hapticSelection()}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{followingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>Following</Text>
          </Pressable>
        </View>

        {/* ─── Taste Profile Section ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Taste Profile</Text>
          <View style={styles.radarWrap}>
            <TasteRadar profile={tasteProfile} size={200} />
          </View>
          {tasteProfile && (
            <View style={styles.pillRow}>
              {tasteProfile.preferredRoast ? (
                <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.pillText, { color: colors.accent }]}>
                    {tasteProfile.preferredRoast}
                  </Text>
                </View>
              ) : null}
              {tasteProfile.preferredOrigin ? (
                <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.pillText, { color: colors.accent }]}>
                    {tasteProfile.preferredOrigin}
                  </Text>
                </View>
              ) : null}
              {tasteProfile.preferredProcess ? (
                <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.pillText, { color: colors.accent }]}>
                    {tasteProfile.preferredProcess}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* ─── Activity Section ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity</Text>
          <BrewCalendar brews={brews ?? []} />
        </View>

        {/* ─── Achievements Section ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
          <BadgeGrid brews={brews ?? []} beans={beans ?? []} />
        </View>

        {/* ─── My Setup Section ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Setup</Text>

          {/* Machine */}
          <View style={[styles.equipCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={styles.equipEmoji}>{'\u2615'}</Text>
            <View style={styles.equipInfo}>
              <Text style={[styles.equipName, { color: colors.text }]}>
                {activeMachine?.name ?? 'No machine'}
              </Text>
              <Text style={[styles.equipBrand, { color: colors.textSub }]}>
                {activeMachine?.brand ?? 'Add one in settings'}
              </Text>
            </View>
          </View>

          {/* Grinder */}
          <View style={[styles.equipCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={styles.equipEmoji}>{'\u2699\uFE0F'}</Text>
            <View style={styles.equipInfo}>
              <Text style={[styles.equipName, { color: colors.text }]}>
                {activeGrinder?.name ?? 'No grinder'}
              </Text>
              <Text style={[styles.equipBrand, { color: colors.textSub }]}>
                {activeGrinder?.brand ?? 'Add one in settings'}
              </Text>
            </View>
          </View>

          {/* Active Bean */}
          {activeBean && (
            <View style={[styles.equipCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={styles.equipEmoji}>{'\uD83E\uDED8'}</Text>
              <View style={styles.equipInfo}>
                <Text style={[styles.equipName, { color: colors.text }]}>
                  {activeBean.name}
                </Text>
                <Text style={[styles.equipBrand, { color: colors.textSub }]}>
                  {activeBean.roaster}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ─── Settings & Sign Out ─── */}
        <View style={styles.section}>
          <Pressable
            onPress={() => {
              hapticLight();
              router.push('/settings');
            }}
            style={[styles.settingsBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          >
            <Text style={[styles.settingsBtnText, { color: colors.text }]}>Settings</Text>
          </Pressable>

          <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Header ───
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
    paddingBottom: 16,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  avatarInitial: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: '#FFFFFF',
  },
  infoSection: {
    alignItems: 'center',
  },
  displayName: {
    fontFamily: Fonts.display,
    fontSize: 22,
    letterSpacing: LetterSpacing.display,
    marginBottom: 2,
  },
  username: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    marginBottom: 6,
  },
  bioText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  locationText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginBottom: 10,
  },
  editProfileBtn: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  editProfileBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },

  // ─── Edit Mode ───
  editFields: {
    width: '100%',
    gap: 10,
    paddingTop: 4,
  },
  editInput: {
    fontFamily: Fonts.body,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editBioInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // ─── Stats Row ───
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.gutter,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: Fonts.display,
    fontSize: 20,
    letterSpacing: LetterSpacing.display,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },

  // ─── Sections ───
  section: {
    paddingHorizontal: Spacing.gutter,
    marginTop: Spacing.sectionGap,
  },
  sectionTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 17,
    marginBottom: 12,
  },

  // ─── Taste Pills ───
  radarWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  pillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },

  // ─── Equipment Cards ───
  equipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginBottom: 8,
  },
  equipEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  equipInfo: {
    flex: 1,
  },
  equipName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  equipBrand: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 1,
  },

  // ─── Settings & Sign Out ───
  settingsBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  settingsBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: '#D94444',
  },

  bottomSpacer: {
    height: 80,
  },
});
