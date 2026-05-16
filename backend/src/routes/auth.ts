import express from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import fs from 'fs/promises'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import path from 'path'
import axios from 'axios'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import multer from 'multer'
import { sendEmail, sendPasswordResetEmail } from '../utils/emailService'
import { uploadImage } from '../config/cloudinary'
import { meatShopMessages, messageText, resolveMessage } from '../messages/meatShopMessages'

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
})

const saveAvatarToServer = async (file: Express.Multer.File) => {
  const extension = path.extname(file.originalname).toLowerCase() || '.jpg'
  const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension) ? extension : '.jpg'
  const filename = `${crypto.randomUUID()}${safeExtension}`
  const directory = path.resolve(process.cwd(), 'uploads', 'profiles')
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(path.join(directory, filename), file.buffer)
  return `/uploads/profiles/${filename}`
}

const storeAvatar = async (file: Express.Multer.File) => {
  try {
    return (await uploadImage(file.buffer, 'hincton/profiles')).url
  } catch (error) {
    console.warn('Cloud avatar upload unavailable, saving avatar on server:', error instanceof Error ? error.message : error)
    return saveAvatarToServer(file)
  }
}

const ADMIN_EMAILS = new Set(['admin@meat.com', 'admin2@meat.com'])
const ADMIN_PASSWORD = 'admin123@'
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key'
const Role = {
  BUYER: 'BUYER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const
type RoleValue = typeof Role[keyof typeof Role]

const realEmailSchema = z.string()
  .email()
  .refine((value) => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value), 'Use a real email address with a valid domain')
  .transform((value) => value.toLowerCase())

const strongPasswordSchema = z.string()
  .min(8)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, 'Password must include uppercase, lowercase, number, and symbol')

const registerSchema = z.object({
  name: z.string().min(2),
  email: realEmailSchema,
  password: strongPasswordSchema,
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
  agreed: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms and Privacy Policy to register',
  }),
})

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
})

const phoneOtpRequestSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
})

const phoneOtpVerifySchema = phoneOtpRequestSchema.extend({
  otp: z.string().regex(/^\d{6}$/),
})

const forgotPasswordSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
})

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8),
})

const googleIdTokenSchema = z.object({
  token: z.string().min(10),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().optional().default(''),
  country: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
})

const paymentMethodSchema = z.object({
  type: z.string().optional().default('mpesa'),
  phoneNumber: z.string().regex(/^(07|01)\d{8}$/),
  accountName: z.string().optional().default(''),
  isDefault: z.boolean().optional().default(false),
})

const notificationSettingsSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
  newsletter: z.boolean().optional(),
})

const closeAccountSchema = z.object({
  identifier: z.string().min(3),
  agreed: z.boolean().refine((value) => value === true),
})

const apiMessage = (message: Parameters<typeof resolveMessage>[0], values?: Parameters<typeof resolveMessage>[1]) => {
  const resolved = resolveMessage(message, values)
  return { ...resolved, error: resolved.message }
}

const userInclude = {
  profile: true,
  security: true,
} as const

const getPrimaryRole = (roles: RoleValue[]) => {
  if (roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.ADMIN)) return 'admin'
  return 'buyer'
}

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

const serializeUser = (user: any) => ({
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
})

const signToken = (user: any, sessionId?: string) => {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRE as any) || '7d' }
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: getPrimaryRole(user.roles || []) === 'admin' ? 'ADMIN' : 'BUYER',
      roles: user.roles || [],
      sessionId,
    },
    JWT_SECRET,
    options
  )
}

const getAllowedRedirectOrigins = () => {
  const origins = [
    process.env.FRONTEND_URL?.trim(),
    process.env.NEXTAUTH_URL?.trim(),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://hincton-meat.vercel.app',
  ].filter(Boolean) as string[]

  return Array.from(new Set(origins))
}

const getSafeRedirectUrl = (redirect?: string) => {
  const fallback = process.env.FRONTEND_URL?.trim() || process.env.NEXTAUTH_URL?.trim() || 'http://localhost:3000'
  if (!redirect) return fallback

  try {
    const parsed = new URL(redirect)
    return getAllowedRedirectOrigins().includes(parsed.origin) ? redirect : fallback
  } catch {
    return fallback
  }
}

const getGoogleCallbackUrl = (req: express.Request) => {
  const backendBase = process.env.BACKEND_URL?.trim() || `${req.protocol}://${req.get('host')}`
  return `${backendBase}/api/auth/google/callback`
}

const getUserIdFromRequest = async (req: express.Request) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = jwt.verify(token, JWT_SECRET) as any
  if (!(await isDecodedSessionActive(decoded))) return null
  return decoded.userId as string
}

