import { isEmailConfigured, sendMail } from "@/lib/email/mailer";

type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

type SendPasswordResetEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" }
  | { sent: false; reason: "failed"; error: string };

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
): Promise<SendPasswordResetEmailResult> {
  if (!(await isEmailConfigured())) {
    return { sent: false, reason: "not_configured" };
  }

  const html = `
    <p>Hi,</p>
    <p>We received a request to reset your Voting App admin password.</p>
    <p><a href="${input.resetUrl}">Reset your password</a></p>
    <p>This link expires in 1 hour and can only be used once.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim();

  const text = [
    "We received a request to reset your Voting App admin password.",
    `Reset your password: ${input.resetUrl}`,
    "This link expires in 1 hour and can only be used once.",
    "If you did not request this, you can ignore this email.",
  ].join("\n\n");

  const result = await sendMail({
    to: input.to,
    subject: "Reset your Voting App password",
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
