import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeSequence } from "@/lib/email";

// Temporary debug endpoint — remove after fixing email issues
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  console.log("[DebugEmail] Starting...");
  console.log("[DebugEmail] RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
  console.log("[DebugEmail] EMAIL_FROM:", process.env.EMAIL_FROM || "(not set)");

  try {
    const result = await sendWelcomeSequence(email, {
      username: "debug_test",
      name: "Debug Test",
      score: 75,
      defineScore: 70,
      checkScore: 65,
      generateScore: 80,
      scaleScore: 75,
      archetype: "SIGNAL_SAGE",
      archetypeEmoji: "✨",
      archetypeTagline: "The Knowledge Curator",
      archetypeDescription: "You curate knowledge with depth and clarity.",
      archetypeStrengths: ["clarity"],
      topImprovement: "Post more",
      topStrength: "Clear voice",
      defineInsights: ["Strong niche clarity"],
      checkInsights: ["Consistent voice"],
      generateInsights: ["Good engagement"],
      scaleInsights: ["Growing"],
      summary: "Debug test summary.",
      topImprovements: ["Post more"],
      topStrengths: ["Clear voice"],
    });

    console.log("[DebugEmail] Result:", JSON.stringify(result));
    return NextResponse.json({ result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[DebugEmail] Error:", msg);
    console.error("[DebugEmail] Stack:", stack);
    return NextResponse.json({ error: msg, stack }, { status: 500 });
  }
}