const getSessionIdFromRequest = (req: express.Request) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = jwt.verify(token, JWT_SECRET) as any
  return decoded.sessionId as string | null
}

async function isDecodedSessionActive(decoded: any) {
  if (!decoded.sessionId) return true

  const session = await prisma.userSession.findFirst({
    where: {
      id: decoded.sessionId,
      userId: decoded.userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  })

  if (!session) return false

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastActivity: new Date() },
  }).catch(() => undefined)

  return true
}

const getClientIp = (req: express.Request) => {
  const forwarded = req.headers['x-forwarded-for']
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() || req.ip || req.socket.remoteAddress || ''
}

const inferDeviceType = (userAgent = '') => {
  const ua = userAgent.toLowerCase()
  if (/ipad|tablet/.test(ua)) return 'TABLET'
  if (/mobile|android|iphone|ipod/.test(ua)) return 'MOBILE'
  if (/smart-tv|smarttv|tv/.test(ua)) return 'SMART_TV'
  return ua ? 'DESKTOP' : 'UNKNOWN'
}

const inferDeviceName = (userAgent = '') => {
  if (/iphone/i.test(userAgent)) return 'iPhone'
  if (/ipad/i.test(userAgent)) return 'iPad'
  if (/android/i.test(userAgent)) return 'Android device'
  if (/windows/i.test(userAgent)) return 'Windows browser'
  if (/macintosh|mac os/i.test(userAgent)) return 'Mac browser'
  if (/linux/i.test(userAgent)) return 'Linux browser'
  return 'Unknown device'
}

const notifySecurityLogin = async (user: any, session: any, isNewDevice: boolean) => {
  if (!isNewDevice) return

  const actionUrl = '/profile?tab=security'
  const title = 'New device signed in'
  const message = `${session.deviceName || 'A device'} signed in to your Hincton account. Review active devices if this was not you.`

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'ACCOUNT',
      title,
      message,
      actionUrl,
      data: {
        sessionId: session.id,
        ipAddress: session.ipAddress,
        deviceType: session.deviceType,
        deviceName: session.deviceName,
      },
    },
  }).catch((error) => console.error('Security notification create failed:', error))

  await sendEmail({
    to: user.email,
    subject: 'New sign-in to your Hincton account',
    html: `
      <p>Hello ${user.profile?.firstName || user.email},</p>
      <p>${message}</p>
      <p><strong>Device:</strong> ${session.deviceName || 'Unknown'}<br>
      <strong>IP:</strong> ${session.ipAddress || 'Unknown'}<br>
      <strong>Time:</strong> ${new Date(session.createdAt).toLocaleString()}</p>
      <p><a href="${process.env.FRONTEND_URL || ''}${actionUrl}">Review active devices</a></p>
    `,
    text: `${message}\nDevice: ${session.deviceName || 'Unknown'}\nIP: ${session.ipAddress || 'Unknown'}\nReview: ${(process.env.FRONTEND_URL || '') + actionUrl}`,
  }).catch((error) => console.error('Security email failed:', error))

  if (user.phone && process.env.SMS_WEBHOOK_URL) {
    await fetch(process.env.SMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SMS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        to: user.phone,
        message: `Hincton security alert: ${session.deviceName || 'a device'} signed in. Review devices in your profile.`,
      }),
    }).catch((error) => console.error('Security SMS failed:', error))
  }
}

const createLoginSession = async (user: any, req: express.Request, loginMethod: 'PASSWORD' | 'PHONE' = 'PASSWORD') => {
  const ipAddress = getClientIp(req)
  const userAgent = req.headers['user-agent'] || ''
  const deviceType = inferDeviceType(userAgent)
  const deviceName = inferDeviceName(userAgent)
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const refreshToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const matchingActiveSession = await prisma.userSession.findFirst({
    where: {
      userId: user.id,
      isRevoked: false,
      expiresAt: { gt: new Date() },
      userAgent: String(userAgent),
      ipAddress,
    },
  })

  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      sessionToken,
      refreshToken,
      ipAddress,
      userAgent: String(userAgent),
      deviceName,
      deviceType: deviceType as any,
      expiresAt,
    },
  })

  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      ipAddress,
      userAgent: String(userAgent),
      deviceType: deviceType as any,
      loginMethod,
      status: 'SUCCESS',
    },
  }).catch((error) => console.error('Login history create failed:', error))

  await notifySecurityLogin(user, session, !matchingActiveSession)
  return session
}

const serializeAddress = (address: any) => ({
  id: address.id,
  street: address.addressLine1,
  city: address.city,
  postalCode: address.postalCode,
  country: address.country,
  isDefault: address.isDefault,
})

