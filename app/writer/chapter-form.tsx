import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text, AppTextInput } from '@/components/AppText';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { WriterButton, WriterHeader } from '@/components/WriterChrome';
import { useWriterContent, useWriterStory } from '@/context/WriterContentContext';
import { useColors } from '@/hooks/useColors';

type TextAlign = 'left' | 'center' | 'right';

export default function WriterChapterFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId, chapterId } = useLocalSearchParams<{ bookId: string; chapterId?: string }>();
  const { getBook, saveChapter } = useWriterContent();
  const book = getBook(bookId);
  const { data: detail } = useWriterStory(chapterId ? bookId : '');
  const detailChapters = detail && 'chapters' in detail && Array.isArray(detail.chapters) ? detail.chapters : [];
  const chapter = chapterId ? detailChapters.find((item) => item.id === chapterId) : undefined;
  const [chapterNumber, setChapterNumber] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [filled, setFilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [fontSize, setFontSize] = useState(16);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const paddingTop = Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top;
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  React.useEffect(() => {
    if (filled) return;
    if (chapterId && !chapter) return;
    const pos = chapter ? String(detailChapters.findIndex((c) => c.id === chapter.id) + 1) : String((book?.chaptersCount ?? 0) + 1);
    setChapterNumber(pos);
    setTitle(chapter?.title ?? '');
    setBody(chapter?.body || '');
    setFilled(true);
  }, [filled, chapterId, chapter, book, detailChapters]);

  if (!book) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
        <WriterHeader title="বই পাওয়া যায়নি" backToStudio />
        <View style={styles.missing}><Text style={{ color: colors.mutedForeground }}>পর্বটি কোনো বইয়ের সঙ্গে যুক্ত নয়।</Text></View>
      </View>
    );
  }

  const updateBody = (next: string) => {
    setUndoStack((past) => [...past.slice(-29), body]);
    setRedoStack([]);
    setBody(next);
  };

  const formatBody = (format: 'bold' | 'italic' | 'underline' | 'bullet' | 'number') => {
    if (!body.trim()) {
      setMessage('আগে লেখার অংশ লিখুন, তারপর লেখার ধরন বদলান।');
      return;
    }
    setMessage('');
    if (format === 'bold') updateBody(body.startsWith('**') && body.endsWith('**') ? body.slice(2, -2) : `**${body}**`);
    if (format === 'italic') updateBody(body.startsWith('*') && body.endsWith('*') ? body.slice(1, -1) : `*${body}*`);
    if (format === 'underline') updateBody(body.startsWith('<u>') && body.endsWith('</u>') ? body.slice(3, -4) : `<u>${body}</u>`);
    if (format === 'bullet') updateBody(body.split('\n').map((line) => line.startsWith('• ') ? line.slice(2) : `• ${line}`).join('\n'));
    if (format === 'number') updateBody(body.split('\n').map((line, index) => line.replace(/^\d+[.)]\s*/, '')).map((line, index) => `${index + 1}. ${line}`).join('\n'));
  };

  const undo = () => {
    const previous = undoStack.at(-1);
    if (previous === undefined) return;
    setRedoStack((future) => [...future, body]);
    setUndoStack((past) => past.slice(0, -1));
    setBody(previous);
  };
  const redo = () => {
    const next = redoStack.at(-1);
    if (next === undefined) return;
    setUndoStack((past) => [...past, body]);
    setRedoStack((future) => future.slice(0, -1));
    setBody(next);
  };

  const save = async () => {
    if (saving) return;
    if (!title.trim() || !body.trim()) {
      Alert.alert('পর্ব অসম্পূর্ণ', 'পর্বের শিরোনাম ও গল্পের অংশ লিখুন।');
      return;
    }
    const parsedNumber = Number.parseInt(chapterNumber, 10);
    if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
      Alert.alert('পর্ব নম্বর', '১ বা তার বেশি একটি পর্ব নম্বর লিখুন।');
      return;
    }
    setSaving(true);
    const res = await saveChapter(book.id, {
      ...(chapter ? { id: chapter.id } : {}),
      order: parsedNumber,
      title: title.trim(),
      body: body.trim(),
      isFinal: false,
      status: 'লাইভ',
      views: 0,
    });
    setSaving(false);
    if (!res.id) {
      const msg = res.error === 'unsupported'
        ? 'সার্ভারে পর্ব সম্পাদনা এখনো চালু হয়নি। নতুন পর্ব যোগ করুন।'
        : 'পর্ব সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।';
      Alert.alert('সংরক্ষণ হয়নি', msg);
      return;
    }
    Keyboard.dismiss();
    router.replace({ pathname: '/writer/book/[id]', params: { id: book.id } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop }]}>
      <WriterHeader
        title={book.title}
        subtitle={chapter ? 'পর্ব সম্পাদনা' : 'নতুন পর্ব লিখুন'}
        onBack={() => router.replace({ pathname: '/writer/book/[id]', params: { id: book.id } })}
      />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={88}
      >
        <View style={styles.formHeader}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>{chapter ? 'পর্ব সম্পাদনা করুন' : 'নতুন পর্ব লিখুন'}</Text>
        </View>

        <View style={styles.fieldHeadings}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>পর্ব নম্বর</Text>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>পর্বের শিরোনাম</Text>
        </View>
        <View style={styles.titleRow}>
          <AppTextInput
            accessibilityLabel="পর্ব নম্বর"
            value={chapterNumber}
            onChangeText={(value) => setChapterNumber(value.replace(/\D/g, '').slice(0, 3))}
            keyboardType="number-pad"
            style={[styles.numberInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
          <AppTextInput
            accessibilityLabel="পর্বের শিরোনাম"
            value={title}
            onChangeText={setTitle}
            placeholder="যেমন: ১ম পর্ব"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.titleInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
        </View>

        <View style={styles.contentHeading}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>পর্বের বিষয়বস্তু (Content)</Text>
          <Text style={[styles.count, { color: colors.successText }]}>শব্দ: {wordCount} | অক্ষর: {body.length}</Text>
        </View>
        <View style={[styles.editor, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.toolbar, { borderBottomColor: colors.border, backgroundColor: colors.muted }]}>
            <View style={styles.toolRow}>
              <Pressable onPress={() => setFontSize((size) => Math.max(12, size - 1))} style={styles.tool}><Text style={[styles.toolText, { color: colors.foreground }]}>{fontSize} px</Text><Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>সাইজ</Text></Pressable>
              <Tool label="B" caption="বোল্ড" strong onPress={() => formatBody('bold')} />
              <Tool label="I" caption="ইটালিক" italic onPress={() => formatBody('italic')} />
              <Tool label="U" caption="আন্ডারলাইন" underlined onPress={() => formatBody('underline')} />
              <Pressable onPress={() => setTextAlign((align) => align === 'left' ? 'center' : align === 'center' ? 'right' : 'left')} style={styles.tool}>
                <Feather name={textAlign === 'left' ? 'align-left' : textAlign === 'center' ? 'align-center' : 'align-right'} size={17} color={colors.foreground} />
                <Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>সারিবদ্ধ</Text>
              </Pressable>
              <Pressable onPress={() => setFontSize((size) => Math.min(28, size + 1))} style={styles.tool}><Feather name="plus" size={17} color={colors.foreground} /><Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>আকার</Text></Pressable>
            </View>
            <View style={styles.toolRow}>
              <Pressable onPress={() => setTextAlign('left')} style={styles.tool}><Feather name="align-left" size={16} color={colors.foreground} /><Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>বাম</Text></Pressable>
              <Pressable onPress={() => setTextAlign('center')} style={styles.tool}><Feather name="align-center" size={16} color={colors.foreground} /><Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>মাঝে</Text></Pressable>
              <Pressable onPress={() => setTextAlign('right')} style={styles.tool}><Feather name="align-right" size={16} color={colors.foreground} /><Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>ডান</Text></Pressable>
              <Tool label="•" caption="বুলেট" onPress={() => formatBody('bullet')} />
              <Tool label="1." caption="নম্বর" onPress={() => formatBody('number')} />
              <Pressable onPress={undo} style={styles.tool}><Feather name="corner-up-left" size={16} color={colors.foreground} /><Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>আনডু</Text></Pressable>
              <Pressable onPress={redo} style={styles.tool}><Feather name="corner-up-right" size={16} color={colors.foreground} /><Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>রিডু</Text></Pressable>
            </View>
          </View>
          <AppTextInput
            accessibilityLabel="গল্পের বিষয়বস্তু"
            value={body}
            onChangeText={updateBody}
            placeholder="এখানে আপনার চমৎকার গল্পের অংশটি লিখুন..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
            style={[styles.bodyInput, { color: colors.foreground, fontSize, textAlign }]}
          />
          <View style={[styles.resizeHandle, { backgroundColor: colors.border }]} />
        </View>
        {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}
        <View style={[styles.demoNotice, { backgroundColor: colors.secondary }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.demoText, { color: colors.mutedForeground }]}>পর্ব সরাসরি সার্ভারে সংরক্ষণ করা হয়।</Text>
        </View>
      </KeyboardAwareScrollViewCompat>
      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <WriterButton label={saving ? 'পাঠানো হচ্ছে…' : chapter ? 'পর্ব পরিবর্তন সংরক্ষণ করুন' : 'পর্ব সাবমিট করুন'} icon="save" onPress={() => void save()} />
      </View>
    </View>
  );
}

