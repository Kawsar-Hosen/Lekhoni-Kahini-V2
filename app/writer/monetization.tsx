import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text, AppTextInput } from '@/components/AppText';
import { WriterHeader } from '@/components/WriterChrome';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useWriterContent } from '@/context/WriterContentContext';
import { useColors } from '@/hooks/useColors';
import { toBanglaDigits } from '@/lib/adapters';
import { applyAffiliate } from '@/lib/api';

const PLATFORMS = ['ফেসবুক', 'টিকটক', 'ইউটিউব', 'ইনস্টাগ্রাম', 'অন্যান্য'] as const;

export default function WriterMonetizationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { books } = useWriterContent();
  const { session } = useWriterAccess();
  const topPadding = Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top;
  const publishedBooks = books.filter((book) => book.status === 'লাইভ').length;
  const totalViews = books.reduce((total, book) => total + book.totalViews, 0);
  const followers = session?.followerCount ?? 0;
  const requirements = [
    {
      icon: 'book-open' as const,
      title: `কমপক্ষে ১টি প্রকাশিত বই (বর্তমান: ${toBanglaDigits(publishedBooks)}টি)`,
      detail: 'প্রকাশিত অবস্থায় থাকতে হবে',
      complete: publishedBooks >= 1,
    },
    {
      icon: 'users' as const,
      title: `কমপক্ষে ২০ জন অনুসারী (বর্তমান: ${toBanglaDigits(followers)} জন)`,
      detail: 'আপনার লেখক প্রোফাইল ফলো করতে হবে',
      complete: followers >= 20,
    },
    {
      icon: 'eye' as const,
      title: `কমপক্ষে ৫০০০ মোট ভিউ কাউন্ট (বর্তমান: ${toBanglaDigits(totalViews)}টি)`,
      detail: 'আপনার বইগুলোর সর্বমোট ভিউ সংখ্যা',
      complete: totalViews >= 5000,
    },
  ];
  const eligible = requirements.every((requirement) => requirement.complete);
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>('ফেসবুক');
  const [username, setUsername] = useState('');
  const [followerText, setFollowerText] = useState('');
  const [contact, setContact] = useState('');
  const [applyMsg, setApplyMsg] = useState('');
  const [applying, setApplying] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);

  const submitAffiliate = async () => {
    if (applying) return;
    const followerCount = Number.parseInt(followerText.replace(/[^0-9]/g, ''), 10) || 0;
    if (!username.trim() || !contact.trim() || followerCount <= 0) {
      setApplyMsg('প্ল্যাটফর্মের ইউজারনেম, ফলোয়ার সংখ্যা ও যোগাযোগ মাধ্যম দিন।');
      return;
    }
    setApplying(true);
    setApplyMsg('');
    const r = await applyAffiliate({ platform, username: username.trim(), followers: followerCount, contact: contact.trim() });
    setApplying(false);
    if (r.data && 'ok' in r.data && r.data.ok) {
      setApplyMsg('আবেদন পাঠানো হয়েছে। অনুমোদন হলে জানিয়ে দেওয়া হবে।');
      setUsername('');
      setFollowerText('');
      setContact('');
      return;
    }
    setApplyMsg('আবেদন পাঠানো যায়নি। আবার চেষ্টা করুন।');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <WriterHeader title="মনিটাইজেশন সেটিংস" backToStudio showActions={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.notice, { backgroundColor: colors.monetizationSoft }]}>
          <View style={[styles.noticeStripe, { backgroundColor: colors.monetizationAccent }]} />
          <Feather name="info" size={24} color={colors.monetizationAccent} />
          <View style={styles.noticeCopy}>
            <Text style={[styles.noticeTitle, { color: colors.foreground }]}>
              {eligible ? 'আবেদনের যোগ্যতা অর্জিত হয়েছে' : 'আবেদন যোগ্যতা অর্জিত হয়নি'}
            </Text>
            <Text style={[styles.noticeText, { color: colors.foreground }]}>
              {eligible
                ? 'আপনি আবেদন করার শর্ত পূরণ করেছেন।'
                : 'সক্রিয় করতে নিচের সকল শর্তাবলি পূরণ করুন। পূরণ হলে আবেদনের অপশন চালু হবে।'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View style={[styles.headingMarker, { backgroundColor: colors.monetizationAccent }]} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>মনিটাইজেশন শর্তাবলী</Text>
        </View>

        <View style={styles.requirementList}>
          {requirements.map((requirement) => (
            <View
              key={requirement.icon}
              style={[styles.requirementCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View
                style={[
                  styles.requirementIcon,
                  { backgroundColor: requirement.complete ? colors.success : colors.secondary },
                ]}
              >
                <Feather
                  name={requirement.icon}
                  size={22}
                  color={requirement.complete ? colors.successText : colors.mutedForeground}
                />
              </View>
              <View style={styles.requirementCopy}>
                <Text style={[styles.requirementTitle, { color: colors.foreground }]}>{requirement.title}</Text>
                <Text style={[styles.requirementDetail, { color: colors.mutedForeground }]}>{requirement.detail}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: requirement.complete ? colors.success : colors.incompleteSurface },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: requirement.complete ? colors.successText : colors.destructive },
                  ]}
                >
                  {requirement.complete ? 'সম্পন্ন' : 'অসম্পূর্ণ'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/writer/panel')}
          style={({ pressed }) => [
            styles.dashboardButton,
            { backgroundColor: colors.monetizationAccent, opacity: pressed ? 0.86 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={17} color={colors.monetizationButtonText} />
          <Text style={[styles.dashboardButtonText, { color: colors.monetizationButtonText }]}>ড্যাশবোর্ডে ফিরে যাই</Text>
        </Pressable>
        {eligible ? (
          <View style={[styles.applyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.applyTitle, { color: colors.foreground }]}>অ্যাফিলিয়েট আবেদন</Text>
            <Text style={[styles.applySub, { color: colors.mutedForeground }]}>সোশ্যাল মিডিয়ায় প্রচার করে আয় করুন।</Text>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>প্ল্যাটফর্ম</Text>
            <Pressable testID="affiliate-platform" onPress={() => setPlatformOpen((v) => !v)} style={[styles.selectInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.selectText, { color: colors.foreground }]}>{platform}</Text>
              <Feather name={platformOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.foreground} />
            </Pressable>
            {platformOpen ? (
              <View style={[styles.platformMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {PLATFORMS.map((p) => (
                  <Pressable key={p} onPress={() => { setPlatform(p); setPlatformOpen(false); }} style={[styles.platformOption, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.platformText, { color: p === platform ? colors.primary : colors.foreground }]}>{p}</Text>
                    {p === platform ? <Feather name="check" size={15} color={colors.primary} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ইউজারনেম</Text>
            <AppTextInput
              testID="affiliate-username"
              value={username}
              onChangeText={setUsername}
              placeholder="যেমন: @uponnash"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ফলোয়ার সংখ্যা</Text>
            <AppTextInput
              testID="affiliate-followers"
              value={followerText}
              onChangeText={(v) => setFollowerText(v.replace(/[^0-9]/g, '').slice(0, 9))}
              placeholder="যেমন: ৫০০০"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>যোগাযোগ (মোবাইল/ইমেইল)</Text>
            <AppTextInput
              testID="affiliate-contact"
              value={contact}
              onChangeText={setContact}
              placeholder="যোগাযোগের ঠিকানা"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
            {applyMsg ? <Text style={[styles.applyMsg, { color: colors.primary }]}>{applyMsg}</Text> : null}
            <Pressable
              testID="affiliate-submit"
              onPress={() => void submitAffiliate()}
              disabled={applying}
              style={[styles.applyButton, { backgroundColor: colors.primary, opacity: applying ? 0.7 : 1 }]}
            >
              <Text style={[styles.applyButtonText, { color: colors.primaryForeground }]}>{applying ? 'পাঠানো হচ্ছে…' : 'আবেদন পাঠান'}</Text>
            </Pressable>
          </View>
        ) : null}
        <Text style={[styles.demoNotice, { color: colors.mutedForeground }]}>
          উপরের হিসাব সার্ভারের লাইভ তথ্য থেকে আসে।
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  notice: {
    minHeight: 116,
    borderRadius: 22,
    marginTop: 1,
    marginBottom: 26,
    paddingHorizontal: 25,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  noticeStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  noticeCopy: { flex: 1 },
  noticeTitle: { fontSize: 17, lineHeight: 25, fontWeight: '600' },
  noticeText: { fontSize: 12, lineHeight: 20, marginTop: 5 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  headingMarker: { width: 4, height: 24, borderRadius: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '600' },
  requirementList: { gap: 13 },
  requirementCard: {
    minHeight: 116,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  requirementIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  requirementCopy: { flex: 1, minWidth: 0 },
  requirementTitle: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  requirementDetail: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  statusBadge: { borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },
  dashboardButton: {
    minHeight: 54,
    borderRadius: 28,
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashboardButtonText: { fontSize: 15, fontWeight: '700' },
  demoNotice: { fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 11 },
  applyCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 18 },
  applyTitle: { fontSize: 17, fontWeight: '700' },
  applySub: { fontSize: 12, marginTop: 4, marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  textInput: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 14 },
  selectInput: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 14 },
  platformMenu: { borderWidth: 1, borderRadius: 14, marginTop: 6, overflow: 'hidden' },
  platformOption: { minHeight: 44, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  platformText: { fontSize: 14 },
  applyMsg: { fontSize: 12, lineHeight: 18, marginTop: 10 },
  applyButton: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  applyButtonText: { fontSize: 14, fontWeight: '700' },
});