const serializePaymentMethod = (paymentMethod: any) => ({
  id: paymentMethod.id,
  type: paymentMethod.type,
  last4: paymentMethod.last4,
  expiryMonth: paymentMethod.expiryMonth,
  expiryYear: paymentMethod.expiryYear,
  isDefault: paymentMethod.isDefault,
})

const serializeNotificationSettings = (settings: any) => ({
  email: Boolean(settings?.emailOrder),
  sms: Boolean(settings?.smsOrder),
  push: Boolean(settings?.pushOrder),
  orderUpdates: Boolean(settings?.emailOrder || settings?.smsOrder || settings?.pushOrder),
  promotions: Boolean(settings?.emailPromotion || settings?.smsPromotion || settings?.pushPromotion),
  newsletter: Boolean(settings?.emailNewsletter),
})

const ensureAccountShell = async (userId: string) => {
  await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })

  await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })

  await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

const sendPhoneOtp = async (phone: string, otp: string) => {
  if (!process.env.SMS_WEBHOOK_URL) {
    console.info(`Phone OTP for ${phone}: ${otp}`)
    return { delivered: false, devOtp: otp }
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
  })

  if (!response.ok) {
    throw new Error('SMS provider rejected OTP request')
  }

  return { delivered: true }
}

const syncGoogleUser = async (googleProfile: any, tokenData: any = {}) => {
  if (!googleProfile?.email || !googleProfile?.sub) {
    throw new Error('Invalid Google profile')
  }

  const email = String(googleProfile.email).toLowerCase()
  const providerAccountId = String(googleProfile.sub)
  const existingSocialAccount = await prisma.socialAccount.findUnique({
    where: { provider_providerAccountId: { provider: 'google', providerAccountId } },
    include: { user: { include: { profile: true, security: true } } },
  })

  let user: any = existingSocialAccount?.user

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, security: true },
    })
  }

  if (!user) {
    const createdUser = await prisma.user.create({
      data: {
        email,
        roles: [Role.BUYER],
        profile: {
          create: {
            fullName: googleProfile.name || '',
            firstName: googleProfile.given_name || undefined,
            lastName: googleProfile.family_name || undefined,
            avatar: googleProfile.picture || undefined,
          },
        },
        security: {
          create: {
            isEmailVerified: true,
            is_active: true,
          },
        },
        settings: { create: {} },
        wishlist: { create: {} },
        cart: { create: {} },
      },
    })
    user = await prisma.user.findUnique({
      where: { id: createdUser.id },
      include: { profile: true, security: true },
    })
  } else {
    if (!user.profile) {
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          fullName: googleProfile.name || '',
          firstName: googleProfile.given_name || undefined,
          lastName: googleProfile.family_name || undefined,
          avatar: googleProfile.picture || undefined,
        },
      })
    }

    await prisma.userSecurity.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isEmailVerified: true,
        is_active: true,
      },
      update: {
        isEmailVerified: true,
      },
    })
    await ensureAccountShell(user.id)
  }

  const socialAccountData = {
    userId: user.id,
    provider: 'google',
    providerAccountId,
    accessToken: tokenData.access_token || null,
    refreshToken: tokenData.refresh_token || null,
    expiresAt: tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000)
      : undefined,
  }

  if (existingSocialAccount) {
    await prisma.socialAccount.update({
      where: { id: existingSocialAccount.id },
      data: socialAccountData,
    })
  } else {
    await prisma.socialAccount.create({ data: socialAccountData })
  }

  return prisma.user.findUnique({
    where: { id: user.id },
    include: userInclude,
  })
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, agreed } = registerSchema.parse(req.body)

    if (ADMIN_EMAILS.has(email)) {
      return res.status(403).json(apiMessage(meatShopMessages.auth.emailRegistered))
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json(apiMessage(meatShopMessages.auth.emailRegistered))
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const { firstName, lastName } = splitName(name)

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
    })

    const session = await createLoginSession(user, req, 'PASSWORD')
    const buyerName = firstName || name.trim() || 'there'
    const welcomeMessage = `Welcome ${buyerName}. Your Hincton Meat account is ready, and you can now shop fresh meat, track orders, and message support from your buyer account.`

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ACCOUNT',
        title: `Welcome ${buyerName}`,
        message: welcomeMessage,
        actionUrl: '/profile',
        channel: 'IN_APP',
        sentAt: new Date(),
      },
    }).catch((error) => console.error('Welcome notification create failed:', error))

    sendEmail({
      to: user.email,
      subject: `Welcome ${buyerName} to Hincton Meat`,
      text: welcomeMessage,
      html: `<p>Hello ${buyerName},</p><p>${welcomeMessage}</p><p><a href="${process.env.FRONTEND_URL || ''}/profile">Open your account</a></p>`,
    }).catch((error) => console.error('Welcome email failed:', error))

    res.status(201).json({
      ...resolveMessage({ ...meatShopMessages.auth.accountCreated, text: welcomeMessage }),
      user: serializeUser(user),
      token: signToken(user, session.id),
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    if (error instanceof z.ZodError) {
      const passwordIssue = error.issues.find((issue) => issue.path.includes('password'))
      const emailIssue = error.issues.find((issue) => issue.path.includes('email'))
      const message = passwordIssue
        ? meatShopMessages.auth.passwordMinLength
        : emailIssue
          ? meatShopMessages.auth.invalidEmail
          : meatShopMessages.validation.acceptTerms
      return res.status(400).json({ ...apiMessage(message), details: error.issues })
    }
    res.status(500).json(apiMessage(meatShopMessages.system.unknownError))
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { email },
      include: userInclude,
    })

    if (!user?.security?.password_hash) {
      return res.status(401).json(apiMessage(meatShopMessages.auth.invalidCredentials))
    }

    if (!user.security.is_active) {
      return res.status(403).json({ ...apiMessage(meatShopMessages.security.suspiciousActivity), code: 'ACCOUNT_DISABLED' })
    }

    if (user.security.is_locked || (user.security.locked_until && user.security.locked_until > new Date())) {
      return res.status(423).json(apiMessage(meatShopMessages.auth.accountLocked))
    }

    if (!user.security.isEmailVerified) {
      return res.status(403).json(apiMessage(meatShopMessages.auth.verifyEmail))
    }

    const isAdminTrigger = ADMIN_EMAILS.has(email)
    if (isAdminTrigger && password !== ADMIN_PASSWORD) {
      return res.status(401).json(apiMessage(meatShopMessages.auth.invalidCredentials))
    }

    const isValidPassword = await bcrypt.compare(password, user.security.password_hash)
    if (!isValidPassword) {
      const attempts = user.security.login_attempts + 1
      const shouldLock = attempts >= 5
      await prisma.userSecurity.update({
        where: { userId: user.id },
        data: {
          login_attempts: attempts,
          is_locked: shouldLock,
          locked_until: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      })

      return res.status(401).json({
        ...apiMessage(shouldLock ? meatShopMessages.auth.accountLocked : meatShopMessages.auth.invalidCredentials),
      })
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
    ])

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: userInclude,
    })

    const session = await createLoginSession(refreshedUser || user, req, 'PASSWORD')

    res.json({
      ...resolveMessage(meatShopMessages.auth.welcomeBack, { name: refreshedUser?.profile?.fullName || user.profile?.fullName || user.email }),
      user: serializeUser(refreshedUser || user),
      token: signToken(refreshedUser || user, session.id),
    })
  } catch (error: any) {
    console.error('Login error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ ...apiMessage(meatShopMessages.auth.invalidCredentials), details: error.issues })
    }
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

router.post('/phone/request-otp', async (req, res) => {
  try {
    const { phone } = phoneOtpRequestSchema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { phone },
      include: userInclude,
    })

    if (!user?.security?.is_active) {
      return res.status(404).json({ error: 'No active account exists for this phone number' })
    }

    const otp = createOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.userSecurity.update({
      where: { userId: user.id },
      data: {
        phone_otp: otp,
        phone_otp_expires: expiresAt,
      },
    })

    const delivery = await sendPhoneOtp(phone, otp)
    res.json({
      message: 'OTP sent successfully',
      expiresAt,
      ...(delivery.devOtp ? { devOtp: delivery.devOtp } : {}),
    })
  } catch (error: any) {
    console.error('Phone OTP request error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid phone number', details: error.issues })
    }
    res.status(500).json({ error: 'Could not send OTP' })
  }
})

