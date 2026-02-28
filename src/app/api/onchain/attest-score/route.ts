import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashBrandScore } from '@/lib/onchain/hash';
import { createAttestation } from '@/lib/onchain/eas';
import { BrandScoreAttestation } from '@/lib/onchain/types';

/**
 * POST /api/onchain/attest-score
 *
 * Creates an onchain attestation for a Brand Score result.
 * This is a public endpoint (no auth required) — anyone who completes
 * the brand score journey can mint their score onchain.
 *
 * Body: {
 *   username: string,
 *   overallScore: number,
 *   phases: { define: { score }, check: { score }, generate: { score }, scale: { score } },
 *   archetype: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, overallScore, phases, archetype } = body;

    if (!username || overallScore === undefined || !phases || !archetype) {
      return NextResponse.json(
        { error: 'username, overallScore, phases, and archetype are required' },
        { status: 400 }
      );
    }

    const scoreHash = await hashBrandScore({ username, overallScore, phases });

    // Check if this exact score was already attested
    const existing = await prisma.onchainAttestation.findFirst({
      where: {
        attestationType: 'brand-score',
        dataHash: scoreHash,
      },
    });

    if (existing) {
      return NextResponse.json({
        attestation: {
          uid: existing.uid,
          txHash: existing.txHash,
          explorerUrl: existing.explorerUrl,
          dataHash: existing.dataHash,
          createdAt: existing.createdAt,
          alreadyExists: true,
        },
      });
    }

    const attestationData: BrandScoreAttestation = {
      username,
      overallScore: Math.round(overallScore),
      defineScore: Math.round(phases.define?.score || 0),
      checkScore: Math.round(phases.check?.score || 0),
      generateScore: Math.round(phases.generate?.score || 0),
      scaleScore: Math.round(phases.scale?.score || 0),
      archetype,
      timestamp: Math.floor(Date.now() / 1000),
    };

    const result = await createAttestation('brand-score', attestationData);

    if (!result.success || !result.attestation) {
      return NextResponse.json(
        { error: result.error || 'Attestation failed' },
        { status: 500 }
      );
    }

    // Look up user by X username to link the attestation
    const user = await prisma.user.findFirst({
      where: { xUsername: username },
    });

    const record = await prisma.onchainAttestation.create({
      data: {
        uid: result.attestation.uid,
        txHash: result.attestation.txHash,
        chain: result.attestation.chain,
        attestationType: 'brand-score',
        schemaUid: result.attestation.schemaUid,
        attester: result.attestation.attester,
        recipient: result.attestation.recipient,
        dataHash: scoreHash,
        metadata: JSON.stringify({
          username,
          overallScore: Math.round(overallScore),
          defineScore: Math.round(phases.define?.score || 0),
          checkScore: Math.round(phases.check?.score || 0),
          generateScore: Math.round(phases.generate?.score || 0),
          scaleScore: Math.round(phases.scale?.score || 0),
          archetype,
        }),
        explorerUrl: result.attestation.explorerUrl,
        userId: user?.id || null,
      },
    });

    return NextResponse.json({
      attestation: {
        uid: record.uid,
        txHash: record.txHash,
        explorerUrl: record.explorerUrl,
        dataHash: record.dataHash,
        score: Math.round(overallScore),
        username,
        archetype,
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    console.error('[Attest Score] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create score attestation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onchain/attest-score?username=xxx
 *
 * Returns all score attestations for a username.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { xUsername: username },
    });

    // Search by userId if we have one, otherwise search metadata
    const attestations = user
      ? await prisma.onchainAttestation.findMany({
          where: { userId: user.id, attestationType: 'brand-score' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      : await prisma.onchainAttestation.findMany({
          where: {
            attestationType: 'brand-score',
            metadata: { contains: `"username":"${username}"` },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

    return NextResponse.json({
      attestations: attestations.map((a) => ({
        uid: a.uid,
        txHash: a.txHash,
        chain: a.chain,
        dataHash: a.dataHash,
        explorerUrl: a.explorerUrl,
        metadata: a.metadata ? JSON.parse(a.metadata) : null,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Attest Score] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch score attestations' },
      { status: 500 }
    );
  }
}
