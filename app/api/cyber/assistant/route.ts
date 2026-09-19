import { NextRequest, NextResponse } from "next/server";
import { queryInvestigationAssistant } from "@/lib/cyber/ai-analyst";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context } = body;

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const answer = await queryInvestigationAssistant(question, context || {});

    return NextResponse.json({ answer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Copilot error" }, { status: 500 });
  }
}
