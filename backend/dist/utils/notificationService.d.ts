type DeliveryChannel = 'inApp' | 'email' | 'sms' | 'whatsapp';
type Recipient = {
    id?: string | null;
    email?: string | null;
    phone?: string | null;
};
type NotificationPayload = {
    type?: 'ORDER' | 'PAYMENT' | 'SHIPPING' | 'PROMOTION' | 'SYSTEM' | 'ACCOUNT' | 'REVIEW' | 'WISHLIST';
    title: string;
    message: string;
    actionUrl?: string;
    data?: Record<string, unknown>;
    channels: DeliveryChannel[];
    recipients: Recipient[];
};
export declare const notifyRecipients: (payload: NotificationPayload) => Promise<{
    inApp: number;
    email: number;
    sms: number;
    whatsapp: number;
    skipped: number;
    failed: number;
}>;
export declare const notifyOrderCustomer: (order: any, title: string, message: string, channels?: DeliveryChannel[]) => Promise<{
    inApp: number;
    email: number;
    sms: number;
    whatsapp: number;
    skipped: number;
    failed: number;
}>;
export {};
//# sourceMappingURL=notificationService.d.ts.map