"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageOptimizationService = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const IMAGE_SIZES = {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 }
};
class ImageOptimizationService {
    static async initialize() {
        try {
            await promises_1.default.mkdir(this.uploadDir, { recursive: true });
            await promises_1.default.mkdir(this.optimizedDir, { recursive: true });
        }
        catch (error) {
            console.error('Failed to create directories:', error);
        }
    }
    static async optimizeImage(imagePath, productId) {
        const imageBuffer = await promises_1.default.readFile(imagePath);
        const image = (0, sharp_1.default)(imageBuffer);
        const metadata = await image.metadata();
        const productDir = path_1.default.join(this.optimizedDir, productId);
        await promises_1.default.mkdir(productDir, { recursive: true });
        const results = { original: imagePath };
        // Generate different sizes
        for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
            const optimizedPath = path_1.default.join(productDir, `${sizeName}_${path_1.default.basename(imagePath)}`);
            await image
                .clone()
                .resize(dimensions.width, dimensions.height, {
                fit: 'cover',
                position: 'center'
            })
                .jpeg({ quality: 80, progressive: true })
                .toFile(optimizedPath);
            results[sizeName] = optimizedPath;
        }
        // Generate WebP versions for better performance
        for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
            const webpPath = path_1.default.join(productDir, `${sizeName}_${path_1.default.basename(imagePath, path_1.default.extname(imagePath))}.webp`);
            await image
                .clone()
                .resize(dimensions.width, dimensions.height, {
                fit: 'cover',
                position: 'center'
            })
                .webp({ quality: 80 })
                .toFile(webpPath);
            results[`${sizeName}Webp`] = webpPath;
        }
        return results;
    }
    static async generateResponsiveImageSet(imagePath, productId) {
        const optimized = await this.optimizeImage(imagePath, productId);
        // Generate responsive image set HTML
        const baseUrl = '/uploads/products/optimized/' + productId;
        const imageName = path_1.default.basename(imagePath, path_1.default.extname(imagePath));
        return `
      <picture>
        <source srcset="${baseUrl}/thumbnail_${imageName}.webp" type="image/webp">
        <source srcset="${baseUrl}/thumbnail_${imageName}.jpg" type="image/jpeg">
        <source srcset="${baseUrl}/medium_${imageName}.webp" media="(min-width: 400px)" type="image/webp">
        <source srcset="${baseUrl}/medium_${imageName}.jpg" media="(min-width: 400px)" type="image/jpeg">
        <source srcset="${baseUrl}/large_${imageName}.webp" media="(min-width: 800px)" type="image/webp">
        <source srcset="${baseUrl}/large_${imageName}.jpg" media="(min-width: 800px)" type="image/jpeg">
        <img src="${optimized.medium}" alt="Product image" loading="lazy">
      </picture>
    `;
    }
}
exports.ImageOptimizationService = ImageOptimizationService;
ImageOptimizationService.uploadDir = path_1.default.join(process.cwd(), 'uploads', 'products');
ImageOptimizationService.optimizedDir = path_1.default.join(process.cwd(), 'uploads', 'products', 'optimized');
//# sourceMappingURL=imageOptimizationService.js.map