import { NextRequest, NextResponse } from "next/server";
import { processAnalystFeedback } from "@/lib/cyber/continuous-learning";
import { FeedbackInputSchema } from "@/lib/cyber/validation";
import { checkRateLimit } from "@/lib/cyber/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`feedback-${ip}`, 80, 60000);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const rawBody = await req.json();
    const parseResult = FeedbackInputSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid feedback payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { incidentId, feedbackType, notes } = parseResult.data;

    const result = await processAnalystFeedback(
      incidentId,
      feedbackType,
      notes
    );

    return NextResponse.json({
      success: true,
      feedback: result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 });
  }
}
