import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text, AppTextInput } from '@/components/AppText';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function WriterVerificationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { session, signOut, verifyEmailCode, resendEmailCode } = useWriterAccess();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const pendingEmail = emailParam ?? session?.email;

  useEffect(() => {
    if (!session && !pendingEmail) router.replace('/auth/login');
    else if (session?.verification === 'verified') router.replace('/writer/panel');
  }, [session, pendingEmail]);

  const submitCode = async () => {
    if (!pendingEmail || codeBusy) return;
    if (code.trim().length < 6) {
      setCodeError('ইমেইলে পাঠানো ৬ সংখ্যার কোডটি লিখুন।');
      return;
    }
    setCodeBusy(true);
    setCodeError('');
    const res = await verifyEmailCode(pendingEmail, code.trim());
    setCodeBusy(false);
    if (res.ok) {
      router.replace('/writer/panel');
      return;
    }
    setCodeError(res.error);
  };

  const resendCode = async () => {
    if (!pendingEmail || codeBusy) return;
    setCodeBusy(true);
    const r = await resendEmailCode(pendingEmail);
    setCodeBusy(false);
    if (r.ok) {
      setCodeSent(true);
      setCodeError('');
    } else {
      setCodeError('কোড পাঠানো যায়নি। আবার চেষ্টা করুন।');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          testID="verification-back"
          onPress={() => goBackOrFallback(session ? '/writer/panel' : '/auth/login')}
          accessibilityRole="button"
          accessibilityLabel="ফিরে যান"
          style={[styles.headerButton, { backgroundColor: colors.secondary }]}
        >
          <Feather name="arrow-left" size={21} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ইমেইল যাচাইকরণ</Text>
          <Pressable
            testID="verification-logout"
            onPress={() => {
              signOut();
              router.replace('/');
            }}
            accessibilityRole="button"
            accessibilityLabel="লগআউট"
            style={styles.logoutButton}
          >
            <Feather name="log-out" size={18} color={colors.primary} />
            <Text style={[styles.logoutText, { color: colors.primary }]}>লগআউট</Text>
          </Pressable>
        </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: (Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 24)) + 22 }]}
      >

        <View style={[styles.lockIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="mail" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>ইমেইল যাচাই করুন</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          লেখক প্যানেল চালু করতে আপনার ইমেইলে পাঠানো ৬ সংখ্যার যাচাইকরণ কোডটি নিচে লিখুন।
        </Text>

        {pendingEmail ? (
          <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.codeHeader}>
              <Feather name="mail" size={18} color={colors.primary} />
              <Text style={[styles.codeTitle, { color: colors.foreground }]}>যাচাইকরণ কোড</Text>
            </View>
            <Text style={[styles.codeBody, { color: colors.mutedForeground }]}>
              {pendingEmail} ঠিকানায় কোড পাঠানো হয়েছে।
            </Text>
            <AppTextInput
              testID="verification-code"
              value={code}
              onChangeText={(v) => { setCode(v.replace(/[^0-9]/g, '').slice(0, 6)); setCodeError(''); }}
              placeholder="৬ সংখ্যার কোড"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.codeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
            {codeError ? <Text style={[styles.codeError, { color: colors.primary }]}>{codeError}</Text> : null}
            {codeSent ? <Text style={[styles.codeSent, { color: colors.successText }]}>নতুন কোড পাঠানো হয়েছে।</Text> : null}
            <View style={styles.codeActions}>
              <Pressable
                testID="verification-code-submit"
                onPress={() => void submitCode()}
                disabled={codeBusy}
                style={[styles.codeSubmit, { backgroundColor: colors.primary, opacity: codeBusy ? 0.7 : 1 }]}
              >
                <Text style={[styles.codeSubmitText, { color: colors.primaryForeground }]}>{codeBusy ? 'যাচাই হচ্ছে…' : 'কোড যাচাই করুন'}</Text>
              </Pressable>
              <Pressable testID="verification-code-resend" onPress={() => void resendCode()} disabled={codeBusy} style={styles.codeResend}>
                <Text style={[styles.codeResendText, { color: colors.primary }]}>কোড আবার পাঠান</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  headerButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  logoutButton: { width: 66, alignItems: 'center', justifyContent: 'center', gap: 2 },
  logoutText: { fontSize: 10, fontWeight: '600' },
  lockIcon: { width: 70, height: 70, borderRadius: 35, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  title: { fontSize: 22, lineHeight: 32, textAlign: 'center', fontWeight: '700', marginTop: 16 },
  description: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 10, marginBottom: 4 },
  codeCard: { borderWidth: 1, borderRadius: 18, padding: 15, marginTop: 15, gap: 9 },
  codeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeTitle: { fontSize: 15, fontWeight: '700' },
  codeBody: { fontSize: 12, lineHeight: 19 },
  codeInput: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, fontSize: 18, letterSpacing: 4, textAlign: 'center' },
  codeError: { fontSize: 12, lineHeight: 18 },
  codeSent: { fontSize: 12 },
  codeActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  codeSubmit: { flex: 1, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  codeSubmitText: { fontSize: 13, fontWeight: '700' },
  codeResend: { paddingVertical: 10, paddingHorizontal: 4 },
  codeResendText: { fontSize: 12, fontWeight: '700' },
});
