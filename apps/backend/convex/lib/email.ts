/**
 * Transactional email sending via Resend.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */

const ERROR_TEXT_MAX_LENGTH = 200;

export interface EmailContent {
  html: string;
  subject: string;
  text: string;
}

export interface SendEmailArgs extends EmailContent {
  to: string;
}

/**
 * Send a transactional email through Resend. Throws a clear error if
 * `RESEND_API_KEY` isn't configured, or if the Resend API call fails.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email is not configured: set RESEND_API_KEY");
  }

  const from = process.env.EMAIL_FROM ?? "Chic <hello@usechic.com>";

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({ from, html, subject, text, to }),
    headers: {
      // biome-ignore lint/style/useNamingConvention: HTTP header names use PascalCase
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Resend HTTP ${response.status}: ${body.slice(0, ERROR_TEXT_MAX_LENGTH)}`
    );
  }
}

export interface PasswordResetEmailArgs {
  url: string;
}

/**
 * On-brand "reset your password" email content, ready to spread into
 * `sendEmail`: `sendEmail({ to: user.email, ...passwordResetEmail({ url }) })`.
 */
export function passwordResetEmail({
  url,
}: PasswordResetEmailArgs): EmailContent {
  const subject = "Reset your password";

  const html = `
    <div style="background-color:#FAF8F4;padding:40px 24px;font-family:Georgia,'Cormorant Garamond',serif;">
      <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid #CFC8BC;border-radius:12px;padding:40px;">
        <h1 style="margin:0 0 16px;font-family:Georgia,'Cormorant Garamond',serif;font-size:28px;font-weight:600;color:#161617;">Reset your password</h1>
        <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#161617;">We received a request to reset the password for your Chic account.</p>
        <p style="margin:0 0 28px;">
          <a href="${url}" style="display:inline-block;background-color:#B08D57;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:9999px;">Reset password</a>
        </p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b6b6b;">Or paste this link into your browser:<br /><a href="${url}" style="color:#B08D57;word-break:break-all;">${url}</a></p>
      </div>
    </div>
  `.trim();

  const text = `Reset your password\n\nWe received a request to reset the password for your Chic account. Open this link to choose a new one:\n${url}`;

  return { html, subject, text };
}
