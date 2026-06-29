type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function hasTransactionalEmailConfig() {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

export async function sendTransactionalEmail(input: EmailInput) {
  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "DeVoice <noreply@devoice.io>",
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html
      })
    });

    if (!response.ok) {
      throw new Error(`Resend email HTTP ${response.status}: ${await response.text()}`);
    }

    return { provider: "resend" };
  }

  if (process.env.SMTP_HOST) {
    console.warn("SMTP_HOST is configured, but this build has no SMTP client dependency. Configure RESEND_API_KEY for email delivery.");
    return { provider: "smtp-unavailable" };
  }

  return { provider: "preview" };
}