function Tool({
  label,
  caption,
  onPress,
  strong = false,
  italic = false,
  underlined = false,
}: {
  label: string;
  caption: string;
  onPress: () => void;
  strong?: boolean;
  italic?: boolean;
  underlined?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={styles.tool}>
      <Text style={[styles.toolText, { color: colors.foreground, fontWeight: strong ? '700' : '400', fontStyle: italic ? 'italic' : 'normal', textDecorationLine: underlined ? 'underline' : 'none' }]}>{label}</Text>
      <Text style={[styles.toolCaption, { color: colors.mutedForeground }]}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 21, paddingTop: 22, paddingBottom: 125 },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 },
  pageTitle: { fontSize: 19, fontWeight: '700' },
  finalToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  toggleLabel: { fontSize: 11 },
  fieldHeadings: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  fieldLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  titleRow: { flexDirection: 'row', gap: 10 },
  numberInput: { width: '34%', minHeight: 52, borderWidth: 1, borderRadius: 15, textAlign: 'center', fontSize: 16 },
  titleInput: { flex: 1, minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  contentHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 8 },
  count: { fontSize: 10 },
  editor: { minHeight: 470, borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  toolbar: { borderBottomWidth: 1, paddingHorizontal: 5 },
  toolRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  tool: { minWidth: 33, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  toolText: { fontSize: 14, lineHeight: 19 },
  toolCaption: { fontSize: 8, lineHeight: 12 },
  bodyInput: { flex: 1, minHeight: 345, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, lineHeight: 27 },
  resizeHandle: { width: 48, height: 4, borderRadius: 3, alignSelf: 'center', marginVertical: 6 },
  message: { fontSize: 11, marginTop: 6 },
  draftRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  demoNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 13, padding: 11, marginTop: 12 },
  demoText: { flex: 1, fontSize: 10, lineHeight: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22, paddingTop: 10 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
