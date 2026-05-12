import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const emailHost = () => process.env.EMAIL_HOST || process.env.SMTP_HOST
const emailPort = () => process.env.EMAIL_PORT || process.env.SMTP_PORT || '587'
const emailUser = () => process.env.EMAIL_USER || process.env.SMTP_USER
const emailPass = () => process.env.EMAIL_PASS || process.env.SMTP_PASS
const emailFrom = () => process.env.EMAIL_FROM || emailUser()

export const isEmailConfigured = () => Boolean(emailHost() && emailUser() && emailPass());

export const sendEmail = async (options: EmailOptions): Promise<{ sent: boolean; skipped?: boolean }> => {
  try {
    if (!isEmailConfigured()) {
      console.info(`Email skipped because SMTP is not configured. To: ${options.to}, Subject: ${options.subject}`);
      return { sent: false, skipped: true };
    }

    const transporter = nodemailer.createTransport({
      host: emailHost(),
      port: parseInt(emailPort()),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: emailUser(),
        pass: emailPass()
      }
    });

    const mailOptions = {
      from: emailFrom(),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return { sent: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

export const sendOrderConfirmationEmail = async (userEmail: string, orderDetails: any): Promise<void> => {
  const subject = 'Order Confirmation - Hincton Meat Products';
  const html = `
    <h2>Order Confirmed!</h2>
    <p>Thank you for your order. Here are your order details:</p>
    <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
    <p><strong>Total Amount:</strong> KES ${orderDetails.totalAmount}</p>
    <p><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDeliveryTime}</p>
    <p>We'll notify you when your order is on the way.</p>
    <br>
    <p>Best regards,<br>Hincton Meat Products Team</p>
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html
  });
};

export const sendPasswordResetEmail = async (userEmail: string, resetToken: string): Promise<void> => {
  const subject = 'Password Reset - Hincton Meat Products';
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <br>
    <p>If you didn't request this, please ignore this email.</p>
    <br>
    <p>Best regards,<br>Hincton Meat Products Team</p>
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html
  });
};
