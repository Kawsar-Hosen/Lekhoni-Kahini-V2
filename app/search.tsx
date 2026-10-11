import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppText';
import { useBooks } from '@/hooks/useLekhoni';
import { coverSource, fallbackCover, toUiBook } from '@/lib/adapters';
import { bookViews } from '@/lib/api';
import { addSearchTerm, getSearchHistory } from '@/lib/storage';
import type { Book } from '@/data/books';
import { useColors } from '@/hooks/useColors';
import { useResponsive } from '@/hooks/useResponsive';

type LiveBook = Book;

function buildSearchCategories(books: LiveBook[]) {
  const romanticBooks = books.filter((book) => book.genre === 'রোমান্টিক');
  const coverAt = (index: number) => books[index]?.cover ?? fallbackCover(`search-${index}`);
  return [
    {
      title: 'রোমান্টিক (পর্ব)',
      count: `${romanticBooks.length}টি বই`,
      filter: 'genre' as const,
      value: 'রোমান্টিক',
      cover: coverAt(0),
    },
    {
      title: 'রোমান্টিক (অডিও)',
      count: `${Math.min(romanticBooks.length, 3)}টি বই`,
      filter: 'genre' as const,
      value: 'রোমান্টিক',
      cover: coverAt(1),
    },
    {
      title: 'নতুন বই',
      count: `${books.filter((book) => book.status === 'নতুন').length}টি বই`,
      filter: 'status' as const,
      value: 'নতুন',
      cover: coverAt(4),
    },
  ];
}

