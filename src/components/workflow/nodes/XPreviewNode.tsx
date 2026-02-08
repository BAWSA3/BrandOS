'use client';

import { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Copy, Send, Loader2, ExternalLink } from 'lucide-react';
import BaseNode from './BaseNode';
import XPostPreview from '../XPostPreview';
import { useWorkflowStore } from '../useWorkflowStore';
import { useAuth } from '@/hooks/useAuth';

function XPreviewNode(_props: NodeProps) {
  const {
    editedContent,
    mediaUrls,
    linkUrl,
    isPosting,
    postResult,
    setIsPosting,
    setPostError,
    setPostResult,
  } = useWorkflowStore();

  const { user } = useAuth();

  const displayName = user?.name || user?.xUsername || 'Your Name';
  const username = user?.xUsername || 'username';
  const avatarUrl = user?.avatar || '';

  const hasContent = editedContent.length > 0;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(editedContent);
  }, [editedContent]);

  const handlePost = useCallback(async () => {
    if (!editedContent.trim()) return;

    setIsPosting(true);
    setPostError(null);
    setPostResult(null);

    try {
      const res = await fetch('/api/post-to-x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editedContent,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setPostError(result.error || 'Failed to post');
        return;
      }

      setPostResult(result);
    } catch {
      setPostError('Network error');
    } finally {
      setIsPosting(false);
    }
  }, [editedContent, setIsPosting, setPostError, setPostResult]);

  return (
    <BaseNode
      nodeType="xPreview"
      title="Preview"
      subtitle="X / Twitter"
      inputs={[{ id: 'preview-in', color: '#C0C0C0' }]}
      isActive={hasContent}
      wide
    >
      {hasContent ? (
        <div className="space-y-3">
          {/* X Post Preview */}
          <XPostPreview
            content={editedContent}
            displayName={displayName}
            username={username}
            avatarUrl={avatarUrl}
            verified={false}
            mediaUrls={mediaUrls}
            linkUrl={linkUrl}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-[11px] text-white/60 hover:text-white/80 hover:border-white/15 transition-all"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
            <button
              onClick={handlePost}
              disabled={isPosting || !!postResult}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                postResult
                  ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20'
                  : 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] disabled:opacity-50'
              }`}
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Posting...
                </>
              ) : postResult ? (
                <>
                  <ExternalLink className="w-3 h-3" />
                  Posted!
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Post to X
                </>
              )}
            </button>
          </div>

          {/* Post result link */}
          {postResult && (
            <a
              href={postResult.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] text-[#1D9BF0] hover:underline"
            >
              View on X →
            </a>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white/20">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <p className="text-[11px] text-white/25">
            Your post preview will appear here
          </p>
        </div>
      )}
    </BaseNode>
  );
}

export default memo(XPreviewNode);
