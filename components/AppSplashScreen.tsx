import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROSE = '#9d3157';
const APP_VERSION = Constants.expoConfig?.version;

export function StartupSplashGate({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.gate}>
      {children}
      {visible && <AppSplashScreen />}
    </View>
  );
}

function AppSplashScreen() {
  return (
    <View style={styles.overlay} accessibilityLabel="লেখনি কাহিনী চালু হচ্ছে">
      <StatusBar hidden />
      <LinearGradient
        colors={['#ffffff', '#fffdfd', '#fff9fb']}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(199, 111, 143, 0.14)', 'rgba(255, 248, 251, 0)']}
        style={[styles.glow, styles.topGlow]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(199, 111, 143, 0.12)', 'rgba(255, 248, 251, 0)']}
        style={[styles.glow, styles.bottomGlow]}
        pointerEvents="none"
      />
      <View style={[styles.dot, styles.dotTopLeft]} />
      <View style={[styles.dot, styles.dotTopRight]} />
      <View style={[styles.dot, styles.dotMidLeft]} />
      <View style={[styles.dot, styles.dotBottomRight]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.topSpace} />

          <View style={styles.hero}>
            <View style={styles.logoFrame}>
              <Image
                source={require('../assets/images/lekhoni-kahini-logo.png')}
                style={styles.logo}
                resizeMode="cover"
                accessibilityLabel="লেখনি কাহিনী অ্যাপের লোগো"
              />
            </View>

            <View style={styles.eyebrow}>
              <View style={styles.eyebrowLine} />
              <Text style={styles.eyebrowText}>গল্প • উপন্যাস • কবিতা</Text>
              <View style={styles.eyebrowLine} />
            </View>

            <Text style={styles.title}>লেখনি কাহিনী</Text>
            <Text style={styles.description}>
              বাংলা গল্পের আপন ঠিকানা—{'\n'}
              প্রিয় গল্প পড়ুন, নতুন লেখক আবিষ্কার করুন।
            </Text>
          </View>

          <View style={styles.flexSpace} />

          <View style={styles.footer}>
            <ActivityIndicator
              size="small"
              color={ROSE}
              accessibilityLabel="গল্পের জগৎ সাজানো হচ্ছে"
            />
            <Text style={styles.loading}>গল্পের জগৎ সাজানো হচ্ছে…</Text>
            <Text style={styles.poweredBy}>
              Powered by <Text style={styles.brand}>Lekhoni Kahini</Text>
            </Text>
            <Text style={styles.version}>
              সংস্করণ {APP_VERSION ?? '1.3.0'} · {new Date().getFullYear()}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
    overflow: 'hidden',
    backgroundColor: '#fffafb',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
  },
  flexSpace: {
    flex: 1,
  },
  topSpace: {
    flex: 1.35,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
  },
  logoFrame: {
    width: 174,
    height: 174,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: '#f1e8eb',
    borderRadius: 26,
    shadowColor: '#8e304f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 25,
  },
  eyebrowLine: {
    width: 21,
    height: 1,
    backgroundColor: '#d9b1bd',
  },
  eyebrowText: {
    color: '#876a73',
    fontFamily: 'NotoSerifBengali_500Medium',
    fontSize: 12,
    letterSpacing: 0.15,
  },
  title: {
    marginTop: 7,
    color: ROSE,
    fontFamily: 'NotoSerifBengali_700Bold',
    fontSize: 29,
    lineHeight: 47,
    textAlign: 'center',
  },
  description: {
    marginTop: 3,
    color: '#766a6f',
    fontFamily: 'NotoSerifBengali_400Regular',
    fontSize: 14,
    lineHeight: 25,
    textAlign: 'center',
  },
  footer: {
    minHeight: 106,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
  },
  loading: {
    marginTop: 10,
    marginBottom: 18,
    color: '#72686c',
    fontFamily: 'NotoSerifBengali_500Medium',
    fontSize: 13,
  },
  poweredBy: {
    color: '#81767a',
    fontSize: 13,
  },
  brand: {
    color: ROSE,
    fontWeight: '600',
  },
  version: {
    marginTop: 4,
    color: '#8f8589',
    fontSize: 12,
  },
  glow: {
    position: 'absolute',
    width: 285,
    height: 285,
    borderRadius: 150,
    opacity: 0.7,
  },
  topGlow: {
    top: -170,
    right: -125,
    transform: [{ scaleX: 1.15 }],
  },
  bottomGlow: {
    bottom: -185,
    left: -145,
    transform: [{ scaleX: 1.25 }],
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d5a4b3',
    opacity: 0.62,
  },
  dotTopLeft: {
    top: '10%',
    left: '10%',
  },
  dotTopRight: {
    top: '20%',
    right: '14%',
  },
  dotMidLeft: {
    top: '41%',
    left: '13%',
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotBottomRight: {
    bottom: '17%',
    right: '12%',
  },
});
