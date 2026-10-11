import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { WriterHeader } from '@/components/WriterChrome';
import { useColors } from '@/hooks/useColors';

async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('লিংক খোলা যায়নি', 'পরে আবার চেষ্টা করুন।');
  }
}

const WHATSAPP_URL = 'https://wa.me/8801926890544';
const TELEGRAM_URL = 'https://t.me/xyteee';
const SUPPORT_EMAIL = 'lekhoni-kahini@xyteee.com';

function SupportCard({
  icon,
  title,
  detail,
  iconColor,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  detail: string;
  iconColor: string;
  onPress?: () => void;
}) {
  const colors = useColors();
  const content = (
    <>
      <Feather name={icon} size={24} color={iconColor} />
      <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>{title}</Text>
      <Text style={[styles.cardDetail, { color: colors.foreground }]}>{detail}</Text>
    </>
  );
  const style = [styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

export default function WriterSupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <WriterHeader
        title="সাপোর্ট সেন্টার"
        subtitle="লাইভ সাপোর্ট এবং যোগাযোগের মাধ্যমসমূহ"
        backToStudio
        showActions={false}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroIcon, { backgroundColor: colors.card }]}>
          <Feather name="headphones" size={39} color={colors.supportGreenText} />
        </View>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>লাইভ সাপোর্ট চ্যাট</Text>
        <Text style={[styles.heroCopy, { color: colors.mutedForeground }]}>
          আপনার অ্যাকাউন্ট, পেমেন্ট অথবা বই সংক্রান্ত যেকোনো সমস্যার জন্য সরাসরি আমাদের অফিসিয়াল হোয়াটসঅ্যাপ গ্রুপে যুক্ত হন।
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => void openLink(WHATSAPP_URL)}
          style={({ pressed }) => [
            styles.whatsappButton,
            { backgroundColor: colors.supportGreen, opacity: pressed ? 0.86 : 1 },
          ]}
        >
          <Feather name="message-circle" size={21} color={colors.supportButtonText} />
          <Text style={[styles.whatsappText, { color: colors.supportButtonText }]}>হোয়াটসঅ্যাপ গ্রুপ</Text>
        </Pressable>

        <View style={styles.contactGrid}>
          <View style={styles.contactRow}>
            <SupportCard icon="clock" title="সাপোর্ট সময়" detail={'সকাল ১০:০০ -\nরাত ০২:০০'} iconColor={colors.supportBlue} />
            <SupportCard
              icon="mail"
              title="সাপোর্ট ইমেইল"
              detail={'lekhoni-kahini@\nxyteee.com'}
              iconColor={colors.supportOrange}
              onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
            />
          </View>
          <View style={styles.contactRow}>
            <SupportCard
              icon="send"
              title="টেলিগ্রাম"
              detail="@xyteee"
              iconColor={colors.foreground}
              onPress={() => openLink(TELEGRAM_URL)}
            />
            <SupportCard
              icon="message-circle"
              title="হোয়াটসঅ্যাপ"
              detail={'+880 1926-\n890544'}
              iconColor={colors.socialBlue}
              onPress={() => openLink(WHATSAPP_URL)}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void openLink(WHATSAPP_URL)}
          style={[styles.adminRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="phone" size={21} color={colors.supportGreenText} />
          <View style={styles.adminCopy}>
            <Text style={[styles.adminTitle, { color: colors.foreground }]}>হোয়াটসঅ্যাপ অ্যাডমিন</Text>
            <Text style={[styles.adminSubtitle, { color: colors.mutedForeground }]}>অ্যাডমিনের সাথে সরাসরি চ্যাট করুন</Text>
          </View>
          <Feather name="send" size={20} color={colors.mutedForeground} />
        </Pressable>
        <Text style={[styles.demoNotice, { color: colors.mutedForeground }]}>
          ৪৮ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 30, alignItems: 'center' },
  heroIcon: { width: 100, height: 100, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  heroTitle: { fontSize: 23, fontWeight: '700', textAlign: 'center' },
  heroCopy: { maxWidth: 420, fontSize: 14, lineHeight: 24, textAlign: 'center', marginTop: 11 },
  whatsappButton: {
    minHeight: 54,
    width: '100%',
    borderRadius: 28,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    elevation: 2,
  },
  whatsappText: { fontSize: 15, fontWeight: '700' },
  contactGrid: { width: '100%', gap: 12, marginTop: 27 },
  contactRow: { flexDirection: 'row', gap: 12 },
  contactCard: {
    flex: 1,
    minHeight: 151,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  cardTitle: { fontSize: 12, textAlign: 'center' },
  cardDetail: { fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  adminRow: {
    width: '100%',
    minHeight: 77,
    borderWidth: 1,
    borderRadius: 17,
    marginTop: 17,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 1,
  },
  adminCopy: { flex: 1 },
  adminTitle: { fontSize: 15, fontWeight: '600' },
  adminSubtitle: { fontSize: 11, marginTop: 4 },
  demoNotice: { fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 10 },
});
