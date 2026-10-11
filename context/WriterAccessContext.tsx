import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  forgotWriterPassword,
  resetWriterPassword,
  resendWriterCode,
  updateWriterProfile,
  verifyWriterCode,
  writerGoogleAuth,
  writerLogin,
  writerSignup,
  type WriterSession,
} from '@/lib/api';
import { clearStoredToken, rehydrateSession, storeToken } from '@/lib/session';

export type WriterVerificationStatus = 'required' | 'pending' | 'verified';

export type WriterAccount = {
  username: string;
  displayName: string;
  verification: WriterVerificationStatus;
  phone?: string;
  bio?: string;
  email?: string;
  token: string;
  writerId: string;
  avatarUrl?: string | null;
  followerCount?: number;
};

export type AuthResult =
  | { ok: true; needsVerification?: boolean; email?: string }
  | { ok: false; error: string; needsVerification?: boolean; email?: string };

type WriterAccessContextValue = {
  session: WriterAccount | null;
  ready: boolean;
  token: string | null;
  signIn: (username: string, password: string) => Promise<AuthResult>;
  signUp: (displayName: string, username: string, password: string, phone?: string, bio?: string, email?: string) => Promise<AuthResult>;
  verifyEmailCode: (email: string, code: string) => Promise<AuthResult>;
  resendEmailCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
  signInWithGoogle: (credential: string) => Promise<AuthResult>;
  updateProfile: (displayName: string, bio: string) => Promise<{ ok: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  signOut: () => void;
};

const WriterAccessContext = createContext<WriterAccessContextValue | null>(null);

function toAccount(writer: WriterSession, token: string, verification: WriterVerificationStatus, phone = ''): WriterAccount {
  return {
    username: writer.username,
    displayName: writer.writer_name || writer.username,
    verification,
    phone,
    bio: writer.bio || '',
    email: undefined,
    token,
    writerId: writer.id,
    avatarUrl: writer.avatar_url ?? null,
    followerCount: writer.follower_count ?? 0,
  };
}

const bnError = (error?: string): string => {
  switch (error) {
    case 'network':
      return 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।';
    case 'invalid-credentials':
    case 'invalid_credentials':
      return 'ইউজারনেম/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
    case 'user-not-found':
    case 'not-found':
      return 'এই তথ্যে কোনো অ্যাকাউন্ট পাওয়া যায়নি।';
    case 'email-taken':
    case 'username-taken':
      return 'এই ইমেইল/ইউজারনেম দিয়ে আগেই অ্যাকাউন্ট আছে। লগইন করুন।';
    case 'too-many':
    case 'rate-limited':
      return 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
    case 'invalid-code':
    case 'wrong-code':
      return 'যাচাইকরণ কোড সঠিক নয়।';
    case 'expired-code':
    case 'code-expired':
      return 'কোডের মেয়াদ শেষ। নতুন কোড পাঠান।';
    default:
      return error ? `সার্ভার ত্রুটি: ${error}` : 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।';
  }
};

export function WriterAccessProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<WriterAccount | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      const s = await rehydrateSession();
      if (!on) return;
      if (s) setSession(toAccount(s.writer, s.token, 'verified'));
      setReady(true);
    })();
    return () => {
      on = false;
    };
  }, []);

  const refreshSession = useCallback(async () => {
    const s = await rehydrateSession();
    if (s) {
      setSession((current) =>
        current && current.token === s.token
          ? { ...current, displayName: s.writer.writer_name || s.writer.username, bio: s.writer.bio || '', avatarUrl: s.writer.avatar_url ?? null, followerCount: s.writer.follower_count ?? 0 }
          : toAccount(s.writer, s.token, 'verified'),
      );
    } else {
      setSession(null);
    }
  }, []);

  const signIn = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    const res = await writerLogin(username.trim(), password);
    if (!res) return { ok: false, error: 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।' };
    if ('writer' in res) {
      await storeToken(res.token);
      setSession(toAccount(res.writer, res.token, 'verified'));
      return { ok: true };
    }
    if ('unverified' in res) {
      return { ok: false, error: 'ইমেইল যাচাই করা হয়নি। যাচাইকরণ কোড দিন।', needsVerification: true, email: res.email };
    }
    return { ok: false, error: bnError('error' in res ? res.error : undefined) };
  }, []);

  const signUp = useCallback(
    async (displayName: string, username: string, password: string, phone = '', bio = '', email = ''): Promise<AuthResult> => {
      void phone;
      void bio;
      const cleanEmail = email.trim();
      let cleanUsername = username.trim();
      if (!cleanUsername && cleanEmail.includes('@')) cleanUsername = cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '') || `writer${Date.now().toString(36)}`;
      const res = await writerSignup({ username: cleanUsername, writerName: displayName.trim(), email: cleanEmail, password });
      if (!res) return { ok: false, error: 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।' };
      if ('writer' in res && 'token' in res) {
        await storeToken(res.token);
        setSession(toAccount(res.writer, res.token, 'verified'));
        return { ok: true };
      }
      if ('needs_verification' in res) {
        return { ok: true, needsVerification: true, email: res.email };
      }
      return { ok: false, error: bnError('error' in res ? res.error : undefined) };
    },
    [],
  );

  const verifyEmailCode = useCallback(async (email: string, code: string): Promise<AuthResult> => {
    const res = await verifyWriterCode(email.trim(), code.trim());
    if (!res) return { ok: false, error: 'ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।' };
    if ('writer' in res && 'token' in res) {
      await storeToken(res.token);
      setSession(toAccount(res.writer, res.token, 'verified'));
      return { ok: true };
    }
    return { ok: false, error: bnError('error' in res ? res.error : undefined) };
  }, []);

  const resendEmailCode = useCallback(async (email: string) => {
    const res = await resendWriterCode(email.trim());
    if (!res) return { ok: false, error: 'network' };
    if ('ok' in res && res.ok) return { ok: true as const };
    return { ok: false as const, error: ('error' in res && res.error) || 'unknown' };
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const r = await forgotWriterPassword(email.trim());
    if (r.data && 'ok' in r.data && r.data.ok) return { ok: true as const };
    return { ok: false as const, error: r.error || 'unknown' };
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string): Promise<AuthResult> => {
    const r = await resetWriterPassword(email.trim(), code.trim(), newPassword);
    if (r.data && 'writer' in r.data) {
      await storeToken(r.data.token);
      setSession(toAccount(r.data.writer, r.data.token, 'verified'));
      return { ok: true };
    }
    return { ok: false, error: bnError(r.error || ('error' in (r.data ?? {}) ? (r.data as { error?: string }).error : undefined)) };
  }, []);

  const signInWithGoogle = useCallback(async (credential: string): Promise<AuthResult> => {
    const r = await writerGoogleAuth(credential);
    if (r.data && 'writer' in r.data) {
      await storeToken(r.data.token);
      setSession(toAccount(r.data.writer, r.data.token, 'verified'));
      return { ok: true };
    }
    return { ok: false, error: bnError(r.error || ('error' in (r.data ?? {}) ? (r.data as { error?: string }).error : undefined)) };
  }, []);

  const updateProfile = useCallback(
    async (displayName: string, bio: string) => {
      if (!session) return { ok: false as const, error: 'no-session' };
      const r = await updateWriterProfile(session.token, { writer_name: displayName.trim(), bio: bio.trim() });
      if (r.data && 'ok' in r.data && r.data.ok) {
        setSession({ ...session, displayName: displayName.trim(), bio: bio.trim() });
        return { ok: true as const };
      }
      return { ok: false as const, error: r.error || 'unknown' };
    },
    [session],
  );

  const signOut = useCallback(() => {
    setSession(null);
    void clearStoredToken();
  }, []);

  const value = useMemo<WriterAccessContextValue>(
    () => ({ session, ready, token: session?.token ?? null, signIn, signUp, verifyEmailCode, resendEmailCode, forgotPassword, resetPassword, signInWithGoogle, updateProfile, refreshSession, signOut }),
    [session, ready, signIn, signUp, verifyEmailCode, resendEmailCode, forgotPassword, resetPassword, signInWithGoogle, updateProfile, refreshSession, signOut],
  );

  return <WriterAccessContext.Provider value={value}>{children}</WriterAccessContext.Provider>;
}

export function useWriterAccess() {
  const context = useContext(WriterAccessContext);
  if (!context) throw new Error('useWriterAccess must be used within WriterAccessProvider');
  return context;
}
