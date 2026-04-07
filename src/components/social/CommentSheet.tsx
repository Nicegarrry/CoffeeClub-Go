import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { hapticLight } from '../../services/device';
import { Fonts, Spacing } from '../../constants/theme';
import type { CommentWithUser } from '../../types/database';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

interface Props {
  brewId: string;
  visible: boolean;
  onClose: () => void;
}

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

export default function CommentSheet({ brewId, visible, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(SCREEN_HEIGHT - SHEET_HEIGHT, {
        damping: 22,
        stiffness: 200,
        mass: 0.8,
      });
      fetchComments();
    } else {
      overlayOpacity.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 220,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, user:users(id, username, display_name, avatar_url)')
      .eq('brew_id', brewId)
      .order('created_at');
    if (data) setComments(data as CommentWithUser[]);
  }, [brewId]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !user || loading) return;
    setLoading(true);
    const body = text.trim();
    setText('');

    const { error } = await supabase
      .from('comments')
      .insert({ user_id: user.id, brew_id: brewId, body });

    if (!error) {
      // Create notification for brew owner (skip if commenting on own brew)
      const { data: brew } = await supabase
        .from('brews')
        .select('user_id')
        .eq('id', brewId)
        .single();

      if (brew && brew.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: brew.user_id,
          type: 'comment',
          actor_id: user.id,
          brew_id: brewId,
          read: false,
        });
      }

      await fetchComments();
      hapticLight();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setLoading(false);
  }, [text, user, loading, brewId, fetchComments]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

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

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Comments</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeText, { color: colors.textSub }]}>{'\u2715'}</Text>
          </Pressable>
        </View>

        {/* Comment list */}
        <ScrollView
          ref={scrollRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {comments.length === 0 && (
            <Text style={[styles.empty, { color: colors.textFaint }]}>No comments yet</Text>
          )}
          {comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
                <Text style={styles.avatarText}>
                  {(c.user.display_name || c.user.username || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.commentBody}>
                <Text style={[styles.username, { color: colors.text }]}>
                  {c.user.display_name || c.user.username}
                </Text>
                <Text style={[styles.body, { color: colors.textSub }]}>{c.body}</Text>
                <Text style={[styles.time, { color: colors.textFaint }]}>
                  {relativeTime(c.created_at)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={SCREEN_HEIGHT - SHEET_HEIGHT}
        >
          <View style={[styles.inputRow, { borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.bgCard2 }]}
              value={text}
              onChangeText={setText}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textFaint}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim() || loading}
              style={[
                styles.sendBtn,
                { backgroundColor: text.trim() ? colors.accent : colors.accentSoft },
              ]}
            >
              <Text style={styles.sendText}>{'\u2191'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.gutter,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 8,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  avatarText: {
    fontSize: 11,
    fontFamily: Fonts.bodySemiBold,
    color: '#fff',
  },
  commentBody: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 1,
  },
  body: {
    fontSize: 14,
    fontFamily: Fonts.body,
    lineHeight: 19,
  },
  time: {
    fontSize: 11,
    fontFamily: Fonts.body,
    marginTop: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: Fonts.body,
    maxHeight: 80,
    marginRight: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
