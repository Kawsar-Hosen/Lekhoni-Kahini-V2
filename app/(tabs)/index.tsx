import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCard } from '@/components/BookCard';
import { AppText as Text } from '@/components/AppText';
import { VerifiedName } from '@/components/VerifiedName';
import { MenuDrawer, type MenuDestination } from '@/components/MenuDrawer';
import { NotificationCenter } from '@/components/NotificationCenter';
import { NameSetupModal, ThemePickerSheet, themeChoices } from '@/components/SettingsOverlays';
import { useAppTheme } from '@/context/ThemeContext';
import { useBooks, useCategories, useHomeSections, useWriters } from '@/hooks/useLekhoni';
import { coverSource, formatBanglaCount, isVerifiedWriter, toBanglaDigits, toUiBook, writerBooks, writerDisplayName } from '@/lib/adapters';
import type { ApiBook } from '@/lib/api';
import { getDisplayName, setDisplayName } from '@/lib/device';
import type { Book } from '@/data/books';
import { useColors } from '@/hooks/useColors';
import { useResponsive } from '@/hooks/useResponsive';
import { useLibrary } from '@/context/LibraryContext';
import { useNotifications } from '@/context/NotificationContext';
import { useWriterAccess } from '@/context/WriterAccessContext';

const guideSteps = [
  { title: 'গল্প খুঁজুন', body: 'আপনার প্রিয় গল্প সহজে খুঁজে পেতে এখানে ক্লিক করুন', icon: 'search' as const },
  { title: 'পড়তে ক্লিক করুন', body: 'বইটির ওপর ক্লিক করে সরাসরি পড়তে শুরু করতে পারেন', icon: 'book-open' as const },
  { title: 'সবগুলো দেখতে ক্লিক করুন', body: 'এই ক্যাটাগরির সব বই একসাথে দেখতে এখানে ক্লিক করুন', icon: 'grid' as const },
];

function sectionBooks(sections: { key: string; books: ApiBook[] }[] | undefined, key: string): ApiBook[] {
  return sections?.find((s) => s.key === key)?.books ?? [];
}

