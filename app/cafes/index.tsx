import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/hooks/useAuth';
import { useCafes } from '../../src/hooks/useCafes';
import { supabase } from '../../src/services/supabase';
import { hapticLight } from '../../src/services/device';
import { CafeCard } from '../../src/components/cafe/CafeCard';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Fonts, Radius, Spacing, Elevation, LetterSpacing } from '../../src/constants/theme';
import type { CafeWithStats } from '../../src/types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CafesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cafes, loading, refresh, search } = useCafes();

  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCafeName, setNewCafeName] = useState('');
  const [newCafeAddress, setNewCafeAddress] = useState('');
  const [newCafeDesc, setNewCafeDesc] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      search(text);
    },
    [search],
  );

  const handleCafePress = useCallback(
    (cafe: CafeWithStats) => {
      hapticLight();
      router.push(`/cafes/${cafe.id}`);
    },
    [router],
  );

  const handleAddCafe = useCallback(async () => {
    if (!user || !newCafeName.trim()) return;
    setAdding(true);
    try {
      const { error } = await supabase.from('cafes').insert({
        name: newCafeName.trim(),
        address: newCafeAddress.trim(),
        description: newCafeDesc.trim(),
        phone: '',
        website: '',
        hours_json: {},
      });
      if (error) throw error;
      hapticLight();
      setNewCafeName('');
      setNewCafeAddress('');
      setNewCafeDesc('');
      setAddModalVisible(false);
      refresh();
    } catch (err) {
      console.error('Add cafe error:', err);
    } finally {
      setAdding(false);
    }
  }, [user, newCafeName, newCafeAddress, newCafeDesc, refresh]);

  const renderItem = useCallback(
    ({ item }: { item: CafeWithStats }) => (
      <CafeCard cafe={item} onPress={() => handleCafePress(item)} />
    ),
    [handleCafePress],
  );

  const keyExtractor = useCallback((item: CafeWithStats) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Cafes</Text>
        <Pressable
          onPress={() => {
            setSearchActive((prev) => !prev);
            if (searchActive) {
              handleSearch('');
            }
          }}
          hitSlop={12}
        >
          <Text style={[styles.searchIcon, { color: colors.accent }]}>
            {searchActive ? '\u2715' : '\uD83D\uDD0D'}
          </Text>
        </Pressable>
      </View>

      {/* Search bar */}
      {searchActive && (
        <View style={[styles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search cafes..."
            placeholderTextColor={colors.textFaint}
            value={searchText}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
        </View>
      )}

      {/* Cafe list */}
      <FlatList
        data={cafes}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.list,
          cafes.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              emoji={'\u2615'}
              title="No cafes nearby"
              subtitle="Be the first to add a cafe and share it with the community"
              actionLabel="Add a cafe"
              onAction={() => setAddModalVisible(true)}
            />
          ) : null
        }
      />

      {/* FAB */}
      {cafes.length > 0 && (
        <Pressable
          onPress={() => {
            hapticLight();
            setAddModalVisible(true);
          }}
          style={[styles.fab, { shadowColor: colors.shadow }]}
        >
          <LinearGradient
            colors={['#D4A050', '#E8C97A', '#D4A050']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGradient}
          >
            <Text style={styles.fabText}>+</Text>
          </LinearGradient>
        </Pressable>
      )}

      {/* Add Cafe Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setAddModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHandle}>
              <View style={[styles.handle, { backgroundColor: colors.textFaint }]} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add a Cafe</Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
              placeholder="Cafe name"
              placeholderTextColor={colors.textFaint}
              value={newCafeName}
              onChangeText={setNewCafeName}
            />
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
              placeholder="Address"
              placeholderTextColor={colors.textFaint}
              value={newCafeAddress}
              onChangeText={setNewCafeAddress}
            />
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard2 }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textFaint}
              value={newCafeDesc}
              onChangeText={setNewCafeDesc}
              multiline
              numberOfLines={3}
            />

            <Pressable
              onPress={handleAddCafe}
              disabled={adding || !newCafeName.trim()}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={
                  newCafeName.trim()
                    ? ['#D4A050', '#E8C97A', '#D4A050']
                    : [colors.disabledAccent, colors.disabledAccent, colors.disabledAccent]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>
                  {adding ? 'Adding...' : 'Add Cafe'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    letterSpacing: LetterSpacing.display,
  },
  searchIcon: {
    fontSize: 22,
  },
  searchBar: {
    marginHorizontal: Spacing.gutter,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  searchInput: {
    fontFamily: Fonts.body,
    fontSize: 15,
    height: 42,
  },
  list: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.gutter,
    ...Elevation.fab,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: -2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 40,
    ...Elevation.sheet,
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    letterSpacing: LetterSpacing.display,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    fontFamily: Fonts.body,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  modalInputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalBtn: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
  },
});
