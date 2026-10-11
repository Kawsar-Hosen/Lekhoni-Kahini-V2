import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppText';
import { AboutModal, ContactModal, PrivacyModal } from '@/components/InfoModals';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useDisplay } from '@/context/DisplayContext';
import { useLibrary } from '@/context/LibraryContext';
import { addNote, clearSearchHistory, deleteNote, getNotes, getSearchHistory, type NoteItem } from '@/lib/storage';
import { clearAllOfflineChapters, formatBytes, getOfflineBytes } from '@/lib/offline';

export type MenuDestination = 'home' | 'library' | 'categories' | 'audio' | 'notifications' | 'settings' | 'about' | 'login' | 'register' | 'following';

type MenuDrawerProps = {
  visible: boolean;
  active: MenuDestination;
  onClose: () => void;
  onNavigate: (destination: MenuDestination) => void;
  profileName?: string;
  themeLabel?: string;
  onOpenName?: () => void;
  onOpenTheme?: () => void;
};

type MenuItem = {
  label: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  destination: MenuDestination;
  iconColor: string;
};

const communityItems: Omit<MenuItem, 'iconColor'>[] = [
  {
    label: 'রাইটার স্টুডিও',
    subtitle: 'লিখুন, প্রকাশ করুন এবং আয় করুন',
    icon: 'edit-3',
    destination: 'register',
  },
];

const APP_VERSION = Constants.expoConfig?.version ?? '1.3.0';
const SITE_URL = 'https://www.xyteee.com';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.lekhoni.kahini';
const SUPPORT_EMAIL = 'support@uponnash.site';

async function openLink(url: string, fallback: string) {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      await Linking.openURL(url);
      return;
    }
  } catch {}
  Alert.alert('লিংক খোলা যায়নি', fallback);
}

