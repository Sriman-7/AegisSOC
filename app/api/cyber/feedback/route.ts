import { NextRequest, NextResponse } from "next/server";
import { processAnalystFeedback } from "@/lib/cyber/continuous-learning";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { incidentId, verdict, analystNotes, whitelistEntity } = body;

    if (!incidentId || !verdict) {
      return NextResponse.json({ error: "incidentId and verdict are required" }, { status: 400 });
    }

    const result = await processAnalystFeedback(
      incidentId,
      verdict,
      analystNotes,
      whitelistEntity
    );

    return NextResponse.json({ success: true, feedback: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Feedback processing failed" }, { status: 500 });
  }
}
