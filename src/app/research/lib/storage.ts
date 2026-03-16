import { Interview, InterviewMeta } from '../types';

const KEYS = {
  INDEX: 'bos-iv-idx',
  IV: (id: string) => `bos-iv:${id}`,
  API_KEY: 'bos-api-key',
};

export const storage = {
  getIndex(): InterviewMeta[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.INDEX) ?? '[]');
    } catch {
      return [];
    }
  },

  setIndex(idx: InterviewMeta[]): void {
    localStorage.setItem(KEYS.INDEX, JSON.stringify(idx));
  },

  getInterview(id: string): Interview | null {
    try {
      return JSON.parse(localStorage.getItem(KEYS.IV(id)) ?? 'null');
    } catch {
      return null;
    }
  },

  saveInterview(iv: Interview): void {
    localStorage.setItem(KEYS.IV(iv.id), JSON.stringify(iv));
    const idx = this.getIndex();
    const meta: InterviewMeta = {
      id: iv.id,
      username: iv.username,
      tier: iv.tier,
      date: iv.date,
      profile: iv.profile,
      status: iv.status,
    };
    const existing = idx.findIndex((x) => x.id === iv.id);
    if (existing >= 0) idx[existing] = meta;
    else idx.unshift(meta);
    this.setIndex(idx);
  },

  deleteInterview(id: string): void {
    localStorage.removeItem(KEYS.IV(id));
    this.setIndex(this.getIndex().filter((x) => x.id !== id));
  },

  getApiKey(): string {
    return localStorage.getItem(KEYS.API_KEY) ?? '';
  },

  setApiKey(key: string): void {
    localStorage.setItem(KEYS.API_KEY, key);
  },
};
