'use client';

import { useMemo } from 'react';

interface XPostPreviewProps {
  content: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  verified?: boolean;
  mediaUrls?: string[];
  linkUrl?: string | null;
  timestamp?: string;
}

// Parse post content to highlight hashtags, mentions, and links
function parseContent(text: string) {
  const parts: { type: 'text' | 'hashtag' | 'mention' | 'link'; value: string }[] = [];
  const regex = /(#\w+)|(@\w+)|(https?:\/\/\S+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1]) parts.push({ type: 'hashtag', value: match[1] });
    else if (match[2]) parts.push({ type: 'mention', value: match[2] });
    else if (match[3]) parts.push({ type: 'link', value: match[3] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

export default function XPostPreview({
  content,
  displayName,
  username,
  avatarUrl,
  verified = false,
  mediaUrls = [],
  linkUrl,
  timestamp = 'just now',
}: XPostPreviewProps) {
  const parsedContent = useMemo(() => parseContent(content), [content]);

  // Image grid layout for 1-4 images
  const imageGrid = useMemo(() => {
    if (mediaUrls.length === 0) return null;
    const count = Math.min(mediaUrls.length, 4);

    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-2';
    return 'grid-cols-2';
  }, [mediaUrls.length]);

  return (
    <div
      className="rounded-xl overflow-hidden w-full"
      style={{
        background: '#000000',
        border: '1px solid #2F3336',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div className="p-3">
        {/* Header: Avatar, Name, Handle, Time */}
        <div className="flex items-start gap-2.5">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#2F3336]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#71767B] text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Post content */}
          <div className="flex-1 min-w-0">
            {/* Name row */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[15px] font-bold text-[#E7E9EA] leading-5 truncate">
                {displayName}
              </span>
              {verified && (
                <svg viewBox="0 0 22 22" className="w-[18px] h-[18px] shrink-0" fill="none">
                  <path
                    d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.855-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.69-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.636.433 1.221.878 1.69.47.446 1.055.752 1.69.883.635.13 1.294.083 1.902-.141.27.587.7 1.086 1.24 1.44s1.167.551 1.813.568c.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.223 1.26.272 1.894.14.636-.13 1.22-.436 1.69-.883.445-.47.749-1.054.88-1.69.131-.633.08-1.29-.139-1.896.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                    fill="#1D9BF0"
                  />
                </svg>
              )}
              <span className="text-[15px] text-[#71767B] leading-5">
                @{username}
              </span>
              <span className="text-[15px] text-[#71767B] leading-5">·</span>
              <span className="text-[15px] text-[#71767B] leading-5">
                {timestamp}
              </span>
            </div>

            {/* Post Text */}
            <div className="mt-1 text-[15px] leading-5 text-[#E7E9EA] whitespace-pre-wrap break-words">
              {parsedContent.map((part, i) => {
                if (part.type === 'hashtag' || part.type === 'mention') {
                  return (
                    <span key={i} className="text-[#1D9BF0]">
                      {part.value}
                    </span>
                  );
                }
                if (part.type === 'link') {
                  const display = part.value
                    .replace(/^https?:\/\//, '')
                    .replace(/\/$/, '');
                  return (
                    <span key={i} className="text-[#1D9BF0]">
                      {display.length > 30
                        ? display.slice(0, 30) + '...'
                        : display}
                    </span>
                  );
                }
                return <span key={i}>{part.value}</span>;
              })}
            </div>

            {/* Media Grid */}
            {mediaUrls.length > 0 && (
              <div
                className={`mt-3 grid ${imageGrid} gap-0.5 rounded-2xl overflow-hidden border border-[#2F3336]`}
              >
                {mediaUrls.slice(0, 4).map((url, i) => (
                  <div
                    key={i}
                    className={`relative ${
                      mediaUrls.length === 3 && i === 0
                        ? 'row-span-2'
                        : ''
                    }`}
                    style={{
                      aspectRatio:
                        mediaUrls.length === 1
                          ? '16/9'
                          : mediaUrls.length === 3 && i === 0
                          ? '1/1'
                          : '1/1',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Media ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Link preview card */}
            {linkUrl && mediaUrls.length === 0 && (
              <div className="mt-3 rounded-2xl border border-[#2F3336] overflow-hidden">
                <div className="bg-[#16181C] p-3">
                  <p className="text-[13px] text-[#71767B]">
                    {linkUrl
                      .replace(/^https?:\/\//, '')
                      .split('/')[0]}
                  </p>
                  <p className="text-[15px] text-[#E7E9EA] mt-0.5 line-clamp-2">
                    {linkUrl}
                  </p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-3 max-w-[350px]">
              {[
                {
                  icon: (
                    <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
                  ),
                  label: '0',
                },
                {
                  icon: (
                    <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
                  ),
                  label: '0',
                },
                {
                  icon: (
                    <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
                  ),
                  label: '0',
                },
                {
                  icon: (
                    <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z" />
                  ),
                  label: '',
                },
                {
                  icon: (
                    <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
                  ),
                  label: '',
                },
              ].map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 text-[#71767B] group cursor-pointer"
                >
                  <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center group-hover:bg-[#1D9BF0]/10 transition-colors">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-[18px] h-[18px] fill-current group-hover:text-[#1D9BF0] transition-colors"
                    >
                      {action.icon}
                    </svg>
                  </div>
                  {action.label && (
                    <span className="text-[13px] group-hover:text-[#1D9BF0] transition-colors">
                      {action.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Three dot menu */}
          <div className="shrink-0 mt-0.5">
            <svg
              viewBox="0 0 24 24"
              className="w-[18px] h-[18px] fill-[#71767B]"
            >
              <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
            </svg>
          </div>
        </div>

        {/* View count */}
        <div className="mt-3 pt-3 border-t border-[#2F3336]">
          <span className="text-[13px] text-[#71767B]">
            <span className="font-bold text-[#E7E9EA]">0</span> Views
          </span>
        </div>
      </div>
    </div>
  );
}
