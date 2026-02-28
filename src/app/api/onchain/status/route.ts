import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

async function getAuthUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;

  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

/**
 * GET /api/onchain/status
 *
 * Returns a summary of all onchain attestations for the current user,
 * grouped by type with counts and latest entries.
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [brandDna, contentChecks, brandScores, total] = await Promise.all([
      prisma.onchainAttestation.findMany({
        where: { userId: user.id, attestationType: 'brand-dna' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.onchainAttestation.findMany({
        where: { userId: user.id, attestationType: 'content-check' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.onchainAttestation.findMany({
        where: { userId: user.id, attestationType: 'brand-score' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.onchainAttestation.count({
        where: { userId: user.id },
      }),
    ]);

    const formatAttestations = (records: typeof brandDna) =>
      records.map((a) => ({
        uid: a.uid,
        txHash: a.txHash,
        chain: a.chain,
        explorerUrl: a.explorerUrl,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
        createdAt: a.createdAt,
      }));

    return NextResponse.json({
      totalAttestations: total,
      walletAddress: user.walletAddress,
      brandDna: {
        count: brandDna.length,
        latest: formatAttestations(brandDna),
      },
      contentChecks: {
        count: contentChecks.length,
        latest: formatAttestations(contentChecks),
      },
      brandScores: {
        count: brandScores.length,
        latest: formatAttestations(brandScores),
      },
    });
  } catch (error) {
    console.error('[Onchain Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onchain status' },
      { status: 500 }
    );
  }
}
