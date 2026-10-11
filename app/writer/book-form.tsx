import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text, AppTextInput } from '@/components/AppText';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { WriterButton, WriterHeader } from '@/components/WriterChrome';
import { useWriterAccess } from '@/context/WriterAccessContext';
import { useWriterContent } from '@/context/WriterContentContext';
import { useCategories } from '@/hooks/useLekhoni';
import { useColors } from '@/hooks/useColors';

const fallbackCategories = ['উপন্যাস', 'রোমান্টিক', 'থ্রিলার', 'সাহিত্য', 'ইতিহাস', 'জীবনী', 'অন্যান্য'];

export default function WriterBookFormScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const { session } = useWriterAccess();
  const { getBook, saveBook } = useWriterContent();
  const { data: apiCategories } = useCategories();
  const categories = (apiCategories ?? []).map((c) => c.name).filter(Boolean);
  const categoryList = categories.length ? categories : fallbackCategories;
  const existing = bookId ? getBook(bookId) : undefined;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [author, setAuthor] = useState(existing?.author ?? session?.displayName ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'উপন্যাস');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [coverUri, setCoverUri] = useState<string | null>(
    existing?.coverUrl ?? null,
  );
  const [showCategories, setShowCategories] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const coverSource = coverUri ? { uri: coverUri } : existing?.cover ?? null;

  const chooseCover = async () => {
    setMessage('');
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setMessage('কভার বাছাই করতে গ্যালারির অনুমতি দিন।');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) setCoverUri(result.assets[0].uri);
    } catch {
      setMessage('ছবি খোলা যায়নি। আবার চেষ্টা করুন।');
    }
  };

  const submit = async () => {
    if (submitting) return;
    if (!title.trim() || !author.trim() || !description.trim()) {
      Alert.alert('তথ্য অসম্পূর্ণ', 'বইয়ের নাম, লেখকের নাম ও বিবরণ পূরণ করুন।');
      return;
    }
    if (!existing && !coverUri) {
      Alert.alert('কভার ছবি প্রয়োজন', 'বই জমা দেওয়ার আগে একটি কভার ছবি বেছে নিন।');
      return;
    }
    setSubmitting(true);
    setMessage('সার্ভারে পাঠানো হচ্ছে…');
    const res = await saveBook({
      ...(existing ? { id: existing.id } : {}),
      title: title.trim(),
      author: author.trim(),
      category,
      description: description.trim(),
      kind: 'বই',
      cover: coverUri ? { uri: coverUri } : existing?.cover ?? null,
      status: existing?.status ?? 'খসড়া',
    });
    setSubmitting(false);
    if (!res.id) {
      setMessage('সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
      return;
    }
    setMessage('');
    router.replace({ pathname: '/writer/book/[id]', params: { id: res.id } });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Platform.OS === 'web' ? Math.max(insets.top, 8) : insets.top }]}>
      <WriterHeader title={existing ? 'বই সম্পাদনা' : 'নতুন বই প্রকাশ'} backToStudio />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={88}
      >
        <Text style={[styles.fieldTitle, { color: colors.foreground }]}>বইয়ের নাম <Text style={{ color: colors.primary }}>*</Text></Text>
        <AppTextInput
          accessibilityLabel="বইয়ের নাম"
          value={title}
          onChangeText={setTitle}
          placeholder="আপনার বইয়ের নাম লিখুন..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />

        <Text style={[styles.fieldTitle, styles.labelGap, { color: colors.foreground }]}>বই লেখকের নাম <Text style={{ color: colors.primary }}>*</Text></Text>
        <AppTextInput
          accessibilityLabel="বই লেখকের নাম"
          value={author}
          onChangeText={setAuthor}
          placeholder="লেখকের নাম"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />

        <Text style={[styles.fieldTitle, styles.labelGap, { color: colors.foreground }]}>ক্যাটাগরি <Text style={{ color: colors.primary }}>*</Text></Text>
        <Pressable onPress={() => setShowCategories((value) => !value)} style={[styles.input, styles.selectInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.selectText, { color: colors.foreground }]}>{category}</Text>
          <Feather name={showCategories ? 'chevron-up' : 'chevron-down'} size={20} color={colors.foreground} />
        </Pressable>
        {showCategories ? (
          <View style={[styles.categoryMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {categoryList.map((item) => (
              <Pressable key={item} onPress={() => { setCategory(item); setShowCategories(false); }} style={[styles.categoryOption, { borderBottomColor: colors.border }]}>
                <Text style={[styles.categoryText, { color: item === category ? colors.primary : colors.foreground }]}>{item}</Text>
                {item === category ? <Feather name="check" size={16} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={[styles.descriptionHeading, styles.labelGap]}>
          <Text style={[styles.fieldTitle, { color: colors.foreground }]}>ডিসক্রিপশন <Text style={{ color: colors.primary }}>*</Text></Text>
          <Text style={[styles.counter, { color: colors.mutedForeground }]}>{description.length}/১০০০</Text>
        </View>
        <AppTextInput
          accessibilityLabel="বইয়ের বিবরণ"
          value={description}
          onChangeText={(value) => setDescription(value.slice(0, 1000))}
          placeholder="আপনার বই সম্পর্কে লিখুন..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlignVertical="top"
          style={[styles.descriptionInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />

        <Text style={[styles.fieldTitle, styles.labelGap, { color: colors.foreground }]}>প্রচ্ছদ / কভার ছবি <Text style={{ color: colors.primary }}>*</Text></Text>
        <Pressable onPress={chooseCover} style={[styles.coverPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {coverSource ? (
            <Image source={coverSource} resizeMode="cover" style={styles.coverPreview} />
          ) : (
            <>
              <Feather name="upload-cloud" size={39} color={colors.primary} />
              <Text style={[styles.coverTitle, { color: colors.primary }]}>কভার ফটো আপলোড করুন</Text>
              <Text style={[styles.coverSubtitle, { color: colors.mutedForeground }]}>ক্লিক করুন অথবা কভার সিলেক্ট করুন</Text>
            </>
          )}
        </Pressable>
        {message ? <Text style={[styles.message, { color: colors.primary }]}>{message}</Text> : null}
        <View style={[styles.demoNote, { backgroundColor: colors.secondary }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.demoNoteText, { color: colors.mutedForeground }]}>বই ও কভার সরাসরি সার্ভারে সংরক্ষণ করা হয়।</Text>
        </View>
      </KeyboardAwareScrollViewCompat>
      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <WriterButton label={submitting ? 'পাঠানো হচ্ছে…' : existing ? 'পরিবর্তন সংরক্ষণ করুন' : 'বই সাবমিট করুন'} icon="upload-cloud" onPress={() => void submit()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 23, paddingBottom: 116 },
  kindRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 19 },
  kindOptions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kindOption: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  radio: { width: 22, height: 22, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  kindLabel: { fontSize: 12 },
  fieldTitle: { fontSize: 15, fontWeight: '600' },
  labelGap: { marginTop: 21, marginBottom: 10 },
  input: { minHeight: 58, borderWidth: 1, borderRadius: 17, paddingHorizontal: 17, fontSize: 15 },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  selectText: { fontSize: 15 },
  categoryMenu: { borderWidth: 1, borderRadius: 16, marginTop: 7, overflow: 'hidden' },
  categoryOption: { minHeight: 43, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryText: { fontSize: 14 },
  descriptionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontSize: 11 },
  descriptionInput: { minHeight: 170, borderWidth: 1, borderRadius: 17, paddingHorizontal: 16, paddingTop: 15, fontSize: 14 },
  coverPicker: { minHeight: 185, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 7, overflow: 'hidden' },
  coverPreview: { width: 130, height: 174, borderRadius: 11 },
  coverTitle: { fontSize: 15, fontWeight: '700', marginTop: 5 },
  coverSubtitle: { fontSize: 11 },
  message: { fontSize: 12, marginTop: 8 },
  demoNote: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 11, marginTop: 15 },
  demoNoteText: { flex: 1, fontSize: 10, lineHeight: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 22, paddingTop: 10 },
});
