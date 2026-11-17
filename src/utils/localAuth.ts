import { db, isQuotaExceededError } from '../db/database';
import type { AuthSession, LocalAccount } from '../types/resume';

const SESSION_STORAGE_KEY = 'resumeiq_auth_session';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return bytesToHex(arr);
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    return bytesToHex(new Uint8Array(derived));
  }

  // Deterministic fallback if WebCrypto subtle is unavailable in non-HTTPS contexts
  let hash = 2166136261;
  const input = `${salt}:${password}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fb-${(hash >>> 0).toString(16)}`;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function getStoredAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (
      parsed &&
      typeof parsed.accountId === 'string' &&
      typeof parsed.email === 'string' &&
      typeof parsed.fullName === 'string'
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function registerLocalAccount(params: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const fullName = params.fullName.trim();
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (fullName.length < 2) {
    throw new Error('Please enter your full name (at least 2 characters).');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  let existing: LocalAccount | undefined;
  try {
    existing = await db.accounts.where('email').equals(email).first();
  } catch {
    throw new Error(
      'Local IndexedDB storage is unavailable in this browser context. Enable site storage or exit private browsing to create an account.'
    );
  }

  if (existing) {
    throw new Error('An account with this email already exists in this browser. Please sign in instead.');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  const account: LocalAccount = {
    id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fullName,
    email,
    passwordHash,
    salt,
    createdAt: now,
  };

  try {
    await db.accounts.put(account);
  } catch (err) {
    if (isQuotaExceededError(err)) {
      throw new Error('Browser storage quota exceeded. Free up site storage space before creating a new account.');
    }
    throw new Error('Unable to save local account to IndexedDB.');
  }

  const session: AuthSession = {
    accountId: account.id,
    fullName: account.fullName,
    email: account.email,
    signedInAt: now,
  };
  saveAuthSession(session);
  return session;
}

export async function loginLocalAccount(params: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  if (!email || !password) {
    throw new Error('Please enter both your email and password.');
  }

  let account: LocalAccount | undefined;
  try {
    account = await db.accounts.where('email').equals(email).first();
  } catch {
    throw new Error(
      'Local IndexedDB storage is unavailable or blocked in this browser context.'
    );
  }

  if (!account) {
    throw new Error('No local account found for that email address. Please sign up first.');
  }

  const computedHash = await hashPassword(password, account.salt);
  if (!constantTimeEqual(computedHash, account.passwordHash)) {
    throw new Error('Incorrect password. Please try again.');
  }

  const session: AuthSession = {
    accountId: account.id,
    fullName: account.fullName,
    email: account.email,
    signedInAt: new Date().toISOString(),
  };
  saveAuthSession(session);
  return session;
}
