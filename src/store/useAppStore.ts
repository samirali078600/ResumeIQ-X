import { create } from 'zustand';
import {
  db,
  DEFAULT_PROFILE,
  isQuotaExceededError,
} from '../db/database';
import { DEFAULT_ATS_WEIGHTS } from '../ats/atsScoring';
import {
  clearAuthSession,
  getStoredAuthSession,
  loginLocalAccount,
  registerLocalAccount,
} from '../utils/localAuth';
import type {
  ActivityLogItem,
  ATSWeights,
  AuthSession,
  CoverLetterRecord,
  CustomSkillEntry,
  JobMatchResult,
  ResumeAnalysisRecord,
  ResumeBuilderData,
  ThemeMode,
  ToastMessage,
  UserProfile,
} from '../types/resume';

const THEME_STORAGE_KEY = 'resumeiq_theme';
const SIDEBAR_STORAGE_KEY = 'resumeiq_sidebar_collapsed';
const WEIGHTS_STORAGE_KEY = 'resumeiq_ats_weights';

function resolveThemeClass(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function applyThemeToDom(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const isDark = resolveThemeClass(mode);
  if (isDark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // ignore storage errors
  }
  return 'system';
}

function getInitialSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getInitialWeights(): ATSWeights {
  try {
    const raw = localStorage.getItem(WEIGHTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_ATS_WEIGHTS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_ATS_WEIGHTS };
}

interface AppState {
  hydrated: boolean;
  storageError: string | null;
  authSession: AuthSession | null;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  profile: UserProfile;
  atsWeights: ATSWeights;
  customSkills: CustomSkillEntry[];
  analyses: ResumeAnalysisRecord[];
  activeAnalysis: ResumeAnalysisRecord | null;
  jobMatches: JobMatchResult[];
  activeJobMatch: JobMatchResult | null;
  resumes: ResumeBuilderData[];
  coverLetters: CoverLetterRecord[];
  activities: ActivityLogItem[];
  toasts: ToastMessage[];

  hydrateFromIndexedDb: () => Promise<void>;
  signUp: (params: { fullName: string; email: string; password: string }) => Promise<AuthSession>;
  signIn: (params: { email: string; password: string }) => Promise<AuthSession>;
  signOut: () => void;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAtsWeights: (weights: ATSWeights) => void;
  saveProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setActiveAnalysis: (record: ResumeAnalysisRecord | null) => void;
  saveAnalysisToLocal: (record: ResumeAnalysisRecord) => Promise<boolean>;
  updateAnalysisRecord: (record: ResumeAnalysisRecord, persistIfSaved?: boolean) => Promise<void>;
  deleteAnalysis: (id: string) => Promise<void>;
  clearAnalysesHistory: () => Promise<void>;
  saveJobMatch: (match: JobMatchResult) => Promise<void>;
  setActiveJobMatch: (match: JobMatchResult | null) => void;
  saveBuilderResume: (resume: ResumeBuilderData) => Promise<boolean>;
  deleteBuilderResume: (id: string) => Promise<void>;
  saveCoverLetter: (letter: CoverLetterRecord) => Promise<boolean>;
  deleteCoverLetter: (id: string) => Promise<void>;
  addCustomSkill: (skill: Omit<CustomSkillEntry, 'id' | 'createdAt'>) => Promise<void>;
  removeCustomSkill: (id: string) => Promise<void>;
  logActivity: (type: ActivityLogItem['type'], title: string, detail: string) => Promise<void>;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  storageError: null,
  authSession: getStoredAuthSession(),
  theme: getInitialTheme(),
  sidebarCollapsed: getInitialSidebarCollapsed(),
  profile: DEFAULT_PROFILE,
  atsWeights: getInitialWeights(),
  customSkills: [],
  analyses: [],
  activeAnalysis: null,
  jobMatches: [],
  activeJobMatch: null,
  resumes: [],
  coverLetters: [],
  activities: [],
  toasts: [],

  hydrateFromIndexedDb: async () => {
    try {
      const [profiles, customSkills, analyses, jobMatches, resumes, coverLetters, activities, accounts] =
        await Promise.all([
          db.profiles.toArray(),
          db.customSkills.toArray(),
          db.analyses.orderBy('createdAt').reverse().toArray(),
          db.jobMatches.orderBy('createdAt').reverse().toArray(),
          db.resumes.orderBy('updatedAt').reverse().toArray(),
          db.coverLetters.orderBy('createdAt').reverse().toArray(),
          db.activities.orderBy('createdAt').reverse().limit(30).toArray(),
          db.accounts.toArray(),
        ]);

      let validSession = getStoredAuthSession();
      if (validSession && !accounts.some((acc) => acc.id === validSession?.accountId)) {
        clearAuthSession();
        validSession = null;
      }

      const profile = profiles[0] || DEFAULT_PROFILE;
      set({
        hydrated: true,
        storageError: null,
        authSession: validSession,
        profile,
        customSkills,
        analyses,
        activeAnalysis: get().activeAnalysis || analyses[0] || null,
        jobMatches,
        activeJobMatch: get().activeJobMatch || jobMatches[0] || null,
        resumes,
        coverLetters,
        activities,
      });
    } catch (err) {
      set({
        hydrated: true,
        storageError:
          err instanceof Error
            ? `IndexedDB unavailable: ${err.message}. You can still analyze resumes in memory.`
            : 'IndexedDB unavailable in this browser context.',
      });
    }
  },

  signUp: async ({ fullName, email, password }) => {
    const session = await registerLocalAccount({ fullName, email, password });
    set({ authSession: session });
    await get().saveProfile({
      displayName: session.fullName,
      email: session.email,
    });
    return session;
  },

  signIn: async ({ email, password }) => {
    const session = await loginLocalAccount({ email, password });
    set({ authSession: session });
    if (!get().profile.displayName) {
      await get().saveProfile({
        displayName: session.fullName,
        email: session.email,
      });
    }
    return session;
  },

  signOut: () => {
    clearAuthSession();
    set({ authSession: null });
  },

  setTheme: (mode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
    applyThemeToDom(mode);
    set({ theme: mode });
  },

  toggleTheme: () => {
    const current = get().theme;
    const currentlyDark = resolveThemeClass(current);
    const next: ThemeMode = currentlyDark ? 'light' : 'dark';
    get().setTheme(next);
  },

  setSidebarCollapsed: (collapsed) => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // ignore
    }
    set({ sidebarCollapsed: collapsed });
  },

  setAtsWeights: (weights) => {
    try {
      localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(weights));
    } catch {
      // ignore
    }
    set({ atsWeights: weights });
  },

  saveProfile: async (updates) => {
    const next: UserProfile = {
      ...get().profile,
      ...updates,
      id: 'local-profile',
      updatedAt: new Date().toISOString(),
    };
    set({ profile: next });
    try {
      await db.profiles.put(next);
      await get().logActivity('settings', 'Updated local profile', next.displayName || 'Local workspace');
    } catch (err) {
      if (isQuotaExceededError(err)) {
        get().addToast({
          type: 'error',
          title: 'Browser storage quota exceeded',
          description: 'Delete old analyses or export a backup to free space.',
        });
      } else {
        get().addToast({
          type: 'warning',
          title: 'Profile kept in memory only',
          description: 'IndexedDB is unavailable in this browser context.',
        });
      }
    }
  },

  setActiveAnalysis: (record) => set({ activeAnalysis: record }),

  saveAnalysisToLocal: async (record) => {
    try {
      await db.analyses.put(record);
      const existing = get().analyses.filter((a) => a.id !== record.id);
      set({
        analyses: [record, ...existing],
        activeAnalysis: record,
      });
      await get().logActivity(
        'analysis',
        `Analyzed ${record.fileName}`,
        `Heuristic ATS Score: ${record.ats.overallScore}/100`
      );
      return true;
    } catch (err) {
      if (isQuotaExceededError(err)) {
        get().addToast({
          type: 'error',
          title: 'Storage quota exceeded',
          description: 'Could not save analysis to IndexedDB. Free local storage space or disable saving original files.',
        });
      } else {
        get().addToast({
          type: 'error',
          title: 'Local save failed',
          description: err instanceof Error ? err.message : 'Unable to write to IndexedDB.',
        });
      }
      return false;
    }
  },

  updateAnalysisRecord: async (record, persistIfSaved = true) => {
    const updated = { ...record, updatedAt: new Date().toISOString() };
    const existsInDb = get().analyses.some((a) => a.id === updated.id);
    set({
      activeAnalysis: get().activeAnalysis?.id === updated.id ? updated : get().activeAnalysis,
      analyses: existsInDb
        ? get().analyses.map((a) => (a.id === updated.id ? updated : a))
        : get().analyses,
    });
    if (persistIfSaved && existsInDb) {
      try {
        await db.analyses.put(updated);
      } catch {
        // handled silently on live update
      }
    }
  },

  deleteAnalysis: async (id) => {
    const remaining = get().analyses.filter((a) => a.id !== id);
    set({
      analyses: remaining,
      activeAnalysis: get().activeAnalysis?.id === id ? remaining[0] || null : get().activeAnalysis,
    });
    try {
      await db.analyses.delete(id);
    } catch {
      get().addToast({
        type: 'warning',
        title: 'Removed from view only',
        description: 'IndexedDB could not be updated in this browser context.',
      });
    }
  },

  clearAnalysesHistory: async () => {
    set({ analyses: [], activeAnalysis: null });
    try {
      await db.analyses.clear();
    } catch {
      get().addToast({
        type: 'warning',
        title: 'Cleared from session memory',
        description: 'IndexedDB could not be accessed.',
      });
    }
  },

  saveJobMatch: async (match) => {
    set({
      activeJobMatch: match,
      jobMatches: [match, ...get().jobMatches.filter((m) => m.id !== match.id)],
    });
    if (get().profile.consentToSaveLocal) {
      try {
        await db.jobMatches.put(match);
        await get().logActivity(
          'job-match',
          `Matched against ${match.jobTitle}`,
          `${match.company} — ${match.overallMatchScore}% match`
        );
      } catch (err) {
        if (isQuotaExceededError(err)) {
          get().addToast({
            type: 'warning',
            title: 'Storage full',
            description: 'Job match kept in memory only.',
          });
        }
      }
    }
  },

  setActiveJobMatch: (match) => set({ activeJobMatch: match }),

  saveBuilderResume: async (resume) => {
    const updated = { ...resume, updatedAt: new Date().toISOString() };
    set({
      resumes: [updated, ...get().resumes.filter((r) => r.id !== updated.id)],
    });
    try {
      await db.resumes.put(updated);
      await get().logActivity('builder', `Saved resume draft "${updated.title}"`, `Version ${updated.version}`);
      return true;
    } catch (err) {
      if (isQuotaExceededError(err)) {
        get().addToast({
          type: 'error',
          title: 'Storage quota exceeded',
          description: 'Resume draft kept in memory only — free local storage space to persist.',
        });
      } else {
        get().addToast({
          type: 'warning',
          title: 'Saved to memory only',
          description: 'IndexedDB storage is unavailable.',
        });
      }
      return false;
    }
  },

  deleteBuilderResume: async (id) => {
    set({ resumes: get().resumes.filter((r) => r.id !== id) });
    try {
      await db.resumes.delete(id);
    } catch {
      // non-fatal if storage unavailable
    }
  },

  saveCoverLetter: async (letter) => {
    const updated = { ...letter, updatedAt: new Date().toISOString() };
    set({
      coverLetters: [updated, ...get().coverLetters.filter((c) => c.id !== updated.id)],
    });
    try {
      await db.coverLetters.put(updated);
      await get().logActivity('cover-letter', `Saved cover letter for ${updated.jobTitle}`, updated.company);
      return true;
    } catch (err) {
      if (isQuotaExceededError(err)) {
        get().addToast({
          type: 'error',
          title: 'Storage quota exceeded',
          description: 'Cover letter kept in memory only.',
        });
      } else {
        get().addToast({
          type: 'warning',
          title: 'Saved to memory only',
          description: 'IndexedDB storage is unavailable.',
        });
      }
      return false;
    }
  },

  deleteCoverLetter: async (id) => {
    set({ coverLetters: get().coverLetters.filter((c) => c.id !== id) });
    try {
      await db.coverLetters.delete(id);
    } catch {
      // non-fatal
    }
  },

  addCustomSkill: async (skill) => {
    const entry: CustomSkillEntry = {
      ...skill,
      id: `cskill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    set({ customSkills: [...get().customSkills, entry] });
    try {
      await db.customSkills.put(entry);
    } catch (err) {
      if (isQuotaExceededError(err)) {
        get().addToast({
          type: 'warning',
          title: 'Storage full',
          description: 'Custom skill active in current session only.',
        });
      }
    }
  },

  removeCustomSkill: async (id) => {
    set({ customSkills: get().customSkills.filter((s) => s.id !== id) });
    try {
      await db.customSkills.delete(id);
    } catch {
      // non-fatal
    }
  },

  logActivity: async (type, title, detail) => {
    const item: ActivityLogItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      detail,
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...get().activities].slice(0, 30);
    set({ activities: next });
    try {
      await db.activities.put(item);
    } catch {
      // non-critical
    }
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set({ toasts: [...get().toasts, { ...toast, id }] });
    window.setTimeout(() => {
      get().dismissToast(id);
    }, 4500);
  },

  dismissToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
