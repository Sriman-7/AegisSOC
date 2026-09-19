import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (severity && severity !== "ALL") where.severity = severity;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { attackType: { contains: search } },
      ];
    }

    const incidents = await prisma.securityIncident.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        actions: true,
        feedbacks: true,
      },
    });

    const total = await prisma.securityIncident.count();
    const critical = await prisma.securityIncident.count({ where: { severity: "CRITICAL" } });
    const high = await prisma.securityIncident.count({ where: { severity: "HIGH" } });
    const mitigated = await prisma.securityIncident.count({ where: { status: "MITIGATED" } });

    return NextResponse.json({
      incidents,
      stats: { total, critical, high, mitigated },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch incidents" }, { status: 500 });
  }
}
