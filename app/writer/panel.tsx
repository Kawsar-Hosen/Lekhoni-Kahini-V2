import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text, AppTextInput } from '@/components/AppText';
import { WriterButton, WriterHeader, WriterSectionHeading, WriterTabBar, type WriterTab } from '@/components/WriterChrome';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useWriterContent, type WriterBook } from '@/context/WriterContentContext';
import { useColors } from '@/hooks/useColors';
import { toBanglaDigits } from '@/lib/adapters';
import { useQuery } from '@tanstack/react-query';
import { fetchReferral, fetchWriterDashboard } from '@/lib/api';

const storySortOptions = [
  { id: 'newest', label: 'নতুন যুক্ত প্রথমে (ডিফল্ট)', shortLabel: 'নতুন যুক্ত' },
  { id: 'oldest', label: 'পুরানো যুক্ত প্রথমে', shortLabel: 'পুরানো যুক্ত' },
  { id: 'titleAsc', label: 'নামের ক্রমানুসারে (ক - হ)', shortLabel: 'নাম (ক - হ)' },
  { id: 'titleDesc', label: 'নামের ক্রমানুসারে (হ - ক)', shortLabel: 'নাম (হ - ক)' },
  { id: 'chaptersHigh', label: 'সর্বোচ্চ পর্ব প্রথমে', shortLabel: 'বেশি পর্ব' },
  { id: 'chaptersLow', label: 'সর্বনিম্ন পর্ব প্রথমে', shortLabel: 'কম পর্ব' },
] as const;
type StorySort = (typeof storySortOptions)[number]['id'];

export default function WriterPanelScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useWriterAccess();
  const [tab, setTab] = useState<WriterTab>('dashboard');

  useEffect(() => {
    if (!session) router.replace('/auth/login');
  }, [session]);

  if (!session) return null;

  const topPadding = Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top;
  const title = tab === 'dashboard' ? 'Writer Studio' : tab === 'stories' ? 'আমার গল্প সমূহ' : 'লেখক প্রোফাইল';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View pointerEvents="none" style={[styles.pinkOrbTop, { backgroundColor: colors.secondary }]} />
      <View pointerEvents="none" style={[styles.pinkOrbBottom, { backgroundColor: colors.secondary }]} />
      <WriterHeader title={title} />
      {tab === 'dashboard' ? <DashboardTab onStories={() => setTab('stories')} /> : null}
      {tab === 'stories' ? <StoriesTab /> : null}
      {tab === 'profile' ? <ProfileTab /> : null}
      <WriterTabBar active={tab} onChange={setTab} />
    </View>
  );
}

