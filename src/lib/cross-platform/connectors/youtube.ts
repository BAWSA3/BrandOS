// =============================================================================
// YOUTUBE CONNECTOR — YouTube Data API v3
// =============================================================================

import type { PlatformConnector, OAuthTokens, PlatformProfile, PlatformConnectorConfig } from './base';
import type { ContentItem } from '../types';
import { normalizeYouTubeVideo } from '../normalizers';
import { fetchYouTubeCaptions } from '../transcript-engine';

export class YouTubeConnector implements PlatformConnector {
  platform = 'youtube' as const;
  private config: PlatformConnectorConfig;

  constructor(config?: Partial<PlatformConnectorConfig>) {
    this.config = {
      clientId: config?.clientId ?? process.env.YOUTUBE_CLIENT_ID ?? '',
      clientSecret: config?.clientSecret ?? process.env.YOUTUBE_CLIENT_SECRET ?? '',
      redirectUri: config?.redirectUri ?? process.env.YOUTUBE_REDIRECT_URI ?? '',
    };
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) throw new Error(`YouTube token exchange failed: ${res.status}`);
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) throw new Error(`YouTube token refresh failed: ${res.status}`);
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresIn: data.expires_in,
    };
  }

  async fetchProfile(accessToken: string): Promise<PlatformProfile> {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) throw new Error(`YouTube profile fetch failed: ${res.status}`);
    const data = await res.json();
    const channel = data.items?.[0];

    if (!channel) throw new Error('No YouTube channel found');

    return {
      platformUserId: channel.id,
      platformUsername: channel.snippet?.customUrl ?? channel.id,
      displayName: channel.snippet?.title ?? '',
      avatarUrl: channel.snippet?.thumbnails?.default?.url,
      bio: channel.snippet?.description,
      followerCount: parseInt(channel.statistics?.subscriberCount ?? '0', 10),
      postCount: parseInt(channel.statistics?.videoCount ?? '0', 10),
      profileUrl: `https://youtube.com/${channel.snippet?.customUrl ?? 'channel/' + channel.id}`,
      raw: channel,
    };
  }

  async fetchContent(
    accessToken: string,
    options?: { maxResults?: number; since?: string }
  ): Promise<ContentItem[]> {
    const maxResults = Math.min(options?.maxResults ?? 25, 50);

    // Step 1: Get channel's upload playlist
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!channelRes.ok) throw new Error(`YouTube channel fetch failed: ${channelRes.status}`);
    const channelData = await channelRes.json();
    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) return [];

    // Step 2: List videos from uploads playlist
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!playlistRes.ok) return [];
    const playlistData = await playlistRes.json();
    const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId) ?? [];

    if (videoIds.length === 0) return [];

    // Step 3: Get video details (statistics, descriptions)
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!videoRes.ok) return [];
    const videoData = await videoRes.json();

    // Step 4: Normalize to ContentItems, optionally fetch transcripts
    const items: ContentItem[] = [];

    for (const video of videoData.items ?? []) {
      let transcript: string | undefined;
      try {
        const transcriptResult = await fetchYouTubeCaptions(video.id);
        transcript = transcriptResult?.text;
      } catch {
        // Non-blocking — transcript is optional
      }

      items.push(
        normalizeYouTubeVideo({
          id: video.id,
          title: video.snippet?.title ?? '',
          description: video.snippet?.description ?? '',
          publishedAt: video.snippet?.publishedAt ?? '',
          thumbnailUrl: video.snippet?.thumbnails?.high?.url,
          viewCount: parseInt(video.statistics?.viewCount ?? '0', 10),
          likeCount: parseInt(video.statistics?.likeCount ?? '0', 10),
          commentCount: parseInt(video.statistics?.commentCount ?? '0', 10),
          duration: video.contentDetails?.duration,
          transcript,
          channelTitle: video.snippet?.channelTitle,
        })
      );
    }

    return items;
  }
}
