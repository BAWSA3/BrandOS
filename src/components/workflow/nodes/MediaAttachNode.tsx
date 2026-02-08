'use client';

import { memo, useRef, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Image as ImageIcon, Link2, X } from 'lucide-react';
import BaseNode from './BaseNode';
import { useWorkflowStore } from '../useWorkflowStore';

function MediaAttachNode(_props: NodeProps) {
  const { mediaUrls, linkUrl, addMediaUrl, removeMediaUrl, setLinkUrl } =
    useWorkflowStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        addMediaUrl(url);
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addMediaUrl]
  );

  const hasMedia = mediaUrls.length > 0 || !!linkUrl;

  return (
    <BaseNode
      nodeType="mediaAttach"
      title="Media"
      subtitle={hasMedia ? `${mediaUrls.length} file(s)` : 'Optional'}
      outputs={[{ id: 'media-out', color: '#F472B6' }]}
      isActive={hasMedia}
    >
      <div className="space-y-3">
        {/* Image previews */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {mediaUrls.map((url, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-md overflow-hidden border border-white/[0.06] group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeMediaUrl(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {mediaUrls.length < 4 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-white/10 text-[11px] text-white/40 hover:text-white/60 hover:border-white/20 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            {mediaUrls.length === 0 ? 'Add Image' : 'Add More'}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Link input */}
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input
            type="url"
            value={linkUrl || ''}
            onChange={(e) => setLinkUrl(e.target.value || null)}
            placeholder="Paste a link..."
            className="flex-1 bg-transparent border-b border-white/[0.06] py-1 text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-[#F472B6]/40 transition-colors"
          />
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(MediaAttachNode);
