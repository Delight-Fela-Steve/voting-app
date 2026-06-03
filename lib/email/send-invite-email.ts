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

export function isInviteEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendInviteEmail(
  input: SendInviteEmailInput,
): Promise<SendInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false, reason: "not_configured" };
  }

  const expiresLabel = input.expiresAt.toLocaleDateString(undefined, {
    dateStyle: "long",
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "You're invited to the Voting App admin panel",
      html: `
        <p>Hi,</p>
        <p>${input.invitedByName} invited you to join the Voting App as an admin.</p>
        <p><a href="${input.inviteUrl}">Accept invitation and create your account</a></p>
        <p>This link expires on ${expiresLabel}.</p>
        <p>If you did not expect this email, you can ignore it.</p>
      `.trim(),
      text: [
        `${input.invitedByName} invited you to join the Voting App as an admin.`,
        `Accept your invitation: ${input.inviteUrl}`,
        `This link expires on ${expiresLabel}.`,
      ].join("\n\n"),
    }),
  });

  if (!response.ok) {
    let detail = "Failed to send invitation email.";
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
