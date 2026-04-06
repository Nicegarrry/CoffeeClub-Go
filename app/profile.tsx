import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/hooks/useAuth';
import { useProfile } from '../src/hooks/useProfile';
import { useMyBrews } from '../src/hooks/useBrews';
import { useMachines, useGrinders, useBeans } from '../src/hooks/useSetup';
import { pickImage } from '../src/services/device';
import { Fonts, Spacing, Radius, Elevation, LetterSpacing } from '../src/constants/theme';
import { SetupCard } from '../src/components/setup/SetupCard';
import type { DbBrew, DbBean } from '../src/types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_GAP = 4;
const THUMB_SIZE = (SCREEN_WIDTH - Spacing.gutter * 2 - THUMB_GAP) / 2;

type Tab = 'brews' | 'setup' | 'about';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, profile: authProfile, signOut, updateProfile } = useAuth();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();
  const { brews, loading: brewsLoading, refresh: refreshBrews } = useMyBrews();
  const { machines, activeMachine } = useMachines();
  const { grinders, activeGrinder } = useGrinders();
  const { beans } = useBeans();

  const [activeTab, setActiveTab] = useState<Tab>('brews');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const displayProfile = profile ?? authProfile;

  const startEditing = useCallback(() => {
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

  // Compute about stats
  const favouriteBean = useMemo(() => {
    if (!brews || brews.length === 0) return null;
    const counts: Record<string, { count: number; name: string }> = {};
    brews.forEach((b: DbBrew) => {
      if (b.bean_id) {
        if (!counts[b.bean_id]) counts[b.bean_id] = { count: 0, name: b.bean_id };
        counts[b.bean_id].count++;
      }
    });
    // Try to find bean name from beans list
    if (beans) {
      Object.keys(counts).forEach((id) => {
        const bean = beans.find((bn: DbBean) => bn.id === id);
        if (bean) counts[id].name = bean.name;
      });
    }
    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return sorted[0]?.name ?? null;
  }, [brews, beans]);

  const favouriteMethod = useMemo(() => {
    if (!brews || brews.length === 0) return null;
    const counts: Record<string, number> = {};
    brews.forEach((b: DbBrew) => {
      counts[b.brew_type] = (counts[b.brew_type] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
  }, [brews]);

  const initial = (displayProfile?.display_name ?? displayProfile?.username ?? '?')[0].toUpperCase();

  if (profileLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const renderBrewThumb = ({ item }: { item: DbBrew }) => (
    <Pressable
      style={[styles.thumbWrap, { backgroundColor: colors.bgCard2 }]}
      onPress={() => router.push(`/brew/${item.id}`)}
    >
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.thumbImage} />
      ) : (
        <LinearGradient
          colors={[colors.accent, colors.accentSoft]}
          style={styles.thumbImage}
        >
          <Text style={styles.thumbFallback}>{item.brew_type[0].toUpperCase()}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header row with edit button */}
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Profile</Text>
          {!editing ? (
            <Pressable onPress={startEditing} style={styles.editBtn}>
              <Text style={[styles.editBtnText, { color: colors.accent }]}>Edit</Text>
            </Pressable>
          ) : (
            <View style={styles.editActions}>
              <Pressable onPress={() => setEditing(false)}>
                <Text style={[styles.editBtnText, { color: colors.textSub }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveEdits} style={styles.saveBtn}>
                <Text style={[styles.saveBtnText, { color: '#fff' }]}>Save</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Avatar + Info */}
        <View style={styles.profileHeader}>
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
                <Text style={[styles.bioText, { color: colors.text }]}>{displayProfile.bio}</Text>
              ) : null}
              {displayProfile?.location ? (
                <Text style={[styles.locationText, { color: colors.textFaint }]}>
                  {displayProfile.location}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <Pressable style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {profile?.brew_count ?? brews?.length ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>brews</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {profile?.following_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>following</Text>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Pressable style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {profile?.follower_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>followers</Text>
          </Pressable>
        </View>

        {/* Segmented tabs */}
        <View style={[styles.tabRow, { borderColor: colors.border }]}>
          {(['brews', 'setup', 'about'] as Tab[]).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? colors.accent : colors.textFaint },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'brews' && (
          <View style={styles.tabContent}>
            {brewsLoading ? (
              <ActivityIndicator color={colors.accent} style={styles.tabLoader} />
            ) : !brews || brews.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textFaint }]}>
                No brews yet. Start logging!
              </Text>
            ) : (
              <FlatList
                data={brews}
                keyExtractor={(item) => item.id}
                renderItem={renderBrewThumb}
                numColumns={2}
                columnWrapperStyle={styles.thumbRow}
                scrollEnabled={false}
                contentContainerStyle={styles.thumbGrid}
              />
            )}
          </View>
        )}

        {activeTab === 'setup' && (
          <View style={styles.tabContent}>
            <View style={styles.setupGrid}>
              <View style={styles.setupCardWrap}>
                <SetupCard
                  category="Machine"
                  name={activeMachine?.name ?? 'No machine'}
                  detail={activeMachine?.brand ?? 'Add one in settings'}
                  emoji="☕"
                  bgColor={colors.machBg}
                  dotColor="#5B9BD5"
                />
              </View>
              <View style={styles.setupGap} />
              <View style={styles.setupCardWrap}>
                <SetupCard
                  category="Grinder"
                  name={activeGrinder?.name ?? 'No grinder'}
                  detail={activeGrinder?.brand ?? 'Add one in settings'}
                  emoji="⚙️"
                  bgColor={colors.grindBg}
                  dotColor="#D57B5B"
                />
              </View>
            </View>
            {beans && beans.length > 0 && (
              <View style={styles.beanSection}>
                <Text style={[styles.subHeading, { color: colors.text }]}>Beans</Text>
                {beans.map((bean: DbBean) => (
                  <View
                    key={bean.id}
                    style={[styles.beanRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                  >
                    <View style={[styles.beanDot, { backgroundColor: bean.color || colors.accent }]} />
                    <View style={styles.beanInfo}>
                      <Text style={[styles.beanName, { color: colors.text }]}>{bean.name}</Text>
                      <Text style={[styles.beanRoaster, { color: colors.textSub }]}>{bean.roaster}</Text>
                    </View>
                    <Text style={[styles.beanStock, { color: colors.textFaint }]}>
                      {bean.stock_grams}g
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            {displayProfile?.bio ? (
              <View style={styles.aboutItem}>
                <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>BIO</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>{displayProfile.bio}</Text>
              </View>
            ) : null}
            {displayProfile?.location ? (
              <View style={styles.aboutItem}>
                <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>LOCATION</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>{displayProfile.location}</Text>
              </View>
            ) : null}
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>MEMBER SINCE</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>
                {displayProfile?.created_at ? formatDate(displayProfile.created_at) : 'Unknown'}
              </Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>TOTAL BREWS</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>
                {profile?.brew_count ?? brews?.length ?? 0}
              </Text>
            </View>
            {favouriteBean && (
              <View style={styles.aboutItem}>
                <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>FAVOURITE BEAN</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>{favouriteBean}</Text>
              </View>
            )}
            {favouriteMethod && (
              <View style={styles.aboutItem}>
                <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>FAVOURITE METHOD</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>
                  {favouriteMethod.charAt(0).toUpperCase() + favouriteMethod.slice(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Sign out */}
        <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={[styles.signOutText, { color: colors.textFaint }]}>Sign Out</Text>
        </Pressable>

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

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingTop: 8,
    paddingBottom: 12,
  },
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: LetterSpacing.display,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveBtn: {
    backgroundColor: '#B8762E',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
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
    fontSize: 24,
    letterSpacing: LetterSpacing.display,
    marginBottom: 2,
  },
  username: {
    fontFamily: Fonts.body,
    fontSize: 14,
    marginBottom: 8,
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
    fontSize: 12,
  },

  // Edit fields
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

  // Stats
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
    fontSize: 18,
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

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.gutter,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.uppercase,
  },

  // Tab content
  tabContent: {
    paddingHorizontal: Spacing.gutter,
    minHeight: 200,
  },
  tabLoader: {
    marginTop: 40,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },

  // Brew grid
  thumbGrid: {
    gap: THUMB_GAP,
  },
  thumbRow: {
    gap: THUMB_GAP,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbFallback: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: '#FFFFFF',
  },

  // Setup tab
  setupGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  setupCardWrap: {
    flex: 1,
  },
  setupGap: {
    width: 10,
  },
  beanSection: {
    marginTop: 8,
  },
  subHeading: {
    fontFamily: Fonts.display,
    fontSize: 18,
    letterSpacing: LetterSpacing.display,
    marginBottom: 10,
  },
  beanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginBottom: 8,
  },
  beanDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  beanInfo: {
    flex: 1,
  },
  beanName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  beanRoaster: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  beanStock: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },

  // About tab
  aboutItem: {
    marginBottom: 18,
  },
  aboutLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: LetterSpacing.uppercase,
    marginBottom: 4,
  },
  aboutValue: {
    fontFamily: Fonts.body,
    fontSize: 15,
  },

  // Sign out
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 24,
  },
  signOutText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },

  bottomSpacer: {
    height: 80,
  },
});
