import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthField } from '@/components/AuthField';
import { AuthModeToggle } from '@/components/AuthModeToggle';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useWriterAccess();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitRegistration = async () => {
    if (busy) return;
    if (!name.trim() || !phone.trim() || !email.trim() || password.length < 8) {
      setRegisterError('নাম, মোবাইল, ইমেইল ও অন্তত ৮ অক্ষরের password দিন।');
      return;
    }
    setBusy(true);
    setRegisterError('');
    const username = email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '') || `writer${Date.now().toString(36)}`;
    const res = await signUp(name, username, password, phone, bio, email.trim());
    setBusy(false);
    if (!res.ok) {
      setRegisterError(res.error);
      return;
    }
    if (res.needsVerification && res.email) {
      router.replace({ pathname: '/writer/verification', params: { email: res.email } });
      return;
    }
    router.replace('/writer/panel');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingTop: topInset + 8, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable testID="auth-back" onPress={() => goBackOrFallback('/auth/login')} hitSlop={12} style={styles.backButton}>
          <Feather name="arrow-left" size={25} color={colors.foreground} />
        </Pressable>

        <View style={styles.hero}>
          <View style={[styles.accountIcon, { backgroundColor: colors.card }]}>
            <Feather name="user" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>নতুন অ্যাকাউন্ট!</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>লেখনী কাহিনীতে লেখক হিসেবে যুক্ত হন</Text>
        </View>

        <AuthModeToggle mode="register" onLogin={() => router.replace('/auth/login')} onRegister={() => undefined} />

        <View style={styles.form}>
          <AuthField testID="register-name" icon="user" placeholder="আপনার নাম (পাবলিক নাম)" value={name} onChangeText={setName} />
          <AuthField testID="register-phone" icon="phone" placeholder="মোবাইল নম্বর" value={phone} onChangeText={setPhone} rightText="০/১১" />
          <AuthField testID="register-email" icon="mail" placeholder="ইমেইল ঠিকানা" value={email} onChangeText={setEmail} />
          <AuthField
            testID="register-password"
            icon="lock"
            placeholder="পাসওয়ার্ড তৈরি করুন"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightText="০/৮"
            rightIcon={showPassword ? 'eye' : 'eye-off'}
            onRightPress={() => setShowPassword((value) => !value)}
          />
          <AuthField testID="register-bio" icon="message-square" placeholder="আপনার সম্পর্কে কিছু লিখুন (Bio)…" value={bio} onChangeText={setBio} multiline rightText="০/১৫০" />
        </View>

        <Pressable testID="profile-image" onPress={() => Alert.alert('প্রোফাইল ছবি', 'প্রোফাইল ছবি পরে যোগ করা যাবে।')} style={[styles.photoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.photoPlaceholder, { borderColor: colors.border }]}>
            <Feather name="user" size={34} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.photoText, { color: colors.foreground }]}>প্রোফাইল ছবি সিলেক্ট করুন (ঐচ্ছিক)</Text>
        </Pressable>

        {registerError ? <Text style={[styles.errorText, { color: colors.primary }]}>{registerError}</Text> : null}

        <Pressable testID="register-submit" onPress={() => void submitRegistration()} style={[styles.primaryButton, { backgroundColor: colors.authorAction ?? colors.primary, opacity: busy ? 0.7 : 1 }]}>
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{busy ? 'নিবন্ধন হচ্ছে…' : 'নিবন্ধন সম্পন্ন করুন'}</Text>
        </Pressable>

        <Divider colors={colors} />

        <GoogleAuthButton testID="google-register" />

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
  photoCard: { minHeight: 190, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 20 },
  photoPlaceholder: { width: 120, height: 120, borderWidth: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  photoText: { fontFamily: 'serif', fontSize: 14 },
  errorText: { fontSize: 12, lineHeight: 18, marginTop: 15 },
  demoNotice: { fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 13 },
  primaryButton: { minHeight: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryButtonText: { fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 17, marginVertical: 28 },
  divider: { height: 1, flex: 1 },
  dividerText: { fontFamily: 'serif', fontSize: 15 },
  googleButton: { minHeight: 61, borderRadius: 31, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13 },
  googleMark: { fontSize: 27, fontWeight: '800' },
  googleText: { fontSize: 17 },
  legal: { fontFamily: 'serif', fontSize: 12, lineHeight: 20, textAlign: 'center', marginTop: 24 },
});