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
const email_service_1 = require("../../services/email.service");
const crypto_1 = require("crypto");
class AuthService {
    generateToken(userId, role, email) {
        return jsonwebtoken_1.default.sign({ userId, role, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '7d' });
    }
    // Magic-link only registration: create user (if not exists) and send verify link
    async magicRegister(email) {
        if (!email) {
            throw new errorHandler_1.AppError('Email is required', 400);
        }
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, email_verified, role')
            .eq('email', email)
            .maybeSingle();
        let userId = existing?.id;
        const userRole = existing?.role || 'senior';
        if (!userId) {
            const { data: created, error } = await supabase_1.supabaseAdmin
                .from('users')
                .insert({ email, role: 'senior', auth_provider: 'magic_link', email_verified: false })
                .select('id, role')
                .single();
            if (error || !created) {
                throw new errorHandler_1.AppError('Failed to create user', 500);
            }
            userId = created.id;
        }
        const { magicLink } = await this.generateMagicLink(email);
        await supabase_1.supabaseAdmin.from('audit_logs').insert({
            entity_type: 'user',
            entity_id: userId,
            action: 'magic_register_link_sent',
            user_id: userId
        });
        return { user: { id: userId, email, role: userRole }, pendingEmailVerification: true, magicLink };
    }
    // Magic-link only login: require existing user; send sign-in link
    async magicLogin(email) {
        if (!email) {
            throw new errorHandler_1.AppError('Email is required', 400);
        }
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, email, role, email_verified')
            .eq('email', email)
            .maybeSingle();
        if (error || !user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const { magicLink } = await this.generateMagicLink(email);
        await supabase_1.supabaseAdmin.from('audit_logs').insert({
            entity_type: 'user',
            entity_id: user.id,
            action: 'magic_login_link_sent',
            user_id: user.id
        });
        return { user: { id: user.id, email: user.email, role: user.role }, emailVerified: user.email_verified === true, magicLink };
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' });
    }
    async register(data) {
        const { email, password, role, name } = data;
        if (!email) {
            throw new errorHandler_1.AppError('Email is required', 400);
        }
        const { data: existingUser } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        if (existingUser) {
            throw new errorHandler_1.AppError('User already exists', 409);
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const { data: user, error: userError } = await supabase_1.supabaseAdmin
            .from('users')
            .insert({
            email,
            role,
            auth_provider: 'password',
            password_hash: passwordHash
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
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'user',
            entity_id: user.id,
            action: 'register',
            user_id: user.id,
            changes: { role, auth_provider: 'password' }
        });
        // Immediately send magic link for email verification/sign-in
        await this.generateMagicLink(email);
        return { user: { id: user.id, email: user.email, role: user.role }, pendingEmailVerification: true };
    }
    async login(data) {
        const { email, password } = data;
        if (!email) {
            throw new errorHandler_1.AppError('Email is required', 400);
        }
        const { data: user, error } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, email, role, password_hash, email_verified')
            .eq('email', email)
            .maybeSingle();
        if (error || !user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const ok = user.password_hash ? await bcryptjs_1.default.compare(password, user.password_hash) : false;
        if (!ok) {
            throw new errorHandler_1.AppError('Wrong password', 401);
        }
        // Send a magic link to complete login/verification each time
        await this.generateMagicLink(email);
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'user',
            entity_id: user.id,
            action: 'login_magic_link_sent',
            user_id: user.id
        });
        return { user: { id: user.id, email: user.email, role: user.role }, emailVerified: user.email_verified === true };
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
        // Upsert user by email; default role senior and auth_provider magic_link if created
        const { data: existing } = await supabase_1.supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('email', email)
            .maybeSingle();
        let userId = existing?.id;
        if (!userId) {
            const { data: created, error: insertErr } = await supabase_1.supabaseAdmin
                .from('users')
                .insert({ email, role: 'senior', auth_provider: 'magic_link' })
                .select('id, role')
                .single();
            if (insertErr || !created) {
                logger_1.default.error('Failed to create user for magic link:', insertErr);
                throw new errorHandler_1.AppError('Failed to create user', 500);
            }
            userId = created.id;
        }
        const jti = (0, crypto_1.randomUUID)();
        const token = jsonwebtoken_1.default.sign({ userId, type: 'magic_link', email, jti }, process.env.JWT_SECRET, { expiresIn: '15m' });
        // Persist JTI for single-use enforcement
        await supabase_1.supabaseAdmin
            .from('magic_link_uses')
            .insert({ jti, email });
        const frontendLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
        const backendLink = `${process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/api/${process.env.API_VERSION || 'v1'}/auth/verify?token=${token}`;
        try {
            const purpose = existing ? 'signin' : 'verify';
            await (0, email_service_1.sendMagicLinkEmail)({ to: email, frontendLink, backendLink, purpose: purpose });
        }
        catch (err) {
            logger_1.default.error('Failed to send magic link email:', err);
            // Still return the link for testing purposes when email fails
            return { sent: false, magicLink: backendLink };
        }
        logger_1.default.info(`Magic link issued for ${email}`);
        return { sent: true, magicLink: backendLink };
    }
    async verifyMagicLink(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (decoded.type !== 'magic_link') {
                throw new errorHandler_1.AppError('Invalid magic link', 401);
            }
            // Enforce single-use by checking jti not used
            const { data: ml, error: mlErr } = await supabase_1.supabaseAdmin
                .from('magic_link_uses')
                .select('id, used_at')
                .eq('jti', decoded.jti)
                .maybeSingle();
            if (mlErr || !ml) {
                throw new errorHandler_1.AppError('Invalid magic link', 401);
            }
            if (ml.used_at) {
                throw new errorHandler_1.AppError('Magic link already used', 401);
            }
            const { data: user, error } = await supabase_1.supabaseAdmin
                .from('users')
                .select('id, email, role, email_verified')
                .eq('id', decoded.userId)
                .maybeSingle();
            if (error || !user) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            // mark email verified and consume magic link
            await Promise.all([
                supabase_1.supabaseAdmin
                    .from('users')
                    .update({ email_verified: true, auth_provider: 'magic_link' })
                    .eq('id', decoded.userId),
                supabase_1.supabaseAdmin
                    .from('magic_link_uses')
                    .update({ used_at: new Date().toISOString() })
                    .eq('jti', decoded.jti)
            ]);
            const accessToken = this.generateToken(user.id, user.role, user.email);
            const refreshToken = this.generateRefreshToken(user.id);
            return {
                user: { id: user.id, email: user.email, role: user.role },
                token: accessToken,
                refreshToken
            };
        }
        catch (error) {
            // If token expired, delete unverified user automatically as requested
            const err = error;
            if (err && err.name === 'TokenExpiredError') {
                const decoded = jsonwebtoken_1.default.decode(token);
                if (decoded?.userId) {
                    const { data: user } = await supabase_1.supabaseAdmin
                        .from('users')
                        .select('id, email_verified')
                        .eq('id', decoded.userId)
                        .maybeSingle();
                    if (user && user.email_verified !== true) {
                        await supabase_1.supabaseAdmin.from('users').delete().eq('id', decoded.userId);
                    }
                }
            }
            throw new errorHandler_1.AppError('Invalid or expired magic link', 401);
        }
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map