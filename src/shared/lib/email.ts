import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[email] SMTP not configured, skipping email to:", to);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@example.com",
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("[email] Failed to send email:", error);
    return false;
  }
}

// Email template helpers
export function orderConfirmationEmail(orderNumber: string, storeName: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Confirmed!</h2>
      <p>Thank you for your order at <strong>${storeName}</strong>.</p>
      <p>Your order number is: <strong>${orderNumber}</strong></p>
      <p>We will notify you when your order status changes.</p>
    </div>
  `;
}

export function orderStatusEmail(
  orderNumber: string,
  status: string,
  storeName: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Update</h2>
      <p>Your order <strong>${orderNumber}</strong> at <strong>${storeName}</strong> has been updated.</p>
      <p>New status: <strong style="text-transform: capitalize;">${status}</strong></p>
    </div>
  `;
}

export function announcementEmail(title: string, message: string, storeName: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${title}</h2>
      <p>${message}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #888; font-size: 12px;">From ${storeName}</p>
    </div>
  `;
}
