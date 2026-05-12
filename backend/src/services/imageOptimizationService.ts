import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface ImageSizes {
  thumbnail: { width: number; height: number };
  medium: { width: number; height: number };
  large: { width: number; height: number };
}

const IMAGE_SIZES: ImageSizes = {
  thumbnail: { width: 150, height: 150 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 }
};

export class ImageOptimizationService {
  private static uploadDir = path.join(process.cwd(), 'uploads', 'products');
  private static optimizedDir = path.join(process.cwd(), 'uploads', 'products', 'optimized');

  static async initialize() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  static async optimizeImage(imagePath: string, productId: string): Promise<{
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  }> {
    const imageBuffer = await fs.readFile(imagePath);
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const productDir = path.join(this.optimizedDir, productId);
    await fs.mkdir(productDir, { recursive: true });

    const results: any = { original: imagePath };

    // Generate different sizes
    for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
      const optimizedPath = path.join(productDir, `${sizeName}_${path.basename(imagePath)}`);
      
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
      const webpPath = path.join(productDir, `${sizeName}_${path.basename(imagePath, path.extname(imagePath))}.webp`);
      
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

  static async generateResponsiveImageSet(imagePath: string, productId: string): Promise<string> {
    const optimized = await this.optimizeImage(imagePath, productId);
    
    // Generate responsive image set HTML
    const baseUrl = '/uploads/products/optimized/' + productId;
    const imageName = path.basename(imagePath, path.extname(imagePath));
    
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
