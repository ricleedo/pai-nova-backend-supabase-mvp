import { UserRole } from '../../types';
interface RegisterData {
    email?: string;
    phone?: string;
    password: string;
    role: UserRole;
    name: string;
}
interface LoginData {
    email?: string;
    phone?: string;
    password: string;
}
export declare class AuthService {
    private generateToken;
    magicRegister(email: string): Promise<{
        user: {
            id: any;
            email: string;
            role: UserRole;
        };
        pendingEmailVerification: boolean;
        magicLink: string;
    }>;
    magicLogin(email: string): Promise<{
        user: {
            id: any;
            email: any;
            role: any;
        };
        emailVerified: boolean;
        magicLink: string;
    }>;
    private generateRefreshToken;
    register(data: RegisterData): Promise<{
        user: {
            id: any;
            email: any;
            role: any;
        };
        pendingEmailVerification: boolean;
    }>;
    login(data: LoginData): Promise<{
        user: {
            id: any;
            email: any;
            role: any;
        };
        emailVerified: boolean;
    }>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    generateMagicLink(email: string): Promise<{
        sent: boolean;
        magicLink: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        user: {
            id: any;
            email: any;
            role: any;
        };
        token: string;
        refreshToken: string;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map