import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCard } from '@/components/BookCard';
import { useBooks } from '@/hooks/useLekhoni';
import { toUiBook } from '@/lib/adapters';
import { useResponsive } from '@/hooks/useResponsive';
import { useColors } from '@/hooks/useColors';
import { useLibrary } from '@/context/LibraryContext';
import { useDisplay } from '@/context/DisplayContext';

const filters = ['ডাউনলোড', 'অডিও', 'ফেভারিট', 'ইতিহাস'];

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const numColumns = isTablet ? 2 : 1;
  const [active, setActive] = useState('ডাউনলোড');
  const { downloadedIds, savedIds, historyIds, toggleSaved } = useLibrary();
  const { compactCards } = useDisplay();
  const { data: apiBooks } = useBooks();
  const liveById = new Map((apiBooks ?? []).map((b) => [b.id, toUiBook(b)]));
  const ids = active === 'ডাউনলোড' ? downloadedIds : active === 'ফেভারিট' ? savedIds : active === 'ইতিহাস' ? historyIds : [];
  const visibleBooks = useMemo(() => {
    if (active === 'ইতিহাস') {
      // historyIds is most-recent-first; preserve that order.
      return ids.map((id) => liveById.get(id)).filter((b): b is NonNullable<typeof b> => Boolean(b));
    }
    return [...liveById.values()].filter((book) => ids.includes(book.id));
  }, [ids, liveById, active]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Feather name="arrow-left" size={23} color={colors.primary} /></Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>লাইব্রেরি</Text>
        <View style={{ width: 23 }} />
      </View>
      <View style={[styles.filterBar, { backgroundColor: colors.muted }]}>
        {filters.map((filter) => <Pressable key={filter} onPress={() => setActive(filter)} style={[styles.filter, active === filter && { backgroundColor: colors.card }]}><Text style={[styles.filterText, { color: active === filter ? colors.primary : colors.mutedForeground }]}>{filter}</Text></Pressable>)}
      </View>
      {visibleBooks.length ? (
        <FlatList
          data={visibleBooks}
          key={`library-list-${numColumns}`}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { gap: 10 } : undefined}
          contentContainerStyle={{ padding: 18, paddingBottom: Platform.OS === 'web' ? 105 : 90, gap: 10 }}
          renderItem={({ item }) => <BookCard book={item} compact={compactCards} onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.id } })} onSave={() => toggleSaved(item.id)} saved={savedIds.includes(item.id)} />}
        />
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}><Feather name={active === 'অডিও' ? 'headphones' : 'download'} size={33} color={colors.primary} /></View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>কোনো {active.toLowerCase()}কৃত ধারাবাহিক নেই!</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>অনুগ্রহ করে আপনার পছন্দমতো বই যুক্ত করুন।</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontFamily: 'serif', fontSize: 21, fontWeight: '700' },
  filterBar: { marginHorizontal: 18, padding: 4, borderRadius: 28, flexDirection: 'row', justifyContent: 'space-between' },
  filter: { paddingVertical: 11, paddingHorizontal: 12, borderRadius: 23, minWidth: 70, alignItems: 'center' },
  filterText: { fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100, paddingHorizontal: 30 },
  emptyIcon: { width: 73, height: 73, borderRadius: 37, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: 'serif', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 23 },
});