import { NextRequest, NextResponse } from "next/server";
import { rollbackDefenseAction } from "@/lib/cyber/response-orchestrator";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const revertedBy = body.revertedBy || "SOC Administrator";

    const result = await rollbackDefenseAction(id, revertedBy);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to rollback action" }, { status: 500 });
  }
}