function DashboardTab({ onStories }: { onStories: () => void }) {
  const colors = useColors();
  const { books } = useWriterContent();
  const { session, token } = useWriterAccess();
  const dashboardQuery = useQuery({
    queryKey: ['writer-dashboard', token ?? ''],
    queryFn: () => (token ? fetchWriterDashboard(token).then((r) => r.data) : Promise.resolve(null)),
    enabled: Boolean(token),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnReconnect: true,
  });
  const referralQuery = useQuery({
    queryKey: ['writer-referral', token ?? ''],
    queryFn: () => (token ? fetchReferral(token).then((r) => r.data) : Promise.resolve(null)),
    enabled: Boolean(token),
    staleTime: 60_000,
    refetchOnReconnect: true,
  });
  const dash = dashboardQuery.data && 'stories' in dashboardQuery.data ? dashboardQuery.data : null;
  const earnings = referralQuery.data && 'earnings' in referralQuery.data ? referralQuery.data.earnings : 0;
  const bookCount = dash?.stories ?? books.length;
  const chapterCount = books.reduce((total, book) => total + (book.chaptersCount || book.chapters.length), 0);
  const followerCount = dash?.followers ?? session?.followerCount ?? 0;
  const likeCount = dash?.totalLikes ?? books.reduce((total, book) => total + book.totalLikes, 0);

  return (
    <ScrollView contentContainerStyle={styles.dashboardContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.incomeCard, { backgroundColor: colors.writerGreen }]}>
        <View style={[styles.incomeOrb, { backgroundColor: colors.primaryForeground }]} />
        <Text style={[styles.incomeCaption, { color: colors.primaryForeground }]}>এ মাসের আয়</Text>
        <Text style={[styles.incomeValue, { color: colors.primaryForeground }]}>৳{toBanglaDigits(earnings.toFixed(2))}</Text>
        <View style={styles.incomeFooter}>
          <Text style={[styles.incomeTotal, { color: colors.success }]}>মোট ভিউ: {toBanglaDigits(String(dash?.totalViews ?? 0))}</Text>
          <View style={styles.incomeActions}>
            <Pressable onPress={() => router.push('/writer/monetization')} style={[styles.incomePill, { backgroundColor: colors.primaryForeground }]}>
              <Text style={[styles.incomePillText, { color: colors.writerGreen }]}>মনিটাইজেশন</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/writer/earnings')} style={[styles.incomePill, { backgroundColor: colors.primaryForeground }]}>
              <Text style={[styles.incomePillText, { color: colors.writerGreen }]}>ইনকাম লিস্ট</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.statGrid}>
        <StatCard icon="book-open" value={toBanglaDigits(String(bookCount))} label="মোট বই" color={colors.skyText} />
        <StatCard icon="users" value={toBanglaDigits(String(followerCount))} label="ফলোয়ার" color={colors.primary} />
        <StatCard icon="trending-up" value={toBanglaDigits(String(chapterCount))} label="বই পর্ব" color={colors.successText} />
        <StatCard icon="thumbs-up" value={toBanglaDigits(String(likeCount))} label="লাইক ও প্রতিক্রিয়া" color={colors.destructive} />
        <StatCard icon="clock" value={toBanglaDigits(String(dash?.pending ?? 0))} label="পেন্ডিং রিভিউ" color={colors.authorAction} />
        <StatCard icon="bell" value={toBanglaDigits(String(dash?.todayViews ?? 0))} label="আজকের ভিউ" color={colors.skyText} />
      </View>

      <WriterSectionHeading title="সাম্প্রতিক গল্প" action="♲ রিসাইকেল বিন" onAction={() => router.push('/writer/trash')} />
      {books.length > 0 ? (
        <BookCard book={books[0]} author={session?.displayName ?? books[0].author} compact />
      ) : (
        <EmptyBooks />
      )}
      <Pressable onPress={onStories} style={styles.seeAll}>
        <Text style={[styles.seeAllText, { color: colors.primary }]}>সব গল্প দেখুন</Text>
        <Feather name="arrow-right" size={16} color={colors.primary} />
      </Pressable>
    </ScrollView>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ComponentProps<typeof Feather>['name']; value: string; label: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={24} color={color} />
      <View style={styles.statCopy}>
        <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </View>
  );
}

