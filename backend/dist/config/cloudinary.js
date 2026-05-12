"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptimizedImageUrl = exports.deleteImage = exports.uploadImage = exports.cloudinaryApi = void 0;
const cloudinary_1 = require("cloudinary");
const url_gen_1 = require("@cloudinary/url-gen");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});
exports.cloudinaryApi = new url_gen_1.Cloudinary({
    cloud: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME
    },
    url: {
        secure: true
    }
});
// Upload image to Cloudinary
const uploadImage = async (file, folder = 'premium-meat-shop') => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw new Error('Cloudinary is not configured');
        }
        if (Buffer.isBuffer(file)) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({
                    folder,
                    resource_type: 'auto',
                    quality: 'auto',
                    fetch_format: 'auto',
                }, (error, uploadResult) => {
                    if (error || !uploadResult)
                        return reject(error || new Error('Cloudinary upload failed'));
                    resolve(uploadResult);
                });
                stream.end(file);
            });
            return {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }
        const result = await cloudinary_1.v2.uploader.upload(file, {
            folder,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto'
        });
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image');
    }
};
exports.uploadImage = uploadImage;
// Delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image');
    }
};
exports.deleteImage = deleteImage;
// Get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
    const transformations = [];
    if (options.width)
        transformations.push(`w_${options.width}`);
    if (options.height)
        transformations.push(`h_${options.height}`);
    if (options.quality)
        transformations.push(`q_${options.quality}`);
    if (options.crop)
        transformations.push(`c_${options.crop}`);
    const transformationString = transformations.length > 0
        ? transformations.join(',')
        : 'q_auto,f_auto';
    return cloudinary_1.v2.url(publicId, {
        transformation: transformationString,
        secure: true
    });
};
exports.getOptimizedImageUrl = getOptimizedImageUrl;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map