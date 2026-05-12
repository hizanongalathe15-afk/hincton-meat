export declare class ImageOptimizationService {
    private static uploadDir;
    private static optimizedDir;
    static initialize(): Promise<void>;
    static optimizeImage(imagePath: string, productId: string): Promise<{
        thumbnail: string;
        medium: string;
        large: string;
        original: string;
    }>;
    static generateResponsiveImageSet(imagePath: string, productId: string): Promise<string>;
}
//# sourceMappingURL=imageOptimizationService.d.ts.map