import nodemailer from 'nodemailer';
import { NotificationType } from '@prisma/client';

// Only build a transporter when SMTP is configured. If any required SMTP
// variable is missing, `mailer` will be `null` and emails are skipped
// gracefully (notifications are still stored in the database).
let mailer: nodemailer.Transporter | null = null;

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD &&
  process.env.SMTP_FROM_EMAIL
) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

/**
 * Send an email. Returns `true` if sent, `false` if SMTP is not configured
 * or the send failed (errors are logged but never thrown to the caller).
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!mailer || !to) return false;
  try {
    const from = `${process.env.SMTP_FROM_NAME || 'BAUST Exchange'} <${process.env.SMTP_FROM_EMAIL}>`;
    await mailer.sendMail({
      from,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('sendEmail error:', err);
    return false;
  }
}

export type EmailContext = {
  subject: string;
  html: string;
};

/**
 * Build the email body for a given notification type. In a real app this would
 * live in a templates module; here it is kept small.
 */
export function notificationEmail(type: NotificationType, message: string): EmailContext {
  const titles: Record<NotificationType, string> = {
    REQUEST_NEW: '🔔 New Exchange Request Received',
    REQUEST_ACCEPTED: '✅ Your Request Was Accepted!',
    REQUEST_REJECTED: 'ℹ️ Update on Your Exchange Request',
    MESSAGE: '💬 New Message Received',
    LISTING_APPROVED: '🎉 Listing Approved',
    ADMIN: '🛡️ Important Account Notice',
    MATCH: '✨ Possible Exchange Match Found',
  };
  const appUrl = process.env.NEXTAUTH_URL || 'https://baust-exchange.vercel.app';
  const subject = titles[type] || 'BAUST Exchange Notification';
  
  const actionUrls: Partial<Record<NotificationType, string>> = {
    REQUEST_NEW: `${appUrl}/exchange-requests`,
    REQUEST_ACCEPTED: `${appUrl}/exchange-requests`,
    REQUEST_REJECTED: `${appUrl}/exchange-requests`,
    MESSAGE: `${appUrl}/messages`,
    ADMIN: `${appUrl}/notifications`,
    MATCH: `${appUrl}/marketplace`,
  };

  const ctaUrl = actionUrls[type] || `${appUrl}/notifications`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
          <td style="background-color: #1d4e89; padding: 20px 24px; text-align: left;">
            <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
              BAUST <span style="color: #60a5fa;">Exchange</span>
            </h1>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 28px 24px; color: #1e293b;">
            <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 16px;">
              ${titles[type] || 'Notification'}
            </h2>
            <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
              ${message.replace(/\n/g, '<br/>')}
            </p>
            
            <!-- Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
              <tr>
                <td style="border-radius: 6px; background-color: #1d4e89;">
                  <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                    View Details on BAUST Exchange
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 0;">
              Or copy this link to your browser: <br/>
              <a href="${ctaUrl}" style="color: #1d4e89; text-decoration: underline; word-break: break-all;">${ctaUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              © 2026 BAUST Exchange. Bangladesh Army University of Science and Technology.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return { subject, html };
}
