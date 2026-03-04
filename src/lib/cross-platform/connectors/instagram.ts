// =============================================================================
// INSTAGRAM CONNECTOR — Meta Graph API (Instagram Business / Creator)
// =============================================================================

import type { PlatformConnector, OAuthTokens, PlatformProfile, PlatformConnectorConfig } from './base';
import type { ContentItem } from '../types';
import { normalizeInstagramPost } from '../normalizers';

export class InstagramConnector implements PlatformConnector {
  platform = 'instagram' as const;
  private config: PlatformConnectorConfig;

  constructor(config?: Partial<PlatformConnectorConfig>) {
    this.config = {
      clientId: config?.clientId ?? process.env.INSTAGRAM_CLIENT_ID ?? '',
      clientSecret: config?.clientSecret ?? process.env.INSTAGRAM_CLIENT_SECRET ?? '',
      redirectUri: config?.redirectUri ?? process.env.INSTAGRAM_REDIRECT_URI ?? '',
    };
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'instagram_basic,instagram_manage_insights',
      response_type: 'code',
      state,
    });
    return `https://www.instagram.com/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const res = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code,
      }),
    });

    if (!res.ok) throw new Error(`Instagram token exchange failed: ${res.status}`);
    const shortLived = await res.json();

    // Exchange for long-lived token
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${this.config.clientSecret}&access_token=${shortLived.access_token}`
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
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`
    );

    if (!res.ok) throw new Error(`Instagram token refresh failed: ${res.status}`);
    const data = await res.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    const res = await fetch(
      `https://graph.instagram.com/me?fields=id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`
    );

    if (!res.ok) throw new Error(`Instagram profile fetch failed: ${res.status}`);
    const data = await res.json();

    return {
      platformUserId: data.id,
      platformUsername: data.username,
      displayName: data.name ?? data.username,
      avatarUrl: data.profile_picture_url,
      bio: data.biography,
      followerCount: data.followers_count,
      followingCount: data.follows_count,
      postCount: data.media_count,
      profileUrl: `https://instagram.com/${data.username}`,
      raw: data,
    };
  }

  async fetchContent(
    accessToken: string,
    options?: { maxResults?: number }
  ): Promise<ContentItem[]> {
    const limit = Math.min(options?.maxResults ?? 25, 100);
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink,children{media_url}&limit=${limit}&access_token=${accessToken}`
    );

    if (!res.ok) {
      console.error(`Instagram media fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.data ?? []).map((post: any) =>
      normalizeInstagramPost({
        id: post.id,
        caption: post.caption,
        mediaType: post.media_type,
        mediaUrl: post.media_url,
        thumbnailUrl: post.thumbnail_url,
        timestamp: post.timestamp,
        likeCount: post.like_count,
        commentsCount: post.comments_count,
        permalink: post.permalink,
        children: post.children?.data,
      })
    );
  }
}
