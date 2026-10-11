import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { useColors } from '@/hooks/useColors';
import { useComments, usePostComment } from '@/hooks/useLekhoni';
import { toBanglaDigits } from '@/lib/adapters';
import { getDisplayName, setDisplayName } from '@/lib/device';
import type { ApiComment } from '@/lib/api';

export type BookComment = {
  id: string;
  author: string;
  initial: string;
  message: string;
  createdAt: string;
};

type BookCommentsSheetProps = {
  visible: boolean;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  comments?: BookComment[];
  onClose: () => void;
  onSend?: (message: string) => void;
};

function toUiComment(c: ApiComment): BookComment {
  const name = c.display_name || 'পাঠক';
  return {
    id: c.id,
    author: name,
    initial: name.trim().charAt(0) || 'প',
    message: c.body,
    createdAt: formatTime(c.created_at),
  };
}

function formatTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  if (diff < 0) return '';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'এখন';
  if (m < 60) return `${toBanglaDigits(String(m))} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${toBanglaDigits(String(h))} ঘণ্টা আগে`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${toBanglaDigits(String(d))} দিন আগে`;
  return new Date(t).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function BookCommentsSheet({
  visible,
  bookId,
  bookTitle,
  bookAuthor,
  comments: legacyComments,
  onClose,
  onSend,
}: BookCommentsSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [myName, setMyName] = useState('পাঠক');
  const { data: liveComments } = useComments(visible ? bookId : '');
  const postMutation = usePostComment(bookId);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const trimmedDraft = draft.trim();

  useEffect(() => {
    if (visible) {
      void getDisplayName().then((name) => {
        if (name.trim()) setMyName(name.trim());
      });
    }
  }, [visible]);

  const comments: BookComment[] = legacyComments ?? (liveComments ?? []).map(toUiComment);

  const submit = () => {
    if (!trimmedDraft || sending) return;
    if (onSend) {
      onSend(trimmedDraft);
      setDraft('');
      return;
    }
    setSending(true);
    postMutation.mutate(
      { name: myName, body: trimmedDraft.slice(0, 200) },
      {
        onSettled: () => setSending(false),
        onSuccess: (res) => {
          if (res.ok) {
            setDraft('');
            if (res.needsApproval) Alert.alert('পাঠানো হয়েছে', 'মন্তব্য অনুমোদনের পর দেখা যাবে।');
          } else {
            Alert.alert('মন্তব্য পাঠানো যায়নি', 'আবার চেষ্টা করুন।');
          }
        },
      },
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior="padding">
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: topInset + 5 }]}>
          <Pressable
            testID="close-comments"
            onPress={onClose}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="মন্তব্য বন্ধ করুন"
          >
            <Feather name="arrow-left" size={23} color={colors.primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>মন্তব্য</Text>
            <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>
              {comments.length.toLocaleString('bn-BD')}টি মন্তব্য
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="message-circle" size={18} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.bookContext, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.bookContextMark, { backgroundColor: colors.primary }]} />
          <View style={styles.bookContextCopy}>
            <Text numberOfLines={1} style={[styles.bookContextTitle, { color: colors.foreground }]}>{bookTitle}</Text>
            <Text numberOfLines={1} style={[styles.bookContextAuthor, { color: colors.mutedForeground }]}>লেখক: {bookAuthor}</Text>
          </View>
          <View style={[styles.contextTag, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.contextTagText, { color: colors.primary }]}>আলোচনা</Text>
          </View>
        </View>

        <ScrollView
          testID="comments-list"
          style={styles.scroll}
          contentContainerStyle={comments.length ? styles.commentsContent : styles.emptyContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {comments.length ? (
            comments.map((comment) => (
              <View key={comment.id} style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{comment.initial}</Text>
                </View>
                <View style={styles.commentCopy}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentAuthor, { color: colors.foreground }]}>{comment.author}</Text>
                    <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>{comment.createdAt}</Text>
                  </View>
                  <Text style={[styles.commentMessage, { color: colors.foreground }]}>{comment.message}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="message-circle" size={25} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>এখনো কোনো মন্তব্য নেই</Text>
              <Text style={[styles.emptyMessage, { color: colors.mutedForeground }]}>
                গল্পটি নিয়ে আপনার মতামত লিখে প্রথম মন্তব্যটি করুন।
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.nameRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.nameLabel, { color: colors.mutedForeground }]}>নাম:</Text>
          <TextInput
            value={myName}
            onChangeText={(v) => {
              setMyName(v);
              void setDisplayName(v);
            }}
            maxLength={50}
            placeholder="আপনার নাম"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.nameInput, { color: colors.foreground }]}
          />
        </View>
        <View style={[styles.composerWrap, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.composerRow}>
            <View style={[styles.yourAvatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.yourAvatarText, { color: colors.primary }]}>{myName.trim().charAt(0) || 'আ'}</Text>
            </View>
            <TextInput
              testID="comment-input"
              value={draft}
              onChangeText={setDraft}
              placeholder="আপনার মন্তব্য লিখুন..."
              placeholderTextColor={colors.mutedForeground}
              maxLength={200}
              multiline
              textAlignVertical="center"
              accessibilityLabel="আপনার মন্তব্য"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />
            <Pressable
              testID="send-comment"
              onPress={submit}
              disabled={!trimmedDraft || sending}
              accessibilityRole="button"
              accessibilityLabel="মন্তব্য পাঠান"
              style={({ pressed }) => [
                styles.sendButton,
                { backgroundColor: trimmedDraft ? colors.primary : colors.muted, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Feather name="send" size={18} color={trimmedDraft ? colors.primaryForeground : colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.composerHintRow}>
            <Text style={[styles.composerHint, { color: colors.mutedForeground }]}>সর্বোচ্চ ২০০ অক্ষর</Text>
            <Text style={[styles.composerCount, { color: colors.mutedForeground }]}>{draft.length}/২০০</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 72, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  headerButton: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { fontFamily: 'serif', fontSize: 21, fontWeight: '700' },
  headerCount: { fontSize: 11, marginTop: 1 },
  headerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  bookContext: { minHeight: 61, marginHorizontal: 17, marginTop: 13, paddingHorizontal: 12, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookContextMark: { width: 4, height: 34, borderRadius: 2 },
  bookContextCopy: { flex: 1, minWidth: 0 },
  bookContextTitle: { fontFamily: 'serif', fontSize: 14, fontWeight: '600' },
  bookContextAuthor: { fontSize: 11, marginTop: 3 },
  contextTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13 },
  contextTagText: { fontFamily: 'serif', fontSize: 10, fontWeight: '600' },
  scroll: { flex: 1 },
  commentsContent: { paddingHorizontal: 17, paddingTop: 17, paddingBottom: 16, gap: 11 },
  emptyContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 34, paddingBottom: 35 },
  emptyState: { alignItems: 'center', paddingVertical: 25 },
  emptyIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'serif', fontSize: 17, fontWeight: '700', marginTop: 14 },
  emptyMessage: { maxWidth: 265, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  commentCard: { minHeight: 84, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  avatar: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'serif', fontSize: 17, fontWeight: '700' },
  commentCopy: { flex: 1, minWidth: 0 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAuthor: { fontSize: 14, fontWeight: '600' },
  commentTime: { fontSize: 10 },
  commentMessage: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth },
  nameLabel: { fontSize: 12 },
  nameInput: { flex: 1, fontSize: 13, paddingVertical: 4 },
  composerWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 11, paddingHorizontal: 15, backgroundColor: 'transparent' },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  yourAvatar: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  yourAvatarText: { fontFamily: 'serif', fontSize: 17, fontWeight: '700' },
  input: { flex: 1, minHeight: 48, maxHeight: 100, borderWidth: 1, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 11, fontFamily: 'serif', fontSize: 14, lineHeight: 20 },
  sendButton: { width: 42, height: 42, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  composerHintRow: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 47, paddingHorizontal: 7, marginTop: 5 },
  composerHint: { fontSize: 10 },
  composerCount: { fontSize: 10 },
});
