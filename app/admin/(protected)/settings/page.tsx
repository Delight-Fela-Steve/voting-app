import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmailServiceSection } from "@/components/admin/email-service-section";
import {
  getEmailConfig,
  isGoogleOAuthConfigured,
} from "@/lib/actions/settings";
import { canEncrypt } from "@/lib/email/encrypt";

const OAUTH_FLASH_MESSAGES: Record<string, string> = {
  gmail_connected: "Gmail connected successfully via OAuth.",
};

const OAUTH_FLASH_ERRORS: Record<string, string> = {
  oauth_not_configured:
    "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  encryption_not_configured:
    "EMAIL_ENCRYPTION_KEY is not configured. Set a 64-character hex key before connecting.",
  oauth_denied: "Google sign-in was cancelled or denied.",
  oauth_invalid_state: "OAuth session expired or was invalid. Please try again.",
  oauth_token_failed: "Failed to exchange OAuth code for tokens.",
  oauth_no_refresh_token:
    "Google did not return a refresh token. Revoke app access in your Google account and try again with consent.",
  oauth_profile_failed: "Could not read your Google account email.",
};

type SettingsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  const session = await auth();

  if (session?.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const params = await searchParams;
  const flashMessage = params.success
    ? OAUTH_FLASH_MESSAGES[params.success] ?? null
    : null;
  const flashError = params.error
    ? OAUTH_FLASH_ERRORS[params.error] ?? "An error occurred during Gmail OAuth."
    : null;

  const [config, googleOAuthConfigured] = await Promise.all([
    getEmailConfig(),
    isGoogleOAuthConfigured(),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-text-muted">
          Configure application-wide options for the admin panel.
        </p>
      </div>

      <EmailServiceSection
        config={config}
        googleOAuthConfigured={googleOAuthConfigured}
        encryptionConfigured={canEncrypt()}
        flashMessage={flashMessage}
        flashError={flashError}
      />
    </main>
  );
}
