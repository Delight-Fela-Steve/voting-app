import type { OtpPurpose } from "@prisma/client";
import { isEmailConfigured, sendMail } from "@/lib/email/mailer";

type SendOtpEmailInput = {
  to: string;
  code: string;
  purpose: OtpPurpose;
};

type SendOtpEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" }
  | { sent: false; reason: "failed"; error: string };

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

export async function isOtpEmailConfigured(): Promise<boolean> {
  return isEmailConfigured();
}

export async function sendOtpEmail(
  input: SendOtpEmailInput,
): Promise<SendOtpEmailResult> {
  if (!(await isEmailConfigured())) {
    return { sent: false, reason: "not_configured" };
  }

  const { subject, intro } = purposeCopy(input.purpose);

  const html = `
    <p>Hi,</p>
    <p>${intro}</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${input.code}</p>
    <p>This code expires in 10 minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim();

  const text = [intro, input.code, "This code expires in 10 minutes."].join(
    "\n\n",
  );

  const result = await sendMail({
    to: input.to,
    subject,
    html,
    text,
  });

  if (result.sent) {
    return { sent: true };
  }

  if (result.reason === "not_configured") {
    return { sent: false, reason: "not_configured" };
  }

  return { sent: false, reason: "failed", error: result.error };
}
