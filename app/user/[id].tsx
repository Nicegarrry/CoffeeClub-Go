import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useProfile } from '../../src/hooks/useProfile';
import { useFollow } from '../../src/hooks/useFollow';
import { Fonts, Spacing, Radius, LetterSpacing } from '../../src/constants/theme';
import type { DbBrew } from '../../src/types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_GAP = 4;
const THUMB_SIZE = (SCREEN_WIDTH - Spacing.gutter * 2 - THUMB_GAP) / 2;

type Tab = 'brews' | 'about';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { profile, loading } = useProfile(id);
  const { isFollowing, toggle: toggleFollow, loading: followLoading } = useFollow(id!);

  const [activeTab, setActiveTab] = useState<Tab>('brews');

  // Profile will include brews via the hook or we show what we have
  const publicBrews = useMemo(() => {
    // The profile hook may not include brews directly; we rely on what's available
    return (profile as any)?.brews?.filter((b: DbBrew) => b.is_public) ?? [];
  }, [profile]);

  const initial = (profile?.display_name ?? profile?.username ?? '?')[0].toUpperCase();

  if (loading || !profile) {
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
        {/* Header with back */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.accent }]}>Back</Text>
          </Pressable>
          <Pressable
            onPress={toggleFollow}
            disabled={followLoading}
            style={[
              styles.followBtn,
              {
                backgroundColor: isFollowing ? colors.bgCard2 : colors.accent,
                borderColor: isFollowing ? colors.border : colors.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.followBtnText,
                { color: isFollowing ? colors.textSub : '#FFFFFF' },
              ]}
            >
              {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        </View>

        {/* Avatar + Info */}
        <View style={styles.profileHeader}>
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={[styles.avatar, { borderColor: colors.accent }]}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
          <Text style={[styles.displayName, { color: colors.text }]}>
            {profile.display_name}
          </Text>
          <Text style={[styles.username, { color: colors.textSub }]}>
            @{profile.username}
          </Text>
          {profile.bio ? (
            <Text style={[styles.bioText, { color: colors.text }]}>{profile.bio}</Text>
          ) : null}
          {profile.location ? (
            <Text style={[styles.locationText, { color: colors.textFaint }]}>
              {profile.location}
            </Text>
          ) : null}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {profile.brew_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>brews</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {profile.following_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>following</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {profile.follower_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSub }]}>followers</Text>
          </View>
        </View>

        {/* Tabs (no Setup for other users) */}
        <View style={[styles.tabRow, { borderColor: colors.border }]}>
          {(['brews', 'about'] as Tab[]).map((tab) => (
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

        {activeTab === 'brews' && (
          <View style={styles.tabContent}>
            {publicBrews.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textFaint }]}>
                No public brews yet.
              </Text>
            ) : (
              <FlatList
                data={publicBrews}
                keyExtractor={(item: DbBrew) => item.id}
                renderItem={renderBrewThumb}
                numColumns={2}
                columnWrapperStyle={styles.thumbRow}
                scrollEnabled={false}
                contentContainerStyle={styles.thumbGrid}
              />
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            {profile.bio ? (
              <View style={styles.aboutItem}>
                <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>BIO</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>{profile.bio}</Text>
              </View>
            ) : null}
            {profile.location ? (
              <View style={styles.aboutItem}>
                <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>LOCATION</Text>
                <Text style={[styles.aboutValue, { color: colors.text }]}>{profile.location}</Text>
              </View>
            ) : null}
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>MEMBER SINCE</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>
                {formatDate(profile.created_at)}
              </Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={[styles.aboutLabel, { color: colors.textFaint }]}>TOTAL BREWS</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>
                {profile.brew_count ?? 0}
              </Text>
            </View>
          </View>
        )}

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
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  followBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  followBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    marginBottom: 12,
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

  bottomSpacer: {
    height: 80,
  },
});