router.post('/phone/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = phoneOtpVerifySchema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { phone },
      include: userInclude,
    })

    if (!user?.security?.is_active) {
      return res.status(401).json({ error: 'Invalid phone number or OTP' })
    }

    const expiresAt = user.security.phone_otp_expires?.getTime() || 0
    if (user.security.phone_otp !== otp || expiresAt < Date.now()) {
      return res.status(401).json({ error: 'The verification code you entered is incorrect. Please try again or request a new code.' })
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
    ])

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: userInclude,
    })

    const session = await createLoginSession(refreshedUser || user, req, 'PHONE')

    res.json({
      message: 'Phone login successful',
      user: serializeUser(refreshedUser || user),
      token: signToken(refreshedUser || user, session.id),
    })
  } catch (error: any) {
    console.error('Phone OTP verify error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid OTP data', details: error.issues })
    }
    res.status(500).json({ error: 'Could not verify OTP' })
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { email },
      include: userInclude,
    })

    if (user?.security?.is_active) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      await prisma.userSecurity.update({
        where: { userId: user.id },
        data: {
          reset_token: resetToken,
          reset_token_expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      })

      await sendPasswordResetEmail(user.email, resetToken)
    }

    res.json(resolveMessage(meatShopMessages.auth.passwordResetSent))
  } catch (error: any) {
    console.error('Forgot password error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ ...apiMessage(meatShopMessages.auth.invalidEmail), details: error.issues })
    }
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body)
    const userSecurity = await prisma.userSecurity.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: { gt: new Date() },
        is_active: true,
      },
    })

    if (!userSecurity) {
      return res.status(400).json(apiMessage(meatShopMessages.auth.resetTokenExpired))
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.userSecurity.update({
      where: { userId: userSecurity.userId },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        password_changed_at: new Date(),
      },
    })

    res.json(resolveMessage(meatShopMessages.auth.passwordChanged))
  } catch (error: any) {
    console.error('Reset password error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ ...apiMessage(meatShopMessages.auth.passwordStrength), details: error.issues })
    }
    res.status(500).json(apiMessage(meatShopMessages.system.serverBusy))
  }
})

