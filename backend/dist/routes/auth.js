"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const emailService_1 = require("../utils/emailService");
const cloudinary_1 = require("../config/cloudinary");
const meatShopMessages_1 = require("../messages/meatShopMessages");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
fs_1.default.mkdirSync('uploads/profiles', { recursive: true });
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
});
const ADMIN_EMAILS = new Set(['admin@meat.com', 'admin2@meat.com']);
const ADMIN_PASSWORD = 'admin123@';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const Role = {
    BUYER: 'BUYER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
};
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email().transform((value) => value.toLowerCase()),
    password: zod_1.z.string().min(8),
    phone: zod_1.z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
    agreed: zod_1.z.boolean().refine((val) => val === true, {
        message: 'You must agree to the Terms and Privacy Policy to register',
    }),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().transform((value) => value.toLowerCase()),
    password: zod_1.z.string().min(1),
});
const phoneOtpRequestSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(/^\+[1-9]\d{7,14}$/),
});
const phoneOtpVerifySchema = phoneOtpRequestSchema.extend({
    otp: zod_1.z.string().regex(/^\d{6}$/),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email().transform((value) => value.toLowerCase()),
});
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(20),
    password: zod_1.z.string().min(8),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8),
});
const addressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1),
    city: zod_1.z.string().min(1),
    postalCode: zod_1.z.string().optional().default(''),
    country: zod_1.z.string().min(1),
    isDefault: zod_1.z.boolean().optional().default(false),
});
const paymentMethodSchema = zod_1.z.object({
    type: zod_1.z.string().optional().default('mpesa'),
    phoneNumber: zod_1.z.string().regex(/^(07|01)\d{8}$/),
    accountName: zod_1.z.string().optional().default(''),
    isDefault: zod_1.z.boolean().optional().default(false),
});
const notificationSettingsSchema = zod_1.z.object({
    email: zod_1.z.boolean().optional(),
    sms: zod_1.z.boolean().optional(),
    push: zod_1.z.boolean().optional(),
    orderUpdates: zod_1.z.boolean().optional(),
    promotions: zod_1.z.boolean().optional(),
    newsletter: zod_1.z.boolean().optional(),
});
const apiMessage = (message, values) => {
    const resolved = (0, meatShopMessages_1.resolveMessage)(message, values);
    return { ...resolved, error: resolved.message };
};
const userInclude = {
    profile: true,
    security: true,
};
const getPrimaryRole = (roles) => {
    if (roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.ADMIN))
        return 'admin';
    return 'buyer';
};
const splitName = (name) => {
    const parts = name.trim().split(/\s+/);
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
    };
};
const serializeUser = (user) => ({
    id: user.id,
    name: user.profile?.fullName || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ') || user.email,
    email: user.email,
    username: user.username,
    phone: user.phone,
    avatar: user.profile?.avatar,
    profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        fullName: user.profile.fullName,
        avatar: user.profile.avatar,
        coverImage: user.profile.coverImage,
        bio: user.profile.bio,
        website: user.profile.website,
        mpesaPhone: user.profile.mpesaPhone,
        preferredDeliveryLocation: user.profile.preferredDeliveryLocation,
        locationLabel: user.profile.locationLabel,
    } : undefined,
    walletBalance: Number(user.walletBalance || 0),
    voucherBalance: Number(user.voucherBalance || 0),
    loyaltyPoints: Number(user.loyaltyPoints || 0),
    address: user.profile?.preferredDeliveryLocation ? {
        street: user.profile.preferredDeliveryLocation,
        city: user.profile.locationLabel || '',
        state: '',
        zipCode: '',
        country: 'Kenya',
        latitude: user.profile.locationLatitude,
        longitude: user.profile.locationLongitude,
    } : undefined,
    role: getPrimaryRole(user.roles || []),
    roles: user.roles || [],
    isVerified: Boolean(user.security?.isEmailVerified),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
const signToken = (user) => {
    const options = { expiresIn: process.env.JWT_EXPIRE || '7d' };
    return jsonwebtoken_1.default.sign({
        userId: user.id,
        email: user.email,
        role: getPrimaryRole(user.roles || []) === 'admin' ? 'ADMIN' : 'BUYER',
        roles: user.roles || [],
    }, JWT_SECRET, options);
};
const getUserIdFromRequest = (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return null;
    const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    return decoded.userId;
};
const serializeAddress = (address) => ({
    id: address.id,
    street: address.addressLine1,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
});
const serializePaymentMethod = (paymentMethod) => ({
    id: paymentMethod.id,
    type: paymentMethod.type,
    last4: paymentMethod.last4,
    expiryMonth: paymentMethod.expiryMonth,
    expiryYear: paymentMethod.expiryYear,
    isDefault: paymentMethod.isDefault,
});
const serializeNotificationSettings = (settings) => ({
    email: Boolean(settings?.emailOrder),
    sms: Boolean(settings?.smsOrder),
    push: Boolean(settings?.pushOrder),
    orderUpdates: Boolean(settings?.emailOrder || settings?.smsOrder || settings?.pushOrder),
    promotions: Boolean(settings?.emailPromotion || settings?.smsPromotion || settings?.pushPromotion),
    newsletter: Boolean(settings?.emailNewsletter),
});
const ensureAccountShell = async (userId) => {
    await prisma.userSettings.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });
    await prisma.wishlist.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });
    await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });
};
const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const sendPhoneOtp = async (phone, otp) => {
    if (!process.env.SMS_WEBHOOK_URL) {
        console.info(`Phone OTP for ${phone}: ${otp}`);
        return { delivered: false, devOtp: otp };
    }
    const response = await fetch(process.env.SMS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(process.env.SMS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` } : {}),
        },
        body: JSON.stringify({
            to: phone,
            message: `Your Hincton Meat Products sign-in code is ${otp}. It expires in 10 minutes.`,
        }),
    });
    if (!response.ok) {
        throw new Error('SMS provider rejected OTP request');
    }
    return { delivered: true };
};
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, agreed } = registerSchema.parse(req.body);
        if (ADMIN_EMAILS.has(email)) {
            return res.status(403).json(apiMessage(meatShopMessages_1.meatShopMessages.auth.emailRegistered));
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json(apiMessage(meatShopMessages_1.meatShopMessages.auth.emailRegistered));
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const { firstName, lastName } = splitName(name);
        const user = await prisma.user.create({
            data: {
                email,
                phone,
                roles: [Role.BUYER],
                profile: {
                    create: {
                        firstName,
                        lastName,
                        fullName: name.trim(),
                        mpesaPhone: phone,
                    },
                },
                security: {
                    create: {
                        password_hash: hashedPassword,
                        isEmailVerified: true,
                        is_active: true,
                        password_changed_at: new Date(),
                    },
                },
                settings: { create: {} },
                wishlist: { create: {} },
                cart: { create: {} },
            },
            include: userInclude,
        });
        res.status(201).json({
            ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.auth.accountCreated),
            user: serializeUser(user),
            token: signToken(user),
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error instanceof zod_1.z.ZodError) {
            const passwordIssue = error.issues.find((issue) => issue.path.includes('password'));
            const emailIssue = error.issues.find((issue) => issue.path.includes('email'));
            const message = passwordIssue
                ? meatShopMessages_1.meatShopMessages.auth.passwordMinLength
                : emailIssue
                    ? meatShopMessages_1.meatShopMessages.auth.invalidEmail
                    : meatShopMessages_1.meatShopMessages.validation.acceptTerms;
            return res.status(400).json({ ...apiMessage(message), details: error.issues });
        }
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.unknownError));
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email },
            include: userInclude,
        });
        if (!user?.security?.password_hash) {
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.auth.invalidCredentials));
        }
        if (!user.security.is_active) {
            return res.status(403).json({ ...apiMessage(meatShopMessages_1.meatShopMessages.security.suspiciousActivity), code: 'ACCOUNT_DISABLED' });
        }
        if (user.security.is_locked || (user.security.locked_until && user.security.locked_until > new Date())) {
            return res.status(423).json(apiMessage(meatShopMessages_1.meatShopMessages.auth.accountLocked));
        }
        if (!user.security.isEmailVerified) {
            return res.status(403).json(apiMessage(meatShopMessages_1.meatShopMessages.auth.verifyEmail));
        }
        const isAdminTrigger = ADMIN_EMAILS.has(email);
        if (isAdminTrigger && password !== ADMIN_PASSWORD) {
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.auth.invalidCredentials));
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.security.password_hash);
        if (!isValidPassword) {
            const attempts = user.security.login_attempts + 1;
            const shouldLock = attempts >= 5;
            await prisma.userSecurity.update({
                where: { userId: user.id },
                data: {
                    login_attempts: attempts,
                    is_locked: shouldLock,
                    locked_until: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
                },
            });
            return res.status(401).json({
                ...apiMessage(shouldLock ? meatShopMessages_1.meatShopMessages.auth.accountLocked : meatShopMessages_1.meatShopMessages.auth.invalidCredentials),
            });
        }
        await Promise.all([
            prisma.userSecurity.update({
                where: { userId: user.id },
                data: {
                    last_login_at: new Date(),
                    last_login_ip: req.ip,
                    login_attempts: 0,
                    is_locked: false,
                    locked_until: null,
                },
            }),
            ensureAccountShell(user.id),
        ]);
        const refreshedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: userInclude,
        });
        res.json({
            ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.auth.welcomeBack, { name: refreshedUser?.profile?.fullName || user.profile?.fullName || user.email }),
            user: serializeUser(refreshedUser || user),
            token: signToken(refreshedUser || user),
        });
    }
    catch (error) {
        console.error('Login error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ ...apiMessage(meatShopMessages_1.meatShopMessages.auth.invalidCredentials), details: error.issues });
        }
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
router.post('/phone/request-otp', async (req, res) => {
    try {
        const { phone } = phoneOtpRequestSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { phone },
            include: userInclude,
        });
        if (!user?.security?.is_active) {
            return res.status(404).json({ error: 'No active account exists for this phone number' });
        }
        const otp = createOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.userSecurity.update({
            where: { userId: user.id },
            data: {
                phone_otp: otp,
                phone_otp_expires: expiresAt,
            },
        });
        const delivery = await sendPhoneOtp(phone, otp);
        res.json({
            message: 'OTP sent successfully',
            expiresAt,
            ...(delivery.devOtp ? { devOtp: delivery.devOtp } : {}),
        });
    }
    catch (error) {
        console.error('Phone OTP request error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid phone number', details: error.issues });
        }
        res.status(500).json({ error: 'Could not send OTP' });
    }
});
router.post('/phone/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = phoneOtpVerifySchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { phone },
            include: userInclude,
        });
        if (!user?.security?.is_active) {
            return res.status(401).json({ error: 'Invalid phone number or OTP' });
        }
        const expiresAt = user.security.phone_otp_expires?.getTime() || 0;
        if (user.security.phone_otp !== otp || expiresAt < Date.now()) {
            return res.status(401).json({ error: 'The verification code you entered is incorrect. Please try again or request a new code.' });
        }
        await Promise.all([
            prisma.userSecurity.update({
                where: { userId: user.id },
                data: {
                    phone_otp: null,
                    phone_otp_expires: null,
                    isPhoneVerified: true,
                    last_login_at: new Date(),
                    login_attempts: 0,
                },
            }),
            ensureAccountShell(user.id),
        ]);
        const refreshedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: userInclude,
        });
        res.json({
            message: 'Phone login successful',
            user: serializeUser(refreshedUser || user),
            token: signToken(refreshedUser || user),
        });
    }
    catch (error) {
        console.error('Phone OTP verify error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid OTP data', details: error.issues });
        }
        res.status(500).json({ error: 'Could not verify OTP' });
    }
});
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { email },
            include: userInclude,
        });
        if (user?.security?.is_active) {
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            await prisma.userSecurity.update({
                where: { userId: user.id },
                data: {
                    reset_token: resetToken,
                    reset_token_expires: new Date(Date.now() + 60 * 60 * 1000),
                },
            });
            await (0, emailService_1.sendPasswordResetEmail)(user.email, resetToken);
        }
        res.json((0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.auth.passwordResetSent));
    }
    catch (error) {
        console.error('Forgot password error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ ...apiMessage(meatShopMessages_1.meatShopMessages.auth.invalidEmail), details: error.issues });
        }
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = resetPasswordSchema.parse(req.body);
        const userSecurity = await prisma.userSecurity.findFirst({
            where: {
                reset_token: token,
                reset_token_expires: { gt: new Date() },
                is_active: true,
            },
        });
        if (!userSecurity) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.auth.resetTokenExpired));
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        await prisma.userSecurity.update({
            where: { userId: userSecurity.userId },
            data: {
                password_hash: hashedPassword,
                reset_token: null,
                reset_token_expires: null,
                password_changed_at: new Date(),
            },
        });
        res.json((0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.auth.passwordChanged));
    }
    catch (error) {
        console.error('Reset password error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ ...apiMessage(meatShopMessages_1.meatShopMessages.auth.passwordStrength), details: error.issues });
        }
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.serverBusy));
    }
});
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: userInclude,
        });
        if (!user) {
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        }
        res.json({ user: serializeUser(user) });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
    }
});
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: userInclude,
        });
        if (!user) {
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        }
        res.json({ user: serializeUser(user) });
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
    }
});
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const { name, firstName: providedFirstName, lastName: providedLastName, username, phone, avatar, coverImage, bio, website, preferredDeliveryLocation, locationLatitude, locationLongitude, locationLabel, } = req.body;
        const split = splitName(name || '');
        const firstName = providedFirstName ?? split.firstName;
        const lastName = providedLastName ?? split.lastName;
        const fullName = name || [firstName, lastName].filter(Boolean).join(' ');
        const user = await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                username: username === undefined ? undefined : String(username).trim() || null,
                phone: phone === undefined ? undefined : String(phone).trim() || null,
                profile: {
                    upsert: {
                        update: {
                            firstName,
                            lastName,
                            fullName,
                            avatar,
                            coverImage,
                            bio,
                            website,
                            mpesaPhone: phone === undefined ? undefined : String(phone).trim() || null,
                            preferredDeliveryLocation,
                            locationLatitude,
                            locationLongitude,
                            locationLabel,
                        },
                        create: {
                            firstName,
                            lastName,
                            fullName,
                            avatar,
                            coverImage,
                            bio,
                            website,
                            mpesaPhone: phone === undefined ? undefined : String(phone).trim() || null,
                            preferredDeliveryLocation,
                            locationLatitude,
                            locationLongitude,
                            locationLabel,
                        },
                    },
                },
            },
            include: userInclude,
        });
        res.json({
            message: (0, meatShopMessages_1.messageText)(meatShopMessages_1.meatShopMessages.system.preferencesSaved),
            code: meatShopMessages_1.meatShopMessages.system.preferencesSaved.code,
            type: meatShopMessages_1.meatShopMessages.system.preferencesSaved.type,
            user: serializeUser(user),
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        if (error?.code === 'P2002') {
            return res.status(409).json({ message: 'That username or phone number is already in use.' });
        }
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.system.unknownError));
    }
});
router.post('/profile/avatar', upload.single('avatar'), async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        if (!req.file)
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.system.unknownError));
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        let avatarUrl;
        try {
            avatarUrl = (await (0, cloudinary_1.uploadImage)(req.file.buffer, 'hincton/profiles')).url;
        }
        catch {
            const filename = `avatar-${decoded.userId}-${Date.now()}${path_1.default.extname(req.file.originalname)}`;
            const localPath = path_1.default.join('uploads/profiles', filename);
            fs_1.default.writeFileSync(localPath, req.file.buffer);
            avatarUrl = `/${localPath.replace(/\\/g, '/')}`;
        }
        const user = await prisma.user.update({
            where: { id: decoded.userId },
            data: {
                profile: {
                    upsert: {
                        update: { avatar: avatarUrl },
                        create: { avatar: avatarUrl },
                    },
                },
            },
            include: userInclude,
        });
        res.json({ ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.system.preferencesSaved), user: serializeUser(user), avatar: avatarUrl });
    }
    catch (error) {
        console.error('Avatar update error:', error);
        res.status(500).json({ error: 'Could not update avatar' });
    }
});
router.put('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: userInclude,
        });
        if (!user?.security?.password_hash || !user.security.is_active) {
            return res.status(404).json({ error: 'User not found' });
        }
        const currentPasswordMatches = await bcryptjs_1.default.compare(currentPassword, user.security.password_hash);
        if (!currentPasswordMatches) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma.userSecurity.update({
            where: { userId: user.id },
            data: {
                password_hash: hashedPassword,
                password_changed_at: new Date(),
            },
        });
        res.json((0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.auth.passwordChanged));
    }
    catch (error) {
        console.error('Change password error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid password data', details: error.issues });
        }
        res.status(500).json({ error: 'Could not change password' });
    }
});
router.get('/addresses', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const addresses = await prisma.address.findMany({
            where: { userId, deletedAt: null },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
        res.json({ addresses: addresses.map(serializeAddress) });
    }
    catch (error) {
        console.error('Get addresses error:', error);
        res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
    }
});
router.post('/addresses', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const data = addressSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
        const [firstName, ...restName] = (user?.profile?.fullName || user?.email || '').split(/\s+/);
        if (data.isDefault) {
            await prisma.address.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } });
        }
        const address = await prisma.address.create({
            data: {
                userId,
                firstName: firstName || '',
                lastName: restName.join(' '),
                addressLine1: data.street,
                city: data.city,
                state: '',
                postalCode: data.postalCode,
                country: data.country,
                isDefault: data.isDefault,
                email: user?.email,
                phone: user?.phone,
            },
        });
        res.status(201).json({ address: serializeAddress(address) });
    }
    catch (error) {
        console.error('Add address error:', error);
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: 'Invalid address data', details: error.issues });
        res.status(500).json({ error: 'Could not add address' });
    }
});
router.put('/addresses/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const data = addressSchema.partial().parse(req.body);
        const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId, deletedAt: null } });
        if (!existing)
            return res.status(404).json({ error: 'Address not found' });
        if (data.isDefault) {
            await prisma.address.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } });
        }
        const address = await prisma.address.update({
            where: { id: req.params.id },
            data: {
                addressLine1: data.street,
                city: data.city,
                postalCode: data.postalCode,
                country: data.country,
                isDefault: data.isDefault,
            },
        });
        res.json({ address: serializeAddress(address) });
    }
    catch (error) {
        console.error('Update address error:', error);
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: 'Invalid address data', details: error.issues });
        res.status(500).json({ error: 'Could not update address' });
    }
});
router.delete('/addresses/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const result = await prisma.address.updateMany({
            where: { id: req.params.id, userId, deletedAt: null },
            data: { deletedAt: new Date(), isDefault: false },
        });
        if (result.count === 0)
            return res.status(404).json({ error: 'Address not found' });
        res.json({ message: 'Address deleted successfully' });
    }
    catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Could not delete address' });
    }
});
router.put('/addresses/:id/default', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId, deletedAt: null } });
        if (!existing)
            return res.status(404).json({ error: 'Address not found' });
        await prisma.address.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } });
        const address = await prisma.address.update({ where: { id: req.params.id }, data: { isDefault: true } });
        res.json({ address: serializeAddress(address) });
    }
    catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({ error: 'Could not update default address' });
    }
});
router.get('/payment-methods', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const paymentMethods = await prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
        res.json({ paymentMethods: paymentMethods.map(serializePaymentMethod) });
    }
    catch (error) {
        console.error('Get payment methods error:', error);
        res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
    }
});
router.post('/payment-methods', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const data = paymentMethodSchema.parse(req.body);
        if (data.isDefault) {
            await prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
        }
        const paymentMethod = await prisma.paymentMethod.create({
            data: {
                userId,
                type: data.type,
                last4: data.phoneNumber.slice(-4),
                cardBrand: 'M-PESA',
                providerId: data.accountName || null,
                billingAddress: { phoneNumber: data.phoneNumber, accountName: data.accountName },
                isDefault: data.isDefault,
            },
        });
        res.status(201).json({ paymentMethod: serializePaymentMethod(paymentMethod) });
    }
    catch (error) {
        console.error('Add payment method error:', error);
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: 'Invalid payment method data', details: error.issues });
        res.status(500).json({ error: 'Could not add payment method' });
    }
});
router.delete('/payment-methods/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const result = await prisma.paymentMethod.deleteMany({ where: { id: req.params.id, userId } });
        if (result.count === 0)
            return res.status(404).json({ error: 'Payment method not found' });
        res.json({ message: 'Payment method deleted successfully' });
    }
    catch (error) {
        console.error('Delete payment method error:', error);
        res.status(500).json({ error: 'Could not delete payment method' });
    }
});
router.put('/payment-methods/:id/default', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const existing = await prisma.paymentMethod.findFirst({ where: { id: req.params.id, userId } });
        if (!existing)
            return res.status(404).json({ error: 'Payment method not found' });
        await prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
        const paymentMethod = await prisma.paymentMethod.update({ where: { id: req.params.id }, data: { isDefault: true } });
        res.json({ paymentMethod: serializePaymentMethod(paymentMethod) });
    }
    catch (error) {
        console.error('Set default payment method error:', error);
        res.status(500).json({ error: 'Could not update default payment method' });
    }
});
router.get('/notification-settings', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const settings = await prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } });
        res.json({ notifications: serializeNotificationSettings(settings) });
    }
    catch (error) {
        console.error('Get notification settings error:', error);
        res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
    }
});
router.put('/notification-settings', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId)
            return res.status(401).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        const data = notificationSettingsSchema.parse(req.body);
        const settings = await prisma.userSettings.upsert({
            where: { userId },
            update: {
                emailOrder: data.email ?? data.orderUpdates,
                emailPromotion: data.promotions,
                emailNewsletter: data.newsletter,
                smsOrder: data.sms ?? data.orderUpdates,
                smsPromotion: data.promotions,
                pushOrder: data.push ?? data.orderUpdates,
                pushPromotion: data.promotions,
            },
            create: {
                userId,
                emailOrder: data.email ?? data.orderUpdates ?? true,
                emailPromotion: data.promotions ?? false,
                emailNewsletter: data.newsletter ?? false,
                smsOrder: data.sms ?? false,
                smsPromotion: data.promotions ?? false,
                pushOrder: data.push ?? data.orderUpdates ?? true,
                pushPromotion: data.promotions ?? false,
            },
        });
        res.json({ notifications: serializeNotificationSettings(settings) });
    }
    catch (error) {
        console.error('Update notification settings error:', error);
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: 'Invalid notification settings', details: error.issues });
        res.status(500).json({ error: 'Could not update notification settings' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map