import { Resend } from "resend";

const resend = new Resend(process.env.AUTH_RESEND_KEY);
const from = process.env.AUTH_EMAIL_FROM ?? "auth@keepalink.com";
const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// Best-effort welcome email for a freshly provisioned account. Returns whether it
// actually sent — provisioning never fails just because the email bounced (e.g. an
// unverified Resend domain can only reach the account owner in dev).
export async function sendWelcomeEmail(to: string, context: string): Promise<boolean> {
  try {
    await resend.emails.send({
      from,
      to,
      subject: "You've been added to metalingus",
      html: `<p>An account was created for you on metalingus (${context}).</p>
<p><a href="${appUrl}/auth/signin">Sign in</a> with this email address to get started.</p>`,
    });
    return true;
  } catch (e) {
    console.error("welcome email failed:", e);
    return false;
  }
}
