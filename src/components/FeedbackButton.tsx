'use client';

import { useState } from 'react';

interface FeedbackButtonProps {
  className?: string;
}

type FeedbackType = 'bug' | 'idea' | 'other';

export default function FeedbackButton({
  className = ''
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: feedbackType,
          message: message.trim(),
          rating,
          url: window.location.href,
          category: 'general',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitted(true);

      // Reset after delay
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
        setRating(null);
        setFeedbackType('bug');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
        aria-label="Send feedback"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-white text-sm font-medium">Feedback</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={handleClose}
        />
      )}

      {/* Feedback Modal */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-[101] w-[360px] rounded-2xl shadow-2xl animate-slide-up"
          style={{
            background: 'rgba(15, 15, 15, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Send Feedback</h3>
                <p className="text-white/50 text-xs">Help us improve BrandOS</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {submitted ? (
            /* Success State */
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Thanks for your feedback!</h4>
              <p className="text-white/60 text-sm">We&apos;ll review it and use it to improve BrandOS.</p>
            </div>
          ) : (
            /* Form */
            <div className="p-4">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Feedback Type */}
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                  Type
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'bug', label: '🐛 Bug' },
                    { id: 'idea', label: '💡 Idea' },
                    { id: 'other', label: '💬 Other' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFeedbackType(type.id as FeedbackType)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-all ${
                        feedbackType === type.id
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    feedbackType === 'bug'
                      ? "Describe what happened and what you expected..."
                      : feedbackType === 'idea'
                      ? "What feature would make BrandOS better for you?"
                      : "What's on your mind?"
                  }
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-white/30 resize-none transition-colors"
                />
              </div>

              {/* Rating (optional) */}
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                  How&apos;s your experience? (optional)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(rating === star ? null : star)}
                      className={`p-2 rounded-lg transition-all ${
                        rating && rating >= star
                          ? 'text-yellow-400'
                          : 'text-white/20 hover:text-white/40'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || isSubmitting}
                className="w-full py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Send Feedback'}
              </button>

              <p className="text-center text-white/40 text-xs mt-3">
                Your feedback is saved and reviewed by our team
              </p>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
