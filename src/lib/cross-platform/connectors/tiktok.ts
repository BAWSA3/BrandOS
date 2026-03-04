// =============================================================================
// TIKTOK CONNECTOR — TikTok for Developers API
// =============================================================================

import type { PlatformConnector, OAuthTokens, PlatformProfile, PlatformConnectorConfig } from './base';
import type { ContentItem } from '../types';
import { normalizeTikTokVideo } from '../normalizers';

export class TikTokConnector implements PlatformConnector {
  platform = 'tiktok' as const;
  private config: PlatformConnectorConfig;

  constructor(config?: Partial<PlatformConnectorConfig>) {
    this.config = {
      clientId: config?.clientId ?? process.env.TIKTOK_CLIENT_KEY ?? '',
      clientSecret: config?.clientSecret ?? process.env.TIKTOK_CLIENT_SECRET ?? '',
      redirectUri: config?.redirectUri ?? process.env.TIKTOK_REDIRECT_URI ?? '',
    };
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_key: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'user.info.basic,video.list',
      response_type: 'code',
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!res.ok) throw new Error(`TikTok token exchange failed: ${res.status}`);
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) throw new Error(`TikTok token refresh failed: ${res.status}`);
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in,
    };
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    const res = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,following_count,video_count,bio_description',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) throw new Error(`TikTok profile fetch failed: ${res.status}`);
    const data = await res.json();
    const user = data.data?.user;

    if (!user) throw new Error('No TikTok user data returned');

    return {
      platformUserId: user.open_id,
      platformUsername: user.username ?? user.display_name,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: user.bio_description,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      postCount: user.video_count,
      profileUrl: `https://tiktok.com/@${user.username}`,
      raw: user,
    };
  }

  async fetchContent(
    accessToken: string,
    options?: { maxResults?: number }
  ): Promise<ContentItem[]> {
    const maxCount = Math.min(options?.maxResults ?? 20, 20);
    const res = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time,cover_image_url,share_count,view_count,like_count,comment_count',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: maxCount }),
      }
    );

    if (!res.ok) {
      console.error(`TikTok video list fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.data?.videos ?? []).map((video: any) =>
      normalizeTikTokVideo({
        id: video.id,
        description: video.video_description ?? video.title ?? '',
        createTime: video.create_time,
        diggCount: video.like_count,
        commentCount: video.comment_count,
        shareCount: video.share_count,
        playCount: video.view_count,
        coverImageUrl: video.cover_image_url,
      })
    );
  }
}
