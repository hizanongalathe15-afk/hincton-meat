"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const index_1 = require("../index");
exports.UserModel = {
    findById: async (id) => {
        const user = await index_1.prisma.user.findUnique({
            where: { id }
        });
        return user ? {
            ...user,
            role: user.role
        } : null;
    },
    findByEmail: async (email) => {
        const user = await index_1.prisma.user.findUnique({
            where: { email }
        });
        return user ? {
            ...user,
            role: user.role
        } : null;
    },
    create: async (userData) => {
        const user = await index_1.prisma.user.create({
            data: userData
        });
        return {
            ...user,
            role: user.role
        };
    },
    update: async (id, userData) => {
        const user = await index_1.prisma.user.update({
            where: { id },
            data: userData
        });
        return {
            ...user,
            role: user.role
        };
    },
    delete: async (id) => {
        await index_1.prisma.user.delete({
            where: { id }
        });
    }
};
//# sourceMappingURL=User.js.map