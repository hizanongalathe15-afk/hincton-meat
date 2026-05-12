export interface IUser {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'BUYER' | 'AFFILIATE';
    phone?: string;
    isVerified: boolean;
    avatar?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserModel: {
    findById: (id: string) => Promise<IUser | null>;
    findByEmail: (email: string) => Promise<IUser | null>;
    create: (userData: Omit<IUser, "id" | "createdAt" | "updatedAt">) => Promise<IUser>;
    update: (id: string, userData: Partial<IUser>) => Promise<IUser>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=User.d.ts.map