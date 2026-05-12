export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
export declare const isEmailConfigured: () => boolean;
export declare const sendEmail: (options: EmailOptions) => Promise<{
    sent: boolean;
    skipped?: boolean;
}>;
export declare const sendOrderConfirmationEmail: (userEmail: string, orderDetails: any) => Promise<void>;
export declare const sendPasswordResetEmail: (userEmail: string, resetToken: string) => Promise<void>;
//# sourceMappingURL=emailService.d.ts.map