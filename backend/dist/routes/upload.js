"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const supabase_js_1 = require("@supabase/supabase-js");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const tempDir = path_1.default.resolve('uploads/temp');
if (!fs_1.default.existsSync(tempDir)) {
    fs_1.default.mkdirSync(tempDir, { recursive: true });
}
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'hinton_bucket';
const upload = (0, multer_1.default)({ dest: tempDir });
router.post('/upload-product-image', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), upload.single('image'), async (req, res) => {
    try {
        const { productId } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            return res.status(500).json({ error: 'Supabase configuration is missing' });
        }
        const fileBuffer = fs_1.default.readFileSync(file.path);
        const fileExt = path_1.default.extname(file.originalname);
        const fileName = `products/${productId}/${Date.now()}${fileExt}`;
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
            contentType: file.mimetype,
            cacheControl: '3600'
        });
        if (error) {
            throw error;
        }
        const urlData = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName).data;
        fs_1.default.unlinkSync(file.path);
        res.json({
            success: true,
            url: urlData.publicUrl,
            message: 'Image uploaded successfully!'
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error?.message || 'Upload failed' });
    }
});
router.get('/product-images/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { data, error } = await supabase.storage
            .from(bucketName)
            .list(`products/${productId}/`);
        if (error) {
            if (error.message?.includes('NotFound')) {
                return res.json({ success: true, images: [] });
            }
            throw error;
        }
        const images = data.map((file) => ({
            name: file.name,
            url: supabase.storage.from(bucketName).getPublicUrl(`products/${productId}/${file.name}`).data.publicUrl,
            size: file.metadata?.size,
            created_at: file.created_at
        }));
        res.json({ success: true, images });
    }
    catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: error?.message || 'Failed to list images' });
    }
});
router.delete('/delete-product-image', auth_1.authenticate, (0, auth_1.authorize)('ADMIN'), async (req, res) => {
    try {
        const { imagePath } = req.body;
        if (!imagePath) {
            return res.status(400).json({ error: 'Image path is required' });
        }
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([imagePath]);
        if (error) {
            throw error;
        }
        res.json({ success: true, message: 'Image deleted successfully' });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error?.message || 'Delete failed' });
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map