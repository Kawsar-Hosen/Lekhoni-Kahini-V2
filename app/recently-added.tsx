import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { VerifiedName } from '@/components/VerifiedName';
import { useBooks } from '@/hooks/useLekhoni';
import { toUiBook } from '@/lib/adapters';
import { isNewBook } from '@/lib/api';
import { useColors } from '@/hooks/useColors';

function formatAddedDate(iso?: string): string {
  const t = iso ? new Date(iso).getTime() : NaN;
  const d = Number.isNaN(t) ? new Date() : new Date(t);
  return `${d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })} - ${d.toLocaleDateString('bn-BD', { weekday: 'long' })}`;
}

export default function RecentlyAddedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: apiBooks } = useBooks();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const live = (apiBooks ?? []).filter((b) => isNewBook(b)).sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
  const source = live.length ? live : [...(apiBooks ?? [])].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()).slice(0, 10);
  const books = source.map(toUiBook);
  const dates = new Map(source.map((b) => [b.id, formatAddedDate(b.updated_at)]));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 7 }]}>
        <Pressable testID="recently-added-back" onPress={() => router.back()} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="ফিরে যান">
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Recently Added</Text>
        <Pressable testID="recently-added-search" onPress={() => router.push('/search')} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="খুঁজুন">
          <Feather name="search" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        testID="recently-added-list"
        data={books}
        keyExtractor={(book) => book.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item: book }) => (
          <Pressable
            testID={`recent-book-${book.id}`}
            onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}
            style={({ pressed }) => [
              styles.bookCard,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.84 : 1 },
            ]}
          >
            <Image source={book.cover} resizeMode="cover" style={styles.cover} />
            <View style={styles.bookInfo}>
              <Text numberOfLines={1} style={[styles.bookTitle, { color: colors.foreground }]}>বই: {book.title}</Text>
              <View style={styles.authorLine}>
                <Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>লেখক: </Text>
                <VerifiedName
                  name={book.author}
                  verified={book.verified}
                  containerStyle={styles.authorName}
                  nameStyle={[styles.bookMeta, { color: colors.mutedForeground }]}
                />
              </View>
              <View style={styles.tags}>
                <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>পর্ব</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: colors.rose }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>Recently Added</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: colors.success }]}>
                  <Text style={[styles.tagText, { color: colors.successText }]}>{book.status}</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.date, { color: colors.mutedForeground }]}>{dates.get(book.id) ?? ''}</Text>
              <View style={styles.readerCount}>
                <Feather name="eye" size={15} color={colors.mutedForeground} />
                <Text style={[styles.bookMeta, { color: colors.mutedForeground, marginTop: 0 }]}>{book.readers}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 70, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { width: 37, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'serif', fontSize: 21, fontWeight: '700' },
  list: { paddingHorizontal: 11, paddingTop: 13, paddingBottom: 26, gap: 7 },
  bookCard: { minHeight: 121, borderWidth: 1, borderRadius: 17, padding: 7, flexDirection: 'row', gap: 11 },
  cover: { width: 76, height: 106, borderRadius: 11 },
  bookInfo: { flex: 1, minWidth: 0, paddingTop: 3, paddingRight: 4 },
  bookTitle: { fontFamily: 'serif', fontSize: 15, fontWeight: '600' },
  authorLine: { flexDirection: 'row', alignItems: 'center', minWidth: 0, marginTop: 3 },
  authorName: { flex: 1 },
  bookMeta: { fontFamily: 'serif', fontSize: 12, marginTop: 2 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  tag: { minHeight: 19, borderRadius: 11, paddingHorizontal: 8, justifyContent: 'center' },
  tagText: { fontFamily: 'serif', fontSize: 10, lineHeight: 15 },
  date: { fontFamily: 'serif', fontSize: 11, marginTop: 5 },
  readerCount: { position: 'absolute', right: 1, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
});