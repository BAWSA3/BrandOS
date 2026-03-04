// =============================================================================
// PLATFORM CONNECTORS — Registry and initialization
// =============================================================================

export type { PlatformConnector, OAuthTokens, PlatformProfile, PlatformConnectorConfig } from './base';
export { registerConnector, getConnector, getAvailableConnectors } from './base';

export { YouTubeConnector } from './youtube';
export { LinkedInConnector } from './linkedin';
export { InstagramConnector } from './instagram';
export { TikTokConnector } from './tiktok';
export { ThreadsConnector } from './threads';

import { registerConnector } from './base';
import { YouTubeConnector } from './youtube';
import { LinkedInConnector } from './linkedin';
import { InstagramConnector } from './instagram';
import { TikTokConnector } from './tiktok';
import { ThreadsConnector } from './threads';

let initialized = false;

/**
 * Initialize all platform connectors. Safe to call multiple times.
 * Only registers connectors whose env vars are present.
 */
export function initializeConnectors(): void {
  if (initialized) return;

  if (process.env.YOUTUBE_CLIENT_ID) {
    registerConnector(new YouTubeConnector());
  }

  if (process.env.LINKEDIN_CLIENT_ID) {
    registerConnector(new LinkedInConnector());
  }

  if (process.env.INSTAGRAM_CLIENT_ID) {
    registerConnector(new InstagramConnector());
  }

  if (process.env.TIKTOK_CLIENT_KEY) {
    registerConnector(new TikTokConnector());
  }

  if (process.env.THREADS_CLIENT_ID) {
    registerConnector(new ThreadsConnector());
  }

  initialized = true;
}
