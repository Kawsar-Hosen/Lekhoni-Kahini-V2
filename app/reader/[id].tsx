import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { ReaderSettingsSheet } from '@/components/SettingsOverlays';
import { useBook, useRecordView } from '@/hooks/useLekhoni';
import { toBanglaDigits } from '@/lib/adapters';
import { getOfflineChapters } from '@/lib/offline';
import { useLibrary } from '@/context/LibraryContext';
import type { ApiChapter } from '@/lib/api';
import { useColors } from '@/hooks/useColors';

export default function ReaderScreen() {
  const { id, chapter } = useLocalSearchParams<{ id: string; chapter?: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: apiBook } = useBook(id);
  useRecordView(id);
  const { addToHistory, downloadedIds } = useLibrary();
  const [offlineChapters, setOfflineChapters] = useState<ApiChapter[] | null>(null);
  const [chapterId, setChapterId] = useState<string | undefined>(chapter);
  const [fontSize, setFontSize] = useState(21);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const isDarkPage = backgroundColor === '#111111';
  const textColor = isDarkPage ? '#f7f2ed' : colors.foreground;

  useEffect(() => {
    setChapterId(chapter);
  }, [chapter, id]);

  useEffect(() => {
    if (downloadedIds.includes(id)) {
      void getOfflineChapters(id).then(setOfflineChapters);
    } else {
      setOfflineChapters(null);
    }
  }, [id, downloadedIds]);

  const liveChapters = apiBook?.chapters ?? [];
  const chapters = offlineChapters ?? liveChapters;
  const activeIndex = Math.max(0, chapters.findIndex((c) => c.id === chapterId));
  const activeChapter = chapters[activeIndex];
  const paragraphs = (activeChapter?.body || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);

  const openChapter = (nextId: string) => {
    addToHistory(id);
    setChapterId(nextId);
  };

  return (
    <View
      accessibilityLabel={apiBook?.title ?? 'পাঠক'}
      style={[styles.screen, { backgroundColor }]}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: isDarkPage ? 'rgba(255,255,255,0.12)' : colors.border }]}>
        <Pressable
          testID="reader-back"
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="ফিরে যান"
        >
          <Feather name="arrow-left" size={24} color={textColor} />
        </Pressable>
        <Text style={[styles.chapterTitle, { color: textColor }]}>{activeChapter?.title ?? 'পর্ব লোড হচ্ছে…'}</Text>
        <View style={styles.headerActions}>
          <Pressable
            testID="reader-audio"
            onPress={() => router.push('/(tabs)/audio')}
            hitSlop={10}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="অডিও শুনুন"
          >
            <Feather name="headphones" size={22} color={textColor} />
          </Pressable>
          <Pressable
            testID="reader-settings"
            onPress={() => setSettingsVisible(true)}
            hitSlop={10}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="রিডার সেটিংস"
          >
            <Feather name="settings" size={21} color={textColor} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        testID="reader-content"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
      >
        {paragraphs.length ? paragraphs.map((paragraph, index) => (
          <Text
            key={`chapter-paragraph-${index}`}
            style={[styles.paragraph, { color: textColor, fontSize, lineHeight: fontSize * 1.55 }]}
          >
            {paragraph}
          </Text>
        )) : (
          <Text style={[styles.paragraph, { color: textColor, fontSize }]}>পর্বের লেখা লোড হচ্ছে…</Text>
        )}
      </ScrollView>

      <View style={[styles.bottomNavigation, { borderTopColor: colors.border, backgroundColor: isDarkPage ? '#171717' : colors.card, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable disabled={activeIndex <= 0} onPress={() => openChapter(chapters[activeIndex - 1].id)} style={styles.chapterNavButton}>
          <Text style={[styles.chapterNavText, { color: activeIndex <= 0 ? colors.mutedForeground : textColor }]}>← আগের পর্ব</Text>
        </Pressable>
        <Text style={[styles.pageIndicator, { color: textColor }]}>পর্ব {toBanglaDigits(String(activeIndex + 1))} / {toBanglaDigits(String(chapters.length))}</Text>
        <Pressable disabled={activeIndex >= chapters.length - 1} onPress={() => openChapter(chapters[activeIndex + 1].id)} style={[styles.chapterNavButton, styles.nextChapter]}>
          <Text style={[styles.chapterNavText, { color: activeIndex >= chapters.length - 1 ? colors.mutedForeground : textColor }]}>পরের পর্ব →</Text>
        </Pressable>
      </View>

      <ReaderSettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        fontSize={fontSize}
        onFontSizeChange={(size) => setFontSize(Math.max(14, Math.min(30, size)))}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
        keepScreenOn={keepScreenOn}
        onKeepScreenOnChange={setKeepScreenOn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { minHeight: 68, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
  chapterTitle: { flex: 1, textAlign: 'center', fontFamily: 'serif', fontSize: 19, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  content: { paddingHorizontal: 16, paddingTop: 10 },
  paragraph: { fontFamily: 'serif', marginBottom: 14, textAlign: 'left' },
  bottomNavigation: { minHeight: 54, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chapterNavButton: { minWidth: 104, minHeight: 44, justifyContent: 'center' },
  nextChapter: { alignItems: 'flex-end' },
  chapterNavText: { fontFamily: 'serif', fontSize: 13 },
  pageIndicator: { fontFamily: 'serif', fontSize: 14, fontWeight: '600' },
});