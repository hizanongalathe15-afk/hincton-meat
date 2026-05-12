"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
// @ts-nocheck
const nodemailer_1 = __importDefault(require("nodemailer"));
const database_1 = require("../database");
class EmailService {
    constructor() {
        this.templates = {};
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        this.initializeTemplates();
    }
    initializeTemplates() {
        this.templates = {
            welcome: {
                subject: 'Welcome to Hincton Meat!',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
              <h1>Welcome to Hincton Meat</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Thank you for joining Hincton Meat! We're excited to serve you with premium quality meat products.</p>
              <p>Get started by browsing our wide selection of fresh beef, chicken, goat meat, and more.</p>
              <a href="${process.env.FRONTEND_URL || 'https://hinctonmeat.com'}" 
                 style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Start Shopping
              </a>
            </div>
            <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Hincton Meat. All rights reserved.</p>
            </div>
          </div>
        `
            },
            orderConfirmation: {
                subject: 'Order Confirmation - Hincton Meat',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
              <h1>Order Confirmed!</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Thank you for your order! We're preparing your fresh meat products with care.</p>
              <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> {{orderNumber}}</p>
                <p><strong>Total Amount:</strong> KSh {{totalAmount}}</p>
                <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
              </div>
              <p>You'll receive another email when your order is on the way.</p>
            </div>
            <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Hincton Meat. All rights reserved.</p>
            </div>
          </div>
        `
            },
            passwordReset: {
                subject: 'Password Reset - Hincton Meat',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
              <h1>Password Reset</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>You requested to reset your password. Click the link below to create a new password:</p>
              <a href="{{resetLink}}" 
                 style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
              <p style="margin-top: 20px; color: #666;">This link expires in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Hincton Meat. All rights reserved.</p>
            </div>
          </div>
        `
            },
            orderShipped: {
                subject: 'Your Order Has Been Shipped! - Hincton Meat',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #27ae60; color: white; padding: 20px; text-align: center;">
              <h1>Order Shipped!</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <p>Great news! Your order is on its way to you.</p>
              <div style="background: white; padding: 15px; border-radius: 4px; margin: 10px 0;">
                <h3>Shipping Details</h3>
                <p><strong>Order Number:</strong> {{orderNumber}}</p>
                <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
                <p><strong>Courier:</strong> {{courier}}</p>
                <p><strong>Expected Delivery:</strong> {{expectedDelivery}}</p>
              </div>
              <a href="{{trackingLink}}" 
                 style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Track Your Order
              </a>
            </div>
            <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>&copy; 2024 Hincton Meat. All rights reserved.</p>
            </div>
          </div>
        `
            }
        };
    }
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: `"Hincton Meat" <${process.env.SMTP_FROM || 'noreply@hinctonmeat.com'}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments
            };
            const result = await this.transporter.sendMail(mailOptions);
            // Log email sent to database
            await database_1.prisma.emailLog.create({
                data: {
                    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                    subject: options.subject,
                    status: 'sent',
                    messageId: result.messageId
                }
            });
            return true;
        }
        catch (error) {
            console.error('Email send error:', error);
            // Log failed email
            await database_1.prisma.emailLog.create({
                data: {
                    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                    subject: options.subject,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            return false;
        }
    }
    async sendTemplateEmail(templateName, to, variables = {}) {
        const template = this.templates[templateName];
        if (!template) {
            throw new Error(`Email template '${templateName}' not found`);
        }
        let html = template.html;
        let subject = template.subject;
        // Replace variables in template
        Object.entries(variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            html = html.replace(new RegExp(placeholder, 'g'), value);
            subject = subject.replace(new RegExp(placeholder, 'g'), value);
        });
        return this.sendEmail({
            to,
            subject,
            html
        });
    }
    async sendWelcomeEmail(email, userName) {
        return this.sendTemplateEmail('welcome', email, {
            userName: userName || 'Customer'
        });
    }
    async sendOrderConfirmationEmail(email, orderData) {
        return this.sendTemplateEmail('orderConfirmation', email, {
            orderNumber: orderData.orderNumber,
            totalAmount: orderData.totalAmount.toString(),
            estimatedDelivery: orderData.estimatedDelivery
        });
    }
    async sendPasswordResetEmail(email, resetToken) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        return this.sendTemplateEmail('passwordReset', email, {
            resetLink
        });
    }
    async sendOrderShippedEmail(email, orderData) {
        return this.sendTemplateEmail('orderShipped', email, {
            orderNumber: orderData.orderNumber,
            trackingNumber: orderData.trackingNumber,
            courier: orderData.courier,
            expectedDelivery: orderData.expectedDelivery,
            trackingLink: orderData.trackingLink
        });
    }
    async sendBulkEmail(emails, subject, html) {
        const results = { success: 0, failed: 0 };
        for (const email of emails) {
            const sent = await this.sendEmail({
                to: email,
                subject,
                html
            });
            if (sent) {
                results.success++;
            }
            else {
                results.failed++;
            }
        }
        return results;
    }
    async verifyConnection() {
        try {
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            console.error('Email service connection error:', error);
            return false;
        }
    }
}
exports.emailService = new EmailService();
exports.default = exports.emailService;
//# sourceMappingURL=emailService.js.map