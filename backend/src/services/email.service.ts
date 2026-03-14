import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function sendBulkEmails(
  recipients: { email: string; name: string }[],
  subject: string,
  bodyTemplate: string,
  jobTitle?: string,
  companyName?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const personalizedBody = bodyTemplate
      .replace(/\{\{candidate_name\}\}/g, recipient.name)
      .replace(/\{\{job_title\}\}/g, jobTitle || '')
      .replace(/\{\{company_name\}\}/g, companyName || '');

    const success = await sendEmail({
      to: recipient.email,
      subject,
      html: personalizedBody,
    });

    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}
