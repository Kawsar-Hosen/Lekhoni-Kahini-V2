import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';
import { useWriterAccess } from '@/context/WriterAccessContext';
import * as WebBrowser from 'expo-web-browser';
import { ResponseType } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

// Same Google Cloud client as lekhoni-web. The backend verifies the ID token
// at /api/public/writers/google and returns a writer session + token.
const GOOGLE_WEB_CLIENT_ID = '940343114841-pd5po6gp5dij90nlp5k28tigp5qqr1rt.apps.googleusercontent.com';

export function GoogleAuthButton({ testID }: { testID: string }) {
  const colors = useColors();
  const router = useRouter();
  const { signInWithGoogle } = useWriterAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    responseType: ResponseType.IdToken,
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') setError('Google লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      return;
    }
    const credential = (response.params as { id_token?: string }).id_token;
    if (!credential) {
      setError('Google থেকে তথ্য পাওয়া যায়নি।');
      return;
    }
    setBusy(true);
    setError('');
    void signInWithGoogle(credential).then((res) => {
      setBusy(false);
      if (res.ok) router.replace('/writer/panel');
      else setError(res.error);
    });
  }, [response, router, signInWithGoogle]);

  return (
    <>
      <Pressable
        testID={testID}
        disabled={!request || busy}
        onPress={() => {
          setError('');
          void promptAsync();
        }}
        style={[styles.googleButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: !request || busy ? 0.6 : 1 }]}
      >
        <Text style={[styles.googleMark, { color: colors.primary }]}>G</Text>
        <Text style={[styles.googleText, { color: colors.foreground }]}>{busy ? 'যাচাই হচ্ছে…' : 'Google দিয়ে চালিয়ে যান'}</Text>
      </Pressable>
      {error ? <Text style={[styles.googleError, { color: colors.primary }]}>{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  googleButton: { minHeight: 61, borderRadius: 31, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13 },
  googleMark: { fontSize: 27, fontWeight: '800' },
  googleText: { fontSize: 17 },
  googleError: { fontSize: 12, lineHeight: 18, marginTop: 9, textAlign: 'center' },
});
