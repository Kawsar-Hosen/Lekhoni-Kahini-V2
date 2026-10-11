import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
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
import { clearOfflineChapters, saveOfflineChapters } from '@/lib/offline';
import { useResponsive } from '@/hooks/useResponsive';
import { useColors } from '@/hooks/useColors';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedIds, downloadedIds, toggleSaved, toggleDownloaded, addToHistory } = useLibrary();
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
  const saved = book ? savedIds.includes(book.id) : false;
  const downloaded = book ? downloadedIds.includes(book.id) : false;
  const serverLikes = apiBook ? bookLikesCount(apiBook) : 0;
  const likeCount = serverLikes + (reaction === 'like' ? 1 : 0);
  const serverDislikes = apiBook?.dislikes !== undefined ? bookViewsCount({ views: apiBook.dislikes }) : 0;
  const unlikeCount = serverDislikes + (reaction === 'unlike' ? 1 : 0);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const authorPortrait = apiBook ? coverSource(null, displayAuthor(apiBook)) : require('@/assets/images/author-profile.png');

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

  const toggleDownload = () => {
    if (!book) return;
    if (!downloaded && chapters.length) void saveOfflineChapters(book.id, chapters);
    if (downloaded) void clearOfflineChapters(book.id);
    toggleDownloaded(book.id);
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
    if (value === null) return;
    setLiking(true);
    likeMutation.mutate(value === 'like', { onSettled: () => setLiking(false) });
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
            onPress={() => router.back()}
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
              <View style={[styles.statusPill, { backgroundColor: colors.success }]}>
                <Text style={[styles.statusText, { color: colors.successText }]}>{book.status}</Text>
              </View>
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
            style={({ pressed }) => [
              styles.downloadButton,
              { borderColor: colors.primary, backgroundColor: colors.secondary, opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <Feather name={downloaded ? 'check' : 'download'} size={17} color={colors.primary} />
            <Text style={[styles.downloadText, { color: colors.primary }]}>
              {downloaded ? 'ডাউনলোড হয়েছে' : 'অফলাইনে ডাউনলোড'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.sectionHeader, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>সূচিপত্র ({toBanglaDigits(String(chapters.length))}টি পর্ব)</Text>
          <View style={styles.sectionActions}>
            <ReactionButton
              testID="like-button"
              icon="thumb-up"
              label="পছন্দ করুন"
              active={reaction === 'like'}
              colors={colors}
              onPress={() => toggleReaction('like')}
            />
            <ReactionButton
              testID="unlike-button"
              icon="thumb-down"
              label="অপছন্দ করুন"
              active={reaction === 'unlike'}
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
            return (
              <Pressable
                key={chapter.id}
                testID={`chapter-row-${chapter.position}`}
                onPress={() => {
                  addToHistory(book.id);
                  router.push({ pathname: '/reader/[id]', params: { id: book.id, chapter: chapter.id } });
                }}
                style={[styles.chapterRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.chapterNumber, { color: colors.primary }]}>{number}.</Text>
                <Text style={[styles.chapterTitle, { color: colors.foreground }]}>{chapter.title}</Text>
                {index === 0 ? (
                  <View style={[styles.currentChapter, { backgroundColor: colors.cream }]}>
                    <Text style={[styles.currentChapterText, { color: colors.authorAction }]}>আজকের পর্ব</Text>
                  </View>
                ) : null}
                {index === 0 ? <Feather name="play-circle" size={18} color={colors.primary} /> : null}
              </Pressable>
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
  colors,
  onPress,
}: {
  testID: string;
  icon: 'thumb-up' | 'thumb-down';
  label: string;
  active: boolean;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconName = icon === 'thumb-up'
    ? active ? 'thumb-up' : 'thumb-up-outline'
    : active ? 'thumb-down' : 'thumb-down-outline';

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.34, friction: 5, tension: 360, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 9, tension: 260, useNativeDriver: true }),
        ]).start();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={styles.reactionTapTarget}
    >
      <Animated.View
        style={[
          styles.actionCircle,
          { backgroundColor: active ? colors.primary : colors.secondary },
          { transform: [{ scale }] },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={17}
          color={active ? colors.primaryForeground : colors.mutedForeground}
        />
      </Animated.View>
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
  sectionHeader: { minHeight: 65, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactionTapTarget: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  actionCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  commentCircle: { position: 'relative', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  commentBadge: { position: 'absolute', top: -3, right: -2, minWidth: 16, height: 16, borderRadius: 8, overflow: 'hidden', textAlign: 'center', fontSize: 9, fontWeight: '700' },
  chapterList: { gap: 9 },
  chapterRow: { minHeight: 55, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  chapterNumber: { fontSize: 18, fontWeight: '700' },
  chapterTitle: { flex: 1, fontSize: 16, fontWeight: '500' },
  currentChapter: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  currentChapterText: { fontSize: 10, fontWeight: '600' },
  notice: { position: 'absolute', left: 22, right: 22, minHeight: 56, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, elevation: 6 },
  noticeText: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 20 },
});