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
    private generateRefreshToken;
    register(data: RegisterData): Promise<{
        user: {
            id: any;
            email: any;
            phone: any;
            role: any;
        };
        token: string;
        refreshToken: string;
    }>;
    login(data: LoginData): Promise<{
        user: {
            id: any;
            email: any;
            phone: any;
            role: any;
        };
        token: string;
        refreshToken: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
    generateMagicLink(email: string): Promise<{
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