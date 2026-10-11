import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthField } from '@/components/AuthField';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { forgotPassword, resetPassword } = useWriterAccess();
  const topInset = insets.top;
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleBack = () => {
    if (step === 'reset') {
      setStep('email');
      setCode('');
      setPassword('');
      setError('');
      setSent(false);
      return;
    }
    goBackOrFallback('/auth/login');
  };

  useEffect(() => {
    if (Platform.OS !== 'android' || step !== 'reset') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep('email');
      setCode('');
      setPassword('');
      setError('');
      setSent(false);
      return true;
    });
    return () => subscription.remove();
  }, [step]);

  const sendCode = async () => {
    if (busy) return;
    if (!email.trim() || !email.includes('@')) {
      setError('সঠিক ইমেইল ঠিকানা দিন।');
      return;
    }
    setBusy(true);
    setError('');
    const r = await forgotPassword(email.trim());
    setBusy(false);
    if (r.ok) {
      setSent(true);
      setStep('reset');
      return;
    }
    setError('অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।');
  };

  const submitReset = async () => {
    if (busy) return;
    if (code.trim().length < 6) {
      setError('ইমেইলে পাঠানো ৬ সংখ্যার কোডটি লিখুন।');
      return;
    }
    if (password.length < 8) {
      setError('নতুন পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।');
      return;
    }
    setBusy(true);
    setError('');
    const res = await resetPassword(email.trim(), code.trim(), password);
    setBusy(false);
    if (res.ok) {
      router.replace('/writer/panel');
      return;
    }
    setError(res.error);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingTop: topInset + 8, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          testID="auth-back"
          onPress={handleBack}
          hitSlop={12}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={25} color={colors.foreground} />
        </Pressable>

        <View style={styles.hero}>
          <View style={[styles.accountIcon, { backgroundColor: colors.card }]}>
            <Feather name="lock" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>পাসওয়ার্ড রিসেট</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {step === 'email' ? 'অ্যাকাউন্টের ইমেইল লিখুন, কোড পাঠিয়ে দিচ্ছি' : 'কোড ও নতুন পাসওয়ার্ড দিন'}
          </Text>
        </View>

        <View style={styles.form}>
          <AuthField
            testID="forgot-email"
            icon="mail"
            placeholder="ইমেইল ঠিকানা"
            value={email}
            onChangeText={setEmail}
            editable={step === 'email'}
          />
          {step === 'reset' ? (
            <>
              <AuthField
                testID="forgot-code"
                icon="shield"
                placeholder="৬ সংখ্যার কোড"
                value={code}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
              <AuthField
                testID="forgot-password"
                icon="lock"
                placeholder="নতুন পাসওয়ার্ড (অন্তত ৮ অক্ষর)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={showPassword ? 'eye' : 'eye-off'}
                onRightPress={() => setShowPassword((value) => !value)}
              />
            </>
          ) : null}
        </View>

        {error ? <Text style={[styles.errorText, { color: colors.primary }]}>{error}</Text> : null}
        {sent && step === 'reset' ? (
          <Text style={[styles.sentText, { color: colors.successText }]}>কোড পাঠানো হয়েছে। ইমেইল চেক করুন।</Text>
        ) : null}

        {step === 'email' ? (
          <Pressable testID="forgot-send" onPress={() => void sendCode()} style={[styles.primaryButton, { backgroundColor: colors.authorAction ?? colors.primary, opacity: busy ? 0.7 : 1 }]}>
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{busy ? 'পাঠানো হচ্ছে…' : 'কোড পাঠান'}</Text>
          </Pressable>
        ) : (
          <Pressable testID="forgot-submit" onPress={() => void submitReset()} style={[styles.primaryButton, { backgroundColor: colors.authorAction ?? colors.primary, opacity: busy ? 0.7 : 1 }]}>
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{busy ? 'যাচাই হচ্ছে…' : 'পাসওয়ার্ড বদলান'}</Text>
          </Pressable>
        )}

        <Pressable testID="forgot-login" onPress={() => router.replace('/auth/login')} style={styles.loginLink}>
          <Text style={[styles.loginLinkText, { color: colors.primary }]}>লগইন পেজে ফিরুন</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
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
  errorText: { fontSize: 12, lineHeight: 18, marginTop: 9 },
  sentText: { fontSize: 12, lineHeight: 18, marginTop: 9 },
  primaryButton: { minHeight: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  primaryButtonText: { fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  loginLink: { alignSelf: 'center', marginTop: 22, paddingVertical: 6 },
  loginLinkText: { fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
});
