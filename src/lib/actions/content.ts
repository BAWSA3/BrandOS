'use server';

import {
  CreateContentDraftSchema,
  UpdateContentDraftSchema,
  type CreateContentDraftInput,
  type UpdateContentDraftInput,
} from '@/lib/schemas';
import { prisma } from '@/lib/db';

export async function createContentDraft(input: CreateContentDraftInput) {
  const parsed = CreateContentDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const draft = await prisma.contentDraft.create({
    data: {
      content: parsed.data.content,
      contentType: parsed.data.contentType,
      tone: parsed.data.tone,
      brandId: parsed.data.brandId,
      scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : undefined,
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
      parentId: parsed.data.parentId,
    },
  });

  return { success: true, id: draft.id };
}

export async function updateContentDraft(id: string, input: UpdateContentDraftInput) {
  const parsed = UpdateContentDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const draft = await prisma.contentDraft.update({
    where: { id },
    data: {
      ...parsed.data,
      scheduledFor: parsed.data.scheduledFor === null
        ? null
        : parsed.data.scheduledFor
          ? new Date(parsed.data.scheduledFor)
          : undefined,
    },
  });

  return { success: true, id: draft.id };
}

export async function deleteContentDraft(id: string) {
  await prisma.contentDraft.delete({ where: { id } });
  return { success: true };
}
