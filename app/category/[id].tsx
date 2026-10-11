import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { VerifiedName } from '@/components/VerifiedName';
import { useBooks, useCategories } from '@/hooks/useLekhoni';
import { toBanglaDigits, toUiBook } from '@/lib/adapters';
import { useLibrary } from '@/context/LibraryContext';
import { useColors } from '@/hooks/useColors';

export default function CategoryBooksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: apiCategories } = useCategories();
  const { data: apiBooks } = useBooks();
  const { savedIds, toggleSaved } = useLibrary();
  const category = (apiCategories ?? []).find((c) => c.id === id);
  const books = (apiBooks ?? []).filter((b) => category && (b.category || '') === category.name).map(toUiBook);
  const topInset = insets.top;

  if (!category) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>ক্যাটাগরি পাওয়া যায়নি</Text>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>ফিরে যান</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 7 }]}>
        <Pressable testID="category-books-back" onPress={() => router.back()} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="ফিরে যান">
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.primary }]}>{category.name}</Text>
        <Pressable testID="category-books-search" onPress={() => router.push('/search')} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="খুঁজুন">
          <Feather name="search" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        testID="category-books-list"
        data={books}
        keyExtractor={(book) => book.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 105 : 92 }]}
        ListHeaderComponent={
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {toBanglaDigits(books.length)}টি বই
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="book-open" size={26} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>এই ক্যাটাগরিতে এখনো বই যোগ হয়নি</Text>
          </View>
        }
        renderItem={({ item: book }) => (
          <Pressable
            testID={`category-book-${book.id}`}
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
                <View style={[styles.tag, { backgroundColor: colors.success }]}>
                  <Text style={[styles.tagText, { color: colors.successText }]}>{book.status}</Text>
                </View>
              </View>
              <View style={styles.readerCount}>
                <Feather name="eye" size={15} color={colors.mutedForeground} />
                <Text style={[styles.bookMeta, { color: colors.mutedForeground, marginTop: 0 }]}>{book.readers}</Text>
              </View>
              <Pressable
                testID={`category-save-${book.id}`}
                onPress={() => toggleSaved(book.id)}
                hitSlop={10}
                style={styles.saveButton}
                accessibilityRole="button"
                accessibilityLabel={savedIds.includes(book.id) ? 'লাইব্রেরি থেকে সরান' : 'লাইব্রেরিতে রাখুন'}
              >
                <Feather name="bookmark" size={17} color={savedIds.includes(book.id) ? colors.primary : colors.mutedForeground} />
              </Pressable>
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
  list: { paddingHorizontal: 11, paddingTop: 4, paddingBottom: 26, gap: 7 },
  countText: { fontSize: 12, paddingHorizontal: 7, marginBottom: 2 },
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
  readerCount: { position: 'absolute', right: 1, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveButton: { position: 'absolute', right: 1, top: 0, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 14 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 18, fontWeight: '700' },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, marginTop: 16 },
  backButtonText: { fontSize: 14, fontWeight: '700' },
});
