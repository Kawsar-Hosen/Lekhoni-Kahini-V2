import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { toBanglaDigits } from '@/lib/adapters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

function InfoShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible>
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable testID="info-back" onPress={onClose} hitSlop={12} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="ফিরে যান">
            <Feather name="arrow-left" size={25} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>{title}</Text>
          <View style={styles.headerButton} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 40 : Math.max(insets.bottom, 24) + 20 }]}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.para, { color: colors.mutedForeground }]}>{children}</Text>;
}

function H({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.h, { color: colors.foreground }]}>{children}</Text>;
}

const STEPS = [
  { title: 'পড়ুন', body: 'হাজারো বাংলা গল্প — উপন্যাস, ছোটগল্প, কবিতা। ফ্রি পড়ুন, অফলাইনে ডাউনলোড করুন।' },
  { title: 'লিখুন', body: 'রাইটার স্টুডিওতে আপনার গল্প লিখুন — পর্ব আকারে বা সম্পূর্ণ, কভারসহ।' },
  { title: 'প্রকাশ করুন', body: 'রিভিউয়ের জন্য জমা দিন — অনুমোদন পেলেই লাখো পাঠকের কাছে পৌঁছে যাবে।' },
  { title: 'আয় করুন', body: 'পাঠক বাড়ান, ব্যালেন্স আনলক করুন — আপনার লেখাই আপনার আয়।' },
];

const FEATURES = [
  { icon: 'book-open', title: 'যেকোনো জায়গায় পড়ুন', body: 'উপন্যাস, ছোটগল্প ও কবিতা — প্রতিদিন নতুন পর্ব, অনলাইন ও অফলাইন।' },
  { icon: 'edit-3', title: 'লিখুন ও আয় করুন', body: 'রাইটার স্টুডিওতে প্রকাশ করুন, পাঠকের ভালোবাসা থেকে আয় করুন।' },
  { icon: 'heart', title: 'বাংলার জন্য তৈরি', body: 'বাংলা সাহিত্যের জন্য পরিষ্কার, দ্রুত পড়ার অভিজ্ঞতা — শুধু গল্প।' },
] as const;

