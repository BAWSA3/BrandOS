import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import BrainstormStudio from '@/components/studio/BrainstormStudio';

// /dashboard/studio?post=<PostScore id>&s=<suggestion index>
// "Build on this" from a post's Next-time suggestion: the studio room as the
// brainstorm workspace (src/components/studio/BrainstormStudio.tsx).
export const dynamic = 'force-dynamic';

export default async function StudioBrainstormPage({
  searchParams,
}: {
  searchParams: Promise<{ post?: string; s?: string }>;
}) {
  // Parked for the launch (docs/LAUNCH-PLAN.md): the workstation stays hidden.
  if (process.env.NEXT_PUBLIC_SHOW_WORKSTATION !== 'true') redirect('/dashboard');
  const user = await getCurrentUser();
  if (!user) redirect('/signup?next=/dashboard');
  const q = await searchParams;
  const postId = (q.post ?? '').slice(0, 64);
  const post = postId
    ? await prisma.postScore
        .findFirst({
          where: { id: postId, userId: user.id },
          select: { id: true, excerpt: true, fit: true, breakdown: true },
        })
        .catch(() => null)
    : null;
  const sharpen = (post?.breakdown as { sharpen?: unknown } | null)?.sharpen;
  const suggestions = Array.isArray(sharpen)
    ? sharpen.filter((t): t is string => typeof t === 'string')
    : [];

  if (!post || !suggestions.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F2EFE8] px-6 text-center">
        <p className="text-[15px]">
          That post isn&apos;t on your dashboard (or has no suggestions yet).
        </p>
        <Link
          href="/dashboard"
          className="bg-[#0047FF] px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-white"
          style={{ fontFamily: "'VCR OSD Mono', monospace" }}
        >
          Back to your dashboard
        </Link>
      </main>
    );
  }

  return (
    <BrainstormStudio
      mode="live"
      post={{ id: post.id, excerpt: post.excerpt, fit: post.fit }}
      suggestions={suggestions}
      initialIndex={Number(q.s) || 0}
    />
  );
}
