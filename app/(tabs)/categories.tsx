import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBooks, useCategories } from '@/hooks/useLekhoni';
import { coverSource, toBanglaDigits } from '@/lib/adapters';
import { useResponsive } from '@/hooks/useResponsive';
import { useColors } from '@/hooks/useColors';

export default function CategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const { data: apiBooks } = useBooks();
  const { data: apiCategories } = useCategories();
  const liveBooks = apiBooks ?? [];
  const cats = apiCategories ?? [];
  const numColumns = isTablet ? 3 : 2;
  const countFor = (name: string) => liveBooks.filter((b) => (b.category || '') === name).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>ক্যাটাগরি</Text>
        <Pressable testID="categories-search" onPress={() => router.push('/search')} accessibilityRole="button" accessibilityLabel="খুঁজুন">
          <Feather name="search" size={21} color={colors.primary} />
        </Pressable>
      </View>
      <FlatList
        testID="categories-grid"
        key={`cat-grid-${numColumns}`}
        data={cats}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.grid, { paddingBottom: Platform.OS === 'web' ? 105 : 92 }]}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.mutedForeground }]}>ক্যাটাগরি লোড হচ্ছে…</Text>}
        renderItem={({ item }) => (
          <Pressable
            testID={`category-${item.name}`}
            onPress={() => router.push({ pathname: '/category/[id]', params: { id: item.id } })}
            style={[styles.catCard, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Image source={coverSource(item.cover_url, item.id)} resizeMode="cover" style={styles.catCover} />
            <View style={styles.catCopy}>
              <Text numberOfLines={1} style={[styles.catName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.catCount, { color: colors.mutedForeground }]}>{toBanglaDigits(countFor(item.name))}টি বই</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { height: 67, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'serif', fontSize: 23, fontWeight: '700' },
  grid: { paddingHorizontal: 13, paddingTop: 6, gap: 10 },
  gridRow: { gap: 10 },
  catCard: { flex: 1, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  catCover: { width: '100%', aspectRatio: 16 / 10 },
  catCopy: { paddingHorizontal: 11, paddingVertical: 9 },
  catName: { fontFamily: 'serif', fontSize: 14, fontWeight: '700' },
  catCount: { fontSize: 11, marginTop: 3 },
  emptyText: { width: '100%', textAlign: 'center', paddingTop: 60, fontSize: 15 },
});
