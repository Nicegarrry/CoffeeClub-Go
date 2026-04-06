import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/hooks/useAuth';
import { useLike } from '../../src/hooks/useLikes';
import { supabase } from '../../src/services/supabase';
import { Fonts, Spacing, Radius, LetterSpacing, Elevation } from '../../src/constants/theme';
import type { BrewWithDetails } from '../../src/types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;

function formatTime(seconds: number | null): string {
  if (seconds == null) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StarDisplay({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 3; i++) {
    stars.push(
      <Text key={i} style={styles.star}>
        {i <= rating ? '\u2605' : '\u2606'}
      </Text>,
    );
  }
  return <View style={styles.starsRow}>{stars}</View>;
}

export default function BrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isLiked, likeCount, toggle: toggleLike } = useLike(id!);

  const [brew, setBrew] = useState<BrewWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('cc_brews')
        .select(
          '*, user:cc_users(id, username, display_name, avatar_url), bean:cc_beans(id, name, roaster, color), machine:cc_machines(id, name), grinder:cc_grinders(id, name)',
        )
        .eq('id', id)
        .single();
      if (data) {
        setBrew(data as unknown as BrewWithDetails);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Brew', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('cc_brews').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }, [id]);

  const isOwn = brew?.user_id === user?.id;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!brew) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingWrap}>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backText, { color: colors.accent }]}>Back</Text>
          </Pressable>
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>Brew not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const beanColor = brew.bean?.color ?? colors.accent;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero photo */}
        <View style={styles.heroWrap}>
          {brew.photo_url ? (
            <Image source={{ uri: brew.photo_url }} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={[beanColor, colors.bgCard2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroImage}
            >
              <Text style={styles.heroFallback}>
                {brew.brew_type[0].toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          {/* Back button overlay */}
          <Pressable
            onPress={() => router.back()}
            style={styles.heroBackBtn}
          >
            <Text style={styles.heroBackText}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Brew name */}
          <Text style={[styles.brewName, { color: colors.text }]}>{brew.name}</Text>

          {/* Author row */}
          <Pressable
            style={styles.authorRow}
            onPress={() => router.push(`/user/${brew.user.id}`)}
          >
            {brew.user.avatar_url ? (
              <Image source={{ uri: brew.user.avatar_url }} style={styles.authorAvatar} />
            ) : (
              <View style={[styles.authorAvatar, styles.authorAvatarFallback, { backgroundColor: colors.accent }]}>
                <Text style={styles.authorAvatarText}>
                  {(brew.user.display_name ?? brew.user.username)[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {brew.user.display_name}
              </Text>
              <Text style={[styles.authorHandle, { color: colors.textSub }]}>
                @{brew.user.username} · {relativeTime(brew.created_at)}
              </Text>
            </View>
          </Pressable>

          {/* Rating */}
          <StarDisplay rating={brew.rating} />

          {/* Details grid */}
          <View style={[styles.detailsGrid, { borderColor: colors.border }]}>
            <View style={styles.detailRow}>
              <View style={styles.detailCell}>
                <Text style={[styles.detailLabel, { color: colors.textFaint }]}>TYPE</Text>
                <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.pillText, { color: colors.accent }]}>
                    {brew.brew_type}
                  </Text>
                </View>
              </View>
              <View style={styles.detailCell}>
                <Text style={[styles.detailLabel, { color: colors.textFaint }]}>DOSE</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {brew.dose_in_grams != null ? `${brew.dose_in_grams}g in` : '--'}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailCell}>
                <Text style={[styles.detailLabel, { color: colors.textFaint }]}>YIELD</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {brew.yield_out_grams != null ? `${brew.yield_out_grams}g out` : '--'}
                </Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={[styles.detailLabel, { color: colors.textFaint }]}>TIME</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatTime(brew.brew_time_seconds)}
                </Text>
              </View>
            </View>
            {brew.grind_setting && (
              <View style={styles.detailRow}>
                <View style={styles.detailCell}>
                  <Text style={[styles.detailLabel, { color: colors.textFaint }]}>GRIND</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {brew.grind_setting}
                  </Text>
                </View>
                <View style={styles.detailCell} />
              </View>
            )}
          </View>

          {/* Bean */}
          {brew.bean && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>BEAN</Text>
              <View style={[styles.beanPill, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={[styles.beanDot, { backgroundColor: brew.bean.color || colors.accent }]} />
                <View>
                  <Text style={[styles.beanName, { color: colors.text }]}>{brew.bean.name}</Text>
                  <Text style={[styles.beanRoaster, { color: colors.textSub }]}>{brew.bean.roaster}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Machine & Grinder */}
          {(brew.machine || brew.grinder) && (
            <View style={styles.section}>
              {brew.machine && (
                <Text style={[styles.equipmentText, { color: colors.textSub }]}>
                  Machine: {brew.machine.name}
                </Text>
              )}
              {brew.grinder && (
                <Text style={[styles.equipmentText, { color: colors.textSub }]}>
                  Grinder: {brew.grinder.name}
                </Text>
              )}
            </View>
          )}

          {/* Tasting notes */}
          {brew.tasting_notes && brew.tasting_notes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textFaint }]}>TASTING NOTES</Text>
              <View style={styles.chipRow}>
                {brew.tasting_notes.map((note, idx) => (
                  <View key={idx} style={[styles.chip, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.chipText, { color: colors.accent }]}>{note}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Like button */}
          <View style={styles.likeRow}>
            <Pressable onPress={toggleLike} style={styles.likeBtn}>
              <Text style={[styles.likeIcon, { color: isLiked ? '#E05050' : colors.textFaint }]}>
                {isLiked ? '\u2665' : '\u2661'}
              </Text>
            </Pressable>
            <Text style={[styles.likeCount, { color: colors.textSub }]}>
              {likeCount ?? 0}
            </Text>
          </View>

          {/* Own brew actions */}
          {isOwn && (
            <View style={styles.ownActions}>
              <Pressable
                style={[styles.actionBtn, { borderColor: colors.border }]}
                onPress={() => {
                  // Edit is a placeholder -- would open an edit modal/screen
                  Alert.alert('Edit', 'Edit functionality coming soon.');
                }}
              >
                <Text style={[styles.actionBtnText, { color: colors.accent }]}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={handleDelete}
              >
                <Text style={[styles.actionBtnText, { color: '#E05050' }]}>Delete</Text>
              </Pressable>
            </View>
          )}
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
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  backText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },

  // Hero
  heroWrap: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallback: {
    fontFamily: Fonts.display,
    fontSize: 64,
    color: 'rgba(255,255,255,0.4)',
  },
  heroBackBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  heroBackText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },

  // Content
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: 20,
  },
  brewName: {
    fontFamily: Fonts.display,
    fontSize: 28,
    letterSpacing: LetterSpacing.display,
    marginBottom: 12,
  },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  authorAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  authorHandle: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },

  // Stars
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 16,
  },
  star: {
    color: '#F4D060',
    fontSize: 22,
  },

  // Details grid
  detailsGrid: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 14,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailCell: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: LetterSpacing.uppercase,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    textTransform: 'capitalize',
  },

  // Bean
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: LetterSpacing.uppercase,
    marginBottom: 8,
  },
  beanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  beanDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  beanName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  beanRoaster: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },

  // Equipment
  equipmentText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginBottom: 4,
  },

  // Tasting notes
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
  },

  // Like
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  likeBtn: {
    padding: 4,
  },
  likeIcon: {
    fontSize: 28,
  },
  likeCount: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
  },

  // Own actions
  ownActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deleteBtn: {
    borderColor: '#E05050',
  },
  actionBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },

  bottomSpacer: {
    height: 60,
  },
});
