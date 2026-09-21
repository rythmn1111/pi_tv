import { NextResponse } from "next/server";
import { getServices } from "@/lib/services";
import { launchService, returnHome } from "@/lib/launcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action === "home") {
    returnHome();
    return NextResponse.json({ ok: true });
  }

  // Only ever launch URLs that are in the config - never an arbitrary string
  // handed to us by the page.
  const services = await getServices();
  const service = services.find((s) => s.id === body.id);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  launchService(service.url, service.userAgent);
  return NextResponse.json({ ok: true, launched: service.id });
}
