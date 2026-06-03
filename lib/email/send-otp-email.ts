import type { OtpPurpose } from "@prisma/client";

type SendOtpEmailInput = {
  to: string;
  code: string;
  purpose: OtpPurpose;
};

type SendOtpEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" }
  | { sent: false; reason: "failed"; error: string };

export function isOtpEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function purposeCopy(purpose: OtpPurpose): { subject: string; intro: string } {
  if (purpose === "CHANGE_EMAIL") {
    return {
      subject: "Confirm your email change",
      intro: "Use this code to confirm your email address change:",
    };
  }

  return {
    subject: "Confirm your password change",
    intro: "Use this code to confirm your password change:",
  };
}

export async function sendOtpEmail(
  input: SendOtpEmailInput,
): Promise<SendOtpEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false, reason: "not_configured" };
  }

  const { subject, intro } = purposeCopy(input.purpose);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      html: `
        <p>Hi,</p>
        <p>${intro}</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${input.code}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `.trim(),
      text: [intro, input.code, "This code expires in 10 minutes."].join("\n\n"),
    }),
  });

  if (!response.ok) {
    let detail = "Failed to send verification email.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        detail = body.message;
      }
    } catch {
      // ignore parse errors
    }
    return { sent: false, reason: "failed", error: detail };
  }

  return { sent: true };
}
