import { v2 as cloudinary } from 'cloudinary';
import { Cloudinary } from '@cloudinary/url-gen';
export declare const cloudinaryApi: Cloudinary;
export declare const uploadImage: (file: string | Buffer, folder?: string) => Promise<{
    url: string;
    publicId: string;
}>;
export declare const deleteImage: (publicId: string) => Promise<void>;
export declare const getOptimizedImageUrl: (publicId: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    crop?: string;
}) => string;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map