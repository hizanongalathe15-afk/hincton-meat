import express from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import { z } from 'zod'
import multer from 'multer'
import { sendPasswordResetEmail } from '../utils/emailService'
import { uploadImage } from '../config/cloudinary'
import { meatShopMessages, messageText, resolveMessage } from '../messages/meatShopMessages'

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
})

const ADMIN_EMAILS = new Set(['admin@meat.com', 'admin2@meat.com'])
const ADMIN_PASSWORD = 'admin123@'
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key'
const Role = {
  BUYER: 'BUYER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const
type RoleValue = typeof Role[keyof typeof Role]

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
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

const signToken = (user: any) => {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRE as any) || '7d' }
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: getPrimaryRole(user.roles || []) === 'admin' ? 'ADMIN' : 'BUYER',
      roles: user.roles || [],
    },
    JWT_SECRET,
    options
  )
}

const getUserIdFromRequest = (req: express.Request) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const decoded = jwt.verify(token, JWT_SECRET) as any
  return decoded.userId as string
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

    res.status(201).json({
      ...resolveMessage(meatShopMessages.auth.accountCreated),
      user: serializeUser(user),
      token: signToken(user),
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

    res.json({
      ...resolveMessage(meatShopMessages.auth.welcomeBack, { name: refreshedUser?.profile?.fullName || user.profile?.fullName || user.email }),
      user: serializeUser(refreshedUser || user),
      token: signToken(refreshedUser || user),
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

    res.json({
      message: 'Phone login successful',
      user: serializeUser(refreshedUser || user),
      token: signToken(refreshedUser || user),
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

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
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

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
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

router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json(apiMessage(meatShopMessages.system.sessionExpired))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
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
    const avatarUrl = (await uploadImage(req.file.buffer, 'hincton/profiles')).url

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
    await prisma.userSecurity.update({
      where: { userId: user.id },
      data: {
        password_hash: hashedPassword,
        password_changed_at: new Date(),
      },
    })

    res.json(resolveMessage(meatShopMessages.auth.passwordChanged))
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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
    const userId = getUserIdFromRequest(req)
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

export default router
