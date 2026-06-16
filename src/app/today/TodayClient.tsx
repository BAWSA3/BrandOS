'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  briefId: string;
  initiallyCompleted: boolean;
}

export default function TodayClient({ briefId, initiallyCompleted }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setError(null);
    setCompleted(true);
    try {
      const res = await fetch('/api/today/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setCompleted(initiallyCompleted);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (completed) {
    return (
      <p className="text-xs uppercase tracking-wider text-green-400 pt-2">
        ✓ done · come back tomorrow
      </p>
    );
  }

  return (
    <div className="pt-2 space-y-2">
      <button
        type="button"
        onClick={handleComplete}
        disabled={pending}
        className="px-4 py-2 border border-white text-sm hover:bg-white hover:text-black transition disabled:opacity-50"
      >
        {pending ? 'marking…' : 'mark done →'}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
