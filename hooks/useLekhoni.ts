// Realtime query hooks over the live backend (TanStack Query v5).
// Polling intervals keep every screen fresh while it is mounted.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  REFETCH_BOOK_MS,
  REFETCH_COMMENTS_MS,
  REFETCH_HOME_MS,
  REFETCH_LIST_MS,
  deleteComment,
  fetchFollowed,
  followWriter,
  getBook,
  getBooks,
  getCategories,
  getComments,
  getHomeSections,
  getWriter,
  getWriters,
  postComment,
  setLike,
  trackView,
  unfollowWriter,
  updateComment,
} from '@/lib/api';
import { getDeviceId } from '@/lib/device';

export const qk = {
  books: ['books'] as const,
  home: ['home-sections'] as const,
  book: (id: string) => ['book', id] as const,
  categories: ['categories'] as const,
  writers: ['writers'] as const,
  writer: (id: string) => ['writer', id] as const,
  comments: (bookId: string) => ['comments', bookId] as const,
  followed: ['followed'] as const,
  device: ['device-id'] as const,
};

export function useDeviceId() {
  return useQuery({ queryKey: qk.device, queryFn: getDeviceId, staleTime: Infinity, gcTime: Infinity });
}

export function useBooks() {
  return useQuery({
    queryKey: qk.books,
    queryFn: getBooks,
    staleTime: 30_000,
    refetchInterval: REFETCH_LIST_MS,
    refetchOnReconnect: true,
  });
}

export function useHomeSections() {
  return useQuery({
    queryKey: qk.home,
    queryFn: getHomeSections,
    staleTime: 30_000,
    refetchInterval: REFETCH_HOME_MS,
    refetchOnReconnect: true,
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: qk.book(id),
    queryFn: () => getBook(id),
    enabled: Boolean(id),
    staleTime: 15_000,
    refetchInterval: REFETCH_BOOK_MS,
    refetchOnReconnect: true,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: getCategories,
    staleTime: 60_000,
    refetchInterval: REFETCH_LIST_MS,
    refetchOnReconnect: true,
  });
}

export function useWriters() {
  return useQuery({
    queryKey: qk.writers,
    queryFn: getWriters,
    staleTime: 60_000,
    refetchInterval: REFETCH_LIST_MS,
    refetchOnReconnect: true,
  });
}

export function useWriter(id: string) {
  return useQuery({
    queryKey: qk.writer(id),
    queryFn: () => getWriter(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    refetchInterval: REFETCH_LIST_MS,
    refetchOnReconnect: true,
  });
}

export function useComments(bookId: string) {
  return useQuery({
    queryKey: qk.comments(bookId),
    queryFn: () => getComments(bookId),
    enabled: Boolean(bookId),
    staleTime: 10_000,
    refetchInterval: REFETCH_COMMENTS_MS,
    refetchOnReconnect: true,
  });
}

export function useFollowedIds() {
  return useQuery({
    queryKey: qk.followed,
    queryFn: async () => {
      const deviceId = await getDeviceId();
      if (!deviceId) return [] as { id: string }[];
      return fetchFollowed(deviceId);
    },
    staleTime: 30_000,
    refetchInterval: REFETCH_LIST_MS,
    refetchOnReconnect: true,
  });
}

export function useRecordView(bookId: string, enabled = true) {
  const { data: deviceId } = useDeviceId();
  return useQuery({
    queryKey: ['view-recorded', bookId, deviceId ?? ''],
    queryFn: async () => {
      if (deviceId && bookId) await trackView(bookId, deviceId);
      return true;
    },
    enabled: enabled && Boolean(deviceId && bookId),
    staleTime: Infinity,
    gcTime: 60_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

export function useToggleLike(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: boolean) => {
      const deviceId = await getDeviceId();
      return setLike(bookId, deviceId, value);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.book(bookId) });
      void qc.invalidateQueries({ queryKey: qk.books });
      void qc.invalidateQueries({ queryKey: qk.home });
    },
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ writerId, following }: { writerId: string; following: boolean }) => {
      const deviceId = await getDeviceId();
      const ok = following ? await unfollowWriter(deviceId, writerId) : await followWriter(deviceId, writerId);
      return { ok, following: !following };
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.followed });
      void qc.invalidateQueries({ queryKey: qk.writers });
    },
  });
}

export function usePostComment(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, body, avatarUrl }: { name: string; body: string; avatarUrl?: string }) =>
      (async () => {
        const deviceId = await getDeviceId();
        return postComment(bookId, deviceId, name, body, avatarUrl);
      })(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(bookId) });
    },
  });
}

export function useEditComment(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      (async () => {
        const deviceId = await getDeviceId();
        return updateComment(bookId, commentId, deviceId, body);
      })(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(bookId) });
    },
  });
}

export function useDeleteComment(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      (async () => {
        const deviceId = await getDeviceId();
        return deleteComment(bookId, commentId, deviceId);
      })(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.comments(bookId) });
    },
  });
}
