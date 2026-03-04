// =============================================================================
// THREADS CONNECTOR — Meta Threads API
// =============================================================================

import type { PlatformConnector, OAuthTokens, PlatformProfile, PlatformConnectorConfig } from './base';
import type { ContentItem } from '../types';
import { normalizeThreadsPost } from '../normalizers';

export class ThreadsConnector implements PlatformConnector {
  platform = 'threads' as const;
  private config: PlatformConnectorConfig;

  constructor(config?: Partial<PlatformConnectorConfig>) {
    this.config = {
      clientId: config?.clientId ?? process.env.THREADS_CLIENT_ID ?? '',
      clientSecret: config?.clientSecret ?? process.env.THREADS_CLIENT_SECRET ?? '',
      redirectUri: config?.redirectUri ?? process.env.THREADS_REDIRECT_URI ?? '',
    };
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'threads_basic,threads_content_publish,threads_manage_insights',
      response_type: 'code',
      state,
    });
    return `https://threads.net/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const res = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code,
      }),
    });

    if (!res.ok) throw new Error(`Threads token exchange failed: ${res.status}`);
    const shortLived = await res.json();

    // Exchange for long-lived token
    const longLivedRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${this.config.clientSecret}&access_token=${shortLived.access_token}`
    );

    if (longLivedRes.ok) {
      const longLived = await longLivedRes.json();
      return {
        accessToken: longLived.access_token,
        expiresIn: longLived.expires_in,
      };
    }

    return {
      accessToken: shortLived.access_token,
      expiresIn: 3600,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch(
      `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${refreshToken}`
    );

    if (!res.ok) throw new Error(`Threads token refresh failed: ${res.status}`);
    const data = await res.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    const res = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${accessToken}`
    );

    if (!res.ok) throw new Error(`Threads profile fetch failed: ${res.status}`);
    const data = await res.json();

    return {
      platformUserId: data.id,
      platformUsername: data.username,
      displayName: data.name ?? data.username,
      avatarUrl: data.threads_profile_picture_url,
      bio: data.threads_biography,
      profileUrl: `https://threads.net/@${data.username}`,
      raw: data,
    };
  }

  async fetchContent(
    accessToken: string,
    options?: { maxResults?: number }
  ): Promise<ContentItem[]> {
    const limit = Math.min(options?.maxResults ?? 25, 100);
    const res = await fetch(
      `https://graph.threads.net/v1.0/me/threads?fields=id,text,timestamp,media_url,media_type,shortcode,is_quote_post&limit=${limit}&access_token=${accessToken}`
    );

    if (!res.ok) {
      console.error(`Threads posts fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.data ?? []).map((post: any) =>
      normalizeThreadsPost({
        id: post.id,
        text: post.text,
        timestamp: post.timestamp,
        mediaUrls: post.media_url ? [post.media_url] : undefined,
      })
    );
  }
}
