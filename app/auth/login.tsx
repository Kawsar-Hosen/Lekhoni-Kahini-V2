import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthField } from '@/components/AuthField';
import { AuthModeToggle } from '@/components/AuthModeToggle';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useWriterAccess();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitLogin = async () => {
    if (busy) return;
    if (!identifier.trim() || !password) {
      setLoginError('ইউজারনেম/ইমেইল ও পাসওয়ার্ড দিন।');
      return;
    }
    setBusy(true);
    setLoginError('');
    const res = await signIn(identifier, password);
    setBusy(false);
    if (res.ok) {
      router.replace('/writer/panel');
      return;
    }
    if (res.needsVerification && res.email) {
      router.replace({ pathname: '/writer/verification', params: { email: res.email } });
      return;
    }
    setLoginError(res.error);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingTop: topInset + 8, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable testID="auth-back" onPress={() => goBackOrFallback('/')} hitSlop={12} style={styles.backButton}>
          <Feather name="arrow-left" size={25} color={colors.foreground} />
        </Pressable>

        <View style={styles.hero}>
          <View style={[styles.accountIcon, { backgroundColor: colors.card }]}>
            <Feather name="user" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>আবার স্বাগতম, লেখক!</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>আপনার গল্পের অপেক্ষায় — লগইন করুন</Text>
        </View>

        <AuthModeToggle mode="login" onLogin={() => undefined} onRegister={() => router.replace('/auth/register')} />

        <View style={styles.form}>
          <AuthField
            testID="login-identifier"
            icon="mail"
            placeholder="ইউজারনেম, ইমেইল অথবা মোবাইল"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <AuthField
            testID="login-password"
            icon="lock"
            placeholder="পাসওয়ার্ড"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? 'eye' : 'eye-off'}
            onRightPress={() => setShowPassword((value) => !value)}
          />
        </View>

        {loginError ? <Text style={[styles.errorText, { color: colors.primary }]}>{loginError}</Text> : null}

        <Pressable testID="forgot-password" onPress={() => router.push('/auth/forgot')} style={styles.forgot}>
          <Text style={[styles.forgotText, { color: colors.authorAction ?? colors.primary }]}>পাসওয়ার্ড ভুলে গেছেন?</Text>
        </Pressable>

        <Pressable testID="login-submit" onPress={() => void submitLogin()} style={[styles.primaryButton, { backgroundColor: colors.authorAction ?? colors.primary, opacity: busy ? 0.7 : 1 }]}>
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{busy ? 'লগইন হচ্ছে…' : 'লগইন করুন'}</Text>
        </Pressable>

        <Divider colors={colors} />

        <GoogleAuthButton testID="google-login" />

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>চালিয়ে গেলে আপনি আমাদের লেখক নীতিমালা ও গোপনীয়তা নীতিতে সম্মত হচ্ছেন</Text>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>অথবা</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 30 },
  backButton: { width: 36, height: 40, justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 15, marginBottom: 18 },
  accountIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: 'serif', fontSize: 27, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontFamily: 'serif', fontSize: 16, marginTop: 7, textAlign: 'center' },
  form: { gap: 16, marginTop: 30 },
  demoCard: { borderWidth: 1, borderRadius: 18, padding: 13, marginTop: 17, flexDirection: 'row', alignItems: 'center', gap: 8 },
  demoCopy: { flex: 1, minWidth: 0 },
  demoTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  demoCredential: { fontSize: 10, lineHeight: 16 },
  demoFillButton: { minHeight: 36, borderRadius: 12, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  demoFillText: { fontSize: 11, fontWeight: '700' },
  errorText: { fontSize: 12, lineHeight: 18, marginTop: 9 },
  forgot: { alignSelf: 'flex-end', marginTop: 15, paddingVertical: 4 },
  forgotText: { fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
  primaryButton: { minHeight: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  primaryButtonText: { fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 17, marginVertical: 28 },
  divider: { height: 1, flex: 1 },
  dividerText: { fontFamily: 'serif', fontSize: 15 },
  googleButton: { minHeight: 61, borderRadius: 31, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13 },
  googleMark: { fontSize: 27, fontWeight: '800' },
  googleText: { fontSize: 17 },
  legal: { fontFamily: 'serif', fontSize: 12, lineHeight: 20, textAlign: 'center', marginTop: 24 },
});