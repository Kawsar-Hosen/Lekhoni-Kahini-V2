import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBooks } from '@/hooks/useLekhoni';
import { toUiBook } from '@/lib/adapters';
import { bookViews } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function AudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: apiBooks } = useBooks();
  const books = [...(apiBooks ?? [])].sort((a, b) => bookViews(b) - bookViews(a)).slice(0, 3).map(toUiBook);
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Platform.OS === 'web' ? 105 : 92 }}>
      <View style={styles.header}><Pressable testID="audio-back" onPress={() => goBackOrFallback('/')} hitSlop={10} accessibilityRole="button" accessibilityLabel="ফিরে যান"><Feather name="arrow-left" size={23} color={colors.primary} /></Pressable><Text style={[styles.title, { color: colors.primary }]}>অডিও গল্প</Text><View style={{ width: 23 }} /></View>
      <View style={[styles.hero, { backgroundColor: colors.deepInk }]}>
        <View style={[styles.heroOrb, { backgroundColor: colors.wine }]} />
        <View style={styles.heroCopy}><Text style={styles.eyebrow}>শুনুন, চোখ বন্ধ করে</Text><Text style={styles.heroTitle}>গল্প এখন আপনার কানে</Text><Text style={styles.heroText}>যাতায়াত বা বিশ্রামের সময় প্রিয় গল্প শুনুন।</Text></View>
        <View style={styles.headphone}><Feather name="headphones" size={34} color={colors.deepInk} /></View>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>শ্রোতাদের পছন্দ</Text>
      <View style={styles.list}>{books.slice(0, 3).map((book, index) => <Pressable key={book.id} onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })} style={[styles.audioCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.number, { backgroundColor: colors.accent }]}><Text style={[styles.numberText, { color: colors.primary }]}>0{index + 1}</Text></View><View style={styles.audioCopy}><Text style={[styles.bookTitle, { color: colors.foreground }]}>{book.title}</Text><Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>{book.author} • ১২ মিনিট</Text></View><View style={[styles.play, { backgroundColor: colors.primary }]}><MaterialIcons name="play-arrow" size={19} color={colors.primaryForeground} /></View></Pressable>)}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { height: 67, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  hero: { height: 186, marginHorizontal: 18, borderRadius: 24, overflow: 'hidden', padding: 22, justifyContent: 'center' },
  heroOrb: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -70, top: -44, opacity: 0.8 },
  heroCopy: { width: '67%' },
  eyebrow: { color: 'rgba(255,255,255,0.62)', fontSize: 11, marginBottom: 7 },
  heroTitle: { color: '#fff', fontFamily: 'serif', fontSize: 23, fontWeight: '700' },
  heroText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 19, marginTop: 7 },
  headphone: { position: 'absolute', right: 26, bottom: 28, width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: 'serif', fontSize: 19, fontWeight: '700', marginHorizontal: 20, marginTop: 28, marginBottom: 12 },
  list: { paddingHorizontal: 18, gap: 10 },
  audioCard: { minHeight: 74, borderWidth: 1, borderRadius: 17, padding: 11, flexDirection: 'row', alignItems: 'center' },
  number: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, fontWeight: '700' },
  audioCopy: { flex: 1, paddingLeft: 12 },
  bookTitle: { fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
  bookMeta: { fontSize: 11, marginTop: 5 },
  play: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});