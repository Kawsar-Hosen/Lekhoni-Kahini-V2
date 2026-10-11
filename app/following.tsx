import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { VerifiedName } from '@/components/VerifiedName';
import { useBooks, useFollowedIds, useToggleFollow, useWriters } from '@/hooks/useLekhoni';
import { coverSource, formatBanglaCount, isVerifiedWriter, writerBooks, writerDisplayName } from '@/lib/adapters';
import type { ApiBook, ApiWriter } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function FollowingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: apiWriters } = useWriters();
  const { data: apiBooks } = useBooks();
  const { data: followed } = useFollowedIds();
  const followMutation = useToggleFollow();
  const writers = apiWriters ?? [];
  const liveBooks = apiBooks ?? [];
  const followedIds = new Set((followed ?? []).map((f) => f.id));
  const followedAuthors = writers.filter((w) => followedIds.has(w.id));
  const suggestedAuthors = writers.filter((w) => !followedIds.has(w.id));

  const toggleFollowing = (id: string) => {
    followMutation.mutate({ writerId: id, following: followedIds.has(id) });
  };

  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <Pressable testID="following-back" onPress={() => goBackOrFallback('/')} hitSlop={12} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.primary }]}>ফলো করা লেখক লিস্ট</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>আপনার অনুসরণকৃত লেখকগণ</Text>
        {followedAuthors.length ? followedAuthors.map((author) => (
          <AuthorRow
            key={author.id}
            author={author}
            following
            colors={colors}
            liveBooks={liveBooks}
            onToggle={() => toggleFollowing(author.id)}
          />
        )) : (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>এখনও কোনো লেখককে ফলো করেননি।</Text>
        )}

        <Text style={[styles.sectionTitle, styles.suggestionsTitle, { color: colors.foreground }]}>⭐ জনপ্রিয় লেখক প্রস্তাবনা</Text>
        {suggestedAuthors.map((author) => (
          <AuthorRow
            key={author.id}
            author={author}
            following={false}
            colors={colors}
            liveBooks={liveBooks}
            onToggle={() => toggleFollowing(author.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function AuthorRow({
  author,
  following,
  colors,
  liveBooks,
  onToggle,
}: {
  author: ApiWriter;
  following: boolean;
  colors: ReturnType<typeof useColors>;
  liveBooks: ApiBook[];
  onToggle: () => void;
}) {
  const wBooks = writerBooks(liveBooks, author);
  const cover = author.avatar_url
    ? { uri: author.avatar_url }
    : (wBooks[0] ? coverSource(wBooks[0].cover_url, wBooks[0].id) : require('@/assets/images/author-profile.png'));
  const name = writerDisplayName(author);

  return (
    <View style={[styles.authorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        testID={`author-profile-${author.id}`}
        onPress={() => router.push({ pathname: '/profile/[id]', params: { id: author.id } })}
        style={styles.authorInfo}
        accessibilityRole="button"
      >
        <Image source={cover} resizeMode="cover" style={styles.avatar} />
        <View style={styles.authorCopy}>
          <VerifiedName
            name={name}
            verified={isVerifiedWriter(author)}
            containerStyle={styles.authorNameRow}
            nameStyle={[styles.authorName, { color: colors.foreground }]}
          />
          <Text style={[styles.authorFollowers, { color: colors.mutedForeground }]}>♟ {formatBanglaCount(author.follower_count ?? 0)} জন অনুসারী</Text>
        </View>
      </Pressable>
      <Pressable
        testID={`follow-${author.id}`}
        onPress={onToggle}
        style={[styles.followButton, { backgroundColor: following ? colors.secondary : colors.primary }]}
        accessibilityRole="button"
      >
        <Text style={[styles.followText, { color: following ? colors.primary : colors.primaryForeground }]}>
          {following ? 'ফলো করা হয়েছে ✓' : '+ ফলো করুন'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { width: 34, height: 42, justifyContent: 'center' },
  title: { fontFamily: 'serif', fontSize: 22, fontWeight: '700' },
  content: { paddingHorizontal: 19, paddingTop: 22, paddingBottom: 36 },
  sectionTitle: { fontFamily: 'serif', fontSize: 17, fontWeight: '600', marginBottom: 14 },
  suggestionsTitle: { marginTop: 32 },
  authorCard: { minHeight: 80, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 11 },
  authorInfo: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  authorCopy: { flex: 1, minWidth: 0 },
  authorNameRow: { maxWidth: '100%' },
  authorName: { fontFamily: 'serif', fontSize: 16, fontWeight: '600' },
  authorFollowers: { fontSize: 11, marginTop: 6 },
  followButton: { minWidth: 112, minHeight: 40, borderRadius: 12, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  followText: { fontFamily: 'serif', fontSize: 12, fontWeight: '700' },
  empty: { fontFamily: 'serif', fontSize: 14, paddingVertical: 18, paddingHorizontal: 8 },
});