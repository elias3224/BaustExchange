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
    REQUEST_NEW: 'New Exchange Request',
    REQUEST_ACCEPTED: 'Your Request Was Accepted',
    REQUEST_REJECTED: 'Your Request Was Rejected',
    MESSAGE: 'New Message',
    LISTING_APPROVED: 'Listing Approved',
    ADMIN: 'Admin Notice',
    MATCH: 'Possible Exchange Match',
  };
  const subject = titles[type] || 'BAUST Exchange notification';
  const html = `
    <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1d4e89;">BAUST Exchange</h2>
      <p>${message.replace(/\n/g, '<br/>')}</p>
      <p style="margin-top: 24px; color: #777; font-size: 12px;">You received this email because you are registered on BAUST Exchange.</p>
    </div>
  `;
  return { subject, html };
}
