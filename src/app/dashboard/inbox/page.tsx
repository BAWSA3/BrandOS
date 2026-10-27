import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import SupportInbox from '@/components/admin/SupportInbox';

// /dashboard/inbox — the support inbox: member feedback and replies to our
// emails, triaged and drafted by the support agent. Admins only (role
// "admin"); everyone else gets a 404.
export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signup?next=/dashboard/inbox');
  if (user.role !== 'admin') notFound();
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-white/50 text-sm mt-1 mb-6">
          Feedback and email replies. The agent drafts; nothing is sent until you press Send.
        </p>
        <SupportInbox />
      </div>
    </main>
  );
}
