import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587');
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'careers@rie-agl.com';

const hasSmtpConfig = !!(host && user && pass);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    })
  : null;

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  if (!transporter) {
    console.warn('[SMTP] SMTP credentials missing in .env.local. Logging mock email.');
    
    // Log to mock_emails.log
    const fs = require('fs');
    const path = require('path');
    const mockLogDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(mockLogDir)) {
      fs.mkdirSync(mockLogDir, { recursive: true });
    }
    const logPath = path.join(mockLogDir, 'mock_emails.log');
    const logMessage = 
      `======================================================\n` +
      `MOCK EMAIL SENDER (REAL SMTP NOT CONFIGURED)\n` +
      `Date: ${new Date().toISOString()}\n` +
      `To: ${to}\n` +
      `Subject: ${subject}\n\n` +
      `${text}\n` +
      `======================================================\n\n`;
    fs.appendFileSync(logPath, logMessage);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });
    console.log(`[SMTP] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
  } catch (error: any) {
    if (error && error.responseCode === 550 && error.message && error.message.includes('only send testing emails to your own email address')) {
      const match = error.message.match(/\(([^)]+)\)/);
      const ownerEmail = match ? match[1] : null;
      if (ownerEmail) {
        console.warn(`[SMTP] Resend Sandbox Restriction: Cannot send to ${to}. Redirecting to verified owner email: ${ownerEmail}`);
        try {
          const redirectSubject = `[REDIRECTED from ${to}] ${subject}`;
          const redirectText = `[This email was redirected to you because Resend is in Sandbox mode and only allows sending to the account owner's email address (${ownerEmail}).]\n\nOriginal Recipient: ${to}\n\n` + text;
          const redirectHtml = html 
            ? `<div style="background:#fff9db;padding:12px;border:1px solid #ffe066;border-radius:6px;margin-bottom:20px;color:#856404;"><strong>Resend Sandbox Mode:</strong> This email was redirected because Resend only allows sending to the account owner's email address (<strong>${ownerEmail}</strong>) in sandbox mode. Original recipient: <strong>${to}</strong></div>` + html
            : redirectText.replace(/\n/g, '<br>');

          await transporter.sendMail({
            from,
            to: ownerEmail,
            subject: redirectSubject,
            text: redirectText,
            html: redirectHtml,
          });
          console.log(`[SMTP] Redirected email sent successfully to ${ownerEmail}.`);
          return;
        } catch (redirectError) {
          console.error(`[SMTP] Failed to send redirected email to ${ownerEmail}:`, redirectError);
        }
      }
    }
    console.error(`[SMTP] Failed to send email to ${to}:`, error);
    throw error;
  }
}
