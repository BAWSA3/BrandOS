// BrandOS Extension Constants

// API Configuration
export const API_BASE_URL = 'http://localhost:3000';
export const PROD_API_BASE_URL = 'https://brandos.app';

// Get the active API URL
export function getApiUrl() {
  // In production, use the prod URL
  // For now, check storage for override
  return API_BASE_URL;
}

// Score Color Tiers (matches ShareableScoreCard)
export const SCORE_TIERS = {
  excellent: { min: 80, color: '#22c55e', bg: '#22c55e20', label: 'Excellent' },
  good:      { min: 60, color: '#3b82f6', bg: '#3b82f620', label: 'Good' },
  fair:      { min: 40, color: '#f59e0b', bg: '#f59e0b20', label: 'Fair' },
  weak:      { min: 0,  color: '#ef4444', bg: '#ef444420', label: 'Weak' },
};

export function getScoreTier(score) {
  if (score >= 80) return SCORE_TIERS.excellent;
  if (score >= 60) return SCORE_TIERS.good;
  if (score >= 40) return SCORE_TIERS.fair;
  return SCORE_TIERS.weak;
}

// DOM Selectors for X.com (centralized for easy updates when X changes DOM)
export const X_SELECTORS = {
  // Profile page display name
  profileUserName: '[data-testid="UserName"]',
  // Tweet/reply author
  tweetUserName: '[data-testid="User-Name"]',
  // Fallback: links to user profiles
  userLink: 'a[href^="/"][role="link"]',
  // Timeline container
  timeline: '[data-testid="primaryColumn"]',
  // Tweet containers
  tweet: 'article[data-testid="tweet"]',
};

// Message Types (background <-> content script protocol)
export const MSG = {
  GET_SCORE: 'GET_SCORE',
  GET_SCORES_BATCH: 'GET_SCORES_BATCH',
  CHECK_AUTH: 'CHECK_AUTH',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  AUTH_TOKENS: 'AUTH_TOKENS',
  SCORE_RESULT: 'SCORE_RESULT',
};

// Cache Configuration
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_CACHED_ENTRIES = 500;

// Throttle Configuration
export const FETCH_THROTTLE_MS = 200; // Min ms between API requests
export const BATCH_SIZE = 5; // Max concurrent requests
