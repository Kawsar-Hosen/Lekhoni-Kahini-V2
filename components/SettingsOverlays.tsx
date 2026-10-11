import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import type { ThemeChoice } from '@/constants/colors';

export type { ThemeChoice };

export const themeChoices: { id: ThemeChoice; label: string }[] = [
  { id: 'default-light', label: 'ডিফল্ট লাইট' },
  { id: 'deep-night', label: 'ডিপ নাইট' },
  { id: 'sepia', label: 'সেপিয়া ক্লাসিক' },
  { id: 'cartoon', label: 'কার্টুনপাশ' },
  { id: 'forest', label: 'অরণ্য গ্রিন' },
  { id: 'lavender', label: 'ল্যাভেন্ডার' },
];

type NameSetupModalProps = {
  visible: boolean;
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function NameSetupModal({ visible, initialName = '', onClose, onSave }: NameSetupModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable testID="name-modal-backdrop" onPress={onClose} style={styles.overlayTap} />
        <View style={[styles.nameSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 18 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.nameTitle, { color: colors.foreground }]}>আপনার নাম লিখুন</Text>
          <TextInput
            testID="profile-name-input"
            autoFocus
            value={name}
            onChangeText={setName}
            maxLength={40}
            placeholder="উদাহরণ: রবি, আদনান, সুপ্রিয়া…"
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            style={[styles.nameInput, { color: colors.foreground, borderBottomColor: colors.primary }]}
          />
          <View style={styles.nameActions}>
            <Pressable testID="cancel-name" onPress={onClose} hitSlop={10}>
              <Text style={[styles.cancelText, { color: colors.foreground }]}>বাতিল</Text>
            </Pressable>
            <Pressable testID="save-name" onPress={save} hitSlop={10}>
              <Text style={[styles.saveText, { color: colors.primary }]}>সংরক্ষণ করুন</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type ThemePickerSheetProps = {
  visible: boolean;
  selected: ThemeChoice;
  onClose: () => void;
  onConfirm: (theme: ThemeChoice) => void;
};

export function ThemePickerSheet({ visible, selected, onClose, onConfirm }: ThemePickerSheetProps) {
  const colors = useColors();
  const [draft, setDraft] = useState<ThemeChoice>(selected);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) setDraft(selected);
  }, [visible, selected]);

  const swatches: Record<ThemeChoice, string> = {
    'default-light': '#ffffff',
    'deep-night': '#182234',
    sepia: '#faf5e9',
    cartoon: '#e0447c',
    forest: '#2f7d4f',
    lavender: '#7c5cbf',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable testID="theme-sheet-backdrop" onPress={onClose} style={styles.overlayTap} />
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
          style={[styles.themeSheet, { backgroundColor: colors.card }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.themeTitle, { color: colors.foreground }]}>অ্যাপ থিম বেছে নিন</Text>
          <Text style={[styles.themeSubtitle, { color: colors.mutedForeground }]}>পড়ার স্বাচ্ছন্দ্যে চোখাবান্ধব থিম নির্বাচন করুন</Text>
          <View style={styles.themeGrid}>
            {themeChoices.map((option) => {
              const isSelected = draft === option.id;
              return (
                <Pressable
                  key={option.id}
                  testID={`theme-${option.id}`}
                  onPress={() => setDraft(option.id)}
                  style={({ pressed }) => [
                    styles.themeOption,
                    { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 },
                  ]}
                >
                  <View style={[styles.swatch, { backgroundColor: swatches[option.id], borderColor: colors.border }]} />
                  <Text style={[styles.themeOptionText, { color: colors.foreground }]}>{option.label}</Text>
                  {isSelected ? <Feather name="check" size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Pressable testID="confirm-theme" onPress={() => { onConfirm(draft); onClose(); }} style={[styles.confirmTheme, { backgroundColor: colors.primary }]}>
            <Text style={[styles.confirmThemeText, { color: colors.primaryForeground }]}>ঠিক আছে</Text>
          </Pressable>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
}

type ReaderSettingsTab = 'text-theme' | 'voice' | 'notes';

type ReaderSettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  keepScreenOn: boolean;
  onKeepScreenOnChange: (value: boolean) => void;
};

const readerBackgrounds = ['#ffffff', '#111111', '#f7f0e2', '#f2f3f7', '#fff0f5', '#eff6f0'];

export function ReaderSettingsSheet({
  visible,
  onClose,
  fontSize,
  onFontSizeChange,
  backgroundColor,
  onBackgroundColorChange,
  keepScreenOn,
  onKeepScreenOnChange,
}: ReaderSettingsSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ReaderSettingsTab>('text-theme');
  const [note, setNote] = useState('');
  const [sliderWidth, setSliderWidth] = useState(0);

  const tabs: { id: ReaderSettingsTab; label: string }[] = [
    { id: 'text-theme', label: 'লেখা ও থিম' },
    { id: 'voice', label: 'ভয়েস ও উচ্চারণ' },
    { id: 'notes', label: 'নোটপ্যাড' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.readerOverlay}>
        <Pressable testID="reader-settings-backdrop" onPress={onClose} style={styles.overlayTap} />
        <View style={[styles.readerSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.readerTitle, { color: colors.foreground }]}>রিডার সেটিংস</Text>
          <View style={[styles.readerTabs, { borderBottomColor: colors.border }]}>
            {tabs.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  testID={`reader-settings-tab-${tab.id}`}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.readerTab, selected && { borderBottomColor: colors.primary }]}
                >
                  <Text numberOfLines={1} style={[styles.readerTabText, { color: selected ? colors.primary : colors.mutedForeground }]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.readerSettingsContent}>
            {activeTab === 'text-theme' ? (
              <>
                <View style={[styles.readerSettingCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.readerSettingLabel, { color: colors.mutedForeground }]}>পেইজের ব্যাকগ্রাউন্ড</Text>
                  <View style={styles.readerSwatches}>
                    {readerBackgrounds.map((swatch) => {
                      const selected = backgroundColor === swatch;
                      return (
                        <Pressable
                          key={swatch}
                          testID={`reader-background-${swatch.slice(1)}`}
                          onPress={() => onBackgroundColorChange(swatch)}
                          accessibilityRole="button"
                          accessibilityLabel={`পেইজের রং ${swatch}`}
                          style={[styles.readerSwatch, { backgroundColor: swatch, borderColor: selected ? colors.primary : colors.border }, selected && styles.readerSwatchSelected]}
                        />
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.readerSettingCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.readerSettingLabel, { color: colors.mutedForeground }]}>লেখার সাইজ</Text>
                  <View style={styles.fontSliderRow}>
                    <Text style={[styles.fontSizeSymbol, { color: colors.primary }]}>A+</Text>
                    <Pressable
                      testID="reader-font-size-slider"
                      onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
                      onPress={(event) => {
                        if (sliderWidth > 0) {
                          const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / sliderWidth));
                          onFontSizeChange(14 + Math.round(ratio * 16));
                        }
                      }}
                      style={[styles.fontSliderTrack, { backgroundColor: colors.secondary }]}
                    >
                      <View style={[styles.fontSliderProgress, { backgroundColor: colors.rose, width: `${((fontSize - 14) / 16) * 100}%` }]} />
                      <View style={[styles.fontSliderThumb, { backgroundColor: colors.primary, left: `${((fontSize - 14) / 16) * 100}%` }]} />
                    </Pressable>
                    <Text style={[styles.fontSizeValue, { color: colors.mutedForeground }]}>{fontSize}sp</Text>
                  </View>
                </View>

                <View style={[styles.readerSettingCard, styles.keepAwakeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.readerSettingLabel, { color: colors.mutedForeground }]}>স্ক্রিন অন রাখুন</Text>
                  <Switch
                    testID="keep-screen-on"
                    value={keepScreenOn}
                    onValueChange={onKeepScreenOnChange}
                    trackColor={{ false: colors.border, true: colors.rose }}
                    thumbColor={keepScreenOn ? colors.primary : '#ffffff'}
                  />
                </View>
              </>
            ) : activeTab === 'voice' ? (
              <View style={[styles.readerSettingCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.readerSettingLabel, { color: colors.foreground }]}>ভয়েস ও উচ্চারণ</Text>
                <Text style={[styles.readerVoiceNote, { color: colors.mutedForeground }]}>এই গল্পের অডিও শোনার জন্য হেডফোন আইকনে চাপ দিন।</Text>
              </View>
            ) : (
              <View style={[styles.readerSettingCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.readerSettingLabel, { color: colors.foreground }]}>নোটপ্যাড</Text>
                <TextInput
                  testID="reader-note"
                  multiline
                  value={note}
                  onChangeText={setNote}
                  placeholder="এই গল্পের জন্য আপনার নোট লিখুন"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.readerNoteInput, { color: colors.foreground, borderColor: colors.border }]}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayTap: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,26,36,0.34)' },
  nameSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 25, paddingTop: 13, minHeight: 244 },
  themeSheet: { maxHeight: '74%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 25, paddingTop: 13 },
  sheetHandle: { alignSelf: 'center', width: 57, height: 4, borderRadius: 3, marginBottom: 23 },
  nameTitle: { fontFamily: 'serif', fontSize: 24, fontWeight: '700' },
  nameInput: { height: 50, borderBottomWidth: 1, fontFamily: 'serif', fontSize: 22, marginTop: 15 },
  nameActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 35, alignItems: 'center', marginTop: 30 },
  cancelText: { fontFamily: 'serif', fontSize: 15 },
  saveText: { fontFamily: 'serif', fontSize: 15, fontWeight: '700' },
  themeTitle: { fontFamily: 'serif', fontSize: 24, fontWeight: '700' },
  themeSubtitle: { fontSize: 13, marginTop: 7 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 },
  themeOption: { width: '48%', minHeight: 61, borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 1 },
  themeOptionText: { flex: 1, fontFamily: 'serif', fontSize: 14 },
  confirmTheme: { minHeight: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  confirmThemeText: { fontFamily: 'serif', fontSize: 17, fontWeight: '700' },
  readerOverlay: { flex: 1, justifyContent: 'flex-end' },
  readerSheet: { maxHeight: '72%', borderTopLeftRadius: 27, borderTopRightRadius: 27, paddingTop: 12, paddingHorizontal: 22, overflow: 'hidden' },
  readerTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  readerTabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, marginHorizontal: -4 },
  readerTab: { flex: 1, minHeight: 43, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', paddingHorizontal: 3 },
  readerTabText: { fontFamily: 'serif', fontSize: 12, fontWeight: '600' },
  readerSettingsContent: { paddingTop: 17, paddingBottom: 8, gap: 14 },
  readerSettingCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 15 },
  readerSettingLabel: { fontFamily: 'serif', fontSize: 14, fontWeight: '500' },
  readerSwatches: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  readerSwatch: { width: 39, height: 39, borderRadius: 20, borderWidth: 1 },
  readerSwatchSelected: { borderWidth: 3 },
  fontSliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  fontSizeSymbol: { fontSize: 19, fontWeight: '700' },
  fontSliderTrack: { flex: 1, height: 9, borderRadius: 6, justifyContent: 'center' },
  fontSliderProgress: { height: 3, borderRadius: 2 },
  fontSliderThumb: { position: 'absolute', width: 16, height: 30, borderRadius: 4, marginLeft: -8 },
  fontSizeValue: { minWidth: 34, textAlign: 'right', fontSize: 12 },
  keepAwakeCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readerVoiceNote: { fontSize: 13, lineHeight: 21, marginTop: 8 },
  readerNoteInput: { minHeight: 130, borderWidth: 1, borderRadius: 13, padding: 12, textAlignVertical: 'top', marginTop: 12 },
});