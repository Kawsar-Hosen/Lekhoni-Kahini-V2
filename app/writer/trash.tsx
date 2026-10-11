import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { WriterHeader } from '@/components/WriterChrome';
import { useWriterContent } from '@/context/WriterContentContext';
import { toBanglaDigits } from '@/lib/adapters';
import { useColors } from '@/hooks/useColors';

export default function WriterTrashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { recycledBooks, restoreBook, permanentlyDeleteBook } = useWriterContent();
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top;
  const [busyId, setBusyId] = React.useState<string | null>(null);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
      <WriterHeader title="রিসাইকেল বিন" backToStudio />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.notice, { backgroundColor: colors.secondary }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>মুছে ফেলা বই ৩০ দিনের মধ্যে ফিরিয়ে আনলে সার্ভারে আবার তৈরি হবে।</Text>
        </View>
        {recycledBooks.length ? recycledBooks.map((book) => (
          <View key={book.id} style={[styles.bookCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Image source={book.coverUrl ? { uri: book.coverUrl } : require('@/assets/images/cover-mystery.jpg')} resizeMode="cover" style={styles.cover} />
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: colors.foreground }]}>{book.title}</Text>
              <Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>{book.category} · {toBanglaDigits(String(book.chapters.length))} পর্ব</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => {
                    if (busyId) return;
                    setBusyId(book.id);
                    void restoreBook(book.id).then((res) => {
                      setBusyId(null);
                      Alert.alert('ফিরিয়ে আনা', res.ok ? 'বইটি সার্ভারে আবার তৈরি হয়েছে।' : 'ফিরিয়ে আনা যায়নি। আবার চেষ্টা করুন।');
                    });
                  }}
                  style={[styles.action, { backgroundColor: colors.success, opacity: busyId === book.id ? 0.6 : 1 }]}
                >
                  <Feather name="rotate-ccw" size={14} color={colors.successText} />
                  <Text style={[styles.actionText, { color: colors.successText }]}>{busyId === book.id ? 'আনা হচ্ছে…' : 'ফিরিয়ে আনুন'}</Text>
                </Pressable>
                <Pressable
                  onPress={() => Alert.alert('স্থায়ীভাবে মুছুন', `“${book.title}” তালিকা থেকে সরাবেন?`, [
                    { text: 'বাতিল', style: 'cancel' },
                    { text: 'স্থায়ীভাবে মুছুন', style: 'destructive', onPress: () => permanentlyDeleteBook(book.id) },
                  ])}
                  style={[styles.action, { backgroundColor: colors.secondary }]}
                >
                  <Feather name="trash-2" size={14} color={colors.destructive} />
                  <Text style={[styles.actionText, { color: colors.destructive }]}>মুছুন</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )) : (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="trash-2" size={27} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>রিসাইকেল বিন খালি</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>মুছে ফেলা বই এখানে দেখা যাবে।</Text>
            <Pressable onPress={() => router.replace('/writer/panel')} style={{ marginTop: 12 }}>
              <Text style={[styles.backText, { color: colors.primary }]}>Writer Studio-তে ফিরুন</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 12 },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 14, padding: 12 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },
  bookCard: { borderWidth: 1, borderRadius: 20, padding: 12, flexDirection: 'row', gap: 12 },
  cover: { width: 69, height: 92, borderRadius: 10 },
  bookInfo: { flex: 1, justifyContent: 'center' },
  bookTitle: { fontSize: 15, fontWeight: '700' },
  bookMeta: { fontSize: 10, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 7, marginTop: 12 },
  action: { minHeight: 34, borderRadius: 18, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 10 },
  empty: { minHeight: 360, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 78, height: 78, borderWidth: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 15 },
  emptyText: { fontSize: 12, marginTop: 5 },
  backText: { fontSize: 12, fontWeight: '700' },
});
