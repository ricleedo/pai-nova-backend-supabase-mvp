import nodemailer from 'nodemailer';

interface SendMagicLinkParams {
  to: string;
  frontendLink?: string;
  backendLink: string;
  purpose: 'verify' | 'signin';
}

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const smtpSecureEnv = process.env.SMTP_SECURE;
const smtpSecure = smtpSecureEnv != null ? smtpSecureEnv === 'true' : (smtpPort === 465);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'no-reply@example.com';

let transporter: nodemailer.Transporter | null = null;
if (smtpHost && smtpPort) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: Boolean(smtpSecure),
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined
  });
}

export async function sendMagicLinkEmail({ to, frontendLink, backendLink, purpose }: SendMagicLinkParams): Promise<void> {
  const appName = process.env.APP_NAME || 'PAI Care';
  const buttonText = purpose === 'verify' ? 'Verify email' : 'Sign in';
  const subjectAction = purpose === 'verify' ? 'Verify your email' : 'Sign in to';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.6;">
      <h2>${subjectAction} ${appName}</h2>
      <p>Click the button below. This link expires in 15 minutes and can be used once.</p>
      <p style="margin:24px 0;">
        <a href="${backendLink}" style="background:#4f46e5;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;">${buttonText}</a>
      </p>
      ${frontendLink ? `<p>If you prefer, you can also use this link:</p><p><a href="${frontendLink}">${frontendLink}</a></p>` : ''}
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p><a href="${backendLink}">${backendLink}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  if (!transporter) {
    // Graceful fallback for local/dev when SMTP is not configured
    // eslint-disable-next-line no-console
    console.log(`[DEV] SMTP not configured. Magic link for ${to}: ${backendLink}`);
    return;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: `${subjectAction} ${appName}`,
    html,
    text: `${subjectAction} ${appName}: ${backendLink}`
  });
}

export default { sendMagicLinkEmail };


