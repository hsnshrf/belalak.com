import { NextResponse } from "next/server";

type InquiryPayload = {
  name?: string;
  company?: string;
  email?: string;
  country?: string;
  product?: string;
  volume?: string;
  message?: string;
};

/**
 * Export-inquiry endpoint.
 *
 * In production, forward the payload to your CRM or transactional email
 * provider (Resend, SendGrid, SES…) here — see README "Going live".
 */
export async function POST(request: Request) {
  let payload: InquiryPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const required: (keyof InquiryPayload)[] = ["name", "email", "country", "product"];
  const missing = required.filter((key) => !payload[key]?.trim());
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email!)) {
    return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
  }

  console.log("[belalak] export inquiry received:", {
    ...payload,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
