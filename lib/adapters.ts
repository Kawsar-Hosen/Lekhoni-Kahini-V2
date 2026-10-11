// Maps live API models to the app's existing UI models (design unchanged).
import type { ImageSourcePropType } from 'react-native';
import { bookLikes, bookViews, displayAuthor, type ApiBook, type ApiWriter } from './api';
import type { Book } from '@/data/books';
import type { AuthorProfile } from '@/data/authors';

const localCovers = [
  require('@/assets/images/cover-romance.jpg'),
  require('@/assets/images/cover-mystery.jpg'),
  require('@/assets/images/cover-drama.jpg'),
];

export function fallbackCover(seed: string): ImageSourcePropType {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return localCovers[h % localCovers.length];
}

export function coverSource(coverUrl: string | null | undefined, seed: string): ImageSourcePropType {
  if (coverUrl && coverUrl.startsWith('http')) return { uri: coverUrl };
  return fallbackCover(seed);
}

export type UiBookStatus = Book['status'];

export function mapStatus(b: Pick<ApiBook, 'display_status' | 'writer_status' | 'is_new'>): UiBookStatus {
  const d = (b.display_status || '').toLowerCase();
  const w = (b.writer_status || '').toLowerCase();
  if (d === 'সমাপ্ত' || w === 'সমাপ্ত' || d === 'complete' || w === 'complete' || d === 'completed' || w === 'completed') return 'সমাপ্ত';
  if (d === 'new' || d === 'নতুন' || b.is_new) return 'নতুন';
  return 'চলমান';
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '০';
  if (value < 1000) return String(value);
  const k = value / 1000;
  const s = k >= 100 ? String(Math.round(k)) : String(Math.round(k * 10) / 10).replace(/\.0$/, '');
  return `${s}K`;
}

export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[Number(digit)]);
}

export function formatBanglaCount(value: number): string {
  return toBanglaDigits(formatCount(value));
}

export function toUiBook(b: ApiBook): Book {
  return {
    id: b.id,
    title: b.title,
    author: displayAuthor(b),
    genre: b.category || 'অন্যান্য',
    readers: formatCount(bookViews(b)),
    status: mapStatus(b),
    cover: coverSource(b.cover_url, b.id),
    excerpt: (b.description || '').slice(0, 120),
    description: b.description || '',
    verified: true,
  };
}

export function bookLikesCount(b: Pick<ApiBook, 'likes'>): number {
  return bookLikes(b);
}

export function bookViewsCount(b: Pick<ApiBook, 'views'>): number {
  return bookViews(b);
}

export function writerDisplayName(w: Pick<ApiWriter, 'writer_name' | 'username'>): string {
  return (w.writer_name && w.writer_name.trim()) || w.username || '';
}

export function writerAvatar(w: Pick<ApiWriter, 'avatar_url' | 'id'>): ImageSourcePropType {
  return coverSource(w.avatar_url ?? null, w.id);
}

// Books of a writer: match by username or display name.
export function writerBooks(books: ApiBook[], writer: Pick<ApiWriter, 'username' | 'writer_name'>): ApiBook[] {
  const uname = (writer.username || '').toLowerCase();
  const wname = (writer.writer_name || '').toLowerCase();
  return books.filter((b) => {
    const a = (b.author || '').toLowerCase();
    const an = (b.author_name || '').toLowerCase();
    return (uname && (a === uname || an === uname)) || (wname && (a === wname || an === wname));
  });
}

export function toAuthorProfile(w: ApiWriter, totalReads: number): AuthorProfile {
  return {
    id: w.id,
    name: writerDisplayName(w),
    bio: w.bio || '',
    totalReads: formatBanglaCount(totalReads),
    followers: formatBanglaCount(w.follower_count ?? 0),
  };
}

export function isVerifiedWriter(w: Pick<ApiWriter, 'badge'>): boolean {
  return (w.badge || '').length > 0;
}
