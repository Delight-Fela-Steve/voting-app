import { isEmailConfigured, sendMail } from "@/lib/email/mailer";

type SendInviteEmailInput = {
  to: string;
  inviteUrl: string;
  invitedByName: string;
  expiresAt: Date;
};

type SendInviteEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" }
  | { sent: false; reason: "failed"; error: string };

export async function isInviteEmailConfigured(): Promise<boolean> {
  return isEmailConfigured();
}

export async function sendInviteEmail(
  input: SendInviteEmailInput,
): Promise<SendInviteEmailResult> {
  if (!(await isEmailConfigured())) {
    return { sent: false, reason: "not_configured" };
  }

  const expiresLabel = input.expiresAt.toLocaleDateString(undefined, {
    dateStyle: "long",
  });

  const html = `
    <p>Hi,</p>
    <p>${input.invitedByName} invited you to join the Voting App as an admin.</p>
    <p><a href="${input.inviteUrl}">Accept invitation and create your account</a></p>
    <p>This link expires on ${expiresLabel}.</p>
    <p>If you did not expect this email, you can ignore it.</p>
  `.trim();

  const text = [
    `${input.invitedByName} invited you to join the Voting App as an admin.`,
    `Accept your invitation: ${input.inviteUrl}`,
    `This link expires on ${expiresLabel}.`,
  ].join("\n\n");

  const result = await sendMail({
    to: input.to,
    subject: "You're invited to the Voting App admin panel",
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
