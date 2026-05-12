interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: Buffer;
    }>;
}
interface EmailTemplate {
    [key: string]: {
        subject: string;
        html: string;
    };
}
declare class EmailService {
    private transporter;
    private templates;
    constructor();
    private initializeTemplates;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendTemplateEmail(templateName: keyof EmailTemplate, to: string | string[], variables?: Record<string, string>): Promise<boolean>;
    sendWelcomeEmail(email: string, userName?: string): Promise<boolean>;
    sendOrderConfirmationEmail(email: string, orderData: {
        orderNumber: string;
        totalAmount: number;
        estimatedDelivery: string;
    }): Promise<boolean>;
    sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean>;
    sendOrderShippedEmail(email: string, orderData: {
        orderNumber: string;
        trackingNumber: string;
        courier: string;
        expectedDelivery: string;
        trackingLink: string;
    }): Promise<boolean>;
    sendBulkEmail(emails: string[], subject: string, html: string): Promise<{
        success: number;
        failed: number;
    }>;
    verifyConnection(): Promise<boolean>;
}
export declare const emailService: EmailService;
export default emailService;
//# sourceMappingURL=emailService.d.ts.map