import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

function emailTemplate(name = '') {
  return `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f4f7;padding:40px 0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(90deg,#ec4899,#f59e0b,#ef4444);padding:24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;">Karma&nbsp;AI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:18px;">Hi ${name},</p>
            <p style="font-size:16px;line-height:1.5;margin:16px 0;">
              Welcome to <strong>Karma&nbsp;AI</strong> – your AI-powered playground for crafting stunning UI components in seconds.
            </p>
            <p style="font-size:16px;line-height:1.5;margin:16px 0;">
              Jump into the playground, describe what you need (e.g. “Make a red button with Tailwind”), and watch Karma&nbsp;AI bring it to life. Edit, preview and export the code effortlessly.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/playground" style="background:#ec4899;text-decoration:none;color:#ffffff;padding:14px 24px;font-weight:600;border-radius:6px;display:inline-block;">Go to Playground →</a>
            </div>
            <p style="font-size:14px;color:#6b7280;">If you did not create an account, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">
            Made with ❤️ by Aakash
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendWelcomeEmail({ to, name }) {
  if (!to) return;
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Karma AI <${process.env.EMAIL_SERVER_USER}>`,
    to,
    subject: 'Welcome to Karma AI! 🌟',
    html: emailTemplate(name),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to', to);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

// ─────────────────────────────────────────────────────────
// Support Ticket Emails
// ─────────────────────────────────────────────────────────

function ticketTemplate({ subject, level, description, user }) {
  return `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f4f7;padding:40px 0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:#1f2937;padding:24px;text-align:center;">
            <h2 style="margin:0;color:#ffffff;font-size:24px;">New Support Query</h2>
          </td>
        </tr>
        <tr><td style="padding:24px;">
          <p style="font-size:16px;margin:0 0 12px 0;"><strong>From:</strong> ${user.name} (${user.email})</p>
          <p style="font-size:16px;margin:0 0 12px 0;"><strong>Level:</strong> ${level}</p>
          <p style="font-size:18px;margin:16px 0 8px 0;"><strong>Subject:</strong> ${subject}</p>
          <p style="font-size:15px;line-height:1.6;white-space:pre-wrap;border:1px solid #e5e7eb;padding:12px;border-radius:6px;background:#fafafa;">${description}</p>
          <p style="font-size:14px;color:#6b7280;margin-top:24px;">This message was generated automatically by Karma&nbsp;AI.</p>
        </td></tr>
      </table>
    </div>
  `;
}

function ticketAckTemplate({ name }) {
  return `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f4f7;padding:40px 0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(90deg,#10b981,#06b6d4);padding:24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;">Karma&nbsp;AI Support</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:18px;">Hi ${name},</p>
            <p style="font-size:16px;line-height:1.5;margin:16px 0;">Thanks for reaching out to us. Your query has been received and our team will get back to you as soon as possible.</p>
            <p style="font-size:16px;line-height:1.5;margin:16px 0;">You can expect a response within <strong>24&nbsp;hours</strong>. In the meantime, feel free to continue exploring Karma&nbsp;AI.</p>
            <p style="font-size:14px;color:#6b7280;">If you didn’t raise this ticket, please ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">Made with ❤️ by Aakash</td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendSupportTicketEmail({ subject, level, description, user }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Karma AI <${process.env.EMAIL_SERVER_USER}>`,
    to: adminEmail,
    subject: `[Support] ${subject} (${level})`,
    html: ticketTemplate({ subject, level, description, user }),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Support ticket forwarded to admin');
  } catch (error) {
    console.error('Error sending support ticket email:', error);
  }
}

export async function sendSupportAckEmail({ to, name }) {
  if (!to) return;
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Karma AI <${process.env.EMAIL_SERVER_USER}>`,
    to,
    subject: 'We have received your query ✔️',
    html: ticketAckTemplate({ name }),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Acknowledgement email sent');
  } catch (error) {
    console.error('Error sending ack email:', error);
  }
}

// ─────────────────────────────────────────────────────────
// Password Reset Emails
// ─────────────────────────────────────────────────────────

function passwordResetTemplate({ name = '', resetUrl }) {
  return `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f4f7;padding:40px 0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;">Karma&nbsp;AI</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="font-size:18px;">Hi ${name || 'there'},</p>
            <p style="font-size:16px;line-height:1.5;margin:16px 0;">
              We received a request to reset your password. Click the button below to set a new password. This link will expire in <strong>1&nbsp;hour</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${resetUrl}" style="background:#6366f1;text-decoration:none;color:#ffffff;padding:14px 24px;font-weight:600;border-radius:6px;display:inline-block;">Reset Password →</a>
            </div>
            <p style="font-size:14px;color:#6b7280;">If you did not request a password reset, please ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">Made with ❤️ by Aakash</td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!to || !resetUrl) return;
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Karma AI <${process.env.EMAIL_SERVER_USER}>`,
    to,
    subject: 'Reset your Karma AI password',
    html: passwordResetTemplate({ name, resetUrl }),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to', to);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
} 