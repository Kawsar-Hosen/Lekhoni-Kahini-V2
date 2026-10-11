import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppText';
import { VerifiedName } from '@/components/VerifiedName';
import { useBooks, useFollowedIds, useToggleFollow, useWriter } from '@/hooks/useLekhoni';
import { coverSource, formatBanglaCount, isVerifiedWriter, toBanglaDigits, toUiBook, writerBooks, writerDisplayName } from '@/lib/adapters';
import { bookLikes, bookViews } from '@/lib/api';
import { useColors } from '@/hooks/useColors';

const authorPortrait = require('@/assets/images/author-profile.png');

export default function AuthorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: writer } = useWriter(id);
  const { data: apiBooks } = useBooks();
  const { data: followed } = useFollowedIds();
  const followMutation = useToggleFollow();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const liveBooks = apiBooks ?? [];
  const authorBooks = writer ? writerBooks(liveBooks, writer) : [];
  const uiBooks = authorBooks.map(toUiBook);
  const authorVerified = writer ? isVerifiedWriter(writer) : false;
  const following = (followed ?? []).some((f) => f.id === id);
  const totalReads = authorBooks.reduce((sum, b) => sum + bookViews(b), 0);
  const authorName = writer ? writerDisplayName(writer) : '';
  const avatar = writer?.avatar_url ? { uri: writer.avatar_url } : authorPortrait;
  const likesById = new Map(liveBooks.map((b) => [b.id, bookLikes(b)]));
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconSpin = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  const animateIcon = (toOpen: boolean) => {
    Animated.timing(iconSpin, {
      toValue: toOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (searchOpen && !closing.current) {
      Animated.timing(slideAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  }, [searchOpen, slideAnim]);

  const openSearch = () => {
    closing.current = false;
    setQuery('');
    setSearchOpen(true);
    animateIcon(true);
  };
  const closeSearch = () => {
    if (closing.current) return;
    closing.current = true;
    animateIcon(false);
    Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setQuery('');
      setSearchOpen(false);
      closing.current = false;
    });
  };
  const iconRotate = iconSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  const iconScale = iconSpin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1] });
  const searchTerm = query.trim().toLocaleLowerCase();
  const visibleBooks = searchTerm
    ? uiBooks.filter((book) => `${book.title}`.toLocaleLowerCase().includes(searchTerm))
    : uiBooks;

  if (!writer) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>লেখককে খুঁজে পাওয়া যায়নি</Text>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>ফিরে যান</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          testID="author-profile-back"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="ফিরে যান"
          style={[styles.headerCircle, { backgroundColor: colors.secondary }]}
        >
          <Feather name="arrow-left" size={21} color={colors.primary} />
        </Pressable>
        <Pressable
          testID="author-profile-search"
          onPress={() => (searchOpen ? closeSearch() : openSearch())}
          accessibilityRole="button"
          accessibilityLabel="এই লেখকের বই খুঁজুন"
          style={[styles.headerCircle, { backgroundColor: searchOpen ? colors.primary : colors.secondary }]}
        >
          <Animated.View style={{ transform: [{ rotate: iconRotate }, { scale: iconScale }] }}>
            <Feather name={searchOpen ? 'x' : 'search'} size={19} color={searchOpen ? colors.primaryForeground : colors.primary} />
          </Animated.View>
        </Pressable>
      </View>
      {searchOpen ? (
        <Animated.View
          style={[
            styles.searchWrap,
            {
              opacity: slideAnim,
              transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
            },
          ]}
        >
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={19} color={colors.mutedForeground} />
            <TextInput
              testID="author-book-search-input"
              value={query}
              onChangeText={setQuery}
              placeholder={`${authorName}-এর বই খুঁজুন`}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="search"
              autoCorrect={false}
              autoFocus
              style={[styles.searchInput, { color: colors.foreground }]}
            />
            {query ? (
              <Pressable testID="author-search-clear" onPress={() => setQuery('')} hitSlop={8}>
                <Feather name="x-circle" size={18} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
            <Pressable testID="author-search-close" onPress={closeSearch} hitSlop={8}>
              <Feather name="x" size={19} color={colors.primary} />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 22 }]}
      >

        <View style={styles.heroWrap}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.heroOrbTop, { backgroundColor: colors.accent }]} />
            <View style={[styles.heroOrbBottom, { backgroundColor: colors.secondary }]} />

            <VerifiedName
              name={authorName}
              verified={authorVerified}
              badgeSize={18}
              containerStyle={styles.authorNameRow}
              nameStyle={[styles.authorName, { color: colors.foreground }]}
            />
            <Pressable
              testID="author-follow"
              onPress={() => followMutation.mutate({ writerId: id, following })}
              style={[styles.followButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.followText, { color: colors.primaryForeground }]}>
                {following ? '✓ অনুসরণ করছেন' : '+ ফলো করুন'}
              </Text>
            </Pressable>

            <Text style={[styles.bio, { color: colors.mutedForeground }]}>{writer.bio || ''}</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={[styles.stats, { borderColor: colors.border }]}>
              <ProfileStat label="প্রকাশিত" value={toBanglaDigits(String(uiBooks.length))} colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <ProfileStat label="মোট পাঠ" value={formatBanglaCount(totalReads)} colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <ProfileStat label="ফলোয়ার" value={formatBanglaCount(writer.follower_count ?? 0)} colors={colors} />
            </View>
          </View>

          <View style={[styles.avatarRing, { borderColor: colors.primary, backgroundColor: colors.card }]}>
            <Image source={avatar} resizeMode="cover" style={styles.avatar} />
          </View>
        </View>

        <View style={styles.booksHeading}>
          <View style={[styles.headingMark, { backgroundColor: colors.primary }]} />
          <Text style={[styles.booksTitle, { color: colors.foreground }]}>{authorName}-এর বই</Text>
          <Text style={[styles.booksCount, { color: colors.mutedForeground }]}>{toBanglaDigits(String(visibleBooks.length))}টি</Text>
        </View>

        {searchTerm && !visibleBooks.length ? (
          <View style={[styles.emptyBooks, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyBooksText, { color: colors.mutedForeground }]}>“{query.trim()}” নামে কোনো বই পাওয়া যায়নি</Text>
          </View>
        ) : null}

        {visibleBooks.length ? visibleBooks.map((book) => (
          <Pressable
            key={book.id}
            testID={`author-book-${book.id}`}
            onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}
            style={({ pressed }) => [
              styles.bookRow,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Image source={book.cover} resizeMode="cover" style={styles.bookCover} />
            <View style={styles.bookCopy}>
              <View style={[styles.popularPill, { backgroundColor: colors.secondary, borderColor: colors.accent }]}>
                <Feather name="star" size={12} color={colors.primary} />
                <Text style={[styles.popularText, { color: colors.primary }]}>সবচেয়ে জনপ্রিয়</Text>
              </View>
              <Text numberOfLines={1} style={[styles.bookTitle, { color: colors.foreground }]}>{book.title}</Text>
              <View style={styles.bookAuthorRow}>
                <Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>লেখক: </Text>
                <VerifiedName
                  name={book.author}
                  verified={book.verified}
                  containerStyle={styles.bookAuthorName}
                  nameStyle={[styles.bookMeta, { color: colors.mutedForeground }]}
                />
              </View>
              <Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>ধরন: {book.genre}</Text>
              <View style={styles.bookStats}>
                <Feather name="eye" size={14} color={colors.mutedForeground} />
                <Text style={[styles.bookStatText, { color: colors.mutedForeground }]}>{book.readers}</Text>
                <Feather name="thumbs-up" size={13} color={colors.mutedForeground} />
                <Text style={[styles.bookStatText, { color: colors.mutedForeground }]}>{formatBanglaCount(likesById.get(book.id) ?? 0)}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
          </Pressable>
        )) : searchTerm ? null : (
          <View style={[styles.emptyBooks, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="book-open" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyBooksText, { color: colors.mutedForeground }]}>এই লেখকের বই শিগগিরই যোগ হবে</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ProfileStat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18 },
  header: { minHeight: 70, paddingHorizontal: 18, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerCircle: { width: 42, height: 42, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: 18, paddingBottom: 4 },
  searchBar: { minHeight: 54, borderWidth: 1, borderRadius: 27, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 9, fontSize: 14 },
  heroWrap: { marginTop: 60, marginBottom: 15 },
  heroCard: { minHeight: 365, borderWidth: 1, borderRadius: 26, paddingHorizontal: 17, paddingTop: 58, paddingBottom: 17, overflow: 'hidden', alignItems: 'center' },
  heroOrbTop: { position: 'absolute', width: 145, height: 145, borderRadius: 75, opacity: 0.42, top: -26, right: -20 },
  heroOrbBottom: { position: 'absolute', width: 135, height: 135, borderRadius: 70, opacity: 0.58, bottom: -55, left: -28 },
  avatarRing: { position: 'absolute', top: -48, alignSelf: 'center', width: 96, height: 96, borderRadius: 49, borderWidth: 2, padding: 3, zIndex: 2 },
  avatar: { width: '100%', height: '100%', borderRadius: 45 },
  authorNameRow: { justifyContent: 'center', maxWidth: '100%' },
  authorName: { fontSize: 23, lineHeight: 34, fontWeight: '700', textAlign: 'center' },
  followButton: { minWidth: 136, minHeight: 42, paddingHorizontal: 17, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  followText: { fontSize: 14, fontWeight: '700' },
  bio: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 17, paddingHorizontal: 3 },
  divider: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginTop: 17, marginBottom: 12 },
  stats: { width: '100%', minHeight: 62, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center' },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 39 },
  statValue: { fontSize: 16, fontWeight: '600' },
  statLabel: { fontSize: 11 },
  booksHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9, marginBottom: 10 },
  headingMark: { width: 4, height: 22, borderRadius: 3 },
  booksTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  booksCount: { fontSize: 12 },
  bookRow: { minHeight: 178, borderWidth: 1, borderRadius: 20, padding: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookCover: { width: 87, height: 142, borderRadius: 12 },
  bookCopy: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 5 },
  popularPill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 15, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 },
  popularText: { fontSize: 10, fontWeight: '600' },
  bookTitle: { fontSize: 16, fontWeight: '700', lineHeight: 23 },
  bookMeta: { fontSize: 11, lineHeight: 17 },
  bookAuthorRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  bookAuthorName: { flex: 1 },
  bookStats: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  bookStatText: { fontSize: 11, marginRight: 3 },
  emptyBooks: { minHeight: 120, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyBooksText: { fontSize: 13 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 18, fontWeight: '700' },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, marginTop: 16 },
  backButtonText: { fontSize: 14, fontWeight: '700' },
});