import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = await request.json() as { brandId: string };

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        type: 'brand_dna_report',
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'No purchase found. Please purchase a Brand DNA Report first.', code: 'NO_PURCHASE' },
        { status: 402 }
      );
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const reportData = generateReportData(brand, user.xUsername);

    if (user.email) {
      await sendEmail(
        user.email,
        `Your Brand DNA Report is Ready — ${brand.name}`,
        buildReportEmailBody(brand.name, user.xUsername, reportData)
      );
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      message: user.email
        ? 'Report generated and sent to your email!'
        : 'Report generated! Add an email to your account to receive it by email.',
    });
  } catch (error) {
    console.error('[Brand DNA Report] Error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

function generateReportData(brand: {
  name: string;
  colors: string;
  tone: string;
  keywords: string;
  doPatterns: string;
  dontPatterns: string;
  voiceSamples: string;
  voiceFingerprint: string | null;
}, username: string) {
  let colors, tone, keywords, doPatterns, dontPatterns, voiceSamples, voiceFingerprint;
  try { colors = JSON.parse(brand.colors); } catch { colors = {}; }
  try { tone = JSON.parse(brand.tone); } catch { tone = {}; }
  try { keywords = JSON.parse(brand.keywords); } catch { keywords = []; }
  try { doPatterns = JSON.parse(brand.doPatterns); } catch { doPatterns = []; }
  try { dontPatterns = JSON.parse(brand.dontPatterns); } catch { dontPatterns = []; }
  try { voiceSamples = JSON.parse(brand.voiceSamples); } catch { voiceSamples = []; }
  try { voiceFingerprint = brand.voiceFingerprint ? JSON.parse(brand.voiceFingerprint) : null; } catch { voiceFingerprint = null; }

  return {
    brandName: brand.name,
    username,
    generatedAt: new Date().toISOString(),
    sections: {
      identity: {
        title: 'Brand Identity',
        colors,
        tone,
        keywords,
      },
      voice: {
        title: 'Voice & Tone Analysis',
        voiceSamples: voiceSamples.slice(0, 5),
        voiceFingerprint,
      },
      patterns: {
        title: 'Content Patterns',
        doPatterns,
        dontPatterns,
      },
      actionPlan: {
        title: 'Action Plan',
        recommendations: [
          'Establish a consistent posting cadence that aligns with your audience\'s active hours.',
          'Create a brand voice document your team can reference for all content creation.',
          'Audit existing content against your Brand DNA to identify drift areas.',
          'Set up monthly Brand Health checks to track consistency over time.',
          'Develop 3-5 content pillars that align with your core keywords and tone.',
        ],
      },
    },
  };
}

function buildReportEmailBody(brandName: string, username: string, reportData: ReturnType<typeof generateReportData>): string {
  const { sections } = reportData;
  const keywords = sections.identity.keywords as string[];
  const doPatterns = sections.patterns.doPatterns as string[];
  const recommendations = sections.actionPlan.recommendations;

  return [
    `**Your Brand DNA Deep-Dive Report**`,
    ``,
    `Hi @${username},`,
    ``,
    `Your premium Brand DNA report for "${brandName}" is ready. Here's your full breakdown:`,
    ``,
    `**Brand Identity**`,
    keywords.length > 0 ? `→ Core keywords: ${keywords.slice(0, 8).join(', ')}` : '',
    ``,
    `**Content Patterns — What Works**`,
    ...doPatterns.slice(0, 5).map((p: string) => `✓ ${p}`),
    ``,
    `**Your Action Plan**`,
    ...recommendations.map((r: string) => `→ ${r}`),
    ``,
    `You can view your full interactive report anytime at: https://mybrandos.app/app`,
    ``,
    `Keep building your brand,`,
    `The BrandOS Team`,
  ].filter(Boolean).join('\n');
}