function StoriesTab() {
  const colors = useColors();
  const { books, deleteBook } = useWriterContent();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'book' | 'audio' | 'live' | 'review' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<StorySort>('newest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const filters = [
    { id: 'all' as const, label: 'সব বই', count: books.length },
    { id: 'book' as const, label: 'পর্বের বই', count: books.filter((book) => book.kind !== 'ভয়েস').length },
    { id: 'audio' as const, label: 'অডিও বই', count: books.filter((book) => book.kind !== 'বই').length },
    { id: 'live' as const, label: 'লাইভ', count: books.filter((book) => book.status === 'লাইভ').length },
    { id: 'review' as const, label: 'রিভিউ চলছে', count: books.filter((book) => book.status === 'রিভিউ চলছে').length },
    { id: 'draft' as const, label: 'খসড়া', count: books.filter((book) => book.status === 'খসড়া').length },
  ];
  const visibleBooks = books
    .filter((book) => filter === 'all'
      || (filter === 'book' && book.kind !== 'ভয়েস')
      || (filter === 'audio' && book.kind !== 'বই')
      || (filter === 'live' && book.status === 'লাইভ')
      || (filter === 'review' && book.status === 'রিভিউ চলছে')
      || (filter === 'draft' && book.status === 'খসড়া'))
    .filter((book) => `${book.title} ${book.author}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      const newestFirst = books.indexOf(a) - books.indexOf(b);
      switch (sortBy) {
        case 'oldest': return -newestFirst;
        case 'titleAsc': return a.title.localeCompare(b.title, 'bn');
        case 'titleDesc': return b.title.localeCompare(a.title, 'bn');
        case 'chaptersHigh': return (b.chaptersCount || b.chapters.length) - (a.chaptersCount || a.chapters.length) || newestFirst;
        case 'chaptersLow': return (a.chaptersCount || a.chapters.length) - (b.chaptersCount || b.chapters.length) || newestFirst;
        default: return newestFirst;
      }
    });

  return (
    <>
      <ScrollView contentContainerStyle={styles.storiesContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={20} color={colors.mutedForeground} />
          <AppTextInput
            accessibilityLabel="বই খুঁজুন"
            value={search}
            onChangeText={setSearch}
            placeholder="বইয়ের নাম, প্রথম অক্ষর বা লেখকের নাম লিখুন..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search ? <Pressable onPress={() => setSearch('')}><Feather name="x-circle" size={18} color={colors.mutedForeground} /></Pressable> : null}
        </View>
        <WriterButton label="নতুন বই যুক্ত করুন +" variant="outline" onPress={() => router.push('/writer/book-form')} />
        <View style={styles.listHeading}>
          <Text style={[styles.listTitle, { color: colors.foreground }]}>আপনার বইসমূহ</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="বই সাজানোর ক্রম বেছে নিন"
            onPress={() => setSortMenuOpen(true)}
            style={[styles.sortButton, { borderColor: colors.border }]}
          >
            <Feather name="sliders" size={15} color={colors.mutedForeground} />
            <Text style={[styles.sortText, { color: colors.mutedForeground }]}>সাজানো: {storySortOptions.find((option) => option.id === sortBy)?.shortLabel}</Text>
            <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <View style={styles.filterWrap}>
          {filters.map((item) => {
            const selected = item.id === filter;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.filterPill, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
              >
                <Text style={[styles.filterText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{item.label} {item.count}</Text>
              </Pressable>
            );
          })}
        </View>
        {visibleBooks.length ? visibleBooks.map((book) => (
          <BookCard key={book.id} book={book} busy={busyId === book.id} onDelete={() => {
            Alert.alert('বই মুছুন', `“${book.title}” মুছে ফেলতে চান? মুছে ফেলা বই রিসাইকেল বিনে যাবে।`, [
              { text: 'বাতিল', style: 'cancel' },
              {
                text: 'মুছুন',
                style: 'destructive',
                onPress: () => {
                  setBusyId(book.id);
                  void deleteBook(book.id).then((res) => {
                    setBusyId(null);
                    if (!res.ok) Alert.alert('মোছা যায়নি', 'আবার চেষ্টা করুন।');
                  });
                },
              },
            ]);
          }} />
        )) : <EmptyBooks searching={!!search || filter !== 'all'} />}
      </ScrollView>
      <Modal transparent visible={sortMenuOpen} animationType="fade" onRequestClose={() => setSortMenuOpen(false)}>
        <View style={styles.sortModalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="সাজানোর তালিকা বন্ধ করুন"
            onPress={() => setSortMenuOpen(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.modalOverlay }]}
          />
          <View style={[styles.sortDialog, { backgroundColor: colors.card }]}>
            <Text style={[styles.sortDialogTitle, { color: colors.foreground }]}>বই সাজানোর ক্রম নির্বাচন করুন</Text>
            {storySortOptions.map((option) => {
              const selected = sortBy === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setSortBy(option.id);
                    setSortMenuOpen(false);
                  }}
                  style={styles.sortOption}
                >
                  <View style={[styles.sortRadio, { borderColor: selected ? colors.writerGreen : colors.mutedForeground }]}>
                    {selected ? <View style={[styles.sortRadioDot, { backgroundColor: colors.writerGreen }]} /> : null}
                  </View>
                  <Text style={[styles.sortOptionText, { color: colors.foreground }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

function BookCard({
  book,
  author,
  compact = false,
  busy = false,
  onDelete,
}: {
  book: WriterBook;
  author?: string;
  compact?: boolean;
  busy?: boolean;
  onDelete?: () => void;
}) {
  const colors = useColors();
  const cover = book.cover ?? require('@/assets/images/cover-mystery.jpg');
  const chapterCount = book.chaptersCount || book.chapters.length;
  return (
    <View style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }, compact && styles.compactBookCard]}>
      <Pressable style={styles.bookMain} onPress={() => router.push({ pathname: '/writer/book/[id]', params: { id: book.id } })}>
        <Image source={cover} resizeMode="cover" style={styles.coverImage} />
        <View style={styles.bookDetails}>
          <Text numberOfLines={2} style={[styles.bookTitle, { color: colors.foreground }]}>{compact ? `বই: ${book.title}` : book.title}</Text>
          <Text numberOfLines={1} style={[styles.bookMeta, { color: colors.mutedForeground }]}>
            লেখক: {author ?? book.author} | {book.category}
          </Text>
          <View style={styles.bookBadges}>
            <Badge label={book.kind === 'বই' ? 'পর্বের বই' : book.kind} tone="neutral" />
            <Badge label={book.status} tone={book.status === 'লাইভ' ? 'green' : 'blue'} />
            <Badge label={`মোট পর্ব: ${toBanglaDigits(String(chapterCount))}`} tone="blue" />
          </View>
          <View style={[styles.bookMetrics, { borderColor: colors.border }]}>
            <Metric icon="eye" value={toBanglaDigits(String(book.totalViews))} />
            <Metric icon="thumbs-up" value={toBanglaDigits(String(book.totalLikes))} />
            <Metric icon="heart" value="০" />
            <Metric icon="thumbs-down" value="০" />
          </View>
        </View>
        <Badge label="Serial-1" tone="blue" />
      </Pressable>
      {!compact ? (
        <View style={[styles.bookActions, { borderTopColor: colors.border }]}>
          <SmallAction label="এডিট" onPress={() => router.push({ pathname: '/writer/book-form', params: { bookId: book.id } })} />
          <SmallAction label="পর্বসমূহ" tone="blue" onPress={() => router.push({ pathname: '/writer/book/[id]', params: { id: book.id } })} />
          <SmallAction label="ডিলিট" tone="red" onPress={onDelete ?? (() => Alert.alert('বই', 'বইটি মুছে ফেলা যাবে।'))} />
        </View>
      ) : null}
    </View>
  );
}

function Badge({ label, tone }: { label: string; tone: 'neutral' | 'green' | 'blue' }) {
  const colors = useColors();
  const backgroundColor = tone === 'green' ? colors.success : tone === 'blue' ? colors.sky : colors.muted;
  const color = tone === 'green' ? colors.successText : tone === 'blue' ? colors.skyText : colors.mutedForeground;
  return <View style={[styles.badge, { backgroundColor }]}><Text style={[styles.badgeText, { color }]}>{label}</Text></View>;
}

function Metric({ icon, value }: { icon: React.ComponentProps<typeof Feather>['name']; value: string }) {
  const colors = useColors();
  return <View style={styles.metric}><Feather name={icon} size={14} color={colors.mutedForeground} /><Text style={[styles.metricText, { color: colors.mutedForeground }]}>{value}</Text></View>;
}

function SmallAction({ label, onPress, tone = 'neutral' }: { label: string; onPress: () => void; tone?: 'neutral' | 'blue' | 'red' }) {
  const colors = useColors();
  const borderColor = colors.border;
  const color = tone === 'red' ? colors.destructive : tone === 'blue' ? colors.skyText : colors.foreground;
  return <Pressable onPress={onPress} style={[styles.smallAction, { backgroundColor: colors.muted, borderColor }]}><Text style={[styles.smallActionText, { color }]}>{label}</Text></Pressable>;
}

function EmptyBooks({ searching = false }: { searching?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="book-open" size={31} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{searching ? 'কোনো বই পাওয়া যায়নি' : 'কোনো বই পাওয়া যায়নি।'}</Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {searching ? 'অন্য নাম বা ফিল্টার দিয়ে আবার খুঁজুন।' : 'নতুন বই যুক্ত করতে উপরের “নতুন বই যুক্ত করুন +” বোতামে চাপ দিন।'}
      </Text>
    </View>
  );
}

function ProfileTab() {
  const colors = useColors();
  const { session, updateProfile } = useWriterAccess();
  const [name, setName] = useState(session?.displayName ?? '');
  const [bio, setBio] = useState(session?.bio ?? '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    if (!name.trim()) {
      Alert.alert('নাম প্রয়োজন', 'প্রোফাইলে দেখানোর জন্য আপনার নাম লিখুন।');
      return;
    }
    setSaving(true);
    const res = await updateProfile(name, bio);
    setSaving(false);
    if (!res.ok) {
      Alert.alert('সংরক্ষণ হয়নি', 'আবার চেষ্টা করুন।');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <ScrollView contentContainerStyle={styles.profileContent} keyboardShouldPersistTaps="handled">
      <View style={[styles.avatar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Image source={session?.avatarUrl ? { uri: session.avatarUrl } : require('@/assets/images/author-profile.png')} resizeMode="cover" style={styles.avatarPhoto} />
      </View>
      <ProfileField label="লেখকের নাম" value={name} onChangeText={setName} />
      <ProfileField label="মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)" value={session?.phone || 'নম্বর যোগ করা হয়নি'} editable={false} />
      <ProfileField label="ইমেল ঠিকানা (পরিবর্তনযোগ্য নয়)" value={session?.username ?? ''} editable={false} />
      <ProfileField label="পরিচিতি (Bio)" value={bio} onChangeText={setBio} multiline />
      <WriterButton label={saving ? 'সংরক্ষণ হচ্ছে…' : saved ? 'পরিবর্তন সংরক্ষিত' : 'প্রোফাইল পরিবর্তন সংরক্ষণ করুন'} icon={saved ? 'check' : 'save'} onPress={() => void save()} />
      <Text style={[styles.profileNotice, { color: colors.mutedForeground }]}>প্রোফাইলের পরিবর্তন সার্ভারে সংরক্ষণ করা হয়।</Text>
    </ScrollView>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  editable = true,
  multiline = false,
  secureTextEntry = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  multiline?: boolean;
  secureTextEntry?: boolean;
  placeholder?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.profileField}>
      <Text style={[styles.fieldLabel, { color: editable ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
      <AppTextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.profileInput,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
          multiline && styles.profileBioInput,
          !editable && styles.disabledInput,
        ]}
      />
      {!editable ? <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.lockIcon} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  pinkOrbTop: { position: 'absolute', right: -75, top: 70, width: 150, height: 150, borderRadius: 80, opacity: 0.7 },
  pinkOrbBottom: { position: 'absolute', left: -75, bottom: 90, width: 180, height: 180, borderRadius: 90, opacity: 0.75 },
  dashboardContent: { paddingHorizontal: 19, paddingTop: 19, paddingBottom: 112 },
  incomeCard: { minHeight: 143, borderRadius: 24, paddingHorizontal: 17, paddingVertical: 13, overflow: 'hidden', elevation: 3 },
  incomeOrb: { position: 'absolute', right: -8, top: -24, width: 98, height: 98, borderRadius: 50, opacity: 0.12 },
  incomeCaption: { fontSize: 16 },
  incomeValue: { fontSize: 31, lineHeight: 42, fontWeight: '700', marginTop: 3 },
  incomeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7, marginTop: 4 },
  incomeTotal: { fontSize: 12, flexShrink: 1 },
  incomeActions: { flexDirection: 'row', gap: 7 },
  incomePill: { borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 },
  incomePillText: { fontSize: 10, fontWeight: '700' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 19 },
  statCard: { width: '48%', minHeight: 89, flexGrow: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statCopy: { flexShrink: 1 },
  statValue: { fontSize: 20, lineHeight: 27 },
  statLabel: { fontSize: 12 },
  bookCard: { borderWidth: 1, borderRadius: 21, padding: 12, marginBottom: 12 },
  compactBookCard: { marginBottom: 0 },
  bookMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  coverImage: { width: 76, height: 106, borderRadius: 12 },
  bookDetails: { flex: 1, minWidth: 0 },
  bookTitle: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  bookMeta: { fontSize: 11, marginTop: 2 },
  bookBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14 },
  badgeText: { fontSize: 9, lineHeight: 14 },
  bookMetrics: { borderTopWidth: 1, flexDirection: 'row', gap: 11, paddingTop: 6, marginTop: 7, alignSelf: 'flex-start' },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { fontSize: 10 },
  bookActions: { borderTopWidth: 1, flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 9 },
  smallAction: { flex: 1, minHeight: 39, borderWidth: 1, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  smallActionText: { fontSize: 12, fontWeight: '600' },
  seeAll: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 14 },
  seeAllText: { fontSize: 13, fontWeight: '700' },
  storiesContent: { paddingHorizontal: 19, paddingTop: 19, paddingBottom: 112, gap: 12 },
  searchBox: { minHeight: 56, borderWidth: 1, borderRadius: 30, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 13, paddingVertical: 8 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 },
  listTitle: { fontSize: 16, fontWeight: '700' },
  sortButton: { minHeight: 39, borderWidth: 1, borderRadius: 22, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortText: { fontSize: 10 },
  sortModalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 },
  sortDialog: { width: '100%', maxWidth: 430, borderRadius: 2, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12, elevation: 14, shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  sortDialogTitle: { fontSize: 19, lineHeight: 28, fontWeight: '600', marginBottom: 8 },
  sortOption: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 18 },
  sortRadio: { width: 24, height: 24, borderWidth: 2, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sortRadioDot: { width: 12, height: 12, borderRadius: 8 },
  sortOptionText: { fontSize: 16, lineHeight: 23, flexShrink: 1 },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterPill: { minHeight: 38, borderWidth: 1, borderRadius: 21, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 11 },
  emptyState: { minHeight: 245, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyIcon: { width: 82, height: 82, borderWidth: 1.5, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyDescription: { fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 6, maxWidth: 310 },
  profileContent: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 114, gap: 5 },
  avatar: { width: 88, height: 88, borderWidth: 1, borderRadius: 48, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 11, overflow: 'hidden' },
  avatarPhoto: { width: '100%', height: '100%' },
  profileField: { marginBottom: 8 },
  fieldLabel: { fontSize: 14, marginBottom: 7 },
  profileInput: { minHeight: 54, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15, paddingVertical: 13, fontSize: 14 },
  profileBioInput: { minHeight: 105, textAlignVertical: 'top' },
  disabledInput: { paddingRight: 40 },
  lockIcon: { position: 'absolute', right: 15, bottom: 19 },
  profileNotice: { fontSize: 10, textAlign: 'center', marginTop: 3 },
});
