import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${toBanglaDigits(countFor(item.name))}টি বই`}
            style={({ pressed }) => [
              styles.catCard,
              { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Image source={coverSource(item.cover_url, item.id)} resizeMode="cover" style={styles.catCover} />
            <LinearGradient
              colors={['transparent', 'rgba(15, 10, 13, 0.78)']}
              locations={[0.28, 1]}
              style={styles.catShade}
            />
            <View style={styles.catCopy}>
              <Text numberOfLines={1} style={styles.catName}>{item.name}</Text>
              <Text style={styles.catCount}>{toBanglaDigits(countFor(item.name))}টি বই</Text>
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
  grid: { paddingHorizontal: 17, paddingTop: 12, gap: 13 },
  gridRow: { gap: 13 },
  catCard: { flex: 1, aspectRatio: 1.03, borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  catCover: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  catShade: { ...StyleSheet.absoluteFillObject },
  catCopy: { position: 'absolute', left: 14, right: 12, bottom: 13 },
  catName: { color: '#fff', fontFamily: 'serif', fontSize: 18, fontWeight: '700' },
  catCount: { color: 'rgba(255,255,255,0.86)', fontSize: 12, marginTop: 4 },
  emptyText: { width: '100%', textAlign: 'center', paddingTop: 60, fontSize: 15 },
});
