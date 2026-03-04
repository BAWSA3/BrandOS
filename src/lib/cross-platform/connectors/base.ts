// =============================================================================
// BASE PLATFORM CONNECTOR — Abstract interface all connectors implement
// =============================================================================

import type { ContentItem, SocialPlatform, PlatformConnection } from '../types';

export interface PlatformConnectorConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}

export interface PlatformProfile {
  platformUserId: string;
  platformUsername: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  profileUrl?: string;
  raw: Record<string, unknown>;
}

/**
 * Abstract connector interface for each social platform.
 */
export interface PlatformConnector {
  platform: SocialPlatform;

  /** Generate the OAuth authorization URL for the user to grant access. */
  getAuthUrl(state: string): string;

  /** Exchange an auth code for tokens. */
  exchangeCode(code: string): Promise<OAuthTokens>;

  /** Refresh an expired access token. */
  refreshToken(refreshToken: string): Promise<OAuthTokens>;

  /** Fetch the authenticated user's profile. */
  fetchProfile(accessToken: string): Promise<PlatformProfile>;

  /** Fetch recent content from the authenticated user's account. */
  fetchContent(accessToken: string, options?: {
    maxResults?: number;
    since?: string;
  }): Promise<ContentItem[]>;
}

/**
 * Registry of all available platform connectors.
 */
const connectorRegistry = new Map<SocialPlatform, PlatformConnector>();

export function registerConnector(connector: PlatformConnector): void {
  connectorRegistry.set(connector.platform, connector);
}

export function getConnector(platform: SocialPlatform): PlatformConnector | null {
  return connectorRegistry.get(platform) ?? null;
}

export function getAvailableConnectors(): SocialPlatform[] {
  return Array.from(connectorRegistry.keys());
}