function buildPopularSearches(books: LiveBook[]): string[] {
  const picks = [books[2]?.title, books[4]?.title, books[5]?.title, books[0]?.title, books[1]?.author, books[3]?.title, books[4]?.author, books[5]?.author, books[2]?.author].filter((v): v is string => Boolean(v));
  return [...picks, 'উপন্যাস'].slice(0, 10);
}

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: apiBooks } = useBooks();
  const liveBooks = apiBooks ?? [];
  const books = liveBooks.map(toUiBook);
  const searchCategories = buildSearchCategories(books);
  const popularSearches = buildPopularSearches(books);
  const weeklyBooks = [...liveBooks].sort((a, b) => bookViews(b) - bookViews(a)).slice(0, 3).map(toUiBook);
  const { width: screenWidth } = useResponsive();
  const categoryCardWidth = Math.min(202, Math.round(screenWidth * 0.56));
  type SearchCategory = (typeof searchCategories)[number];
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    void getSearchHistory().then(setRecentSearches);
  }, []);

  const submitSearch = () => {
    if (!query.trim()) return;
    void addSearchTerm(query).then(setRecentSearches);
  };
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory | null>(null);
  const searchTerm = query.trim().toLocaleLowerCase();
  const results = useMemo(() => {
    if (searchTerm) {
      return books.filter((book) =>
        `${book.title} ${book.author} ${book.genre}`.toLocaleLowerCase().includes(searchTerm),
      );
    }
    if (selectedCategory?.filter === 'genre') {
      return books.filter((book) => book.genre === selectedCategory.value);
    }
    if (selectedCategory?.filter === 'status') {
      return books.filter((book) => book.status === selectedCategory.value);
    }
    return [];
  }, [searchTerm, selectedCategory, books]);
  const showResults = Boolean(searchTerm || selectedCategory);

  const choosePopularSearch = (term: string) => {
    setSelectedCategory(null);
    setQuery(term);
  };

  const chooseCategory = (category: SearchCategory) => {
    setQuery('');
    setSelectedCategory(category);
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior="padding">
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            testID="search-back"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="ফিরে যান"
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color={colors.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>খুঁজুন</Text>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
        >

          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={21} color={colors.mutedForeground} />
            <TextInput
              testID="book-search-input"
              value={query}
              onChangeText={(value) => {
                setSelectedCategory(null);
                setQuery(value);
              }}
              placeholder="বই, লেখক বা ধরন খুঁজুন"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="search"
              autoCorrect={false}
              onSubmitEditing={submitSearch}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
            <View style={styles.micButton} accessibilityLabel="ভয়েস সার্চ পরে যোগ হবে">
              <Feather name="mic" size={21} color={colors.primary} />
            </View>
          </View>

          {!showResults ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRail}
              >
                {searchCategories.map((category) => {
                  const active = selectedCategory?.title === category.title;
                  return (
                    <Pressable
                      key={category.title}
                      testID={`search-category-${category.title}`}
                      onPress={() => chooseCategory(category)}
                      style={[
                        styles.categoryCard,
                        { width: categoryCardWidth, backgroundColor: active ? colors.accent : colors.secondary, borderColor: colors.border },
                      ]}
                    >
                      <Image source={category.cover} resizeMode="cover" style={styles.categoryCover} />
                      <View style={styles.categoryCopy}>
                        <Text numberOfLines={1} style={[styles.categoryTitle, { color: colors.foreground }]}>{category.title}</Text>
                        <Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>{category.count}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {recentSearches.length ? (
                <>
                  <View style={styles.sectionHeading}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>সাম্প্রতিক খোঁজ</Text>
                  </View>
                  <View style={styles.popularSearches}>
                    {recentSearches.map((term, index) => (
                      <Pressable
                        key={`recent-${term}-${index}`}
                        testID={`recent-search-${index}`}
                        onPress={() => choosePopularSearch(term)}
                        style={({ pressed }) => [
                          styles.searchChip,
                          { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.72 : 1 },
                        ]}
                      >
                        <Feather name="clock" size={15} color={colors.mutedForeground} />
                        <Text numberOfLines={1} style={[styles.searchChipText, { color: colors.foreground }]}>{term}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
              <View style={styles.sectionHeading}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>জনপ্রিয় অনুসন্ধান</Text>
              </View>
              <View style={styles.popularSearches}>
                {popularSearches.map((term, index) => (
                  <Pressable
                    key={`${term}-${index}`}
                    testID={`popular-search-${index}`}
                    onPress={() => choosePopularSearch(term)}
                    style={({ pressed }) => [
                      styles.searchChip,
                      { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.72 : 1 },
                    ]}
                  >
                    <Feather name="trending-up" size={15} color={colors.mutedForeground} />
                    <Text numberOfLines={1} style={[styles.searchChipText, { color: colors.foreground }]}>{term}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.sectionHeading, styles.weekHeading]}>
                <View style={[styles.sectionMark, { backgroundColor: colors.primary }]} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>এই সপ্তাহে জনপ্রিয়</Text>
              </View>
              <View style={styles.resultsList}>
                {weeklyBooks.map((book, index) => (
                  <BookSearchResult key={book.id} book={book} index={index} colors={colors} />
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={[styles.sectionHeading, styles.resultsHeading]}>
                <View style={[styles.sectionMark, { backgroundColor: colors.primary }]} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {selectedCategory?.title ?? 'অনুসন্ধানের ফলাফল'}
                </Text>
                <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>{results.length}টি</Text>
              </View>
              {results.length ? (
                <View style={styles.resultsList}>
                  {results.map((book, index) => <BookSearchResult key={book.id} book={book} index={index} colors={colors} />)}
                </View>
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="search" size={26} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>কোনো বই পাওয়া যায়নি</Text>
                  <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>অন্য কোনো বই, লেখক বা ধরন দিয়ে খুঁজে দেখুন</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function BookSearchResult({ book, index, colors }: { book: Book; index: number; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      testID={`search-result-${book.id}`}
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}
      style={({ pressed }) => [
        styles.resultCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <Image source={book.cover} resizeMode="cover" style={styles.resultCover} />
      <View style={styles.resultCopy}>
        <Text numberOfLines={2} style={[styles.resultTitle, { color: colors.foreground }]}>বই: {book.title}</Text>
        <Text numberOfLines={1} style={[styles.resultAuthor, { color: colors.mutedForeground }]}>লেখক: {book.author}</Text>
        <View style={styles.resultTags}>
          <Text style={[styles.resultTag, { backgroundColor: colors.sky, color: colors.skyText }]}>পর্ব</Text>
          <Text style={[styles.resultTag, { backgroundColor: colors.secondary, color: colors.primary }]}>{book.genre}</Text>
          <Text style={[styles.resultTag, { backgroundColor: colors.success, color: colors.successText }]}>{book.status}</Text>
        </View>
        <Text style={[styles.resultDate, { color: colors.mutedForeground }]}>{index === 0 ? 'এই সপ্তাহে জনপ্রিয়' : 'পাঠকদের পছন্দের গল্প'}</Text>
      </View>
      <View style={styles.resultViews}>
        <Feather name="eye" size={15} color={colors.mutedForeground} />
        <Text style={[styles.resultViewCount, { color: colors.mutedForeground }]}>{book.readers}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 20 },
  backButton: { width: 32, height: 42, justifyContent: 'center' },
  headerTitle: { fontSize: 21, fontWeight: '700' },
  searchBar: { minHeight: 58, borderWidth: 1, borderRadius: 30, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 9 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 9, fontSize: 15 },
  micButton: { width: 28, height: 34, alignItems: 'center', justifyContent: 'center' },
  categoryRail: { paddingTop: 18, paddingBottom: 3, gap: 12 },
  categoryCard: { width: 202, minHeight: 66, borderWidth: 1, borderRadius: 15, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryCover: { width: 44, height: 50, borderRadius: 9 },
  categoryCopy: { flex: 1, minWidth: 0 },
  categoryTitle: { fontSize: 13, fontWeight: '600' },
  categoryCount: { fontSize: 10, marginTop: 3 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 12 },
  sectionMark: { width: 4, height: 21, borderRadius: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  popularSearches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  searchChip: { minHeight: 39, borderWidth: 1, borderRadius: 22, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  searchChipText: { fontSize: 13 },
  weekHeading: { marginTop: 25, marginBottom: 10 },
  resultsHeading: { marginTop: 20 },
  resultCount: { fontSize: 12 },
  resultsList: { gap: 9 },
  resultCard: { minHeight: 151, borderWidth: 1, borderRadius: 17, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultCover: { width: 82, height: 132, borderRadius: 10 },
  resultCopy: { flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center', gap: 5 },
  resultTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  resultAuthor: { fontSize: 11 },
  resultTags: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 1 },
  resultTag: { overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9 },
  resultDate: { fontSize: 10, marginTop: 1 },
  resultViews: { position: 'absolute', right: 10, bottom: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultViewCount: { fontSize: 10 },
  emptyState: { minHeight: 200, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 22, marginTop: 9 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyBody: { textAlign: 'center', fontSize: 12, lineHeight: 19, marginTop: 5 },
});