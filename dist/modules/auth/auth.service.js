"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../../config/supabase");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = __importDefault(require("../../config/logger"));
class AuthService {
    generateToken(userId, role, email) {
        return jsonwebtoken_1.default.sign({ userId, role, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' });
    }
    async register(data) {
        const { email, phone, password, role, name } = data;
        if (!email && !phone) {
            throw new errorHandler_1.AppError('Email or phone number is required', 400);
        }
        const existingUserQuery = supabase_1.supabaseAdmin
            .from('users')
            .select('id');
        if (email) {
            existingUserQuery.eq('email', email);
        }
        else if (phone) {
            existingUserQuery.eq('phone', phone);
        }
        const { data: existingUser } = await existingUserQuery.maybeSingle();
        if (existingUser) {
            throw new errorHandler_1.AppError('User already exists', 409);
        }
        await bcryptjs_1.default.hash(password, 12);
        const { data: user, error: userError } = await supabase_1.supabaseAdmin
            .from('users')
            .insert({
            email,
            phone,
            role,
            auth_provider: 'password'
        })
            .select()
            .single();
        if (userError || !user) {
            logger_1.default.error('User creation failed:', userError);
            throw new errorHandler_1.AppError('Failed to create user', 500);
        }
        if (role === 'senior') {
            const { error: seniorError } = await supabase_1.supabaseAdmin
                .from('seniors')
                .insert({
                user_id: user.id,
                name,
                date_of_birth: new Date().toISOString().split('T')[0],
                preferences: { font_size: 'large', contrast: 'normal' }
            });
            if (seniorError) {
                logger_1.default.error('Senior profile creation failed:', seniorError);
                throw new errorHandler_1.AppError('Failed to create senior profile', 500);
            }
        }
        else if (role === 'caregiver') {
            const { error: caregiverError } = await supabase_1.supabaseAdmin
                .from('caregivers')
                .insert({
                user_id: user.id,
                name
            });
            if (caregiverError) {
                logger_1.default.error('Caregiver profile creation failed:', caregiverError);
                throw new errorHandler_1.AppError('Failed to create caregiver profile', 500);
            }
        }
        const token = this.generateToken(user.id, user.role, user.email);
        const refreshToken = this.generateRefreshToken(user.id);
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'user',
            entity_id: user.id,
            action: 'register',
            user_id: user.id,
            changes: { role, auth_provider: 'password' }
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            token,
            refreshToken
        };
    }
    async login(data) {
        const { email, phone } = data;
        if (!email && !phone) {
            throw new errorHandler_1.AppError('Email or phone number is required', 400);
        }
        const query = supabase_1.supabaseAdmin
            .from('users')
            .select('id, email, phone, role');
        if (email) {
            query.eq('email', email);
        }
        else if (phone) {
            query.eq('phone', phone);
        }
        const { data: user, error } = await query.maybeSingle();
        if (error || !user) {
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        }
        const token = this.generateToken(user.id, user.role, user.email);
        const refreshToken = this.generateRefreshToken(user.id);
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'user',
            entity_id: user.id,
            action: 'login',
            user_id: user.id
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            token,
            refreshToken
        };
    }
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET);
            if (decoded.type !== 'refresh') {
                throw new errorHandler_1.AppError('Invalid refresh token', 401);
            }
            const { data: user, error } = await supabase_1.supabaseAdmin
                .from('users')
                .select('id, email, role')
                .eq('id', decoded.userId)
                .maybeSingle();
            if (error || !user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const newToken = this.generateToken(user.id, user.role, user.email);
            const newRefreshToken = this.generateRefreshToken(user.id);
            return {
                token: newToken,
                refreshToken: newRefreshToken
            };
        }
        catch (error) {
            throw new errorHandler_1.AppError('Invalid or expired refresh token', 401);
        }
    }
    async generateMagicLink(email) {
        const { data: user } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, type: 'magic_link' }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const magicLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
        logger_1.default.info(`Magic link generated for ${email}: ${magicLink}`);
        return { magicLink };
    }
    async verifyMagicLink(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (decoded.type !== 'magic_link') {
                throw new errorHandler_1.AppError('Invalid magic link', 401);
            }
            const { data: user, error } = await supabase_1.supabaseAdmin
                .from('users')
                .select('id, email, role')
                .eq('id', decoded.userId)
                .maybeSingle();
            if (error || !user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const accessToken = this.generateToken(user.id, user.role, user.email);
            const refreshToken = this.generateRefreshToken(user.id);
            return {
                user,
                token: accessToken,
                refreshToken
            };
        }
        catch (error) {
            throw new errorHandler_1.AppError('Invalid or expired magic link', 401);
        }
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map