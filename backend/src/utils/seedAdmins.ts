import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const Role = {
  ADMIN: 'ADMIN',
} as const

const ADMIN_PASSWORD = 'admin123@'
const admins = [
  { email: 'admin@meat.com', name: 'Hincton Meat Products Admin' },
  { email: 'admin2@meat.com', name: 'Hincton Meat Products Admin 2' },
]

const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  for (const admin of admins) {
    const { firstName, lastName } = splitName(admin.name)

    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        roles: [Role.ADMIN],
        deletedAt: null,
        profile: {
          upsert: {
            update: {
              firstName,
              lastName,
              fullName: admin.name,
            },
            create: {
              firstName,
              lastName,
              fullName: admin.name,
            },
          },
        },
        security: {
          upsert: {
            update: {
              password_hash: passwordHash,
              isEmailVerified: true,
              is_active: true,
              is_locked: false,
              locked_until: null,
              password_changed_at: new Date(),
            },
            create: {
              password_hash: passwordHash,
              isEmailVerified: true,
              is_active: true,
              password_changed_at: new Date(),
            },
          },
        },
        settings: {
          upsert: {
            update: {},
            create: {},
          },
        },
        wishlist: {
          upsert: {
            update: {},
            create: {},
          },
        },
        cart: {
          upsert: {
            update: {},
            create: {},
          },
        },
      },
      create: {
        email: admin.email,
        roles: [Role.ADMIN],
        profile: {
          create: {
            firstName,
            lastName,
            fullName: admin.name,
          },
        },
        security: {
          create: {
            password_hash: passwordHash,
            isEmailVerified: true,
            is_active: true,
            password_changed_at: new Date(),
          },
        },
        settings: { create: {} },
        wishlist: { create: {} },
        cart: { create: {} },
      },
    })

    console.log(`Seeded admin ${admin.email} (${user.id})`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
