import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/services/supabase';
import { hapticLight } from '../src/services/device';
import { Fonts, Spacing } from '../src/constants/theme';
import type { NotificationWithActor } from '../src/types/database';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function notificationText(n: NotificationWithActor): string {
  const name = n.actor.display_name || n.actor.username;
  switch (n.type) {
    case 'like':
      return `${name} liked your brew`;
    case 'comment':
      return `${name} commented on your brew`;
    case 'follow':
      return `${name} started following you`;
    case 'mention':
      return `${name} mentioned you`;
    default:
      return `${name} interacted with you`;
  }
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:users!actor_id(id, username, display_name, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data as NotificationWithActor[]);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    hapticLight();
  }, [user]);

  const handlePress = useCallback(
    (n: NotificationWithActor) => {
      if (!n.read) markRead(n.id);
      if (n.type === 'follow') {
        router.push(`/user/${n.actor_id}` as any);
      } else if (n.brew_id) {
        router.push(`/brew/${n.brew_id}` as any);
      }
    },
    [markRead, router],
  );

  const hasUnread = notifications.some((n) => !n.read);

  const renderItem = useCallback(
    ({ item }: { item: NotificationWithActor }) => (
      <Pressable
        onPress={() => handlePress(item)}
        style={[
          styles.row,
          { backgroundColor: item.read ? 'transparent' : colors.bgCard2 },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
          <Text style={styles.avatarText}>
            {(item.actor.display_name || item.actor.username || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowText, { color: colors.text }]} numberOfLines={2}>
            {notificationText(item)}
          </Text>
          <Text style={[styles.rowTime, { color: colors.textFaint }]}>
            {relativeTime(item.created_at)}
          </Text>
        </View>
      </Pressable>
    ),
    [handlePress, colors],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>{'\u2190'}</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        {hasUnread && (
          <Pressable onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={[styles.markAllText, { color: colors.accent }]}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textFaint }]}>
              No notifications yet
            </Text>
          </View>
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 22,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: Fonts.bodySemiBold,
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 12,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
    color: '#fff',
  },
  rowContent: {
    flex: 1,
  },
  rowText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    lineHeight: 19,
  },
  rowTime: {
    fontSize: 11,
    fontFamily: Fonts.body,
    marginTop: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: Fonts.body,
  },
  emptyList: {
    flex: 1,
  },
});
