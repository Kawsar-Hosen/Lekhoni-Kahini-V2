import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/AppText';
import { VerifiedName } from '@/components/VerifiedName';
import { useColors } from '@/hooks/useColors';
import { useResponsive } from '@/hooks/useResponsive';
import type { Book } from '@/data/books';

type BookCardProps = {
  book: Book;
  compact?: boolean;
  onPress: () => void;
  onSave?: () => void;
  saved?: boolean;
};

export function BookCard({ book, compact = false, onPress, onSave, saved = false }: BookCardProps) {
  const colors = useColors();
  const { width } = useResponsive();
  const statusScale = useRef(new Animated.Value(1)).current;
  // Horizontal rails have 18px screen padding + 10px peek: never overflow small phones.
  const cardWidth = compact
    ? Math.min(204, Math.round(width * 0.56))
    : Math.min(286, Math.max(260, Math.round(width - 76)));

  useEffect(() => {
    if (compact) return;
    statusScale.setValue(0.97);
    const animation = Animated.timing(statusScale, {
      toValue: 1,
      duration: 190,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [book.status, compact, statusScale]);

  const ongoing = book.status === 'চলমান';

  return (
    <Pressable
      testID={`book-card-${book.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.compactCard : styles.card,
        { width: cardWidth, backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Image source={book.cover} resizeMode="cover" style={compact ? styles.compactCover : styles.cover} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>
            {book.title}
          </Text>
        </View>
        <View style={styles.authorRow}>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>লেখক: </Text>
          <VerifiedName
            name={book.author}
            verified={book.verified}
            containerStyle={styles.authorName}
            nameStyle={[styles.meta, { color: colors.mutedForeground }]}
          />
        </View>
        <Text numberOfLines={1} style={[styles.meta, { color: colors.mutedForeground }]}>
          ধরন: {book.genre}
        </Text>
        <View style={styles.bottomRow}>
          <View style={styles.readers}>
            <Feather name="eye" size={13} color={colors.mutedForeground} />
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{book.readers}</Text>
          </View>
          {onSave ? (
            <Pressable testID={`save-${book.id}`} onPress={onSave} hitSlop={10}>
              <Feather name={saved ? 'bookmark' : 'bookmark'} size={16} color={saved ? colors.primary : colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
        {!compact ? (
          <View style={styles.statusRow}>
            <View style={[styles.readPill, { backgroundColor: colors.secondary }]}>
              <MaterialIcons name="menu-book" size={14} color={colors.primary} />
              <Text style={[styles.pillText, { color: colors.primary }]}>পড়ুন</Text>
            </View>
            <Animated.View
              style={[
                styles.statusPill,
                { backgroundColor: ongoing ? colors.success : colors.sky },
                { transform: [{ scale: statusScale }] },
              ]}
            >
              <Text style={[styles.pillText, { color: ongoing ? colors.successText : colors.skyText }]}>{book.status}</Text>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 286, minHeight: 154, flexDirection: 'row', borderWidth: 1, borderRadius: 18, padding: 10, marginRight: 10 },
  compactCard: { width: 204, minHeight: 264, borderWidth: 1, borderRadius: 18, padding: 8, marginRight: 10 },
  cover: { width: 92, height: 134, borderRadius: 12 },
  compactCover: { width: '100%', height: 174, borderRadius: 12 },
  info: { flex: 1, paddingLeft: 10, paddingTop: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorRow: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  authorName: { flex: 1 },
  title: { fontFamily: 'serif', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  meta: { fontSize: 11, marginTop: 4 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  readers: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
  readPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 14 },
  statusPill: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 14 },
  pillText: { fontSize: 10, fontWeight: '600' },
});