import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { BookActionMenu } from '@/components/BookActions';
import { BookCommentsSheet } from '@/components/BookCommentsSheet';
import { VerifiedName } from '@/components/VerifiedName';
import { useLibrary } from '@/context/LibraryContext';
import { useBook, useComments, useRecordView, useToggleLike, useWriters } from '@/hooks/useLekhoni';
import { bookLikesCount, coverSource, formatBanglaCount, formatCount, mapStatus, toBanglaDigits, toUiBook } from '@/lib/adapters';
import { bookViewsCount } from '@/lib/adapters';
import { displayAuthor } from '@/lib/api';
import { clearOfflineChapters, getOfflineChapters, saveOfflineChapter, saveOfflineChapters } from '@/lib/offline';
import type { ApiChapter } from '@/lib/api';
import { useResponsive } from '@/hooks/useResponsive';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedIds, toggleSaved, setDownloaded, addToHistory } = useLibrary();
  const { isSmallPhone } = useResponsive();
  const { data: apiBook, isLoading } = useBook(id);
  const { data: apiWriters } = useWriters();
  const { data: liveComments } = useComments(id);
  useRecordView(id);
  const likeMutation = useToggleLike(id);
  const book = useMemo(() => (apiBook ? toUiBook(apiBook) : null), [apiBook]);
  const chapters = apiBook?.chapters ?? [];
  const [actionsVisible, setActionsVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [reaction, setReaction] = useState<'like' | 'unlike' | null>(null);
  const [notice, setNotice] = useState('');
  const [liking, setLiking] = useState(false);
  const [savedChapters, setSavedChapters] = useState<ApiChapter[]>([]);
  const [downloadingChapters, setDownloadingChapters] = useState(false);
  const [savingChapterId, setSavingChapterId] = useState<string | null>(null);
  const [likeCountOverride, setLikeCountOverride] = useState<number | null>(null);
  const [unlikeCountOverride, setUnlikeCountOverride] = useState<number | null>(null);
  const lastServerCounts = useRef({ likes: 0, dislikes: 0 });
  const statusScale = useRef(new Animated.Value(1)).current;
  const saved = book ? savedIds.includes(book.id) : false;
  const serverLikes = apiBook ? bookLikesCount(apiBook) : 0;
  const serverDislikes = apiBook?.dislikes !== undefined ? bookViewsCount({ views: apiBook.dislikes }) : 0;
  const likeCount = likeCountOverride ?? serverLikes;
  const unlikeCount = unlikeCountOverride ?? serverDislikes;
  const savedChapterIds = useMemo(() => new Set(savedChapters.map((chapter) => chapter.id)), [savedChapters]);
  const savedChapterCount = chapters.filter((chapter) => savedChapterIds.has(chapter.id)).length;
  const allChaptersSaved = chapters.length > 0 && savedChapterCount === chapters.length;
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const authorPortrait = apiBook ? coverSource(null, displayAuthor(apiBook)) : require('@/assets/images/author-profile.png');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getOfflineChapters(id).then((offline) => {
        if (active) setSavedChapters(offline ?? []);
      });
      return () => {
        active = false;
      };
    }, [id]),
  );

  useEffect(() => {
    if (serverLikes !== lastServerCounts.current.likes) setLikeCountOverride(null);
    if (serverDislikes !== lastServerCounts.current.dislikes) setUnlikeCountOverride(null);
    lastServerCounts.current = { likes: serverLikes, dislikes: serverDislikes };
  }, [serverLikes, serverDislikes]);

  useEffect(() => {
    if (!book) return;
    statusScale.setValue(0.97);
    const animation = Animated.timing(statusScale, {
      toValue: 1,
      duration: 190,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [book?.status, statusScale]);

  const downloadAllChapters = async () => {
    if (!book || !chapters.length || downloadingChapters) return;
    setDownloadingChapters(true);
    const saved = await saveOfflineChapters(book.id, chapters);
    if (saved) {
      setSavedChapters(chapters);
      setDownloaded(book.id, true);
    } else {
      setNotice('পর্বগুলো অফলাইনে সেভ করা যায়নি। আবার চেষ্টা করুন।');
    }
    setDownloadingChapters(false);
  };

  const toggleDownload = async () => {
    if (!book || !chapters.length || downloadingChapters) return;
    if (!allChaptersSaved) {
      await downloadAllChapters();
      return;
    }

    setDownloadingChapters(true);
    const cleared = await clearOfflineChapters(book.id);
    if (cleared) {
      setSavedChapters([]);
      setDownloaded(book.id, false);
    } else {
      setNotice('ডাউনলোড মুছতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
    setDownloadingChapters(false);
  };

  const downloadChapter = async (chapter: ApiChapter) => {
    if (!book || savedChapterIds.has(chapter.id) || savingChapterId) return;
    setSavingChapterId(chapter.id);
    const saved = await saveOfflineChapter(book.id, chapter);
    if (saved) {
      setSavedChapters((current) => [
        ...current.filter((item) => item.id !== chapter.id),
        chapter,
      ].sort((a, b) => a.position - b.position));
      setDownloaded(book.id, true);
    } else {
      setNotice('এই পর্বটি অফলাইনে সেভ করা যায়নি। আবার চেষ্টা করুন।');
    }
    setSavingChapterId(null);
  };

  const startReading = () => {
    if (!book) return;
    addToHistory(book.id);
    const firstChapter = chapters[0];
    router.push({ pathname: '/reader/[id]', params: firstChapter ? { id: book.id, chapter: firstChapter.id } : { id: book.id } });
  };

  const openAuthor = () => {
    if (!apiBook) return;
    const match = (apiWriters ?? []).find((w) => {
      const a = (apiBook.author || '').toLowerCase();
      const an = (apiBook.author_name || '').toLowerCase();
      return (w.username && (w.username.toLowerCase() === a || w.username.toLowerCase() === an))
        || (w.writer_name && (w.writer_name.toLowerCase() === a || w.writer_name.toLowerCase() === an));
    });
    if (match) router.push({ pathname: '/profile/[id]', params: { id: match.id } });
  };

  if (!book) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[{ color: colors.mutedForeground }]}>
          {isLoading ? 'বই লোড হচ্ছে…' : 'বইটি পাওয়া যায়নি'}
        </Text>
      </View>
    );
  }

  const shareBook = async () => {
    setActionsVisible(false);
    try {
      await Share.share({
        title: book.title,
        message: `${book.title}\nলেখক: ${book.author}\n\nলেখনী কাহিনী`,
      });
    } catch {
      setNotice('এই বইটি শেয়ার করা যায়নি।');
    }
  };

  const toggleReaction = (next: 'like' | 'unlike') => {
    if (liking) return;
    const value = reaction === next ? null : next;
    setReaction(value);
    if (value === null) {
      setLikeCountOverride(serverLikes);
      setUnlikeCountOverride(serverDislikes);
      return;
    }

    const likesNow = likeCountOverride ?? serverLikes;
    const unlikesNow = unlikeCountOverride ?? serverDislikes;
    const likeDelta = Number(value === 'like') - Number(reaction === 'like');
    const unlikeDelta = Number(value === 'unlike') - Number(reaction === 'unlike');
    setLikeCountOverride(Math.max(0, likesNow + likeDelta));
    setUnlikeCountOverride(Math.max(0, unlikesNow + unlikeDelta));
    setLiking(true);
    likeMutation.mutate(value === 'like', {
      onSuccess: (updatedLikes) => {
        if (updatedLikes >= 0) {
          setLikeCountOverride(updatedLikes);
          return;
        }
        setReaction(reaction);
        setLikeCountOverride(null);
        setUnlikeCountOverride(null);
        setNotice('পছন্দ আপডেট করা যায়নি। আবার চেষ্টা করুন।');
      },
      onSettled: () => setLiking(false),
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 22 }]}
      >
        <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
          <Pressable
            testID="book-detail-back"
            onPress={() => goBackOrFallback('/')}
            accessibilityRole="button"
            accessibilityLabel="ফিরে যান"
            style={styles.headerButton}
          >
            <Feather name="arrow-left" size={24} color={colors.primary} />
          </Pressable>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.primary }]}>{book.title}</Text>
          <View style={styles.headerActions}>
            <Pressable
              testID="save-book"
              onPress={() => toggleSaved(book.id)}
              accessibilityRole="button"
              accessibilityLabel={saved ? 'লাইব্রেরি থেকে সরান' : 'লাইব্রেরিতে রাখুন'}
              style={styles.headerButton}
            >
              <Feather name={saved ? 'bookmark' : 'bookmark'} size={21} color={saved ? colors.primary : colors.foreground} />
            </Pressable>
            <Pressable
              testID="book-actions-button"
              onPress={() => setActionsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="আরও অপশন"
              style={styles.headerButton}
            >
              <Feather name="more-vertical" size={22} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={book.cover} resizeMode="cover" style={[styles.cover, isSmallPhone && { width: 92, height: 144 }]} />
          <View style={styles.summaryCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>বইটির নাম:</Text>
            <Text style={[styles.title, { color: colors.primary }]}>{book.title}</Text>

            <Pressable
              testID="book-author-profile"
              onPress={openAuthor}
              style={[styles.authorPill, { backgroundColor: colors.secondary }]}
            >
              <Image source={authorPortrait} resizeMode="cover" style={styles.authorAvatar} />
              <VerifiedName
                name={book.author}
                verified={book.verified}
                containerStyle={styles.detailAuthorName}
                nameStyle={[styles.authorName, { color: colors.primary }]}
              />
              <Feather name="chevron-right" size={15} color={colors.primary} />
            </Pressable>

            <Text numberOfLines={2} style={[styles.description, { color: colors.mutedForeground }]}>
              বিবরণ: {book.description}
            </Text>
            <View style={styles.genreRow}>
              <Text style={[styles.genreLabel, { color: colors.mutedForeground }]}>ধরন: {book.genre}</Text>
              <Animated.View
                style={[
                  styles.statusPill,
                  { backgroundColor: book.status === 'চলমান' ? colors.success : colors.sky },
                  { transform: [{ scale: statusScale }] },
                ]}
              >
                <Text style={[styles.statusText, { color: book.status === 'চলমান' ? colors.successText : colors.skyText }]}>{book.status}</Text>
              </Animated.View>
            </View>

            <View style={[styles.stats, { borderTopColor: colors.border }]}>
              <BookStat label="ভিউ" value={book.readers} colors={colors} />
              <BookStat label="পছন্দ" value={formatCount(likeCount)} colors={colors} />
              <BookStat label="অপছন্দ" value={formatCount(unlikeCount)} colors={colors} />
            </View>
          </View>
        </View>

        <View style={styles.buttons}>
          <Pressable
            testID="read-book"
            onPress={startReading}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.84 : 1 }]}
          >
            <MaterialIcons name="menu-book" size={19} color={colors.primaryForeground} />
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>পড়া শুরু করুন</Text>
          </Pressable>
            <Pressable
              testID="download-book"
              onPress={toggleDownload}
              disabled={downloadingChapters || !chapters.length}
            style={({ pressed }) => [
              styles.downloadButton,
              { borderColor: colors.primary, backgroundColor: colors.secondary, opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <Feather name={allChaptersSaved ? 'check' : 'download'} size={17} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.downloadText, { color: colors.primary }]}>
              {downloadingChapters ? 'সেভ হচ্ছে…' : allChaptersSaved ? 'ডাউনলোড হয়েছে' : savedChapterCount ? 'বাকি পর্ব ডাউনলোড' : 'অফলাইনে ডাউনলোড'}
            </Text>
          </Pressable>
        </View>

        {chapters.length ? (
          <View style={[styles.offlineBanner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name={allChaptersSaved ? 'check-circle' : 'download'} size={21} color={colors.primary} />
            <View style={styles.offlineBannerCopy}>
              <Text style={[styles.offlineBannerTitle, { color: colors.foreground }]}>পুরো গল্পটা অফলাইনে রাখুন</Text>
              <Text style={[styles.offlineBannerSubtitle, { color: colors.mutedForeground }]}>
                {toBanglaDigits(String(chapters.length))}টি পর্বের মধ্যে {toBanglaDigits(String(savedChapterCount))}টি সেভ আছে
                {allChaptersSaved ? ' — সব পর্ব অফলাইনে পড়তে পারবেন।' : ' — বাকি পর্বগুলোও ডাউনলোড করুন।'}
              </Text>
            </View>
            <Pressable
              testID="download-remaining-chapters"
              onPress={() => void downloadAllChapters()}
              disabled={allChaptersSaved || downloadingChapters}
              accessibilityRole="button"
              accessibilityLabel={allChaptersSaved ? 'সব পর্ব সেভ করা আছে' : 'বাকি সব পর্ব ডাউনলোড করুন'}
              style={({ pressed }) => [
                styles.downloadAllButton,
                { backgroundColor: allChaptersSaved ? colors.success : colors.primary, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text numberOfLines={1} style={[styles.downloadAllText, { color: allChaptersSaved ? colors.successText : colors.primaryForeground }]}>
                {downloadingChapters ? 'সেভ হচ্ছে…' : allChaptersSaved ? 'সেভ হয়েছে' : 'সব ডাউনলোড'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.sectionHeader, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>সূচিপত্র ({toBanglaDigits(String(chapters.length))}টি পর্ব)</Text>
          <View style={styles.sectionActions}>
            <ReactionButton
              testID="like-button"
              icon="thumb-up"
              label="পছন্দ করুন"
              active={reaction === 'like'}
              count={formatBanglaCount(likeCount)}
              colors={colors}
              onPress={() => toggleReaction('like')}
            />
            <ReactionButton
              testID="unlike-button"
              icon="thumb-down"
              label="অপছন্দ করুন"
              active={reaction === 'unlike'}
              count={formatBanglaCount(unlikeCount)}
              colors={colors}
              onPress={() => toggleReaction('unlike')}
            />
            <Pressable
              testID="comments-button"
              onPress={() => setCommentsVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`${(liveComments ?? []).length}টি মন্তব্য দেখুন`}
              style={[styles.commentCircle, { backgroundColor: colors.secondary }]}
            >
              <Feather name="message-square" size={18} color={colors.mutedForeground} />
              <Text style={[styles.commentBadge, { backgroundColor: colors.primary, color: colors.primaryForeground }]}>
                {toBanglaDigits(String((liveComments ?? []).length))}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chapterList}>
          {chapters.map((chapter, index) => {
            const number = toBanglaDigits(String(chapter.position));
            const isSaved = savedChapterIds.has(chapter.id);
            const isSaving = savingChapterId === chapter.id;
            return (
              <View
                key={chapter.id}
                testID={`chapter-row-${chapter.position}`}
                style={[styles.chapterRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Pressable
                  testID={`open-chapter-${chapter.position}`}
                  onPress={() => {
                    addToHistory(book.id);
                    router.push({ pathname: '/reader/[id]', params: { id: book.id, chapter: chapter.id } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${number} নম্বর পর্ব খুলুন`}
                  style={styles.chapterOpenButton}
                >
                  <Text style={[styles.chapterNumber, { color: colors.primary }]}>{number}.</Text>
                  <Text numberOfLines={1} style={[styles.chapterTitle, { color: colors.foreground }]}>{chapter.title}</Text>
                  {index === 0 && !isSmallPhone ? (
                    <View style={[styles.currentChapter, { backgroundColor: colors.cream }]}>
                      <Text style={[styles.currentChapterText, { color: colors.authorAction }]}>আজকের পর্ব</Text>
                    </View>
                  ) : null}
                </Pressable>
                <Pressable
                  testID={`save-chapter-${chapter.position}`}
                  onPress={() => void downloadChapter(chapter)}
                  disabled={isSaved || Boolean(savingChapterId)}
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? `${number} নম্বর পর্ব সেভ আছে` : `${number} নম্বর পর্ব ডাউনলোড করুন`}
                  accessibilityState={{ disabled: isSaved || Boolean(savingChapterId) }}
                  style={[
                    styles.chapterDownloadButton,
                    { backgroundColor: isSaved ? colors.success : colors.secondary, borderColor: isSaved ? colors.success : colors.border },
                  ]}
                >
                  <Feather name={isSaving ? 'loader' : isSaved ? 'check' : 'download'} size={14} color={isSaved ? colors.successText : colors.primary} />
                  <Text numberOfLines={1} style={[styles.chapterDownloadText, { color: isSaved ? colors.successText : colors.primary }]}>
                    {isSaving ? 'সেভ হচ্ছে' : isSaved ? 'সেভ আছে' : 'ডাউনলোড'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <BookActionMenu
        visible={actionsVisible}
        topOffset={topInset + 58}
        onClose={() => setActionsVisible(false)}
        onShare={() => void shareBook()}
      />
      <BookCommentsSheet
        visible={commentsVisible}
        bookId={book.id}
        bookTitle={book.title}
        bookAuthor={book.author}
        onClose={() => setCommentsVisible(false)}
      />
      {notice ? (
        <Pressable
          testID="book-action-notice"
          onPress={() => setNotice('')}
          style={[styles.notice, { backgroundColor: colors.deepInk, bottom: Math.max(insets.bottom, 18) + 18 }]}
        >
          <Feather name="info" size={18} color="#fff" />
          <Text style={styles.noticeText}>{notice}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function BookStat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function ReactionButton({
  testID,
  icon,
  label,
  active,
  count,
  colors,
  onPress,
}: {
  testID: string;
  icon: 'thumb-up' | 'thumb-down';
  label: string;
  active: boolean;
  count: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const iconName = icon === 'thumb-up'
    ? active ? 'thumb-up' : 'thumb-up-outline'
    : active ? 'thumb-down' : 'thumb-down-outline';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count}`}
      accessibilityState={{ selected: active }}
      style={styles.reactionTapTarget}
    >
      <View style={[styles.actionCircle, { backgroundColor: active ? colors.primary : colors.secondary }]}>
        <MaterialCommunityIcons
          name={iconName}
          size={17}
          color={active ? colors.primaryForeground : colors.mutedForeground}
        />
      </View>
      <Text style={[styles.reactionCount, { color: active ? colors.primary : colors.mutedForeground }]}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  topBar: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerButton: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, minWidth: 0, textAlign: 'center', fontSize: 19, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryCard: { borderWidth: 1, borderRadius: 22, padding: 14, marginTop: 11, flexDirection: 'row', gap: 13 },
  cover: { width: 105, height: 164, borderRadius: 13 },
  summaryCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 18, lineHeight: 25, fontWeight: '700', marginTop: 2 },
  authorPill: { alignSelf: 'flex-start', maxWidth: '100%', minHeight: 36, borderRadius: 20, paddingLeft: 5, paddingRight: 9, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorAvatar: { width: 26, height: 26, borderRadius: 13 },
  detailAuthorName: { flexShrink: 1 },
  authorName: { flexShrink: 1, fontSize: 11, fontWeight: '600' },
  description: { fontSize: 10, lineHeight: 15, marginTop: 8 },
  genreRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  genreLabel: { fontSize: 10 },
  statusPill: { borderRadius: 11, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 7 },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 12, fontWeight: '600' },
  statLabel: { fontSize: 9, marginTop: 1 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  primaryButton: { flex: 1, minHeight: 49, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryButtonText: { fontSize: 13, fontWeight: '700' },
  downloadButton: { flex: 1, minHeight: 49, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  downloadText: { fontSize: 12, fontWeight: '600' },
  offlineBanner: { minHeight: 76, borderWidth: 1, borderRadius: 16, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  offlineBannerCopy: { flex: 1, minWidth: 0, gap: 3 },
  offlineBannerTitle: { fontSize: 12, fontWeight: '700' },
  offlineBannerSubtitle: { fontSize: 10, lineHeight: 15 },
  downloadAllButton: { minHeight: 36, minWidth: 84, maxWidth: 104, paddingHorizontal: 10, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  downloadAllText: { fontSize: 10, fontWeight: '700' },
  sectionHeader: { minHeight: 65, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactionTapTarget: { minWidth: 42, height: 52, alignItems: 'center', justifyContent: 'center' },
  actionCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  reactionCount: { fontSize: 9, lineHeight: 11, marginTop: 1, fontWeight: '600' },
  commentCircle: { position: 'relative', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  commentBadge: { position: 'absolute', top: -3, right: -2, minWidth: 16, height: 16, borderRadius: 8, overflow: 'hidden', textAlign: 'center', fontSize: 9, fontWeight: '700' },
  chapterList: { gap: 9 },
  chapterRow: { minHeight: 55, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 },
  chapterOpenButton: { flex: 1, minWidth: 0, minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 5 },
  chapterNumber: { fontSize: 16, fontWeight: '700' },
  chapterTitle: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '500' },
  currentChapter: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  currentChapterText: { fontSize: 10, fontWeight: '600' },
  chapterDownloadButton: { minHeight: 33, borderWidth: 1, borderRadius: 17, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  chapterDownloadText: { fontSize: 9, fontWeight: '600' },
  notice: { position: 'absolute', left: 22, right: 22, minHeight: 56, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, elevation: 6 },
  noticeText: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 20 },
});