export function AboutModal({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  return (
    <InfoShell title="আমাদের সম্পর্কে" onClose={onClose}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="book-open" size={34} color={colors.primary} />
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>লেখনী কাহিনী</Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>আপনার গল্পের ঠিকানা</Text>
      </View>
      <Text style={[styles.hook, { color: colors.foreground }]}>
        যেখানে বাংলা গল্প খুঁজে পায় তার পাঠক — আর লেখক খুঁজে পায় তার আয়।
      </Text>
      <View style={styles.aboutSectionHead}>
        <View style={[styles.aboutMark, { backgroundColor: colors.primary }]} />
        <Text style={[styles.aboutSectionTitle, { color: colors.foreground }]}>কীভাবে কাজ করে</Text>
      </View>
      {STEPS.map((step, index) => (
        <View key={step.title} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
            <Text style={[styles.stepNumText, { color: colors.primaryForeground }]}>{toBanglaDigits(index + 1)}</Text>
          </View>
          <View style={styles.stepCopy}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
            <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{step.body}</Text>
          </View>
        </View>
      ))}
      <View style={styles.aboutSectionHead}>
        <View style={[styles.aboutMark, { backgroundColor: colors.primary }]} />
        <Text style={[styles.aboutSectionTitle, { color: colors.foreground }]}>কেন লেখনী কাহিনী</Text>
      </View>
      {FEATURES.map((feature) => (
        <View key={feature.title} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.featureIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={feature.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.stepCopy}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{feature.title}</Text>
            <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{feature.body}</Text>
          </View>
        </View>
      ))}
      <Text style={[styles.closing, { color: colors.mutedForeground }]}>
        এক ক্যাটালগ, সব জায়গায় — ওয়েবসাইট ও অ্যাপ একই লাইভ লাইব্রেরি থেকে চলে।
      </Text>
      <Text style={[styles.copyright, { color: colors.mutedForeground }]}>© ২০২৬ লেখনী কাহিনী</Text>
    </InfoShell>
  );
}

export function PrivacyModal({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const points = [
    { title: 'কী সংগ্রহ করি', body: 'অ্যাপটি শুধু কার্যকরী তথ্য রাখে: ভাষা, থিম, লেখক লগইন সেশন, পড়ার ইতিহাস ও লাইব্রেরি। কোনো ট্র্যাকিং, অ্যানালিটিক্স বা বিজ্ঞাপন নেই।' },
    { title: 'কীভাবে ব্যবহার করি', body: 'শুধু আপনার সেটিংস মনে রাখতে, লগইন ধরে রাখতে, লাইভ বই তালিকা দেখাতে ব্যবহার হয়। পড়ার অগ্রগতি আপনার ডিভাইসেই থাকে।' },
    { title: 'অ্যাকাউন্ট ও নিরাপত্তা', body: 'লেখক পাসওয়ার্ড সার্ভারে salted ও hashed থাকে — কখনো সরাসরি সংরক্ষণ হয় না। লগইন সেশন এনক্রিপ্টেড টোকেন, সবকিছু HTTPS-এ চলে।' },
    { title: 'তথ্য শেয়ার', body: 'ব্যক্তিগত তথ্য বিক্রি করা হয় না, কোনো বিজ্ঞাপন SDK নেই। প্রযুক্তি প্রদানকারী: Cloudflare (হোস্টিং), Neon (ডাটাবেস), Google (Sign-In)।' },
    { title: 'সংরক্ষণ ও মোছা', body: 'পছন্দ বদলানো বা মোছা পর্যন্ত থাকে। অ্যাকাউন্ট ও প্রকাশিত কনটেন্ট আপনি মুছে ফেলতে পারেন — লেখকরা স্টুডিও থেকে, পাঠকরা মেনুর ডাউনলোড/ক্যাশ অপশন থেকে।' },
    { title: 'শিশু ও যোগাযোগ', body: 'লেখনী কাহিনী ১৫ বছর বা তার বেশি বয়সীদের জন্য। গোপনীয়তা নিয়ে প্রশ্ন থাকলে ইমেইল করুন — ৪৮ ঘণ্টার মধ্যে উত্তর দিই।' },
  ];
  return (
    <InfoShell title="গোপনীয়তা নীতি" onClose={onClose}>
      <Text style={[styles.updated, { color: colors.mutedForeground }]}>সর্বশেষ হালনাগাদ: ৮ সেপ্টেম্বর ২০২৬</Text>
      {points.map((point, index) => (
        <View key={point.title} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
            <Text style={[styles.stepNumText, { color: colors.primaryForeground }]}>{toBanglaDigits(index + 1)}</Text>
          </View>
          <View style={styles.stepCopy}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{point.title}</Text>
            <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{point.body}</Text>
          </View>
        </View>
      ))}
    </InfoShell>
  );
}

const CONTACTS = [
  { icon: 'mail', title: 'ইমেইল', detail: 'lekhoni-kahini@xyteee.com', url: 'mailto:lekhoni-kahini@xyteee.com' },
  { icon: 'message-circle', title: 'হোয়াটসঅ্যাপ', detail: '+880 1926-890544', url: 'https://wa.me/8801926890544' },
  { icon: 'send', title: 'টেলিগ্রাম', detail: '@xyteee', url: 'https://t.me/xyteee' },
] as const;

export function ContactModal({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const open = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('লিংক খোলা যায়নি', 'পরে আবার চেষ্টা করুন।');
    } catch {
      Alert.alert('লিংক খোলা যায়নি', 'পরে আবার চেষ্টা করুন।');
    }
  };
  return (
    <InfoShell title="সাহায্য ও যোগাযোগ" onClose={onClose}>
      <Text style={[styles.contactHelp, { color: colors.mutedForeground }]}>
        পড়া, লেখা বা অ্যাকাউন্ট নিয়ে সাহায্য লাগলে নিচের যেকোনো মাধ্যমে বার্তা দিন — ইউজারনেম ও সমস্যাটি জানাবেন।
      </Text>
      <View style={[styles.slaPill, { backgroundColor: colors.success }]}>
        <Text style={[styles.slaText, { color: colors.successText }]}>৪৮ ঘণ্টার মধ্যে উত্তর দিই</Text>
      </View>
      {CONTACTS.map((c) => (
        <Pressable
          key={c.title}
          testID={`contact-${c.title}`}
          onPress={() => void open(c.url)}
          style={[styles.contactRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.contactIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={c.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.stepCopy}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{c.title}</Text>
            <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{c.detail}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </InfoShell>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 66, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 34, height: 42, justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'serif', fontSize: 22, fontWeight: '700', marginLeft: 9 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  hero: { borderWidth: 1, borderRadius: 22, paddingVertical: 26, paddingHorizontal: 18, alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontFamily: 'serif', fontSize: 24, fontWeight: '700', marginTop: 12 },
  heroSub: { fontSize: 13, marginTop: 4 },
  h: { fontFamily: 'serif', fontSize: 17, fontWeight: '700', marginTop: 18, marginBottom: 6 },
  para: { fontSize: 14, lineHeight: 24 },
  hook: { fontFamily: 'serif', fontSize: 18, lineHeight: 28, fontWeight: '700', marginTop: 4, paddingLeft: 12, borderLeftWidth: 4, borderLeftColor: '#9a1c49' },
  aboutSectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 10 },
  aboutMark: { width: 4, height: 20, borderRadius: 2 },
  aboutSectionTitle: { fontFamily: 'serif', fontSize: 17, fontWeight: '700' },
  stepCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 9 },
  stepNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
  stepCopy: { flex: 1, minWidth: 0 },
  stepTitle: { fontSize: 15, fontWeight: '700' },
  stepBody: { fontSize: 13, lineHeight: 21, marginTop: 4 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  closing: { fontSize: 13, lineHeight: 22, textAlign: 'center', marginTop: 16 },
  copyright: { fontSize: 11, textAlign: 'center', marginTop: 10 },
  updated: { fontSize: 12, marginBottom: 12 },
  contactHelp: { fontSize: 14, lineHeight: 23, marginBottom: 12 },
  slaPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 6, marginBottom: 12 },
  slaText: { fontSize: 11, fontWeight: '700' },
  contactRow: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
