// =============================================================================
// LINKEDIN CONNECTOR — LinkedIn API v2
// =============================================================================

import type { PlatformConnector, OAuthTokens, PlatformProfile, PlatformConnectorConfig } from './base';
import type { ContentItem } from '../types';
import { normalizeLinkedInPost } from '../normalizers';

export class LinkedInConnector implements PlatformConnector {
  platform = 'linkedin' as const;
  private config: PlatformConnectorConfig;

  constructor(config?: Partial<PlatformConnectorConfig>) {
    this.config = {
      clientId: config?.clientId ?? process.env.LINKEDIN_CLIENT_ID ?? '',
      clientSecret: config?.clientSecret ?? process.env.LINKEDIN_CLIENT_SECRET ?? '',
      redirectUri: config?.redirectUri ?? process.env.LINKEDIN_REDIRECT_URI ?? '',
    };
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'openid profile r_liteprofile r_basicprofile w_member_social',
      state,
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${res.status}`);
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!res.ok) throw new Error(`LinkedIn token refresh failed: ${res.status}`);
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in,
    };
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`LinkedIn profile fetch failed: ${res.status}`);
    const data = await res.json();

    return {
      platformUserId: data.sub,
      platformUsername: data.email ?? data.sub,
      displayName: data.name ?? `${data.given_name ?? ''} ${data.family_name ?? ''}`.trim(),
      avatarUrl: data.picture,
      bio: data.headline,
      profileUrl: `https://linkedin.com/in/${data.vanityName ?? data.sub}`,
      raw: data,
    };
  }

  async fetchContent(
    accessToken: string,
    options?: { maxResults?: number; since?: string }
  ): Promise<ContentItem[]> {
    // LinkedIn's Posts API (v2) for fetching member posts
    const res = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:me)&count=${options?.maxResults ?? 25}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!res.ok) {
      console.error(`LinkedIn posts fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const posts = data.elements ?? [];

    return posts.map((post: any) => {
      const specificContent = post.specificContent?.['com.linkedin.ugc.ShareContent'];
      const text = specificContent?.shareCommentary?.text ?? '';
      const media = specificContent?.media ?? [];
      const mediaUrls = media.map((m: any) => m.originalUrl).filter(Boolean);

      return normalizeLinkedInPost({
        id: post.id ?? `li-${Date.now()}`,
        text,
        createdAt: new Date(post.created?.time ?? Date.now()).toISOString(),
        likeCount: post.socialMetadata?.totalLikes ?? 0,
        commentCount: post.socialMetadata?.totalComments ?? 0,
        shareCount: post.socialMetadata?.totalShares ?? 0,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });
    });
  }
}
