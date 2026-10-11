import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImageSourcePropType } from 'react-native';
import React, { createContext, useContext, useMemo } from 'react';
import {
  addStoryChapter,
  createStory,
  deleteStory,
  deleteStoryChapter,
  fetchMyStories,
  fetchStoryDetail,
  submitStoryForReview,
  updateStory,
  updateStoryChapter,
  uploadCoverUri,
  type WriterStory,
} from '@/lib/api';
import { qk } from '@/hooks/useLekhoni';
import { useWriterAccess } from './WriterAccessContext';

export type WriterChapter = {
  id: string;
  order: number;
  title: string;
  body: string;
  isFinal: boolean;
  status: 'লাইভ' | 'খসড়া';
  views: number;
};

export type WriterBook = {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  kind: 'বই' | 'ভয়েস' | 'দুটিই';
  cover: ImageSourcePropType | null;
  coverUrl: string | null;
  status: 'লাইভ' | 'রিভিউ চলছে' | 'খসড়া';
  chapters: WriterChapter[];
  chaptersCount: number;
  totalViews: number;
  totalLikes: number;
};

export type TrashedBook = {
  id: string;
  title: string;
  description: string;
  category: string;
  coverUrl: string | null;
  chapters: { title: string; body: string }[];
  deletedAt: number;
};

type BookInput = Omit<WriterBook, 'id' | 'chapters' | 'chaptersCount' | 'totalViews' | 'totalLikes' | 'coverUrl'> & { id?: string };
type ChapterInput = Omit<WriterChapter, 'id'> & { id?: string };

type SaveResult = { id?: string; error?: string };
type OpResult = { ok: boolean; error?: string };

type WriterContentValue = {
  books: WriterBook[];
  isLoading: boolean;
  recycledBooks: TrashedBook[];
  saveBook: (book: BookInput) => Promise<SaveResult>;
  deleteBook: (id: string) => Promise<OpResult>;
  restoreBook: (id: string) => Promise<OpResult>;
  permanentlyDeleteBook: (id: string) => void;
  getBook: (id: string) => WriterBook | undefined;
  saveChapter: (bookId: string, chapter: ChapterInput) => Promise<SaveResult>;
  deleteChapter: (bookId: string, chapterId: string) => Promise<OpResult>;
  submitForReview: (id: string) => Promise<OpResult>;
  refresh: () => void;
};

const WriterContentContext = createContext<WriterContentValue | null>(null);

const TRASH_KEY = 'lk-trash-bin';

