import { Resend } from "resend";
import { buildEmailHtml, EMAIL_SUBJECTS, FROM_EMAIL } from "@/lib/email-templates";

const VALID_TYPES = [
  "case-verified",
  "case-rejected",
  "donation-confirmation",
  "store-order-donor",
  "store-order-vendor",
  "store-receipt-recipient",
];

export async function POST(request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      return Response.json(
        { error: "Email service is not configured." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { type, to, ...data } = body;

    if (!type || !to) {
      return Response.json(
        { error: "Missing required fields: type and to." },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return Response.json({ error: "Invalid email type." }, { status: 400 });
    }

    const html = buildEmailHtml(type, data);

    if (!html) {
      return Response.json(
        { error: "Unable to build email template." },
        { status: 400 },
      );
    }

    const resend = new Resend(apiKey);

    const { data: sendData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: EMAIL_SUBJECTS[type],
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, id: sendData?.id });
  } catch (err) {
    console.error("Send email route error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to send email." },
      { status: 500 },
    );
  }
}
