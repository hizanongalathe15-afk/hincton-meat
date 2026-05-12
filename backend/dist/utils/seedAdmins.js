"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const Role = {
    ADMIN: 'ADMIN',
};
const ADMIN_PASSWORD = 'admin123@';
const admins = [
    { email: 'admin@meat.com', name: 'Hincton Meat Products Admin' },
    { email: 'admin2@meat.com', name: 'Hincton Meat Products Admin 2' },
];
const splitName = (name) => {
    const parts = name.trim().split(/\s+/);
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
    };
};
async function main() {
    const passwordHash = await bcryptjs_1.default.hash(ADMIN_PASSWORD, 12);
    for (const admin of admins) {
        const { firstName, lastName } = splitName(admin.name);
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
        });
        console.log(`Seeded admin ${admin.email} (${user.id})`);
    }
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seedAdmins.js.map