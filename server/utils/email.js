import nodemailer from 'nodemailer';

const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';

const transportConfig = emailHost.includes('gmail')
  ? {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    }
  : {
      host: emailHost,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

const transporter = nodemailer.createTransport(transportConfig);

/**
 * Send late submission threshold alert email to managers.
 * @param {Array} managers - Array of manager objects with { name, email }
 * @param {number} lateCount - Number of late submissions in the period
 * @param {number} threshold - The configured threshold
 * @param {number} totalMembers - Total active team members
 */
export const sendLateThresholdAlert = async (managers, lateCount, threshold, totalMembers) => {
  const managerEmails = managers.map(m => m.email).filter(Boolean);
  if (managerEmails.length === 0) return;

  const complianceRate = totalMembers > 0
    ? ((1 - lateCount / totalMembers) * 100).toFixed(1)
    : '0.0';

  const mailOptions = {
    from: `"Weekly Report Manager" <${process.env.EMAIL_USER || 'no-reply@weeklyreportmanager.com'}>`,
    to: managerEmails.join(', '),
    subject: `⚠️ Late Submission Threshold Exceeded — ${lateCount} late report${lateCount !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family: 'Google Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #000; text-align: center;"><em>Weekly Report Manager</em></h2>
        <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #92400E; font-size: 16px; font-weight: bold; margin: 0;">
            ⚠️ Late Submission Alert
          </p>
        </div>
        <p style="color: #000; line-height: 1.6;">
          The number of late weekly report submissions has exceeded the configured threshold.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Late Submissions</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; color: #DC2626; font-weight: bold;">${lateCount}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Threshold</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${threshold}</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Compliance Rate</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${complianceRate}%</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Total Team Members</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${totalMembers}</td>
          </tr>
        </table>
        <p style="color: #000; line-height: 1.6;">
          Please review the <a href="#" style="color: #4F46E5;">Late Submissions Audit Log</a> in your dashboard for more details.
        </p>
        <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
          © 2026 Weekly Report Manager. All rights reserved.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Late threshold alert sent to ${managerEmails.length} manager(s)`);
  } catch (error) {
    console.error('Failed to send late threshold alert email:', error.message);
  }
};
