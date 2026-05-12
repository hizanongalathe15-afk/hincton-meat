export interface UserProfile {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    preferences?: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        marketingEmails: boolean;
    };
}
export interface CreateUserData {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'ADMIN' | 'BUYER' | 'AFFILIATE';
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    preferences?: {
        emailNotifications?: boolean;
        smsNotifications?: boolean;
        marketingEmails?: boolean;
    };
}
declare class UserService {
    createUser(userData: CreateUserData): Promise<{
        success: boolean;
        user?: any;
        error?: string;
    }>;
    updateUser(userId: string, updateData: UpdateUserData): Promise<{
        success: boolean;
        user?: any;
        error?: string;
    }>;
    getUserProfile(userId: string): Promise<{
        user?: any;
        error?: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    blockUser(userId: string, reason: string, blockedBy: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    unblockUser(userId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    deleteUser(userId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    createAdminUser(userData: CreateUserData): Promise<{
        success: boolean;
        user?: any;
        error?: string;
    }>;
    getUserStats(dateRange?: {
        from: Date;
        to: Date;
    }): Promise<{
        totalUsers: number;
        activeUsers: number;
        newUsers: number;
        blockedUsers: number;
        usersByRole: Record<string, number>;
    }>;
    searchUsers(query: string, page?: number, limit?: number): Promise<{
        users: any[];
        total: number;
        page: number;
        pages: number;
    }>;
    updateUserRole(userId: string, role: 'ADMIN' | 'BUYER' | 'AFFILIATE'): Promise<{
        success: boolean;
        error?: string;
    }>;
    updateUserPreferences(userId: string, preferences: UserProfile['preferences']): Promise<{
        success: boolean;
        error?: string;
    }>;
    getUserActivity(userId: string, days?: number): Promise<{
        loginCount: number;
        lastLogin: Date | null;
        averageSessionDuration: number;
    }>;
}
export declare const userService: UserService;
export default userService;
//# sourceMappingURL=userService.d.ts.map