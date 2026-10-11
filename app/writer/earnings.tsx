import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { WriterHeader } from '@/components/WriterChrome';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useWriterContent } from '@/context/WriterContentContext';
import { useColors } from '@/hooks/useColors';
import { toBanglaDigits } from '@/lib/adapters';
import { fetchReferral } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

type EarningsTab = 'income' | 'books';

export default function WriterEarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books } = useWriterContent();
  const { token } = useWriterAccess();
  const [tab, setTab] = useState<EarningsTab>('books');
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top;
  const { data: referral } = useQuery({
    queryKey: ['writer-referral', token ?? ''],
    queryFn: () => (token ? fetchReferral(token).then((r) => r.data) : Promise.resolve(null)),
    enabled: Boolean(token),
    staleTime: 60_000,
    refetchOnReconnect: true,
  });
  const earnings = referral && 'earnings' in referral ? referral.earnings : 0;
  const uses = referral && 'uses' in referral ? referral.uses : 0;
  const amount = `৳${toBanglaDigits(earnings.toFixed(2))}`;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
      <WriterHeader title="উপার্জন ও উত্তোলন" backToStudio />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.balanceCard, { borderColor: colors.primary, backgroundColor: colors.card }]}>
          <Text style={[styles.balanceLabel, { color: colors.primary }]}>উত্তোলনযোগ্য ব্যালেন্স</Text>
          <View style={styles.balanceLine}>
            <Text style={[styles.balanceAmount, { color: colors.primary }]}>{amount}</Text>
            <Pressable onPress={() => Alert.alert('উত্তোলন', 'উত্তোলনের জন্য রেফারেল আয় পর্যাপ্ত হলে সাপোর্টে যোগাযোগ করুন।')} style={[styles.withdrawButton, { borderColor: colors.primary }]}>
              <Text style={[styles.withdrawLabel, { color: colors.primary }]}>উত্তোলন করুন</Text>
            </Pressable>
          </View>
          <View style={[styles.balanceStats, { borderTopColor: colors.border }]}>
            <BalanceStat label="মোট আয়" amount={amount} />
            <BalanceStat label="রেফারেল ব্যবহার" amount={toBanglaDigits(String(uses))} />
            <BalanceStat label="মোট উত্তোলন" amount="৳০.০০" />
          </View>
        </View>

        <View style={[styles.segment, { backgroundColor: colors.muted }]}>
          <SegmentButton active={tab === 'income'} label="ইনকাম লিস্ট" icon="clock" onPress={() => setTab('income')} />
          <SegmentButton active={tab === 'books'} label="বই উপার্জন" icon="book-open" onPress={() => setTab('books')} />
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionMarker, { backgroundColor: colors.writerGreen }]} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{tab === 'books' ? 'বইয়ের বিবরণ ও উপার্জন' : 'সাম্প্রতিক ইনকাম'}</Text>
        </View>
        {tab === 'books' ? (
          books.map((book) => (
            <Pressable
              key={book.id}
              onPress={() => router.push({ pathname: '/writer/book/[id]', params: { id: book.id } })}
              style={[styles.earningBook, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.bookIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="book-open" size={20} color={colors.primary} />
              </View>
              <View style={styles.bookInfo}>
                <Text style={[styles.bookTitle, { color: colors.foreground }]}>{book.title}</Text>
                <Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>{book.category} · ভিউ: {toBanglaDigits(String(book.totalViews))} · আয়: ৳০.০০</Text>
              </View>
              <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
                <Feather name="check" size={12} color={colors.successText} />
                <Text style={[styles.activeLabel, { color: colors.successText }]}>{book.status}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={[styles.emptyIncome, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="trending-up" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>এখনো কোনো ইনকাম নেই</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>রেফারেল কোড শেয়ার করে আয় শুরু করুন।</Text>
          </View>
        )}
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>রেফারেল আয়ের হিসাব সার্ভার থেকে সরাসরি আসে।</Text>
      </ScrollView>
    </View>
  );
}

function BalanceStat({ label, amount }: { label: string; amount: string }) {
  const colors = useColors();
  return <View style={styles.balanceStat}><Text style={[styles.balanceStatLabel, { color: colors.primary }]}>{label}</Text><Text style={[styles.balanceStatValue, { color: colors.primary }]}>{amount}</Text></View>;
}

function SegmentButton({ active, label, icon, onPress }: { active: boolean; label: string; icon: React.ComponentProps<typeof Feather>['name']; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && { backgroundColor: colors.accent }]}>
      <Feather name={icon} size={15} color={active ? colors.primary : colors.mutedForeground} />
      <Text style={[styles.segmentLabel, { color: active ? colors.primary : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  balanceCard: { borderWidth: 1.5, borderRadius: 25, padding: 20 },
  balanceLabel: { fontSize: 15, fontWeight: '600' },
  balanceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  balanceAmount: { fontSize: 30, fontWeight: '700' },
  withdrawButton: { minHeight: 40, borderWidth: 1.5, borderRadius: 22, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  withdrawLabel: { fontSize: 13, fontWeight: '700' },
  balanceStats: { borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 15, paddingTop: 14 },
  balanceStat: { flex: 1 },
  balanceStatLabel: { fontSize: 11 },
  balanceStatValue: { fontSize: 15, fontWeight: '700', marginTop: 5 },
  segment: { minHeight: 54, borderRadius: 29, flexDirection: 'row', marginTop: 22, padding: 3 },
  segmentButton: { flex: 1, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  segmentLabel: { fontSize: 12 },
  section: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 24, marginBottom: 13 },
  sectionMarker: { width: 4, height: 23, borderRadius: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  earningBook: { minHeight: 104, borderWidth: 1, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  bookIcon: { width: 45, height: 60, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 14, fontWeight: '700' },
  bookMeta: { fontSize: 10, marginTop: 5 },
  activeBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  activeLabel: { fontSize: 9 },
  emptyIncome: { minHeight: 220, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 23 },
  emptyIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { textAlign: 'center', fontSize: 11, lineHeight: 18, marginTop: 5 },
  disclaimer: { fontSize: 10, textAlign: 'center', marginTop: 18 },
});