function byUpdatedDesc(a: ApiBook, b: ApiBook) {
  return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedIds, toggleSaved } = useLibrary();
  const { unreadCount } = useNotifications();
  const { session } = useWriterAccess();
  const { data: apiBooks } = useBooks();
  const { data: home } = useHomeSections();
  const { data: apiWriters } = useWriters();
  const { data: apiCategories } = useCategories();
  const liveBooks = apiBooks ?? [];
  const books = liveBooks.map(toUiBook);
  const sections = home?.sections;
  const sortedNewest = [...liveBooks].sort(byUpdatedDesc);
  const featuredApi = sectionBooks(sections, 'featured');
  const featuredBooks = (featuredApi.length ? featuredApi : sortedNewest.slice(0, 4)).map(toUiBook);
  const newest = sortedNewest.slice(0, 4).map(toUiBook);
  // Every API section renders dynamically — including future `cat:*` sections
  // created when stories publish under new categories.
  const dynamicSections = (sections ?? [])
    .filter((s) => s.key !== 'featured' && s.key !== 'popularAuthors' && s.books.length > 0)
    .map((s) => ({ key: s.key, title: s.title, books: s.books.slice(0, 8).map(toUiBook) }));
  const categoryIdFor = (key: string) => {
    if (!key.startsWith('cat:')) return undefined;
    const name = key.slice(4);
    return (apiCategories ?? []).find((c) => c.name === name)?.id;
  };
  const writers = [...(apiWriters ?? [])]
    .sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0))
    .slice(0, 6)
    .map((w) => {
      const wBooks = writerBooks(liveBooks, w);
      return {
        id: w.id,
        name: writerDisplayName(w),
        books: `${toBanglaDigits(String(wBooks.length))}টি বই`,
        followers: ` • ${formatBanglaCount(w.follower_count ?? 0)} জন ফলোয়ার`,
        cover: w.avatar_url ? { uri: w.avatar_url } : (wBooks[0] ? coverSource(wBooks[0].cover_url, wBooks[0].id) : coverSource(null, w.id)),
        verified: isVerifiedWriter(w),
      };
    });
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const { choice: selectedTheme, setChoice: setSelectedTheme } = useAppTheme();

  useEffect(() => {
    void getDisplayName().then((name) => {
      if (name) setProfileName(name);
    });
  }, []);
  const themeLabel = themeChoices.find((theme) => theme.id === selectedTheme)?.label ?? 'ডিফল্ট লাইট';

  const openBook = (id: string) => router.push({ pathname: '/book/[id]', params: { id } });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable testID="menu-button" onPress={() => setMenuOpen(true)} hitSlop={10}>
          <Feather name="menu" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.logo, { color: colors.primary }]}>লেখনি কাহিনী</Text>
        <View style={styles.headerActions}>
          <Pressable testID="notification-button" onPress={() => setNotificationsOpen(true)} hitSlop={10}>
            <Feather name="bell" size={21} color={colors.primary} />
            {unreadCount > 0 ? <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View> : null}
          </Pressable>
          <Pressable testID="search-button" onPress={() => router.push('/search')} hitSlop={10}>
            <Feather name="search" size={21} color={colors.primary} />
          </Pressable>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 110 : 96 }}>
        {featuredBooks.length ? (
          <FeaturedCarousel
            books={featuredBooks}
            savedIds={savedIds}
            onPress={openBook}
            onSave={toggleSaved}
          />
        ) : null}

        <SectionHeader title="RECENTLY ADDED" onPress={() => router.push('/recently-added')} colors={colors} />
        <FlatList
          horizontal data={newest} keyExtractor={(item) => `recent-${item.id}`} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => <BookCard book={item} onPress={() => openBook(item.id)} onSave={() => toggleSaved(item.id)} saved={savedIds.includes(item.id)} />}
        />

        {dynamicSections.map((section) => {
          const catId = categoryIdFor(section.key);
          return (
            <View key={section.key}>
              <SectionHeader
                title={section.title}
                onPress={() => {
                  if (catId) router.push({ pathname: '/category/[id]', params: { id: catId } });
                  else if (section.key === 'mostPopular' || section.key === 'weeklyPopular' || section.key === 'monthlyPopular') router.push('/recently-added');
                  else setNotice(`${section.title} — সব বই দেখতে ক্যাটাগরি ট্যাবে যান`);
                }}
                colors={colors}
              />
              <FlatList
                horizontal data={section.books} keyExtractor={(item) => `${section.key}-${item.id}`} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => <BookCard book={item} onPress={() => openBook(item.id)} onSave={() => { toggleSaved(item.id); setNotice(savedIds.includes(item.id) ? 'লাইব্রেরি থেকে সরানো হয়েছে' : 'লাইব্রেরিতে যোগ করা হয়েছে'); }} saved={savedIds.includes(item.id)} />}
              />
            </View>
          );
        })}

        <SectionHeader title="Top Writers" onPress={() => router.push('/top-writers')} colors={colors} />
        <FlatList
          horizontal
          data={writers}
          keyExtractor={(item) => item.name}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => <WriterCard writer={item} colors={colors} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } })} />}
        />
      </ScrollView>

        {notice ? (
        <Pressable testID="notice" onPress={() => setNotice('')} style={[styles.notice, { backgroundColor: colors.primary, bottom: Platform.OS === 'web' ? 82 : 88 }]}>
          <Feather name="check" size={19} color="#fff" /><Text style={styles.noticeText}>{notice}</Text>
        </Pressable>
      ) : null}

      <NotificationCenter
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <MenuDrawer
        visible={menuOpen}
        active="home"
        onClose={() => setMenuOpen(false)}
        profileName={profileName}
        themeLabel={themeLabel}
        onOpenName={() => setNameModalOpen(true)}
        onOpenTheme={() => setThemeModalOpen(true)}
        onNavigate={(destination: MenuDestination) => {
          if (destination === 'home') return;
          if (destination === 'notifications') {
            setNotificationsOpen(true);
            return;
          }
          if (destination === 'register') {
            if (!session) {
              router.push('/auth/register');
            } else {
              router.push('/writer/panel');
            }
            return;
          }
          if (destination === 'login') {
            router.push('/auth/login');
            return;
          }
          if (destination === 'settings') {
            setNotice('রিডিং সেটিংস খুব শিগগিরই আসছে');
            return;
          }
          if (destination === 'about') {
            setNotice('লেখনি কাহিনী — আপনার গল্পের ঠিকানা');
            return;
          }
          router.push(`/${destination}`);
        }}
      />

      <NameSetupModal
        visible={nameModalOpen}
        initialName={profileName}
        onClose={() => setNameModalOpen(false)}
        onSave={(name) => {
          setProfileName(name);
          void setDisplayName(name);
          setNotice('আপনার নাম সংরক্ষণ করা হয়েছে');
        }}
      />

      <ThemePickerSheet
        visible={themeModalOpen}
        selected={selectedTheme}
        onClose={() => setThemeModalOpen(false)}
        onConfirm={(theme) => {
          void setSelectedTheme(theme);
          const label = themeChoices.find((item) => item.id === theme)?.label ?? 'থিম';
          setNotice(`${label} নির্বাচিত হয়েছে`);
        }}
      />

      <Modal transparent visible={guideStep !== null} animationType="fade" onRequestClose={() => setGuideStep(null)}>
        <View style={[styles.guideOverlay, { paddingTop: insets.top }]}>
          <View style={[styles.guideCircle, { backgroundColor: colors.deepInk }]} />
          <View style={styles.guideTopHint}><Feather name="search" size={20} color="#fff" /><Text style={styles.guideTopText}>গল্প খুঁজুন</Text></View>
          <View style={styles.guideBottom}>
            <View style={styles.guideIcon}><Feather name={guideSteps[guideStep ?? 0].icon} size={25} color={colors.primary} /></View>
            <Text style={styles.guideTitle}>{guideSteps[guideStep ?? 0].title}</Text>
            <Text style={styles.guideBody}>{guideSteps[guideStep ?? 0].body}</Text>
            <Pressable testID="guide-dismiss" onPress={() => setGuideStep((current) => current === guideSteps.length - 1 ? null : (current ?? 0) + 1)} style={[styles.guideButton, { backgroundColor: colors.card }]}>
              <Text style={[styles.guideButtonText, { color: colors.foreground }]}>{guideStep === guideSteps.length - 1 ? 'শুরু করি' : 'বুঝতে পেরেছি'}</Text>
            </Pressable>
            <View style={styles.dots}>{guideSteps.map((step, index) => <View key={step.title} style={[styles.dot, { backgroundColor: index === guideStep ? colors.rose : 'rgba(255,255,255,0.45)' }]} />)}</View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FeaturedCarousel({
  books,
  savedIds,
  onPress,
  onSave,
}: {
  books: Book[];
  savedIds: string[];
  onPress: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const colors = useColors();
  const { width } = useResponsive();
  const pageWidth = width - 36;
  const [index, setIndex] = useState(0);
  const indexRef = React.useRef(0);
  const listRef = React.useRef<FlatList<Book>>(null);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAuto = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };
  const startAuto = React.useCallback(() => {
    stopAuto();
    if (books.length < 2) return;
    timer.current = setInterval(() => {
      const next = (indexRef.current + 1) % books.length;
      try {
        listRef.current?.scrollToIndex({ index: next, animated: true });
      } catch {
        listRef.current?.scrollToOffset({ offset: next * pageWidth, animated: true });
      }
      indexRef.current = next;
      setIndex(next);
    }, 5000);
  }, [books.length, pageWidth]);

  React.useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    startAuto();
    return stopAuto;
  }, [books.length, startAuto]);

  return (
    <View>
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        data={books}
        keyExtractor={(item) => `featured-${item.id}`}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
          indexRef.current = next;
          setIndex(next);
          startAuto();
        }}
        onScrollBeginDrag={stopAuto}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({ offset: info.index * pageWidth, animated: true });
        }}
        renderItem={({ item, index: i }) => (
          <FeaturedBanner
            width={pageWidth + 36}
            book={item}
            rank={`#${toBanglaDigits(String(i + 1))}`}
            saved={savedIds.includes(item.id)}
            onPress={() => onPress(item.id)}
            onSave={() => onSave(item.id)}
          />
        )}
      />
      {books.length > 1 ? (
        <View style={styles.carouselDots}>
          {books.map((b, i) => (
            <View key={b.id} style={[styles.carouselDot, { backgroundColor: i === index ? colors.primary : colors.border, width: i === index ? 20 : 6 }]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function FeaturedBanner({
  width,
  book,
  rank,
  saved,
  onPress,
  onSave,
}: {
  width: number;
  book: Book;
  rank: string;
  saved: boolean;
  onPress: () => void;
  onSave: () => void;
}) {
  return (
    <View style={{ width }}>
      <View style={styles.featuredWrap}>
      <Image source={book.cover} resizeMode="cover" style={styles.featuredBackdrop} />
      <LinearGradient
        colors={['rgba(12,17,21,0.45)', 'rgba(12,17,21,0.92)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.featuredContent}>
        <Pressable onPress={onPress} style={styles.featuredCoverWrap} accessibilityRole="button">
          <Image source={book.cover} resizeMode="cover" style={styles.featuredCover} />
        </Pressable>
        <View style={styles.featuredText}>
          <Text numberOfLines={1} style={styles.featuredTitle}>{book.title}</Text>
          <Text numberOfLines={1} style={styles.featuredAuthor}>{book.author}</Text>
          <View style={styles.featuredMeta}>
            <Feather name="eye" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.featuredMetaText}>{book.readers} • সম্পূর্ণ • {book.genre}</Text>
          </View>
          <View style={styles.featuredActions}>
            <Pressable onPress={onPress} style={styles.featuredButton}>
              <Feather name="book-open" size={14} color="#292126" />
              <Text style={[styles.featuredButtonText, { color: '#292126' }]}>পড়ুন</Text>
            </Pressable>
            <Pressable
              testID={`featured-save-${book.id}`}
              onPress={onSave}
              accessibilityRole="button"
              accessibilityLabel={saved ? 'লাইব্রেরি থেকে সরান' : 'লাইব্রেরিতে রাখুন'}
              style={styles.featuredBookmark}
            >
              <Feather name="bookmark" size={17} color="#fff" />
            </Pressable>
          </View>
        </View>
        <View style={styles.rankBadge}><Text style={styles.rankText}>{rank}</Text></View>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({ title, onPress, colors }: { title: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.sectionHeader}><View style={[styles.sectionMark, { backgroundColor: colors.primary }]} /><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text><Pressable onPress={onPress} hitSlop={10}><Text style={[styles.seeAll, { color: colors.primary }]}>সব দেখুন…</Text></Pressable></View>;
}

function WriterCard({ writer, colors, onPress }: { writer: { id: string; name: string; books: string; followers: string; cover: unknown; verified: boolean }; colors: ReturnType<typeof useColors>; onPress: () => void }) {
  const { width } = useResponsive();
  const cardWidth = Math.min(142, Math.round(width * 0.38));
  return (
    <Pressable onPress={onPress} style={[styles.writerCard, { width: cardWidth, backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.writerClose}>
        <Feather name="x" size={14} color={colors.mutedForeground} />
      </View>
      <Image source={writer.cover as never} resizeMode="cover" style={styles.writerAvatar} />
      <VerifiedName
        name={writer.name}
        verified={writer.verified}
        containerStyle={styles.writerNameRow}
        nameStyle={[styles.writerName, { color: colors.foreground }]}
      />
      <Text numberOfLines={1} style={[styles.writerMeta, { color: colors.mutedForeground }]}>{writer.books}{writer.followers}</Text>
      <View style={[styles.followButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.followButtonText, { color: colors.primaryForeground }]}>প্রোফাইল</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 70, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  logo: { fontFamily: 'serif', fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  badge: { position: 'absolute', right: -7, top: -8, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  featuredWrap: { height: 187, borderRadius: 23, overflow: 'hidden', marginHorizontal: 18, marginTop: 7 },
  featuredBackdrop: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featuredContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 14 },
  featuredCoverWrap: { width: 87, height: 128, borderRadius: 12, overflow: 'hidden' },
  featuredCover: { width: '100%', height: '100%' },
  featuredText: { flex: 1, justifyContent: 'center' },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginBottom: 4 },
  featuredTitle: { color: '#fff', fontFamily: 'serif', fontWeight: '700', fontSize: 20, lineHeight: 25 },
  featuredAuthor: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  featuredMetaText: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  featuredButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 7, paddingHorizontal: 11, borderRadius: 16, marginTop: 10 },
  featuredButtonText: { fontSize: 11, fontWeight: '700' },
  featuredActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featuredBookmark: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  rankBadge: { position: 'absolute', top: 14, right: 14, borderColor: 'rgba(255,255,255,0.4)', borderWidth: 1, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 15 },
  rankText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  carouselDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 9 },
  carouselDot: { height: 6, borderRadius: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 25, paddingHorizontal: 18, gap: 8 },
  sectionMark: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { fontFamily: 'serif', fontSize: 17, fontWeight: '700', flex: 1 },
  seeAll: { backgroundColor: '#f9edf2', paddingVertical: 7, paddingHorizontal: 11, borderRadius: 16, fontSize: 11, fontWeight: '600' },
  horizontalList: { paddingHorizontal: 18, paddingTop: 11 },
  writerCard: { width: 142, minHeight: 195, borderWidth: 1, borderRadius: 18, padding: 11, alignItems: 'center', marginRight: 10 },
  writerClose: { position: 'absolute', top: 7, right: 7, zIndex: 1, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  writerAvatar: { width: 76, height: 76, borderRadius: 38, marginTop: 7 },
  writerNameRow: { maxWidth: '100%', justifyContent: 'center', marginTop: 10 },
  writerName: { fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
  writerMeta: { fontSize: 9, marginTop: 4 },
  followButton: { width: '100%', borderRadius: 12, alignItems: 'center', paddingVertical: 8, marginTop: 12 },
  followButtonText: { fontFamily: 'serif', fontSize: 12, fontWeight: '700' },
  notice: { position: 'absolute', left: 18, right: 18, borderRadius: 17, minHeight: 52, paddingHorizontal: 17, flexDirection: 'row', gap: 10, alignItems: 'center' },
  noticeText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  guideOverlay: { flex: 1, backgroundColor: 'rgba(10,35,52,0.92)', justifyContent: 'space-between' },
  guideCircle: { position: 'absolute', width: 620, height: 620, borderRadius: 310, top: -235, right: -160, opacity: 0.85 },
  guideTopHint: { marginTop: 46, marginHorizontal: 30, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 11 },
  guideTopText: { color: '#fff', fontFamily: 'serif', fontSize: 24, fontWeight: '700' },
  guideBottom: { alignItems: 'center', paddingHorizontal: 30, paddingBottom: Platform.OS === 'web' ? 28 : 42 },
  guideIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  guideTitle: { color: '#fff', fontFamily: 'serif', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  guideBody: { color: 'rgba(255,255,255,0.88)', fontSize: 16, lineHeight: 25, textAlign: 'center', marginTop: 10, maxWidth: 280 },
  guideButton: { minWidth: 150, paddingVertical: 15, paddingHorizontal: 22, borderRadius: 30, marginTop: 23, alignItems: 'center' },
  guideButtonText: { fontSize: 15, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6, marginTop: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
