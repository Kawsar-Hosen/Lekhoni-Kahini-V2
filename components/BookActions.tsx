import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type BookActionMenuProps = {
  visible: boolean;
  topOffset: number;
  onClose: () => void;
  onShare: () => void;
};

export function BookActionMenu({ visible, topOffset, onClose, onShare }: BookActionMenuProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.actionOverlay}>
        <Pressable testID="book-actions-backdrop" onPress={onClose} style={styles.actionBackdrop} />
        <View style={[styles.actionMenu, { top: topOffset, backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable testID="share-book" onPress={onShare} style={styles.actionRow}>
            <Feather name="share" size={19} color={colors.foreground} />
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>শেয়ার করুন</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type ReportReason = 'adult' | 'copyright' | 'spam' | 'other';

type BookReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason, description: string) => void;
};

const reportReasons: { id: ReportReason; label: string }[] = [
  { id: 'adult', label: 'আপত্তিকর বা অ্যাডাল্ট কনটেন্ট' },
  { id: 'copyright', label: 'কপিরাইট লঙ্ঘন' },
  { id: 'spam', label: 'স্প্যাম বা ভুল তথ্য' },
  { id: 'other', label: 'অন্যান্য' },
];

export function BookReportModal({ visible, onClose, onSubmit }: BookReportModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason>('adult');
  const [description, setDescription] = useState('');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  };

  const submit = () => {
    if (description.trim().length < 50) {
      showToast('অনুগ্রহ করে রিপোর্টের বিস্তারিত বিবরণ লিখুন।');
      return;
    }
    onSubmit(reason, description.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.reportOverlay}>
        <Pressable testID="report-backdrop" onPress={onClose} style={styles.reportBackdrop} />
        <ScrollView
          style={styles.reportScroll}
          contentContainerStyle={styles.reportScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.reportDialog, { backgroundColor: colors.card }]}>
            <View style={styles.reportHeading}>
              <Feather name="alert-triangle" size={22} color={colors.destructive} />
              <Text style={[styles.reportTitle, { color: colors.destructive }]}>বইটি রিপোর্ট করুন</Text>
            </View>
            <Text style={[styles.reportPrompt, { color: colors.foreground }]}>কেন আপনি এই বইটি রিপোর্ট করতে চাচ্ছেন?</Text>

            <View style={styles.reasonList}>
              {reportReasons.map((option) => {
                const selected = reason === option.id;
                return (
                  <Pressable
                    key={option.id}
                    testID={`report-reason-${option.id}`}
                    onPress={() => setReason(option.id)}
                    style={styles.reasonRow}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <MaterialIcons
                      name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                      size={23}
                      color={selected ? colors.primary : colors.mutedForeground}
                    />
                    <Text style={[styles.reasonText, { color: colors.foreground }]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.reportDescriptionLabel, { color: colors.mutedForeground }]}>
              বিস্তারিত লিখুন (আবশ্যক, ন্যূনতম ৫০ অক্ষর):
            </Text>
            <TextInput
              testID="report-description"
              multiline
              maxLength={1200}
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                if (toast) setToast('');
              }}
              placeholder="ন্যূনতম ৫০ অক্ষরের মধ্যে বর্ণনা করুন..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.reportInput, { color: colors.foreground, borderColor: colors.border }]}
            />
            <View style={styles.reportButtons}>
              <Pressable testID="cancel-report" onPress={onClose} style={styles.cancelReport}>
                <Text style={[styles.cancelReportText, { color: colors.mutedForeground }]}>বাতিল</Text>
              </Pressable>
              <Pressable
                testID="submit-report"
                onPress={submit}
                style={[styles.submitReport, { backgroundColor: colors.destructive }]}
              >
                <Text style={[styles.submitReportText, { color: colors.destructiveForeground }]}>জমা দিন</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {toast ? (
          <View style={[styles.reportToast, { bottom: Math.max(insets.bottom, 18) + 34, backgroundColor: colors.deepInk }]}>
            <Feather name="info" size={19} color="#fff" />
            <Text style={styles.reportToastText}>{toast}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionOverlay: { flex: 1 },
  actionBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  actionMenu: { position: 'absolute', right: 12, width: 226, borderWidth: 1, borderRadius: 13, paddingVertical: 5, paddingHorizontal: 7, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 12 },
  actionRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 11 },
  actionLabel: { fontFamily: 'serif', fontSize: 16 },
  reportOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reportBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.58)' },
  reportScroll: { width: '100%', maxHeight: '90%' },
  reportScrollContent: { minHeight: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 10 },
  reportDialog: { width: '100%', maxWidth: 520, borderRadius: 19, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 19 },
  reportHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reportTitle: { fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  reportPrompt: { fontFamily: 'serif', fontSize: 15, marginTop: 13, marginBottom: 20 },
  reasonList: { gap: 10, marginBottom: 18 },
  reasonRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reasonText: { fontFamily: 'serif', fontSize: 15 },
  reportDescriptionLabel: { fontFamily: 'serif', fontSize: 13, marginBottom: 8 },
  reportInput: { minHeight: 100, maxHeight: 150, borderWidth: 1.5, borderRadius: 10, padding: 10, fontFamily: 'serif', fontSize: 14, textAlignVertical: 'top' },
  reportButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 20, marginTop: 21 },
  cancelReport: { minWidth: 62, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  cancelReportText: { fontFamily: 'serif', fontSize: 15 },
  submitReport: { minWidth: 116, minHeight: 46, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  submitReportText: { fontFamily: 'serif', fontSize: 16, fontWeight: '700' },
  reportToast: { position: 'absolute', left: 36, right: 36, minHeight: 58, borderRadius: 26, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 8 },
  reportToastText: { flex: 1, color: '#fff', fontFamily: 'serif', fontSize: 13, lineHeight: 20 },
});