import { NextResponse } from 'next/server';

// Shared clamped-JSON-body reader for API routes. Every hardened route needs
// the same pipeline (read text → size cap → parse → 413/400); keeping it here
// stops the copies from drifting (they already had: brands 200k/400,
// check 100k/413, history 150k/413).

type ReadJsonResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: NextResponse };

export async function readJsonBody(request: Request, maxBytes: number): Promise<ReadJsonResult> {
  const raw = await request.text();
  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Request too large' }, { status: 413 }),
    };
  }
  try {
    const body = JSON.parse(raw);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
      };
    }
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }
}
