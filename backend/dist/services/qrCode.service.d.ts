export interface CreateQrCodeInput {
    name: string;
    code: string;
    description?: string;
    targetUrl?: string;
    redirectUrl?: string;
    discountCode?: string;
    welcomeTitle?: string;
    welcomeMessage?: string;
    welcomeColor?: string;
    autoRedirect?: boolean;
    redirectDelay?: number;
    createdBy?: string;
}
export interface UpdateQrCodeInput {
    name?: string;
    description?: string;
    targetUrl?: string;
    redirectUrl?: string;
    discountCode?: string;
    welcomeTitle?: string;
    welcomeMessage?: string;
    welcomeColor?: string;
    autoRedirect?: boolean;
    redirectDelay?: number;
    isActive?: boolean;
}
declare class QrCodeService {
    /**
     * Create a new QR code
     */
    create(data: CreateQrCodeInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        isActive: boolean;
        createdBy: string | null;
        imageUrl: string | null;
        code: string;
        targetUrl: string;
        redirectUrl: string | null;
        scanCount: number;
        uniqueScanCount: number;
        discountCode: string | null;
        welcomeTitle: string;
        welcomeMessage: string;
        welcomeColor: string;
        autoRedirect: boolean;
        redirectDelay: number;
    }>;
    /**
     * Generate QR code as Data URL (works on Vercel serverless)
     */
    private generateQrImageDataUrl;
    /**
     * Regenerate QR code image (no file system)
     */
    regenerateImage(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        isActive: boolean;
        createdBy: string | null;
        imageUrl: string | null;
        code: string;
        targetUrl: string;
        redirectUrl: string | null;
        scanCount: number;
        uniqueScanCount: number;
        discountCode: string | null;
        welcomeTitle: string;
        welcomeMessage: string;
        welcomeColor: string;
        autoRedirect: boolean;
        redirectDelay: number;
    }>;
    /**
     * Get all QR codes with pagination and filters
     */
    findAll(options?: {
        page?: number;
        limit?: number;
        isActive?: boolean;
        search?: string;
    }): Promise<{
        data: ({
            _count: {
                scans: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            isActive: boolean;
            createdBy: string | null;
            imageUrl: string | null;
            code: string;
            targetUrl: string;
            redirectUrl: string | null;
            scanCount: number;
            uniqueScanCount: number;
            discountCode: string | null;
            welcomeTitle: string;
            welcomeMessage: string;
            welcomeColor: string;
            autoRedirect: boolean;
            redirectDelay: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    /**
     * Get single QR code by ID
     */
    findById(id: string): Promise<{
        _count: {
            scans: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        isActive: boolean;
        createdBy: string | null;
        imageUrl: string | null;
        code: string;
        targetUrl: string;
        redirectUrl: string | null;
        scanCount: number;
        uniqueScanCount: number;
        discountCode: string | null;
        welcomeTitle: string;
        welcomeMessage: string;
        welcomeColor: string;
        autoRedirect: boolean;
        redirectDelay: number;
    }>;
    /**
     * Get QR code by code (for public scanning)
     */
    findByCode(code: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        isActive: boolean;
        createdBy: string | null;
        imageUrl: string | null;
        code: string;
        targetUrl: string;
        redirectUrl: string | null;
        scanCount: number;
        uniqueScanCount: number;
        discountCode: string | null;
        welcomeTitle: string;
        welcomeMessage: string;
        welcomeColor: string;
        autoRedirect: boolean;
        redirectDelay: number;
    }>;
    /**
     * Update QR code
     */
    update(id: string, data: UpdateQrCodeInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        isActive: boolean;
        createdBy: string | null;
        imageUrl: string | null;
        code: string;
        targetUrl: string;
        redirectUrl: string | null;
        scanCount: number;
        uniqueScanCount: number;
        discountCode: string | null;
        welcomeTitle: string;
        welcomeMessage: string;
        welcomeColor: string;
        autoRedirect: boolean;
        redirectDelay: number;
    }>;
    /**
     * Soft delete QR code
     */
    delete(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        isActive: boolean;
        createdBy: string | null;
        imageUrl: string | null;
        code: string;
        targetUrl: string;
        redirectUrl: string | null;
        scanCount: number;
        uniqueScanCount: number;
        discountCode: string | null;
        welcomeTitle: string;
        welcomeMessage: string;
        welcomeColor: string;
        autoRedirect: boolean;
        redirectDelay: number;
    }>;
    /**
     * Track a QR code scan
     */
    trackScan(code: string, scanData: {
        ipAddress?: string;
        userAgent?: string;
        referrer?: string;
        userId?: string;
        sessionId?: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        description: string | null;
        isActive: boolean;
        createdBy: string | null;
        imageUrl: string | null;
        code: string;
        targetUrl: string;
        redirectUrl: string | null;
        scanCount: number;
        uniqueScanCount: number;
        discountCode: string | null;
        welcomeTitle: string;
        welcomeMessage: string;
        welcomeColor: string;
        autoRedirect: boolean;
        redirectDelay: number;
    }>;
    /**
     * Get QR code statistics
     */
    getStats(id: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<{
        qrCode: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            description: string | null;
            isActive: boolean;
            createdBy: string | null;
            imageUrl: string | null;
            code: string;
            targetUrl: string;
            redirectUrl: string | null;
            scanCount: number;
            uniqueScanCount: number;
            discountCode: string | null;
            welcomeTitle: string;
            welcomeMessage: string;
            welcomeColor: string;
            autoRedirect: boolean;
            redirectDelay: number;
        };
        totalScans: number;
        uniqueScans: number;
        conversionCount: number;
        conversionRate: number;
        recentScans: {
            id: string;
            createdAt: Date;
            userId: string | null;
            city: string | null;
            country: string | null;
            sessionId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            convertedAt: Date | null;
            qrCodeId: string;
            referrer: string | null;
            converted: boolean;
        }[];
        dailyScans: unknown;
        period: "year" | "week" | "day" | "month";
    }>;
    /**
     * Mark scan as converted (when user makes a purchase)
     */
    markConverted(code: string, sessionId?: string, userId?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        city: string | null;
        country: string | null;
        sessionId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        convertedAt: Date | null;
        qrCodeId: string;
        referrer: string | null;
        converted: boolean;
    }>;
}
export declare const qrCodeService: QrCodeService;
export default qrCodeService;
//# sourceMappingURL=qrCode.service.d.ts.map