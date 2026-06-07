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
  } catch (error) {
    console.error(`[SMTP] Failed to send email to ${to}:`, error);
    throw error;
  }
}
