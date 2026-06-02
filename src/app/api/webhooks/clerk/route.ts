import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

// This endpoint handles Clerk webhook events
// In production, Clerk sends user lifecycle events here
// During local dev, expose this via ngrok

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: { type: string; data: Record<string, unknown> };

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle events
  switch (evt.type) {
    case "user.created":
      console.log("[webhook] user.created:", evt.data.id);
      // You could sync user data to your DB here if needed
      break;
    case "user.updated":
      console.log("[webhook] user.updated:", evt.data.id);
      break;
    case "user.deleted":
      console.log("[webhook] user.deleted:", evt.data.id);
      break;
    default:
      console.log("[webhook] unhandled event:", evt.type);
  }

  return NextResponse.json({ received: true });
}