export function MenuDrawer({
  visible,
  active: _active,
  onClose,
  onNavigate,
  profileName,
  themeLabel = 'ডিফল্ট লাইট',
  onOpenName,
  onOpenTheme,
}: MenuDrawerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const { compactCards, toggleCompactCards } = useDisplay();
  const { historyIds, savedIds, clearDownloads } = useLibrary();
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [infoPage, setInfoPage] = useState<'about' | 'privacy' | 'contact' | null>(null);
  const [queryCount, setQueryCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [offlineBytes, setOfflineBytes] = useState(0);

  const refreshStats = async () => {
    try {
      setQueryCount(queryClient.getQueryCache().getAll().length);
    } catch {}
    setHistoryCount((await getSearchHistory()).length);
    setOfflineBytes(await getOfflineBytes());
  };

  useEffect(() => {
    if (visible) void refreshStats();
  }, [visible]);

  const choose = (destination: MenuDestination) => {
    onClose();
    onNavigate(destination);
  };

  const clearCache = () => {
    Alert.alert('ক্যাশ মুছুন', 'সার্ভার থেকে নতুন তথ্য আনার জন্য সংরক্ষিত ক্যাশ মুছবেন?', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'মুছুন',
        style: 'destructive',
        onPress: () => {
          queryClient.clear();
          void refreshStats();
          Alert.alert('সম্পন্ন', 'ক্যাশ মুছে ফেলা হয়েছে।');
        },
      },
    ]);
  };

  const clearHistory = () => {
    if (!historyCount) {
      Alert.alert('সার্চ হিস্ট্রি', 'মোছার মতো কোনো হিস্ট্রি নেই।');
      return;
    }
    Alert.alert('সার্চ হিস্ট্রি মুছুন', `${historyCount}টি খোঁজ মুছে ফেলবেন?`, [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'মুছুন',
        style: 'destructive',
        onPress: () => {
          void clearSearchHistory().then(() => void refreshStats());
        },
      },
    ]);
  };

  const clearAllDownloads = () => {
    Alert.alert('সব ডাউনলোড মুছুন', 'অফলাইন বই ও সংরক্ষিত পর্ব মুছে ফেলবেন?', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'মুছুন',
        style: 'destructive',
        onPress: () => {
          void clearAllOfflineChapters().then(() => {
            clearDownloads();
            void refreshStats();
            Alert.alert('সম্পন্ন', 'সব ডাউনলোড মুছে ফেলা হয়েছে।');
          });
        },
      },
    ]);
  };

  const checkUpdate = () => {
    Alert.alert(`অ্যাপ ভার্সন v${APP_VERSION}`, 'নতুন আপডেট থাকলে প্লে স্টোর থেকে নিন।', [
      { text: 'পরে', style: 'cancel' },
      { text: 'প্লে স্টোর খুলুন', onPress: () => void openLink(PLAY_STORE_URL, PLAY_STORE_URL) },
    ]);
  };

  const shareApp = async () => {
    try {
      await Share.share({ title: 'লেখনী কাহিনী', message: `লেখনী কাহিনী — আপনার গল্পের ঠিকানা\n${SITE_URL}` });
    } catch {
      Alert.alert('শেয়ার করা যায়নি', 'আবার চেষ্টা করুন।');
    }
  };

  const showReadingReport = () => {
    Alert.alert(
      'পড়ার রিপোর্ট',
      `মোট পড়া বই: ${historyIds.length}টি\nলাইব্রেরিতে সেভ: ${savedIds.length}টি`,
    );
  };

  const preferenceItems: MenuItem[] = [
    {
      label: 'অ্যাপ থিম ও মোড',
      subtitle: `বর্তমান: ${themeLabel} • থিম পরিবর্তন করতে ট্যাপ করুন`,
      icon: 'moon',
      destination: 'settings',
      iconColor: colors.primary,
    },
    {
      label: 'বইয়ের ডিসপ্লে লেআউট',
      subtitle: `বর্তমান: ${compactCards ? 'কম্প্যাক্ট কার্ড' : 'ডিফল্ট কার্ড'} • বদলাতে ট্যাপ করুন`,
      icon: 'grid',
      destination: 'settings',
      iconColor: colors.primary,
    },
    {
      label: 'নোটপ্যাড',
      subtitle: 'আপনার প্রয়োজনীয় নোট বা চিন্তা লিখে রাখুন',
      icon: 'clipboard',
      destination: 'settings',
      iconColor: colors.primary,
    },
    {
      label: 'অনুসরণ করা লেখকগণ',
      subtitle: 'আপনার প্রিয় লেখকদের তালিকা দেখুন',
      icon: 'users',
      destination: 'following',
      iconColor: colors.successText,
    },
    {
      label: 'বইয়ের অনুরোধ',
      subtitle: 'কোন বই যোগ করতে চান জানান',
      icon: 'book',
      destination: 'settings',
      iconColor: colors.skyText,
    },
  ];

  const handlePreference = (label: string, destination: MenuDestination) => {
    if (label === 'অ্যাপ থিম ও মোড' && onOpenTheme) {
      onClose();
      onOpenTheme();
      return;
    }
    if (label === 'বইয়ের ডিসপ্লে লেআউট') {
      toggleCompactCards();
      return;
    }
    if (label === 'নোটপ্যাড') {
      setNotepadOpen(true);
      return;
    }
    if (label === 'বইয়ের অনুরোধ') {
      void openLink(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('বইয়ের অনুরোধ')}`, 'ইমেইল অ্যাপ খোলা যায়নি।');
      return;
    }
    choose(destination);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable testID="close-menu" onPress={onClose} hitSlop={12} style={styles.headerButton}>
            <Feather name="arrow-left" size={25} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>সেটিংস ও মেনু</Text>
          <Pressable testID="menu-widgets" onPress={() => choose('settings')} style={styles.widgetButton}>
            <Feather name="grid" size={19} color={colors.mutedForeground} />
            <Text style={[styles.widgetLabel, { color: colors.mutedForeground }]}>উইজেট</Text>
          </Pressable>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 18 }]}
        >
          <Pressable
            testID="menu-profile"
            onPress={() => {
              onClose();
              onOpenName ? onOpenName() : onNavigate('settings');
            }}
            style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{profileName?.charAt(0) || 'ম'}</Text>
            </View>
            <View style={styles.profileCopy}>
              <Text style={[styles.profileTitle, { color: colors.foreground }]}>{profileName || 'আপনার নাম সেট করুন'}</Text>
              <Text style={[styles.profileSubtitle, { color: colors.mutedForeground }]}>{profileName ? 'কমেন্টের নাম • প্রোফাইল সম্পাদনা করুন' : 'কমেন্টের নাম • ট্যাপ করে সেট করুন'}</Text>
            </View>
            <View style={[styles.profileAction, { borderColor: colors.border, backgroundColor: colors.cream }]}>
              <Feather name="edit-2" size={13} color={colors.primary} />
              <Text style={[styles.profileActionText, { color: colors.primary }]}>{profileName ? 'বদলান' : 'নাম দিন'}</Text>
            </View>
          </Pressable>

          <StreakCard colors={colors} onReport={showReadingReport} />

          <SectionTitle title="সেটিংস" colors={colors} />
          <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MenuRow
              item={{ label: 'ক্যাশ মুছুন', subtitle: `ক্যাশ • ${queryCount}টি সংরক্ষিত তথ্য`, icon: 'trash-2', destination: 'settings', iconColor: colors.primary }}
              colors={colors}
              divider
              onPress={clearCache}
            />
            <MenuRow
              item={{ label: 'সার্চ হিস্ট্রি মুছুন', subtitle: historyCount ? `${historyCount}টি খোঁজ সংরক্ষিত` : 'কোনো হিস্ট্রি নেই', icon: 'search', destination: 'settings', iconColor: colors.accentForeground }}
              colors={colors}
              divider
              onPress={clearHistory}
            />
            <MenuRow
              item={{ label: 'ডাউনলোড স্টোরেজ', subtitle: `${formatBytes(offlineBytes)} ব্যবহৃত`, icon: 'settings', destination: 'settings', iconColor: colors.skyText }}
              colors={colors}
              divider
              onPress={() => choose('library')}
            />
            <MenuRow
              item={{ label: 'সব ডাউনলোড মুছুন', subtitle: `${formatBytes(offlineBytes)} ব্যবহৃত • সংগ্রহ ও ডাউনলোড তালিকা`, icon: 'trash', destination: 'settings', iconColor: colors.primary }}
              colors={colors}
              divider={false}
              onPress={clearAllDownloads}
            />
          </View>

          <SectionTitle title="লেখক ও কমিউনিটি" colors={colors} />
          <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {communityItems.map((item) => (
              <MenuRow
                key={item.label}
                item={{ ...item, iconColor: colors.primary }}
                colors={colors}
                divider={false}
                onPress={() => choose(item.destination)}
              />
            ))}
          </View>

          <SectionTitle title="ডিজাইন ও থিম" colors={colors} />
          <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {preferenceItems.map((item, index) => (
              <MenuRow
                key={item.label}
                item={item}
                colors={colors}
                divider={index < preferenceItems.length - 1}
                onPress={() => handlePreference(item.label, item.destination)}
              />
            ))}
          </View>

          <SectionTitle title="অন্যান্য" colors={colors} />
          <View style={[styles.menuGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MenuRow
              item={{ label: 'পছন্দের ক্যাটাগরি', subtitle: 'আপনার আগ্রহের জেনার বেছে নিন', icon: 'sliders', destination: 'categories', iconColor: colors.accentForeground }}
              colors={colors}
              divider
              onPress={() => choose('categories')}
            />
            <MenuRow
              item={{ label: 'আপডেট চেক করুন', subtitle: `বর্তমান ভার্সন v${APP_VERSION}`, icon: 'refresh-cw', destination: 'settings', iconColor: colors.skyText }}
              colors={colors}
              divider
              onPress={checkUpdate}
            />
            <MenuRow
              item={{ label: 'অ্যাপটি শেয়ার করুন', subtitle: 'বন্ধুদের সঙ্গে গল্প ভাগ করে নিন', icon: 'share', destination: 'settings', iconColor: colors.skyText }}
              colors={colors}
              divider
              onPress={() => void shareApp()}
            />
            <MenuRow
              item={{ label: 'আমাদের সম্পর্কে', subtitle: 'লেখনী কাহিনী সম্পর্কে জানুন', icon: 'info', destination: 'settings', iconColor: colors.mutedForeground }}
              colors={colors}
              divider
              onPress={() => setInfoPage('about')}
            />
            <MenuRow
              item={{ label: 'সাহায্য ও যোগাযোগ', subtitle: 'ইমেইল, হোয়াটসঅ্যাপ, টেলিগ্রাম', icon: 'help-circle', destination: 'settings', iconColor: colors.skyText }}
              colors={colors}
              divider
              onPress={() => setInfoPage('contact')}
            />
            <MenuRow
              item={{ label: 'গোপনীয়তা নীতি', subtitle: 'আমাদের প্রাইভেসি পলিসি পড়ুন', icon: 'shield', destination: 'settings', iconColor: colors.mutedForeground }}
              colors={colors}
              divider={false}
              onPress={() => setInfoPage('privacy')}
            />
          </View>
        </ScrollView>
      </View>

      <NotepadModal visible={notepadOpen} onClose={() => setNotepadOpen(false)} />
      {infoPage === 'about' ? <AboutModal onClose={() => setInfoPage(null)} /> : null}
      {infoPage === 'privacy' ? <PrivacyModal onClose={() => setInfoPage(null)} /> : null}
      {infoPage === 'contact' ? <ContactModal onClose={() => setInfoPage(null)} /> : null}
    </Modal>
  );
}

function NotepadModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (visible) void getNotes().then(setNotes);
  }, [visible]);

  const save = () => {
    if (!draft.trim()) return;
    void addNote(draft).then((next) => {
      setNotes(next);
      setDraft('');
    });
  };

  const remove = (id: string) => {
    void deleteNote(id).then(setNotes);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable testID="notepad-back" onPress={onClose} hitSlop={12} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="ফিরে যান">
            <Feather name="arrow-left" size={25} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>নোটপ্যাড</Text>
          <View style={styles.widgetButton} />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
        >
          <View style={[styles.noteComposer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              testID="note-input"
              value={draft}
              onChangeText={setDraft}
              placeholder="নতুন নোট লিখুন…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={500}
              style={[styles.noteInput, { color: colors.foreground }]}
            />
            <Pressable testID="note-save" onPress={save} disabled={!draft.trim()} style={[styles.noteSave, { backgroundColor: colors.primary, opacity: draft.trim() ? 1 : 0.5 }]}>
              <Feather name="plus" size={18} color={colors.primaryForeground} />
              <Text style={[styles.noteSaveText, { color: colors.primaryForeground }]}>যোগ করুন</Text>
            </Pressable>
          </View>
          {notes.length ? notes.map((note) => (
            <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.noteText, { color: colors.foreground }]}>{note.text}</Text>
              <View style={styles.noteFooter}>
                <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>
                  {new Date(note.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                <Pressable testID={`note-delete-${note.id}`} onPress={() => remove(note.id)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            </View>
          )) : (
            <View style={styles.noteEmpty}>
              <Feather name="clipboard" size={28} color={colors.mutedForeground} />
              <Text style={[styles.noteEmptyText, { color: colors.mutedForeground }]}>এখনো কোনো নোট নেই</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function StreakCard({ colors, onReport }: { colors: ReturnType<typeof useColors>; onReport: () => void }) {
  const week = [
    { day: 'ম', value: 88 },
    { day: 'বু', value: 0 },
    { day: 'বৃ', value: 0 },
    { day: 'শু', value: 0 },
    { day: 'শু', value: 0 },
    { day: 'শ', value: 0 },
    { day: 'রো', value: 0 },
  ];

  return (
    <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.streakHeader}>
        <View style={styles.streakTitleWrap}>
          <Feather name="zap" size={20} color={colors.primary} />
          <Text style={[styles.streakTitle, { color: colors.foreground }]}>১ দিনের রিডিং স্ট্রিক</Text>
        </View>
        <Text style={[styles.streakToday, { color: colors.primary }]}>আজ: ১ মিনিট</Text>
      </View>

      <Pressable testID="reading-report" onPress={onReport} style={[styles.reportPill, { backgroundColor: colors.secondary }]}>
        <Feather name="bar-chart-2" size={13} color={colors.primary} />
        <Text style={[styles.reportText, { color: colors.primary }]}>বিস্তারিত রিপোর্ট</Text>
      </Pressable>

      <View style={styles.weekRow}>
        {week.map((item, index) => (
          <View key={`${item.day}-${index}`} style={styles.dayColumn}>
            <Text style={[styles.percent, { color: colors.primary }]}>{item.value}%</Text>
            <View style={[styles.barTrack, { backgroundColor: colors.cream, borderColor: colors.border }]}>
              <View style={[styles.barFill, { backgroundColor: colors.primary, height: `${Math.max(item.value, 4)}%` }]} />
            </View>
            <View style={[styles.dayCircle, index === 0 && { backgroundColor: colors.secondary }]}>
              <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>{item.day}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionTitle({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionAccent, { backgroundColor: colors.primary }]} />
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

function MenuRow({
  item,
  colors,
  divider,
  onPress,
}: {
  item: MenuItem;
  colors: ReturnType<typeof useColors>;
  divider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`menu-${item.label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, divider && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }, { opacity: pressed ? 0.68 : 1 }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View style={styles.menuCopy}>
        <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
        <Text numberOfLines={1} style={[styles.menuSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={21} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 19 },
  header: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 34, height: 42, justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'serif', fontSize: 22, fontWeight: '700', marginLeft: 9 },
  widgetButton: { minWidth: 42, alignItems: 'center', gap: 2 },
  widgetLabel: { fontSize: 9, fontWeight: '600' },
  profileCard: { minHeight: 85, borderRadius: 22, borderWidth: 1, paddingHorizontal: 17, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  profileCopy: { flex: 1 },
  profileTitle: { fontFamily: 'serif', fontSize: 16, fontWeight: '700' },
  profileSubtitle: { fontSize: 10, marginTop: 5 },
  profileAction: { borderWidth: 1, borderRadius: 17, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileActionText: { fontFamily: 'serif', fontSize: 11, fontWeight: '700' },
  streakCard: { marginTop: 9, borderRadius: 22, borderWidth: 1, paddingHorizontal: 18, paddingTop: 17, paddingBottom: 14 },
  streakHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  streakTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  streakTitle: { fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  streakToday: { fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
  reportPill: { alignSelf: 'flex-start', borderRadius: 14, paddingVertical: 5, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  reportText: { fontFamily: 'serif', fontSize: 10, fontWeight: '700' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17 },
  dayColumn: { alignItems: 'center', width: 31 },
  percent: { fontFamily: 'serif', fontSize: 12, marginBottom: 6 },
  dayCircle: { minWidth: 29, minHeight: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  dayLabel: { fontFamily: 'serif', fontSize: 12, fontWeight: '600' },
  barTrack: { width: 19, height: 59, borderRadius: 10, borderWidth: 1, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 25, marginBottom: 10 },
  sectionAccent: { width: 4, height: 19, borderRadius: 3 },
  sectionTitle: { fontFamily: 'serif', fontSize: 17, fontWeight: '700' },
  menuGroup: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  menuRow: { minHeight: 79, paddingHorizontal: 17, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1, minWidth: 0 },
  menuLabel: { fontFamily: 'serif', fontSize: 17, fontWeight: '700' },
  menuSubtitle: { fontSize: 10, marginTop: 4 },
  noteComposer: { borderWidth: 1, borderRadius: 18, padding: 13, marginBottom: 12 },
  noteInput: { minHeight: 80, fontSize: 14, textAlignVertical: 'top' },
  noteSave: { marginTop: 10, minHeight: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  noteSaveText: { fontSize: 13, fontWeight: '700' },
  noteCard: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 9 },
  noteText: { fontSize: 14, lineHeight: 22 },
  noteFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  noteDate: { fontSize: 11 },
  noteEmpty: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10 },
  noteEmptyText: { fontSize: 14 },
});
