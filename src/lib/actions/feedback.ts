'use server';

import { SubmitFeedbackSchema, type SubmitFeedbackInput } from '@/lib/schemas';
import { prisma } from '@/lib/db';
import { createServerSupabaseClient } from '@/lib/auth';

export async function submitFeedback(input: SubmitFeedbackInput) {
  const parsed = SubmitFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dbUserId: string | null = null;
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    });
    dbUserId = dbUser?.id ?? null;
  }

  const feedback = await prisma.feedback.create({
    data: {
      type: parsed.data.type,
      category: parsed.data.category,
      message: parsed.data.message,
      rating: parsed.data.rating,
      url: parsed.data.url,
      userId: dbUserId,
    },
  });

  return { success: true, id: feedback.id };
}
