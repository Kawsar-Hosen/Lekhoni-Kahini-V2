import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useColors } from '@/hooks/useColors';

export type WriterTab = 'dashboard' | 'stories' | 'profile';

export function WriterHeader({
  title,
  subtitle,
  backToStudio = false,
  onBack,
  showActions = true,
}: {
  title: string;
  subtitle?: string;
  backToStudio?: boolean;
  onBack?: () => void;
  showActions?: boolean;
}) {
  const colors = useColors();
  const { signOut } = useWriterAccess();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backToStudio ? 'স্টুডিওতে ফিরুন' : 'হোমে ফিরুন'}
        onPress={() => onBack ? onBack() : backToStudio ? router.replace('/writer/panel') : router.replace('/')}
        hitSlop={10}
        style={styles.headerIcon}
      >
        <Feather name="arrow-left" size={23} color={colors.foreground} />
      </Pressable>
      <View style={styles.headerTitleWrap}>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      {showActions ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="সাপোর্ট সেন্টার"
            onPress={() => router.push('/writer/support')}
            style={styles.headerIcon}
          >
            <Feather name="message-square" size={22} color={colors.foreground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="লগআউট"
            onPress={() => {
              signOut();
              router.replace('/');
            }}
            style={styles.headerIcon}
          >
            <Feather name="log-out" size={21} color={colors.foreground} />
          </Pressable>
        </>
      ) : <View style={styles.headerActionsSpacer} />}
    </View>
  );
}

export function WriterTabBar({ active, onChange }: { active: WriterTab; onChange: (tab: WriterTab) => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabs: { id: WriterTab; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: 'grid' },
    { id: 'stories', label: 'আমার গল্প', icon: 'book-open' },
    { id: 'profile', label: 'প্রোফাইল', icon: 'user' },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.id)}
            style={styles.tab}
          >
            <View style={[styles.tabIcon, { backgroundColor: selected ? colors.accent : 'transparent' }]}>
              <Feather name={tab.icon} size={21} color={selected ? colors.primary : colors.mutedForeground} />
            </View>
            <Text style={[styles.tabLabel, { color: selected ? colors.primary : colors.mutedForeground }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function WriterSectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View style={[styles.sectionMarker, { backgroundColor: colors.primary }]} />
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} style={[styles.sectionAction, { borderColor: colors.border }]}>
          <Text style={[styles.sectionActionText, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function WriterButton({
  label,
  onPress,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'soft' | 'outline';
  icon?: React.ComponentProps<typeof Feather>['name'];
}) {
  const colors = useColors();
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'soft' ? colors.secondary : colors.card;
  const foregroundColor = variant === 'primary' ? colors.primaryForeground : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor, borderColor: variant === 'outline' ? colors.primary : backgroundColor, opacity: pressed ? 0.84 : 1 },
      ]}
    >
      {icon ? <Feather name={icon} size={18} color={foregroundColor} /> : null}
      <Text style={[styles.actionLabel, { color: foregroundColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 5, borderBottomWidth: StyleSheet.hairlineWidth },
  headerIcon: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerActionsSpacer: { width: 81 },
  headerTitleWrap: { flex: 1, alignItems: 'center', minWidth: 0 },
  headerTitle: { fontSize: 19, fontWeight: '700' },
  headerSubtitle: { fontSize: 11, marginTop: 1 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 78, borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 7, elevation: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabIcon: { minWidth: 64, height: 39, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, lineHeight: 16 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 25, marginBottom: 13 },
  sectionMarker: { width: 4, height: 25, borderRadius: 2 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  sectionAction: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  sectionActionText: { fontSize: 11 },
  actionButton: { minHeight: 46, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionLabel: { fontSize: 14, fontWeight: '700' },
});
