import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { hostname } from "node:os";
import { runSystemAction, type SystemAction } from "@/lib/launcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: SystemAction[] = ["reboot", "shutdown", "restart-app"];

async function readCpuTemp(): Promise<number | null> {
  try {
    const raw = await readFile("/sys/class/thermal/thermal_zone0/temp", "utf8");
    const milli = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(milli) ? Math.round(milli / 1000) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  return NextResponse.json({
    host: hostname(),
    cpuTemp: await readCpuTemp(),
    uptime: Math.round(process.uptime()),
  });
}

export async function POST(request: Request) {
  let body: { action?: SystemAction };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action || !ALLOWED.includes(body.action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  runSystemAction(body.action);
  return NextResponse.json({ ok: true });
}
