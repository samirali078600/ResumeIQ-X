import Dexie, { type Table } from 'dexie';
import type {
  ActivityLogItem,
  CoverLetterRecord,
  CustomSkillEntry,
  JobMatchResult,
  ResumeAnalysisRecord,
  ResumeBuilderData,
  UserProfile,
  LocalAccount,
} from '../types/resume';

export class ResumeIQXDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  customSkills!: Table<CustomSkillEntry, string>;
  analyses!: Table<ResumeAnalysisRecord, string>;
  jobMatches!: Table<JobMatchResult, string>;
  resumes!: Table<ResumeBuilderData, string>;
  coverLetters!: Table<CoverLetterRecord, string>;
  activities!: Table<ActivityLogItem, string>;
  accounts!: Table<LocalAccount, string>;

  constructor() {
    super('ResumeIQX_DB');
    this.version(1).stores({
      profiles: '&id, updatedAt',
      customSkills: '&id, category, name',
      analyses: '&id, fileName, createdAt, updatedAt',
      jobMatches: '&id, analysisId, jobTitle, company, createdAt',
      resumes: '&id, title, templateId, updatedAt',
      coverLetters: '&id, title, company, createdAt',
      activities: '&id, type, createdAt',
    });
    this.version(2).stores({
      profiles: '&id, updatedAt',
      customSkills: '&id, category, name',
      analyses: '&id, fileName, createdAt, updatedAt',
      jobMatches: '&id, analysisId, jobTitle, company, createdAt',
      resumes: '&id, title, templateId, updatedAt',
      coverLetters: '&id, title, company, createdAt',
      activities: '&id, type, createdAt',
      accounts: '&id, &email, createdAt',
    });
  }
}

export const db = new ResumeIQXDatabase();

export const DEFAULT_PROFILE: UserProfile = {
  id: 'local-profile',
  displayName: '',
  careerTarget: '',
  experienceLevel: 'mid',
  location: '',
  email: '',
  phone: '',
  linkedin: '',
  portfolio: '',
  consentToSaveLocal: true,
  saveOriginalDocs: false,
  nlpModelPreference: 'classical',
  updatedAt: new Date().toISOString(),
};

export interface BackupPayload {
  schemaVersion: number;
  app: 'ResumeIQ X';
  exportedAt: string;
  data: {
    profiles: UserProfile[];
    customSkills: CustomSkillEntry[];
    analyses: ResumeAnalysisRecord[];
    jobMatches: JobMatchResult[];
    resumes: ResumeBuilderData[];
    coverLetters: CoverLetterRecord[];
    activities: ActivityLogItem[];
  };
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = (err as { name?: string }).name || '';
  const message = (err as { message?: string }).message || '';
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    message.toLowerCase().includes('quota')
  );
}

export async function getStorageAvailability(): Promise<{
  available: boolean;
  usageBytes?: number;
  quotaBytes?: number;
  error?: string;
}> {
  try {
    if (typeof indexedDB === 'undefined') {
      return { available: false, error: 'IndexedDB is not supported in this browser.' };
    }
    await db.open();
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      return {
        available: true,
        usageBytes: est.usage,
        quotaBytes: est.quota,
      };
    }
    return { available: true };
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : 'Unable to access IndexedDB storage.',
    };
  }
}

export async function exportLocalBackup(): Promise<BackupPayload> {
  const [profiles, customSkills, analyses, jobMatches, resumes, coverLetters, activities] =
    await Promise.all([
      db.profiles.toArray(),
      db.customSkills.toArray(),
      db.analyses.toArray(),
      db.jobMatches.toArray(),
      db.resumes.toArray(),
      db.coverLetters.toArray(),
      db.activities.toArray(),
    ]);

  return {
    schemaVersion: 1,
    app: 'ResumeIQ X',
    exportedAt: new Date().toISOString(),
    data: {
      profiles,
      customSkills,
      analyses,
      jobMatches,
      resumes,
      coverLetters,
      activities,
    },
  };
}

export function validateBackupPayload(raw: unknown): raw is BackupPayload {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  if (obj.app !== 'ResumeIQ X' || obj.schemaVersion !== 1) return false;
  if (!obj.data || typeof obj.data !== 'object') return false;
  const data = obj.data as Record<string, unknown>;
  const requiredArrays = [
    'profiles',
    'customSkills',
    'analyses',
    'jobMatches',
    'resumes',
    'coverLetters',
    'activities',
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) return false;
  }

  for (const item of data.analyses as unknown[]) {
    if (!item || typeof item !== 'object') return false;
    const rec = item as Record<string, unknown>;
    if (
      typeof rec.id !== 'string' ||
      typeof rec.fileName !== 'string' ||
      typeof rec.extractedText !== 'string' ||
      !rec.ats ||
      !rec.nlp
    ) {
      return false;
    }
  }
  return true;
}

export async function importLocalBackup(payload: BackupPayload): Promise<{
  analysesImported: number;
  resumesImported: number;
  jobMatchesImported: number;
}> {
  await db.transaction(
    'rw',
    [db.profiles, db.customSkills, db.analyses, db.jobMatches, db.resumes, db.coverLetters, db.activities],
    async () => {
      if (payload.data.profiles.length > 0) await db.profiles.bulkPut(payload.data.profiles);
      if (payload.data.customSkills.length > 0) await db.customSkills.bulkPut(payload.data.customSkills);
      if (payload.data.analyses.length > 0) await db.analyses.bulkPut(payload.data.analyses);
      if (payload.data.jobMatches.length > 0) await db.jobMatches.bulkPut(payload.data.jobMatches);
      if (payload.data.resumes.length > 0) await db.resumes.bulkPut(payload.data.resumes);
      if (payload.data.coverLetters.length > 0) await db.coverLetters.bulkPut(payload.data.coverLetters);
      if (payload.data.activities.length > 0) await db.activities.bulkPut(payload.data.activities);
    }
  );

  return {
    analysesImported: payload.data.analyses.length,
    resumesImported: payload.data.resumes.length,
    jobMatchesImported: payload.data.jobMatches.length,
  };
}

export async function clearAllLocalData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.customSkills,
      db.analyses,
      db.jobMatches,
      db.resumes,
      db.coverLetters,
      db.activities,
      db.accounts,
    ],
    async () => {
      await Promise.all([
        db.profiles.clear(),
        db.customSkills.clear(),
        db.analyses.clear(),
        db.jobMatches.clear(),
        db.resumes.clear(),
        db.coverLetters.clear(),
        db.activities.clear(),
        db.accounts.clear(),
      ]);
    }
  );
}
