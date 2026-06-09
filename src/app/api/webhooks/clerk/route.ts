import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

// This endpoint handles Clerk webhook events
// Syncs user data to our local DB and cleans up on deletion

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
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data as {
        id: string;
        email_addresses: { email_address: string }[];
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };

      await prisma.user.upsert({
        where: { clerkId: id },
        create: {
          clerkId: id,
          email: email_addresses?.[0]?.email_address ?? null,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
        update: {
          email: email_addresses?.[0]?.email_address ?? null,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
      });
      break;
    }
    case "user.deleted": {
      const { id } = evt.data as { id: string };
      // Cascade delete will remove signals too
      await prisma.user.delete({
        where: { clerkId: id },
      }).catch(() => {
        // User might not exist in our DB yet
      });
      break;
    }
    default:
      console.log("[webhook] unhandled event:", evt.type);
  }

  return NextResponse.json({ received: true });
}
