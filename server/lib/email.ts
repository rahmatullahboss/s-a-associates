// Resend email service
// Requires RESEND_API_KEY in wrangler.jsonc vars/secrets

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface Env {
  RESEND_API_KEY?: string;
  companyName?: string;
}

async function sendEmail(options: EmailOptions, env: Env): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send');
    return false;
  }

  const fromName = env.companyName || 'Tawakkul Education';
  const fromEmail = 'noreply@tawakkuled.com'; // Change to your verified Resend domain

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Email] Resend API error:', errText);
      return false;
    }

    console.log('[Email] Sent to', options.to);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err);
    return false;
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(content: string, companyName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${companyName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1E293B;padding:28px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:0.5px;">${companyName}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// 1. Booking created (pending) — sent to student
export async function sendBookingCreatedEmail(
  env: Env & { RESEND_API_KEY?: string },
  params: {
    toEmail: string;
    toName: string;
    date: string;
    timeSlot: string;
    bookingId: number;
    companyName: string;
  }
) {
  const content = `
    <h2 style="color:#1E293B;margin-top:0;">Booking Received! 🎉</h2>
    <p style="color:#475569;">Hi <strong>${params.toName}</strong>,</p>
    <p style="color:#475569;">Thank you for booking a free counselling session with us. We have received your request and will confirm your session shortly.</p>
    
    <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:24px 0;">
      <table width="100%" cellpadding="6" cellspacing="0">
        <tr>
          <td style="color:#64748b;font-size:14px;width:40%;">Booking ID</td>
          <td style="color:#1E293B;font-weight:bold;font-size:14px;">#${params.bookingId}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;">Date</td>
          <td style="color:#1E293B;font-weight:bold;font-size:14px;">${params.date}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;">Time</td>
          <td style="color:#1E293B;font-weight:bold;font-size:14px;">${params.timeSlot}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;">Status</td>
          <td style="color:#d97706;font-weight:bold;font-size:14px;">Pending Confirmation</td>
        </tr>
      </table>
    </div>

    <p style="color:#475569;">Our counsellor will review your booking and send you a confirmation with the meeting link very soon.</p>
    <p style="color:#475569;margin-bottom:0;">Best regards,<br/><strong>${params.companyName} Team</strong></p>
  `;

  return sendEmail({
    to: params.toEmail,
    subject: `Booking Received – #${params.bookingId} | ${params.companyName}`,
    html: baseTemplate(content, params.companyName),
  }, env);
}

// 2. Booking confirmed — sent to student with meet link
export async function sendBookingConfirmedEmail(
  env: Env & { RESEND_API_KEY?: string },
  params: {
    toEmail: string;
    toName: string;
    date: string;
    timeSlot: string;
    bookingId: number;
    meetLink: string;
    agentNote?: string;
    companyName: string;
  }
) {
  const meetSection = params.meetLink ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
      <p style="color:#166534;font-weight:bold;margin:0 0 10px;">Your Google Meet Link</p>
      <a href="${params.meetLink}" 
         style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
        Join Meeting
      </a>
      <p style="color:#166534;font-size:12px;margin:10px 0 0;word-break:break-all;">${params.meetLink}</p>
    </div>
  ` : '';

  const noteSection = params.agentNote ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#1d4ed8;font-weight:bold;font-size:14px;margin:0 0 6px;">Note from your Counsellor</p>
      <p style="color:#1e40af;font-size:14px;margin:0;">${params.agentNote}</p>
    </div>
  ` : '';

  const content = `
    <h2 style="color:#1E293B;margin-top:0;">Session Confirmed! ✅</h2>
    <p style="color:#475569;">Hi <strong>${params.toName}</strong>,</p>
    <p style="color:#475569;">Great news! Your free counselling session has been confirmed. Here are your session details:</p>

    <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:24px 0;">
      <table width="100%" cellpadding="6" cellspacing="0">
        <tr>
          <td style="color:#64748b;font-size:14px;width:40%;">Booking ID</td>
          <td style="color:#1E293B;font-weight:bold;font-size:14px;">#${params.bookingId}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;">Date</td>
          <td style="color:#1E293B;font-weight:bold;font-size:14px;">${params.date}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;">Time</td>
          <td style="color:#1E293B;font-weight:bold;font-size:14px;">${params.timeSlot}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;">Status</td>
          <td style="color:#16a34a;font-weight:bold;font-size:14px;">Confirmed ✓</td>
        </tr>
      </table>
    </div>

    ${meetSection}
    ${noteSection}

    <p style="color:#475569;">Please join the meeting at the scheduled time. If you have any questions, feel free to contact us.</p>
    <p style="color:#475569;margin-bottom:0;">Best regards,<br/><strong>${params.companyName} Team</strong></p>
  `;

  return sendEmail({
    to: params.toEmail,
    subject: `Session Confirmed – #${params.bookingId} | ${params.companyName}`,
    html: baseTemplate(content, params.companyName),
  }, env);
}

// 3. Booking cancelled — sent to student
export async function sendBookingCancelledEmail(
  env: Env & { RESEND_API_KEY?: string },
  params: {
    toEmail: string;
    toName: string;
    date: string;
    timeSlot: string;
    bookingId: number;
    companyName: string;
  }
) {
  const content = `
    <h2 style="color:#1E293B;margin-top:0;">Session Cancelled</h2>
    <p style="color:#475569;">Hi <strong>${params.toName}</strong>,</p>
    <p style="color:#475569;">We're sorry to inform you that your counselling session has been cancelled.</p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:24px 0;">
      <table width="100%" cellpadding="6" cellspacing="0">
        <tr>
          <td style="color:#64748b;font-size:14px;width:40%;">Booking ID</td>
          <td style="color:#991b1b;font-weight:bold;font-size:14px;">#${params.bookingId}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;">Date</td>
          <td style="color:#991b1b;font-weight:bold;font-size:14px;">${params.date}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:14px;">Time</td>
          <td style="color:#991b1b;font-weight:bold;font-size:14px;">${params.timeSlot}</td>
        </tr>
      </table>
    </div>

    <p style="color:#475569;">If you'd like to reschedule, please visit our website and book a new session. We apologise for any inconvenience caused.</p>
    <p style="color:#475569;margin-bottom:0;">Best regards,<br/><strong>${params.companyName} Team</strong></p>
  `;

  return sendEmail({
    to: params.toEmail,
    subject: `Session Cancelled – #${params.bookingId} | ${params.companyName}`,
    html: baseTemplate(content, params.companyName),
  }, env);
}
