'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Inbox, Mail, MessageSquare, RefreshCw, Send, Sparkles, X, Check } from 'lucide-react';
import { extractDraft } from '@/lib/support-text';

// /dashboard/inbox: feedback + email replies as threads. The support agent
// triages and drafts; the admin edits (or asks the agent to) and sends.
// Auth is the admin's session (role "admin"); adminKey is the script/key path.

interface ThreadSummary {
  id: string;
  source: 'feedback' | 'email';
  email: string | null;
  name: string | null;
  subject: string;
  status: 'open' | 'replied' | 'closed';
  category: string | null;
  priority: string | null;
  summary: string | null;
  hasDraft: boolean;
  lastMessageAt: string;
  messageCount: number;
}

interface ThreadMessage {
  id: string;
  direction: 'in' | 'out';
  body: string;
  createdAt: string;
}

interface ThreadDetail extends Omit<ThreadSummary, 'hasDraft' | 'messageCount'> {
  draft: string | null;
  messages: ThreadMessage[];
}

interface Member {
  handle: string | null;
  plan: string;
  founding: number | null;
  joined: string | null;
  score: number | null;
  archetype: string | null;
}

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const STATUS_TABS = ['open', 'replied', 'closed'] as const;

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300',
  medium: 'bg-yellow-500/15 text-yellow-300',
  low: 'bg-white/10 text-white/60',
};

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SupportInbox({ adminKey }: { adminKey?: string }) {
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('open');
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const api = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(`/api/admin/support${path}`, {
        ...init,
        headers: {
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
          ...(adminKey ? { Authorization: `Bearer ${adminKey}` } : {}),
        },
      }),
    [adminKey]
  );

  const loadThreads = useCallback(async () => {
    const res = await api(`?status=${status}`);
    if (!res.ok) {
      setError('Could not load the inbox. Is migration 048 applied?');
      return;
    }
    const data = await res.json();
    setError(null);
    setThreads(data.threads);
    setCounts(data.counts);
  }, [api, status]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-1 p-2 border-b border-white/10">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider ${
                status === s ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {s} {counts[s] ? `· ${counts[s]}` : ''}
            </button>
          ))}
          <button
            onClick={loadThreads}
            className="ml-auto p-1.5 rounded-lg text-white/50 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {error && <p className="p-4 text-sm text-red-400">{error}</p>}
        {!error && threads.length === 0 && (
          <div className="p-8 text-center text-white/40 text-sm">
            <Inbox className="w-6 h-6 mx-auto mb-2" />
            Nothing {status}.
          </div>
        )}
        <ul className="max-h-[70vh] overflow-y-auto">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 ${
                  selectedId === t.id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-white/50">
                  {t.source === 'email' ? (
                    <Mail className="w-3 h-3" />
                  ) : (
                    <MessageSquare className="w-3 h-3" />
                  )}
                  <span className="truncate">{t.name || t.email || 'anonymous'}</span>
                  <span className="ml-auto shrink-0">{when(t.lastMessageAt)}</span>
                </div>
                <p className="mt-1 text-sm text-white truncate">{t.summary || t.subject}</p>
                <div className="mt-1.5 flex gap-1.5">
                  {t.priority && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${PRIORITY_STYLE[t.priority]}`}
                    >
                      {t.priority}
                    </span>
                  )}
                  {t.category && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/60">
                      {t.category}
                    </span>
                  )}
                  {t.hasDraft && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0047FF]/30 text-blue-200">
                      draft ready
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedId ? (
        <ThreadPanel
          key={selectedId}
          id={selectedId}
          api={api}
          onChanged={loadThreads}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        <div className="hidden lg:flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white/40 text-sm">
          Pick a thread.
        </div>
      )}
    </div>
  );
}

function ThreadPanel({
  id,
  api,
  onChanged,
  onClose,
}: {
  id: string;
  api: (path: string, init?: RequestInit) => Promise<Response>;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<null | 'save' | 'redraft' | 'send' | 'status'>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await api(`/${id}`);
    if (!res.ok) return setNotice('Could not load this thread.');
    const data = await res.json();
    setThread(data.thread);
    setMember(data.member);
    setDraft(data.thread.draft ?? '');
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [chat]);

  const saveDraft = async () => {
    setBusy('save');
    const res = await api(`/${id}`, { method: 'PATCH', body: JSON.stringify({ draft }) });
    setBusy(null);
    setNotice(res.ok ? 'Draft saved.' : 'Could not save the draft.');
    onChanged();
  };

  const redraft = async () => {
    setBusy('redraft');
    setNotice(null);
    const res = await api(`/${id}/draft`, { method: 'POST' });
    setBusy(null);
    if (!res.ok) return setNotice((await res.json()).error ?? 'The agent failed.');
    await load();
    onChanged();
  };

  const setStatus = async (status: 'open' | 'closed') => {
    setBusy('status');
    await api(`/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setBusy(null);
    await load();
    onChanged();
  };

  const send = async () => {
    if (!thread?.email) return;
    if (!window.confirm(`Send this reply to ${thread.email}?`)) return;
    setBusy('send');
    setNotice(null);
    const res = await api(`/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body: draft }),
    });
    setBusy(null);
    if (!res.ok) return setNotice((await res.json()).error ?? 'Send failed.');
    setNotice(`Sent to ${thread.email}.`);
    setChat([]);
    await load();
    onChanged();
  };

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    const next: ChatMessage[] = [...chat, { role: 'user', content: text }];
    setChat([...next, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);
    try {
      const res = await api(`/${id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ messages: next, draft }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? 'The agent is unavailable.');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setChat([...next, { role: 'assistant', content: answer }]);
      }
    } catch (err) {
      setChat([
        ...next,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong.',
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  if (!thread)
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white/40 text-sm">
        {notice ?? 'Loading…'}
      </div>
    );

  const unresolved = /\[check:/i.test(draft);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col min-h-[70vh]">
      <div className="p-4 border-b border-white/10 flex items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white font-medium truncate">{thread.subject}</p>
          <p className="text-xs text-white/50 mt-0.5">
            {thread.name ? `${thread.name} · ` : ''}
            {thread.email ?? 'anonymous (cannot reply)'}
            {member && (
              <>
                {' · '}
                {member.handle ? `@${member.handle}` : 'no X connected'} · {member.plan}
                {member.founding
                  ? ` · Founding No. ${String(member.founding).padStart(4, '0')}`
                  : ''}
                {member.score != null ? ` · score ${member.score}` : ''}
              </>
            )}
          </p>
          {thread.summary && <p className="text-xs text-blue-200/80 mt-1">{thread.summary}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {thread.status === 'closed' ? (
            <button
              onClick={() => setStatus('open')}
              disabled={!!busy}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Reopen
            </button>
          ) : (
            <button
              onClick={() => setStatus('closed')}
              disabled={!!busy}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Close
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white"
            title="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto max-h-[32vh]">
        {thread.messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-xl p-3 text-sm whitespace-pre-wrap ${
              m.direction === 'in'
                ? 'bg-white/5 text-white/90 mr-10'
                : 'bg-[#0047FF]/20 text-blue-50 ml-10'
            }`}
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-1">
              {m.direction === 'in' ? 'member' : 'you'} · {when(m.createdAt)}
            </p>
            {m.body}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50">
            Reply
          </span>
          <button
            onClick={redraft}
            disabled={!!busy}
            className="text-xs text-white/60 hover:text-white flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            {busy === 'redraft' ? 'Drafting…' : 'Redraft'}
          </button>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={7}
          placeholder={
            thread.email
              ? 'The agent’s draft lands here. Edit freely.'
              : 'Anonymous feedback: no reply possible.'
          }
          className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-white/30"
        />
        {unresolved && (
          <p className="text-xs text-yellow-300">Resolve every [check: …] before sending.</p>
        )}
        {notice && <p className="text-xs text-white/60">{notice}</p>}
        <div className="flex gap-2 justify-end">
          <button
            onClick={saveDraft}
            disabled={!!busy}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10"
          >
            {busy === 'save' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            onClick={send}
            disabled={!!busy || !thread.email || !draft.trim() || unresolved}
            className="px-4 py-1.5 rounded-lg text-xs bg-[#0047FF] hover:bg-[#0047FF]/80 disabled:opacity-40 flex items-center gap-1.5 font-medium"
          >
            <Send className="w-3 h-3" />
            {busy === 'send' ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 flex-1 flex flex-col gap-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50">
          Ask the agent
        </span>
        <div className="space-y-2 overflow-y-auto max-h-[28vh]">
          {chat.map((m, i) => {
            const proposed = m.role === 'assistant' ? extractDraft(m.content) : null;
            const shown = m.content.replace(/<\/?draft>/g, '');
            return (
              <div
                key={i}
                className={`rounded-xl p-3 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-white/10 text-white ml-10'
                    : 'bg-black/30 text-white/85 mr-10'
                }`}
              >
                {shown || (streaming && i === chat.length - 1 ? '…' : '')}
                {proposed && !(streaming && i === chat.length - 1) && (
                  <button
                    onClick={() => setDraft(proposed)}
                    className="mt-2 block text-xs text-blue-300 hover:text-blue-200"
                  >
                    Use this as the reply ↑
                  </button>
                )}
              </div>
            );
          })}
          <div ref={chatEnd} />
        </div>
        <form onSubmit={ask} className="flex gap-2 mt-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="shorter · answer the billing part first · is this a known bug?"
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="px-3 py-2 rounded-lg text-xs bg-white/10 hover:bg-white/20 disabled:opacity-40"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
