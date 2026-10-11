import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';

type AuthModeToggleProps = {
  mode: 'login' | 'register';
  onLogin: () => void;
  onRegister: () => void;
};

export function AuthModeToggle({ mode, onLogin, onRegister }: AuthModeToggleProps) {
  const colors = useColors();
  return (
    <View style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={onLogin} style={[styles.option, mode === 'login' && { backgroundColor: colors.background }]}>
        <Text style={[styles.optionText, { color: mode === 'login' ? colors.foreground : colors.mutedForeground }]}>লগইন</Text>
      </Pressable>
      <Pressable onPress={onRegister} style={[styles.option, mode === 'register' && { backgroundColor: colors.background }]}>
        <Text style={[styles.optionText, { color: mode === 'register' ? colors.foreground : colors.mutedForeground }]}>নিবন্ধন</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { height: 67, borderRadius: 34, borderWidth: 1, padding: 3, flexDirection: 'row' },
  option: { flex: 1, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
});