async function readTrash(): Promise<TrashedBook[]> {
  try {
    const raw = await AsyncStorage.getItem(TRASH_KEY);
    const parsed = raw ? (JSON.parse(raw) as TrashedBook[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapStatus(status: string): WriterBook['status'] {
  const s = (status || '').toLowerCase();
  if (s === 'লাইভ' || s === 'published' || s === 'live' || s === 'approved') return 'লাইভ';
  if (s === 'রিভিউ চলছে' || s === 'pending' || s === 'review' || s === 'submitted') return 'রিভিউ চলছে';
  return 'খসড়া';
}

function mapStory(story: WriterStory, authorName: string): WriterBook {
  return {
    id: story.id,
    title: story.title,
    author: authorName,
    category: story.category || 'অন্যান্য',
    description: story.description || '',
    kind: 'বই',
    cover: story.cover_url ? { uri: story.cover_url } : null,
    coverUrl: story.cover_url,
    status: mapStatus(story.status),
    chapters: [],
    chaptersCount: story.chapters_count ?? 0,
    totalViews: story.views ?? 0,
    totalLikes: story.likes ?? 0,
  };
}

async function resolveCoverUrl(cover: ImageSourcePropType | null, fallback: string | null): Promise<string | null> {
  if (cover && typeof cover === 'object' && 'uri' in cover && typeof cover.uri === 'string') {
    const uri = cover.uri;
    if (uri.startsWith('http')) return uri;
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      const up = await uploadCoverUri(uri);
      if (up.url) return up.url;
      return fallback;
    }
  }
  return fallback;
}

export function WriterContentProvider({ children }: { children: React.ReactNode }) {
  const { token, session } = useWriterAccess();
  const qc = useQueryClient();
  const authorName = session?.displayName ?? '';

  const storiesQuery = useQuery({
    queryKey: ['my-stories', token ?? ''],
    queryFn: async () => {
      if (!token) return [] as WriterBook[];
      const r = await fetchMyStories(token);
      if (!r.data || !Array.isArray(r.data)) return [] as WriterBook[];
      return r.data.map((s) => mapStory(s, authorName || ''));
    },
    enabled: Boolean(token),
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchOnReconnect: true,
  });

  const trashQuery = useQuery({
    queryKey: ['trash-bin'],
    queryFn: readTrash,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const books = storiesQuery.data ?? [];
  const recycledBooks = trashQuery.data ?? [];

  const persistTrash = async (items: TrashedBook[]) => {
    try {
      await AsyncStorage.setItem(TRASH_KEY, JSON.stringify(items.slice(0, 50)));
    } catch {}
    qc.setQueryData<TrashedBook[]>(['trash-bin'], items.slice(0, 50));
  };

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['my-stories'] });
    // A publish/edit changes public lists too — refresh home + books at once.
    void qc.invalidateQueries({ queryKey: qk.books });
    void qc.invalidateQueries({ queryKey: qk.home });
  };

  const saveBookMutation = useMutation({
    mutationFn: async (input: BookInput): Promise<SaveResult> => {
      if (!token) return { error: 'no-session' };
      const existing = input.id ? books.find((b) => b.id === input.id) : undefined;
      const coverUrl = await resolveCoverUrl(input.cover, existing?.coverUrl ?? null);
      if (input.id) {
        const r = await updateStory(token, input.id, {
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category,
          cover_url: coverUrl ?? undefined,
        });
        if (r.data && 'ok' in r.data && r.data.ok) {
          refresh();
          return { id: input.id };
        }
        return { error: (r.data as { error?: string } | null)?.error || r.error || 'unknown' };
      }
      const r = await createStory(token, {
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        cover_url: coverUrl ?? undefined,
      });
      if (r.data && 'id' in r.data && r.data.id) {
        refresh();
        return { id: r.data.id as string };
      }
      return { error: (r.data as { error?: string } | null)?.error || r.error || 'unknown' };
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string): Promise<OpResult> => {
      if (!token) return { ok: false, error: 'no-session' };
      const target = books.find((b) => b.id === id);
      let chapters: { title: string; body: string }[] = [];
      try {
        const d = await fetchStoryDetail(token, id);
        if (d.data && 'chapters' in d.data && Array.isArray(d.data.chapters)) {
          chapters = (d.data.chapters ?? []).map((c) => ({ title: c.title, body: c.body || '' }));
        }
      } catch {}
      const r = await deleteStory(token, id);
      const ok = Boolean(r.data && 'ok' in r.data && r.data.ok);
      if (ok && target) {
        const snapshot: TrashedBook = {
          id: target.id,
          title: target.title,
          description: target.description,
          category: target.category,
          coverUrl: target.coverUrl,
          chapters,
          deletedAt: Date.now(),
        };
        await persistTrash([snapshot, ...recycledBooks]);
      }
      refresh();
      return ok ? { ok: true } : { ok: false, error: (r.data as { error?: string } | null)?.error || r.error || 'unknown' };
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string): Promise<OpResult> => {
      if (!token) return { ok: false, error: 'no-session' };
      const item = recycledBooks.find((b) => b.id === id);
      if (!item) return { ok: false, error: 'not-found' };
      const created = await createStory(token, {
        title: item.title,
        description: item.description,
        category: item.category,
        cover_url: item.coverUrl ?? undefined,
      });
      if (!(created.data && 'id' in created.data && created.data.id)) {
        return { ok: false, error: (created.data as { error?: string } | null)?.error || created.error || 'unknown' };
      }
      const newId = created.data.id as string;
      for (const ch of item.chapters) {
        try {
          await addStoryChapter(token, newId, { title: ch.title, body: ch.body });
        } catch {}
      }
      await persistTrash(recycledBooks.filter((b) => b.id !== id));
      refresh();
      return { ok: true };
    },
  });

  const saveChapterMutation = useMutation({
    mutationFn: async ({ bookId, chapter }: { bookId: string; chapter: ChapterInput }): Promise<SaveResult> => {
      if (!token) return { error: 'no-session' };
      if (chapter.id) {
        const r = await updateStoryChapter(token, bookId, chapter.id, { title: chapter.title.trim(), body: chapter.body.trim() });
        if (r.ok) {
          void qc.invalidateQueries({ queryKey: ['writer-story', bookId] });
          refresh();
          return { id: chapter.id };
        }
        return { error: r.error || 'unsupported' };
      }
      const r = await addStoryChapter(token, bookId, { title: chapter.title.trim(), body: chapter.body.trim() });
      if (r && 'id' in r && r.id) {
        void qc.invalidateQueries({ queryKey: ['writer-story', bookId] });
        refresh();
        return { id: r.id as string };
      }
      return { error: (r as { error?: string } | null)?.error || 'unknown' };
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async ({ bookId, chapterId }: { bookId: string; chapterId: string }): Promise<OpResult> => {
      if (!token) return { ok: false, error: 'no-session' };
      const r = await deleteStoryChapter(token, bookId, chapterId);
      if (r.ok) {
        void qc.invalidateQueries({ queryKey: ['writer-story', bookId] });
        refresh();
        return { ok: true };
      }
      return { ok: false, error: r.error || 'unsupported' };
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string): Promise<OpResult> => {
      if (!token) return { ok: false, error: 'no-session' };
      const r = await submitStoryForReview(token, id);
      refresh();
      if (r.data && 'ok' in r.data && r.data.ok) return { ok: true };
      return { ok: false, error: (r.data as { error?: string } | null)?.error || r.error || 'unknown' };
    },
  });

  const value = useMemo<WriterContentValue>(
    () => ({
      books,
      isLoading: storiesQuery.isLoading,
      recycledBooks,
      saveBook: (book) => saveBookMutation.mutateAsync(book),
      deleteBook: (id) => deleteBookMutation.mutateAsync(id),
      restoreBook: (id) => restoreMutation.mutateAsync(id),
      permanentlyDeleteBook: (id) => {
        void persistTrash(recycledBooks.filter((b) => b.id !== id));
      },
      getBook: (id) => books.find((book) => book.id === id),
      saveChapter: (bookId, chapter) => saveChapterMutation.mutateAsync({ bookId, chapter }),
      deleteChapter: (bookId, chapterId) => deleteChapterMutation.mutateAsync({ bookId, chapterId }),
      submitForReview: (id) => submitMutation.mutateAsync(id),
      refresh,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [books, recycledBooks, storiesQuery.isLoading, token],
  );

  return <WriterContentContext.Provider value={value}>{children}</WriterContentContext.Provider>;
}

export function useWriterContent() {
  const context = useContext(WriterContentContext);
  if (!context) throw new Error('useWriterContent must be used within WriterContentProvider');
  return context;
}

export function useWriterStory(storyId: string) {
  const { token } = useWriterAccess();
  return useQuery({
    queryKey: ['writer-story', storyId],
    queryFn: () => (token ? fetchStoryDetail(token, storyId).then((r) => r.data) : Promise.resolve(null)),
    enabled: Boolean(token && storyId),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnReconnect: true,
  });
}
