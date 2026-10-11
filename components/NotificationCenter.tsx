import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';
import { useBooks } from '@/hooks/useLekhoni';
import { coverSource } from '@/lib/adapters';
import { bookViews, displayAuthor } from '@/lib/api';
import type { ImageSourcePropType } from 'react-native';

type NotificationCenterProps = {
  visible: boolean;
  onClose: () => void;
};

type NotificationFilter = 'সব' | 'নোটিশ' | 'পর্ব' | 'বই';
type PreviewNotification = {
  id: string;
  title: string;
  body: string;
  date: string;
  type: Exclude<NotificationFilter, 'সব'>;
  badge: 'লিংক' | 'পর্ব' | 'বই';
  cover?: ImageSourcePropType;
  icon?: keyof typeof Feather.glyphMap;
  accent?: string;
};

const filters: NotificationFilter[] = ['সব', 'নোটিশ', 'পর্ব', 'বই'];

export function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: apiBooks } = useBooks();
  const live = [...(apiBooks ?? [])].sort((a, b) => bookViews(b) - bookViews(a));
  const top = live[0];
  const second = live[1] ?? top;
  const previewNotifications: PreviewNotification[] = [
    {
      id: 'community-whatsapp',
      title: 'হোয়াটসঅ্যাপ গ্রুপ',
      body: 'এখনই যুক্ত হন আমাদের অফিসিয়াল হোয়াটসঅ্যাপ গ্রুপে।',
      date: '২১ সেপ্টেম্বর ২০২৬',
      type: 'নোটিশ',
      badge: 'লিংক',
      icon: 'message-circle',
      accent: '#38a783',
    },
    {
      id: 'new-audio-book',
      title: top ? `নতুন বই যোগ হয়েছে: ${top.title}` : 'নতুন বই যোগ হয়েছে!',
      body: top ? `“${top.title}” — লেখক: ${displayAuthor(top)}। এখনই পড়তে শুরু করুন।` : 'নতুন বই শিগগিরই আসছে।',
      date: 'সর্বশেষ আপডেট',
      type: 'বই',
      badge: 'বই',
      cover: top ? coverSource(top.cover_url, top.id) : undefined,
    },
    {
      id: 'important-announcement',
      title: 'গুরুত্বপূর্ণ ঘোষণা!',
      body: 'লেখনি কাহিনীতে নতুন আপডেট ও পাঠকদের জন্য বিশেষ ঘোষণা।',
      date: '১৯ আগস্ট ২০২৬',
      type: 'নোটিশ',
      badge: 'লিংক',
      icon: 'volume-2',
      accent: '#a02456',
    },
    {
      id: 'new-episode',
      title: 'নতুন পর্ব যোগ হয়েছে!',
      body: second ? `“${second.title}”-এর নতুন পর্ব এখনই পড়ে দেখুন।` : 'নতুন পর্ব শিগগিরই আসছে।',
      date: 'সর্বশেষ আপডেট',
      type: 'পর্ব',
      badge: 'পর্ব',
      cover: second ? coverSource(second.cover_url, second.id) : undefined,
    },
    {
      id: 'community-facebook',
      title: 'অফিসিয়াল ফেসবুক গ্রুপে যোগ দিন!',
      body: 'নতুন আপডেট, গল্পের আলোচনা ও গুরুত্বপূর্ণ ঘোষণা পেতে সঙ্গে থাকুন।',
      date: '৩১ জুলাই ২০২৬',
      type: 'নোটিশ',
      badge: 'লিংক',
      icon: 'facebook',
      accent: '#2877dc',
    },
  ];
  const topInset = insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const [selectedFilter, setSelectedFilter] = React.useState<NotificationFilter>('সব');
  const visibleNotifications = selectedFilter === 'সব'
    ? previewNotifications
    : previewNotifications.filter((item) => item.type === selectedFilter);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <View style={styles.header}>
          <Pressable testID="close-notifications" onPress={onClose} hitSlop={10} style={styles.headerSide}>
            <Feather name="arrow-left" size={25} color={colors.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>নোটিফিকেশন</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={[styles.filterTrack, { backgroundColor: colors.secondary }]}>
          {filters.map((filter) => {
            const selected = selectedFilter === filter;
            return (
              <Pressable
                key={filter}
                testID={`notification-filter-${filter}`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setSelectedFilter(filter)}
                style={({ pressed }) => [
                  styles.filterButton,
                  selected && { backgroundColor: colors.card },
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Text style={[styles.filterText, { color: selected ? colors.primary : colors.mutedForeground }]}>{filter}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 22 }]}
          showsVerticalScrollIndicator={false}
        >
          {visibleNotifications.length ? visibleNotifications.map((item) => (
            <NotificationCard key={item.id} item={item} colors={colors} />
          )) : (
            <View style={styles.empty}>
              <Feather name="bell-off" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>এই বিভাগে এখনো কোনো নোটিফিকেশন নেই</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function NotificationCard({ item, colors }: { item: PreviewNotification; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.thumbnail, { backgroundColor: item.accent ?? colors.secondary }]}>
        {item.cover ? (
          <Image source={item.cover} resizeMode="cover" style={styles.thumbnailImage} />
        ) : (
          <View style={styles.socialTile}>
            <Feather name={item.icon ?? 'bell'} size={29} color={colors.primaryForeground} />
            <Text style={[styles.socialLabel, { color: colors.primaryForeground }]}>লেখনী</Text>
          </View>
        )}
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={2} style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
        <Text style={[styles.rowBody, { color: colors.mutedForeground }]}>{item.body}</Text>
        <View style={styles.rowFooter}>
          <View style={[styles.tag, { backgroundColor: item.badge === 'বই' || item.badge === 'পর্ব' ? colors.secondary : colors.cream }]}>
            <Text style={[styles.tagText, { color: item.badge === 'বই' || item.badge === 'পর্ব' ? colors.successText : colors.accentForeground }]}>{item.badge}</Text>
          </View>
          <Text numberOfLines={1} style={[styles.rowTime, { color: colors.mutedForeground }]}>{item.date}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 66, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSide: { width: 42, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  filterTrack: { minHeight: 52, marginHorizontal: 18, marginTop: 13, marginBottom: 20, padding: 5, borderRadius: 28, flexDirection: 'row', alignItems: 'center' },
  filterButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 23 },
  filterText: { fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 18, gap: 14 },
  row: { minHeight: 148, borderRadius: 22, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 13 },
  thumbnail: { width: 68, height: 96, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbnailImage: { width: '100%', height: '100%' },
  socialTile: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 7 },
  socialLabel: { fontSize: 10, fontWeight: '700' },
  rowCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '700', lineHeight: 23 },
  rowBody: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 },
  tag: { minWidth: 41, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 13, alignItems: 'center' },
  tagText: { fontSize: 10, fontWeight: '600' },
  rowTime: { flexShrink: 1, fontSize: 10 },
  empty: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 13 },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 26 },
});