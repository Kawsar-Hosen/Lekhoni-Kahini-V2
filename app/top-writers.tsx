import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '@/components/AppText';
import { VerifiedName } from '@/components/VerifiedName';
import { useBooks, useFollowedIds, useToggleFollow, useWriters } from '@/hooks/useLekhoni';
import { coverSource, formatBanglaCount, isVerifiedWriter, toBanglaDigits, writerBooks, writerDisplayName } from '@/lib/adapters';
import { useResponsive } from '@/hooks/useResponsive';
import { useColors } from '@/hooks/useColors';
import { goBackOrFallback } from '@/lib/navigation';

export default function TopWritersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const numColumns = isTablet ? 3 : 2;
  const { data: apiWriters } = useWriters();
  const { data: apiBooks } = useBooks();
  const { data: followed } = useFollowedIds();
  const followMutation = useToggleFollow();
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const liveBooks = apiBooks ?? [];
  const followedIds = new Set((followed ?? []).map((f) => f.id));
  const visibleAuthors = [...(apiWriters ?? [])]
    .filter((author) => !hiddenIds.includes(author.id))
    .sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0));

  const toggleFollow = (id: string) => {
    followMutation.mutate({ writerId: id, following: followedIds.has(id) });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable testID="top-writers-back" onPress={() => goBackOrFallback('/')} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="ফিরে যান">
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Top Writers</Text>
        <Pressable testID="top-writers-search" onPress={() => router.push('/search')} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="খুঁজুন">
          <Feather name="search" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        testID="top-writers-grid"
        key={`writers-grid-${numColumns}`}
        data={visibleAuthors}
        numColumns={numColumns}
        keyExtractor={(author) => author.id}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.mutedForeground }]}>এখন কোনো লেখক দেখানোর নেই।</Text>}
        renderItem={({ item: author }) => {
          const authorBooks = writerBooks(liveBooks, author);
          const avatar = author.avatar_url ? { uri: author.avatar_url } : (authorBooks[0]?.cover_url ? coverSource(authorBooks[0].cover_url, authorBooks[0].id) : require('@/assets/images/author-profile.png'));
          const isFollowing = followedIds.has(author.id);
          const name = writerDisplayName(author);

          return (
            <View style={[styles.writerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable
                testID={`dismiss-writer-${author.id}`}
                onPress={() => setHiddenIds((current) => [...current, author.id])}
                style={[styles.dismissButton, { backgroundColor: colors.background }]}
                accessibilityRole="button"
                accessibilityLabel={`${name} সরান`}
              >
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: author.id } })}
                style={styles.writerProfile}
                accessibilityRole="button"
              >
                <Image source={avatar} resizeMode="cover" style={styles.avatar} />
                <VerifiedName
                  name={name}
                  verified={isVerifiedWriter(author)}
                  containerStyle={styles.authorName}
                  nameStyle={[styles.authorNameText, { color: colors.foreground }]}
                />
                <Text numberOfLines={1} style={[styles.writerMeta, { color: colors.mutedForeground }]}>
                  {toBanglaDigits(String(authorBooks.length))}টি বই • {formatBanglaCount(author.follower_count ?? 0)} জন ফলোয়ার
                </Text>
              </Pressable>
              <Pressable
                testID={`follow-writer-${author.id}`}
                onPress={() => toggleFollow(author.id)}
                style={({ pressed }) => [styles.followButton, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}
                accessibilityRole="button"
              >
                <Text style={[styles.followText, { color: colors.primaryForeground }]}>
                  {isFollowing ? 'ফলো করা হচ্ছে' : 'ফলো'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 70, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { width: 37, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'serif', fontSize: 21, fontWeight: '700' },
  grid: { paddingHorizontal: 13, paddingTop: 14, paddingBottom: 24 },
  gridRow: { gap: 10, marginBottom: 10 },
  writerCard: { flex: 1, minWidth: 0, minHeight: 202, borderWidth: 1, borderRadius: 19, alignItems: 'center', paddingHorizontal: 9, paddingTop: 12, paddingBottom: 10 },
  dismissButton: { position: 'absolute', zIndex: 2, top: 7, right: 7, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  writerProfile: { width: '100%', flex: 1, alignItems: 'center', paddingTop: 1 },
  avatar: { width: 67, height: 67, borderRadius: 34 },
  authorName: { maxWidth: '100%', justifyContent: 'center', marginTop: 8 },
  authorNameText: { fontFamily: 'serif', fontSize: 15, fontWeight: '600' },
  writerMeta: { fontFamily: 'serif', fontSize: 10, marginTop: 5, textAlign: 'center' },
  followButton: { width: '100%', minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  followText: { fontFamily: 'serif', fontSize: 13, fontWeight: '700' },
  emptyText: { width: '100%', textAlign: 'center', paddingTop: 60, fontSize: 15 },
});