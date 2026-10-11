import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { WriterButton, WriterHeader } from '@/components/WriterChrome';
import { useWriterContent, useWriterStory } from '@/context/WriterContentContext';
import { toBanglaDigits } from '@/lib/adapters';
import { useColors } from '@/hooks/useColors';

export default function WriterBookManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books, getBook, deleteChapter, submitForReview } = useWriterContent();
  const book = getBook(id);
  const { data: detail } = useWriterStory(id);
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top;
  const detailChapters = detail && 'chapters' in detail && Array.isArray(detail.chapters) ? detail.chapters : [];
  const [submitting, setSubmitting] = React.useState(false);

  if (!book) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
        <WriterHeader title="বই পাওয়া যায়নি" backToStudio />
        <View style={styles.missing}>
          <Text style={[styles.missingText, { color: colors.mutedForeground }]}>এই বইটি পাওয়া যাচ্ছে না।</Text>
          <WriterButton label="স্টুডিওতে ফিরুন" onPress={() => router.replace('/writer/panel')} />
        </View>
      </View>
    );
  }

  const totalViews = book.totalViews;
  const sortedChapters = [...detailChapters].sort((a, b) => a.position - b.position);

  const submitReview = async () => {
    if (submitting) return;
    setSubmitting(true);
    const res = await submitForReview(book.id);
    setSubmitting(false);
    Alert.alert('রিভিউ', res.ok ? 'বইটি রিভিউয়ের জন্য জমা হয়েছে।' : 'জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
      <WriterHeader title={book.title} subtitle="পর্ব ব্যবস্থাপনা ও পর্যালোচনা" backToStudio />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pills}>
          <View style={[styles.infoPill, { borderColor: colors.border }]}>
            <Feather name="list" size={14} color={colors.skyText} />
            <Text style={[styles.pillText, { color: colors.skyText }]}>সকল পর্ব দেখুন ({toBanglaDigits(String(sortedChapters.length))})</Text>
          </View>
          <View style={[styles.infoPill, { borderColor: colors.border }]}>
            <Feather name="eye" size={14} color={colors.skyText} />
            <Text style={[styles.pillText, { color: colors.skyText }]}>মোট ভিউ: {toBanglaDigits(String(totalViews))}</Text>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: '/writer/chapter-form', params: { bookId: book.id } })}
            style={[styles.infoPill, { backgroundColor: colors.success, borderColor: colors.success }]}
          >
            <Feather name="plus" size={14} color={colors.successText} />
            <Text style={[styles.pillText, { color: colors.successText }]}>নতুন পর্ব যুক্ত করুন</Text>
          </Pressable>
          <Pressable
            onPress={() => void submitReview()}
            disabled={submitting}
            style={[styles.infoPill, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          >
            <Feather name="send" size={14} color={colors.primaryForeground} />
            <Text style={[styles.pillText, { color: colors.primaryForeground }]}>{submitting ? 'জমা হচ্ছে…' : 'রিভিউয়ের জন্য জমা দিন'}</Text>
          </Pressable>
        </View>

        {sortedChapters.length ? sortedChapters.map((chapter) => (
          <View key={chapter.id} style={[styles.chapterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.numberCircle, { borderColor: colors.border }]}>
              <Text style={[styles.chapterNumber, { color: colors.skyText }]}>{toBanglaDigits(String(chapter.position))}</Text>
            </View>
            <View style={styles.chapterDetails}>
              <Text style={[styles.chapterTitle, { color: colors.foreground }]}>{chapter.title}</Text>
              <Text style={[styles.chapterDate, { color: colors.mutedForeground }]}>পর্ব {toBanglaDigits(String(chapter.position))}</Text>
              <View style={styles.chapterMeta}>
                <Feather name="eye" size={13} color={colors.mutedForeground} />
                <Text style={[styles.chapterMetaText, { color: colors.mutedForeground }]}>{chapter.minutes ? `${toBanglaDigits(String(chapter.minutes))} মিনিট` : ''}</Text>
              </View>
            </View>
            <View style={styles.chapterActions}>
              <Pressable
                onPress={() => router.push({ pathname: '/writer/chapter-form', params: { bookId: book.id, chapterId: chapter.id } })}
                style={[styles.chapterAction, { borderColor: colors.border }]}
              >
                <Text style={[styles.chapterActionText, { color: colors.foreground }]}>এডিট</Text>
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('পর্ব মুছুন', `“${chapter.title}” মুছে ফেলতে চান?`, [
                  { text: 'বাতিল', style: 'cancel' },
                  {
                    text: 'মুছুন',
                    style: 'destructive',
                    onPress: () => {
                      void deleteChapter(book.id, chapter.id).then((res) => {
                        if (!res.ok) Alert.alert('মোছা যায়নি', 'সার্ভারে পর্ব মোছা এখনো চালু হয়নি।');
                      });
                    },
                  },
                ])}
                style={[styles.chapterAction, { borderColor: colors.border }]}
              >
                <Text style={[styles.chapterActionText, { color: colors.destructive }]}>ডিলিট</Text>
              </Pressable>
            </View>
          </View>
        )) : (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="book-open" size={29} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>এখানে কোনো পর্ব যুক্ত হয়নি।</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 19, paddingTop: 14, paddingBottom: 32 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 19 },
  infoPill: { minHeight: 38, borderWidth: 1, borderRadius: 21, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pillText: { fontSize: 10 },
  chapterCard: { minHeight: 103, borderWidth: 1, borderRadius: 21, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  numberCircle: { width: 48, height: 48, borderWidth: 1, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  chapterNumber: { fontSize: 19, fontWeight: '700' },
  chapterDetails: { flex: 1, minWidth: 0 },
  chapterTitle: { fontSize: 15, fontWeight: '700' },
  chapterDate: { fontSize: 10, marginTop: 3 },
  chapterMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  chapterMetaText: { fontSize: 10 },
  statusBadge: { borderRadius: 13, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9 },
  chapterActions: { gap: 6 },
  chapterAction: { minWidth: 57, height: 34, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chapterActionText: { fontSize: 11 },
  empty: { minHeight: 365, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 80, height: 80, borderWidth: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, marginTop: 15 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 30 },
  missingText: { fontSize: 15 },
});