router.get('/google', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Google OAuth is not configured' })
    }

    const redirect = getSafeRedirectUrl(String(req.query.redirect || ''))
    const callbackUrl = getGoogleCallbackUrl(req)
    const state = encodeURIComponent(JSON.stringify({ redirect }))
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    }).toString()}`

    res.redirect(authUrl)
  } catch (error) {
    console.error('Google auth redirect error:', error)
    res.status(500).json({ error: 'Unable to start Google authentication' })
  }
})

router.post('/google', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return res.status(500).json({ error: 'Google OAuth is not configured' })
    }

    const { token } = googleIdTokenSchema.parse(req.body)
    const tokenInfoResponse = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: token },
    })
    const googleProfile = tokenInfoResponse.data

    if (googleProfile.aud !== clientId) {
      return res.status(401).json({ success: false, error: 'Invalid Google token audience' })
    }

    if (String(googleProfile.email_verified) !== 'true') {
      return res.status(401).json({ success: false, error: 'Google email is not verified' })
    }

    const user = await syncGoogleUser(googleProfile)
    if (!user?.security?.is_active) {
      return res.status(403).json({ success: false, error: 'Account is disabled' })
    }

    const session = await createLoginSession(user, req, 'PASSWORD')
    res.json({
      success: true,
      message: 'Google login successful',
      user: serializeUser(user),
      token: signToken(user, session.id),
    })
  } catch (error: any) {
    console.error('Google token auth error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Google token is required', details: error.issues })
    }
    res.status(401).json({ success: false, error: 'Invalid Google token' })
  }
})

router.get('/google/callback', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Google OAuth is not configured' })
    }

    const code = String(req.query.code || '')
    const state = String(req.query.state || '')
    let redirect = getSafeRedirectUrl(String(req.query.redirect || ''))
    if (state) {
      try {
        const decodedState = JSON.parse(decodeURIComponent(state))
        if (decodedState?.redirect) {
          redirect = getSafeRedirectUrl(String(decodedState.redirect))
        }
      } catch {
        // ignore invalid state
      }
    }

    if (!code) {
      const url = new URL(redirect)
      url.searchParams.set('error', 'missing_code')
      return res.redirect(url.toString())
    }

    const callbackUrl = getGoogleCallbackUrl(req)
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const accessToken = tokenResponse.data.access_token
    if (!accessToken) {
      const url = new URL(redirect)
      url.searchParams.set('error', 'token_exchange_failed')
      return res.redirect(url.toString())
    }

    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const googleProfile = userInfoResponse.data
    if (!googleProfile?.email || !googleProfile?.sub) {
      const url = new URL(redirect)
      url.searchParams.set('error', 'invalid_google_profile')
      return res.redirect(url.toString())
    }

    const user = await syncGoogleUser(googleProfile, tokenResponse.data)
    if (!user?.security?.is_active) {
      const url = new URL(redirect)
      url.searchParams.set('error', 'account_disabled')
      return res.redirect(url.toString())
    }

    const session = await createLoginSession(user, req, 'PASSWORD')
    const token = signToken(user, session.id)
    const url = new URL(redirect)
    url.searchParams.set('token', token)
    res.redirect(url.toString())
  } catch (error) {
    console.error('Google auth callback error:', error)
    const redirect = getSafeRedirectUrl(String(req.query.redirect || ''))
    const url = new URL(redirect)
    url.searchParams.set('error', 'google_auth_failed')
    res.redirect(url.toString())
  }
})

router.get('/callback/google', (req, res) => {
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  res.redirect(`/api/auth/google/callback${query}`)
})

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (!(await isDecodedSessionActive(decoded))) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: userInclude,
    })

    if (!user) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    res.json({ user: serializeUser(user) })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
  }
})

router.get('/linked-accounts', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const accounts = await prisma.socialAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const providers = [
      { provider: 'google', label: 'Google', configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) },
      { provider: 'github', label: 'GitHub', configured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) },
      { provider: 'facebook', label: 'Facebook', configured: Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) },
    ]

    res.json({
      accounts,
      providers: providers.map((provider) => ({
        ...provider,
        connected: accounts.some((account) => account.provider.toLowerCase() === provider.provider),
        connectUrl: provider.configured ? `/api/auth/${provider.provider}` : null,
      })),
    })
  } catch (error) {
    console.error('Get linked accounts error:', error)
    res.status(500).json({ error: 'Could not load linked accounts' })
  }
})

router.delete('/linked-accounts/:id', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const result = await prisma.socialAccount.deleteMany({
      where: { id: req.params.id, userId },
    })

    if (result.count === 0) return res.status(404).json({ error: 'Linked account not found' })
    res.json({ message: 'Linked account removed successfully' })
  } catch (error) {
    console.error('Delete linked account error:', error)
    res.status(500).json({ error: 'Could not remove linked account' })
  }
})

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (!(await isDecodedSessionActive(decoded))) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: userInclude,
    })

    if (!user) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    res.json({ user: serializeUser(user) })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
  }
})

const serializeSession = (session: any, currentSessionId?: string | null) => ({
  id: session.id,
  deviceName: session.deviceName || inferDeviceName(session.userAgent || ''),
  deviceType: session.deviceType || inferDeviceType(session.userAgent || ''),
  ipAddress: session.ipAddress,
  userAgent: session.userAgent,
  createdAt: session.createdAt,
  lastActivity: session.lastActivity,
  expiresAt: session.expiresAt,
  isRevoked: session.isRevoked,
  isCurrent: session.id === currentSessionId,
})

router.get('/sessions', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    const currentSessionId = getSessionIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const sessions = await prisma.userSession.findMany({
      where: { userId },
      orderBy: { lastActivity: 'desc' },
      take: 50,
    })

    res.json({
      sessions: sessions.map((session) => serializeSession(session, currentSessionId)),
      activeCount: sessions.filter((session) => !session.isRevoked && session.expiresAt > new Date()).length,
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
  }
})

router.delete('/sessions/:id', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    await prisma.userSession.updateMany({
      where: { id: req.params.id, userId },
      data: { isRevoked: true },
    })

    res.json({ message: 'Device session logged out' })
  } catch (error) {
    console.error('Revoke session error:', error)
    res.status(500).json({ error: 'Could not log out device' })
  }
})

router.post('/sessions/revoke-others', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    const currentSessionId = getSessionIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const result = await prisma.userSession.updateMany({
      where: {
        userId,
        id: currentSessionId ? { not: currentSessionId } : undefined,
        isRevoked: false,
      },
      data: { isRevoked: true },
    })

    res.json({ message: 'Other devices logged out', count: result.count })
  } catch (error) {
    console.error('Revoke other sessions error:', error)
    res.status(500).json({ error: 'Could not log out other devices' })
  }
})

router.post('/sessions/:id/accept', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const session = await prisma.userSession.findFirst({ where: { id: req.params.id, userId } })
    if (!session) return res.status(404).json({ error: 'Session not found' })

    await prisma.notification.updateMany({
      where: {
        userId,
        type: 'ACCOUNT',
        data: { path: ['sessionId'], equals: req.params.id },
      } as any,
      data: { isRead: true, readAt: new Date() },
    }).catch(() => undefined)

    res.json({ message: 'Device accepted' })
  } catch (error) {
    console.error('Accept session error:', error)
    res.status(500).json({ error: 'Could not accept device' })
  }
})

router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (!(await isDecodedSessionActive(decoded))) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const {
      name,
      firstName: providedFirstName,
      lastName: providedLastName,
      username,
      phone,
      avatar,
      coverImage,
      bio,
      website,
      preferredDeliveryLocation,
      locationLatitude,
      locationLongitude,
      locationLabel,
    } = req.body
    const split = splitName(name || '')
    const firstName = providedFirstName ?? split.firstName
    const lastName = providedLastName ?? split.lastName
    const fullName = name || [firstName, lastName].filter(Boolean).join(' ')

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
    })

    res.json({
      message: messageText(meatShopMessages.system.preferencesSaved),
      code: meatShopMessages.system.preferencesSaved.code,
      type: meatShopMessages.system.preferencesSaved.type,
      user: serializeUser(user),
    })
  } catch (error) {
    console.error('Profile update error:', error)
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ message: 'That username or phone number is already in use.' })
    }
    res.status(500).json(apiMessage(meatShopMessages.system.unknownError))
  }
})

router.post('/profile/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    if (!req.file) return res.status(400).json(apiMessage(meatShopMessages.system.unknownError))

    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (!(await isDecodedSessionActive(decoded))) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const avatarUrl = await storeAvatar(req.file)

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
    })

    res.json({ ...resolveMessage(meatShopMessages.system.preferencesSaved), user: serializeUser(user), avatar: avatarUrl })
  } catch (error) {
    console.error('Avatar update error:', error)
    res.status(500).json({ error: 'Could not update avatar' })
  }
})

router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (!(await isDecodedSessionActive(decoded))) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: userInclude,
    })

    if (!user?.security?.password_hash || !user.security.is_active) {
      return res.status(404).json({ error: 'User not found' })
    }

    const currentPasswordMatches = await bcrypt.compare(currentPassword, user.security.password_hash)
    if (!currentPasswordMatches) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    const changedAt = new Date()
    await prisma.userSecurity.update({
      where: { userId: user.id },
      data: {
        password_hash: hashedPassword,
        password_changed_at: changedAt,
      },
    })

    const currentSessionId = decoded.sessionId as string | undefined
    const revokedSessions = await prisma.userSession.updateMany({
      where: {
        userId: user.id,
        id: currentSessionId ? { not: currentSessionId } : undefined,
        isRevoked: false,
      },
      data: { isRevoked: true },
    })

    const io = req.app?.get?.('io')
    if (io) {
      io.to(`user:${user.id}`).emit('account:password-changed', {
        userId: user.id,
        currentSessionId,
        changedAt: changedAt.toISOString(),
        message: 'Your password was changed. Other signed-in devices have been logged out.',
      })
    }

    res.json({
      ...resolveMessage(meatShopMessages.auth.passwordChanged),
      revokedSessions: revokedSessions.count,
    })
  } catch (error: any) {
    console.error('Change password error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid password data', details: error.issues })
    }
    res.status(500).json({ error: 'Could not change password' })
  }
})

router.get('/addresses', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const addresses = await prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    res.json({ addresses: addresses.map(serializeAddress) })
  } catch (error) {
    console.error('Get addresses error:', error)
    res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
  }
})

router.post('/addresses', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const data = addressSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    const [firstName, ...restName] = (user?.profile?.fullName || user?.email || '').split(/\s+/)

    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } })
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
    })

    res.status(201).json({ address: serializeAddress(address) })
  } catch (error: any) {
    console.error('Add address error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid address data', details: error.issues })
    res.status(500).json({ error: 'Could not add address' })
  }
})

router.put('/addresses/:id', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const data = addressSchema.partial().parse(req.body)
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId, deletedAt: null } })
    if (!existing) return res.status(404).json({ error: 'Address not found' })

    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } })
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
    })

    res.json({ address: serializeAddress(address) })
  } catch (error: any) {
    console.error('Update address error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid address data', details: error.issues })
    res.status(500).json({ error: 'Could not update address' })
  }
})

router.delete('/addresses/:id', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const result = await prisma.address.updateMany({
      where: { id: req.params.id, userId, deletedAt: null },
      data: { deletedAt: new Date(), isDefault: false },
    })

    if (result.count === 0) return res.status(404).json({ error: 'Address not found' })
    res.json({ message: 'Address deleted successfully' })
  } catch (error) {
    console.error('Delete address error:', error)
    res.status(500).json({ error: 'Could not delete address' })
  }
})

router.put('/addresses/:id/default', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId, deletedAt: null } })
    if (!existing) return res.status(404).json({ error: 'Address not found' })

    await prisma.address.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } })
    const address = await prisma.address.update({ where: { id: req.params.id }, data: { isDefault: true } })

    res.json({ address: serializeAddress(address) })
  } catch (error) {
    console.error('Set default address error:', error)
    res.status(500).json({ error: 'Could not update default address' })
  }
})

router.get('/payment-methods', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    res.json({ paymentMethods: paymentMethods.map(serializePaymentMethod) })
  } catch (error) {
    console.error('Get payment methods error:', error)
    res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
  }
})

router.post('/payment-methods', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const data = paymentMethodSchema.parse(req.body)
    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } })
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
    })

    res.status(201).json({ paymentMethod: serializePaymentMethod(paymentMethod) })
  } catch (error: any) {
    console.error('Add payment method error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payment method data', details: error.issues })
    res.status(500).json({ error: 'Could not add payment method' })
  }
})

router.delete('/payment-methods/:id', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const result = await prisma.paymentMethod.deleteMany({ where: { id: req.params.id, userId } })
    if (result.count === 0) return res.status(404).json({ error: 'Payment method not found' })
    res.json({ message: 'Payment method deleted successfully' })
  } catch (error) {
    console.error('Delete payment method error:', error)
    res.status(500).json({ error: 'Could not delete payment method' })
  }
})

router.put('/payment-methods/:id/default', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const existing = await prisma.paymentMethod.findFirst({ where: { id: req.params.id, userId } })
    if (!existing) return res.status(404).json({ error: 'Payment method not found' })

    await prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } })
    const paymentMethod = await prisma.paymentMethod.update({ where: { id: req.params.id }, data: { isDefault: true } })

    res.json({ paymentMethod: serializePaymentMethod(paymentMethod) })
  } catch (error) {
    console.error('Set default payment method error:', error)
    res.status(500).json({ error: 'Could not update default payment method' })
  }
})

router.get('/notification-settings', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const settings = await prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } })
    res.json({ notifications: serializeNotificationSettings(settings) })
  } catch (error) {
    console.error('Get notification settings error:', error)
    res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
  }
})

router.put('/notification-settings', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const data = notificationSettingsSchema.parse(req.body)
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
    })

    res.json({ notifications: serializeNotificationSettings(settings) })
  } catch (error: any) {
    console.error('Update notification settings error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid notification settings', details: error.issues })
    res.status(500).json({ error: 'Could not update notification settings' })
  }
})

router.delete('/search-history', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const result = await prisma.searchHistory.deleteMany({ where: { userId } })
    res.json({ message: 'Search history cleared', count: result.count })
  } catch (error) {
    console.error('Clear search history error:', error)
    res.status(500).json({ error: 'Could not clear search history' })
  }
})

router.delete('/chat-history', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const result = await prisma.liveChatMessage.deleteMany({
      where: {
        OR: [
          { userId },
          { adminId: userId },
        ],
      },
    })
    res.json({ message: 'Chat history cleared', count: result.count })
  } catch (error) {
    console.error('Clear chat history error:', error)
    res.status(500).json({ error: 'Could not clear chat history' })
  }
})

router.delete('/device-history', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    const currentSessionId = getSessionIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const result = await prisma.userSession.updateMany({
      where: { userId, id: currentSessionId ? { not: currentSessionId } : undefined },
      data: { isRevoked: true },
    })
    res.json({ message: 'Device history cleared', count: result.count })
  } catch (error) {
    console.error('Clear device history error:', error)
    res.status(500).json({ error: 'Could not clear device history' })
  }
})

router.delete('/account', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))

    const data = closeAccountSchema.parse(req.body || {})
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (!user) return res.status(404).json({ error: 'Account not found' })

    const identifier = data.identifier.trim().toLowerCase()
    const phone = String(user.phone || user.profile?.mpesaPhone || '').trim().toLowerCase()
    if (identifier !== user.email.toLowerCase() && identifier !== phone) {
      return res.status(400).json({ error: 'Enter the email or phone number on this account to confirm deletion.' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.liveChatMessage.deleteMany({ where: { OR: [{ userId }, { adminId: userId }] } })
      await tx.reviewImage.deleteMany({ where: { review: { userId } } })
      await tx.review.deleteMany({ where: { userId } })
      await tx.searchHistory.deleteMany({ where: { userId } })
      await tx.searchQuery.deleteMany({ where: { userId } }).catch(() => undefined)
      await tx.productView.deleteMany({ where: { userId } })
      await tx.notification.deleteMany({ where: { userId } })
      await tx.loginHistory.deleteMany({ where: { userId } })
      await tx.loginAttempt.deleteMany({ where: { userId } }).catch(() => undefined)
      await tx.userSession.deleteMany({ where: { userId } })
      await tx.paymentMethod.deleteMany({ where: { userId } })
      await tx.address.deleteMany({ where: { userId } })
      await tx.socialAccount.deleteMany({ where: { userId } })
      await tx.userSettings.deleteMany({ where: { userId } })
      await tx.userSecurity.deleteMany({ where: { userId } })
      await tx.userProfile.deleteMany({ where: { userId } })
      await tx.wishlistItem.deleteMany({ where: { wishlist: { userId } } })
      await tx.wishlist.deleteMany({ where: { userId } })
      await tx.cartItem.deleteMany({ where: { cart: { userId } } })
      await tx.cart.deleteMany({ where: { userId } })
      await tx.order.updateMany({ where: { userId }, data: { userId: null, deletedAt: new Date() } })
      await tx.user.delete({ where: { id: userId } })
    })

    res.json({ message: 'Account permanently deleted' })
  } catch (error: any) {
    console.error('Close account error:', error)
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'You must confirm with your email or phone and agree before closing the account.', details: error.issues })
    res.status(500).json({ error: 'Could not close account' })
  }
})

export default router
