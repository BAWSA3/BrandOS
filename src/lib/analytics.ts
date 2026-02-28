/**
 * BrandOS Beta Analytics
 * 
 * Dual-tracks to Vercel Analytics (performance) and PostHog (product behavior).
 * Vercel Analytics: page views, web vitals, speed metrics.
 * PostHog: funnels, feature usage, session replays, user identification.
 */

import { track as vercelTrack } from '@vercel/analytics';
import posthog from 'posthog-js';

// =============================================================================
// Types
// =============================================================================

export type BetaEvent = 
  // Onboarding & Setup
  | 'beta_onboarding_started'
  | 'beta_onboarding_completed'
  | 'beta_onboarding_skipped'
  | 'beta_template_selected'
  | 'beta_brand_imported'
  
  // Core Features
  | 'beta_content_checked'
  | 'beta_content_generated'
  | 'beta_brand_exported'
  | 'beta_brand_shared'
  
  // Engagement
  | 'beta_feedback_opened'
  | 'beta_feedback_submitted'
  | 'beta_phase_visited'
  | 'beta_feature_used'
  
  // Errors & Issues
  | 'beta_error_encountered'
  | 'beta_rate_limit_hit';

export interface EventProperties {
  // Common properties
  phase?: string;
  feature?: string;
  source?: string;
  
  // Check/Generate specific
  score?: number;
  contentType?: string;
  
  // Error specific
  errorType?: string;
  errorMessage?: string;
  
  // Other
  templateId?: string;
  brandName?: string;
  [key: string]: string | number | boolean | undefined;
}

// =============================================================================
// Analytics Functions
// =============================================================================

/**
 * Track a beta-specific event
 */
export function trackBetaEvent(event: BetaEvent, properties?: EventProperties) {
  try {
    const enriched = {
      ...properties,
      beta_version: '0.2.0',
      timestamp: new Date().toISOString(),
    };

    vercelTrack(event, enriched);

    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture(event, enriched);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, properties);
    }
  } catch (error) {
    console.warn('[Analytics] Failed to track event:', error);
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

export const analytics = {
  // Onboarding
  onboardingStarted: () => trackBetaEvent('beta_onboarding_started'),
  onboardingCompleted: () => trackBetaEvent('beta_onboarding_completed'),
  onboardingSkipped: () => trackBetaEvent('beta_onboarding_skipped'),
  templateSelected: (templateId: string) => 
    trackBetaEvent('beta_template_selected', { templateId }),
  brandImported: (source: string) => 
    trackBetaEvent('beta_brand_imported', { source }),

  // Core Features
  contentChecked: (score: number, contentType?: string) => 
    trackBetaEvent('beta_content_checked', { score, contentType }),
  contentGenerated: (contentType: string) => 
    trackBetaEvent('beta_content_generated', { contentType }),
  brandExported: () => trackBetaEvent('beta_brand_exported'),
  brandShared: () => trackBetaEvent('beta_brand_shared'),

  // Engagement
  feedbackOpened: () => trackBetaEvent('beta_feedback_opened'),
  feedbackSubmitted: (type: string) => 
    trackBetaEvent('beta_feedback_submitted', { feedbackType: type }),
  phaseVisited: (phase: string) => 
    trackBetaEvent('beta_phase_visited', { phase }),
  featureUsed: (feature: string) => 
    trackBetaEvent('beta_feature_used', { feature }),

  // Errors
  errorEncountered: (errorType: string, errorMessage?: string) => 
    trackBetaEvent('beta_error_encountered', { errorType, errorMessage }),
  rateLimitHit: (endpoint: string) => 
    trackBetaEvent('beta_rate_limit_hit', { endpoint }),
};

export default analytics;
