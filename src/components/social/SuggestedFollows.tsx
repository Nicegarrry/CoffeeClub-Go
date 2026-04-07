import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Fonts, Radius, Spacing } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { hapticSelection } from '../../services/device';
import type { DbUser } from '../../types/database';

interface Props {
  visible?: boolean;
}

interface SuggestedUser extends Pick<DbUser, 'id' | 'username' | 'display_name' | 'avatar_url'> {
  reason: string;
}

export default function SuggestedFollows({ visible = true }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Get current user's brews to find their beans and methods
        const { data: myBrews } = await supabase
          .from('brews')
          .select('bean_id, brew_type')
          .eq('user_id', user.id)
          .limit(20);

        if (cancelled || !myBrews?.length) {
          setLoading(false);
          return;
        }

        const myBeanIds = [...new Set(myBrews.map((b) => b.bean_id).filter(Boolean))] as string[];
        const myMethods = [...new Set(myBrews.map((b) => b.brew_type).filter(Boolean))];

        // Get who current user already follows
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const alreadyFollowing = new Set((following ?? []).map((f) => f.following_id));
        alreadyFollowing.add(user.id);

        // Find users with matching beans or methods
        const { data: matchingBrews } = await supabase
          .from('brews')
          .select('user_id, bean_id, brew_type, bean:beans(name)')
          .eq('is_public', true)
          .not('user_id', 'in', `(${[...alreadyFollowing].join(',')})`)
          .limit(50);

        if (cancelled || !matchingBrews?.length) {
          setLoading(false);
          return;
        }

        // Score users by overlap
        const userScores = new Map<string, { score: number; reason: string }>();

        for (const brew of matchingBrews) {
          const uid = brew.user_id;
          if (alreadyFollowing.has(uid)) continue;

          const existing = userScores.get(uid) ?? { score: 0, reason: '' };

          if (brew.bean_id && myBeanIds.includes(brew.bean_id)) {
            const beanName = (brew.bean as any)?.name ?? 'the same beans';
            existing.score += 2;
            if (!existing.reason) {
              existing.reason = `Also loves ${beanName} on ${brew.brew_type}`;
            }
          } else if (myMethods.includes(brew.brew_type)) {
            existing.score += 1;
            if (!existing.reason) {
              existing.reason = `Also brews ${brew.brew_type}`;
            }
          }

          if (existing.score > 0) {
            userScores.set(uid, existing);
          }
        }

        // Get top 5 user IDs
        const topIds = [...userScores.entries()]
          .sort((a, b) => b[1].score - a[1].score)
          .slice(0, 5)
          .map(([id]) => id);

        if (cancelled || topIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch user profiles
        const { data: profiles } = await supabase
          .from('users')
          .select('id, username, display_name, avatar_url')
          .in('id', topIds);

        if (cancelled) return;

        const result: SuggestedUser[] = (profiles ?? []).map((p) => ({
          ...p,
          reason: userScores.get(p.id)?.reason ?? 'Similar taste',
        }));

        setSuggestions(result);
      } catch (err) {
        console.error('SuggestedFollows error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible, user]);

  const handleFollow = useCallback(async (targetId: string) => {
    if (!user) return;
    hapticSelection();

    const isFollowed = followedIds.has(targetId);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (isFollowed) next.delete(targetId);
      else next.add(targetId);
      return next;
    });

    try {
      if (isFollowed) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
      }
    } catch (err) {
      console.error('SuggestedFollows follow error:', err);
      // Revert
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (isFollowed) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
    }
  }, [user, followedIds]);

  if (!visible || loading || suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {suggestions.map((s) => {
        const isFollowed = followedIds.has(s.id);
        return (
          <View key={s.id} style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.bgCard2 }]}>
              <Text style={[styles.avatarLetter, { color: colors.accent }]}>
                {(s.display_name || s.username)?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
              {s.display_name || s.username}
            </Text>
            <Text style={[styles.username, { color: colors.textSub }]} numberOfLines={1}>
              @{s.username}
            </Text>
            <Text style={[styles.reason, { color: colors.textFaint }]} numberOfLines={2}>
              {s.reason}
            </Text>
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowed
                  ? { backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }
                  : { backgroundColor: colors.accent },
              ]}
              activeOpacity={0.7}
              onPress={() => handleFollow(s.id)}
            >
              <Text style={[styles.followText, { color: isFollowed ? colors.textSub : '#fff' }]}>
                {isFollowed ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    gap: 10,
  },
  card: {
    width: 160,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarLetter: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  displayName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  username: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 1,
    textAlign: 'center',
  },
  reason: {
    fontFamily: Fonts.body,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 15,
  },
  followBtn: {
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 10,
  },
  followText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
});
