import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';

// IMPORTANT: iOS 26 uses NativeTabs for native tabs with liquid glass support.
// NativeTabs intentionally does NOT use custom design tokens — liquid glass
// is a system-level appearance provided by iOS and cannot be overridden.
// Custom brand colors are applied only on the ClassicTabLayout path (older iOS / Android / web).
function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>হোম</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="audio">
        <Icon sf={{ default: 'mic', selected: 'mic.fill' }} />
        <Label>অডিও</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="categories">
        <Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
        <Label>ক্যাটাগরি</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <Icon sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }} />
        <Label>লাইব্রেরি</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: isIOS ? 0 : 1,
          borderTopColor: colors.border,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          minHeight: 78,
          elevation: 10,
        },
        tabBarBackground: isIOS
          ? () => <View style={[StyleSheet.absoluteFill, styles.tabBarBackground, { backgroundColor: colors.card, opacity: 0.94 }]} />
          : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'হোম',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && { backgroundColor: colors.accent }]}>
              {isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Feather name="home" size={21} color={color} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          title: 'অডিও',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && { backgroundColor: colors.accent }]}>
              <Feather name="mic" size={21} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'ক্যাটাগরি',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && { backgroundColor: colors.accent }]}>
              <Feather name="grid" size={21} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'লাইব্রেরি',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconPill, focused && { backgroundColor: colors.accent }]}>
              <Feather name="book-open" size={21} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: { borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  tabItem: { paddingTop: 5 },
  tabIconPill: { minWidth: 60, height: 32, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, marginTop: 2, fontWeight: '600' },
});

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
