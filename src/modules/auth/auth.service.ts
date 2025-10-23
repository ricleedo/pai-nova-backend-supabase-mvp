import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../config/logger';
import { UserRole } from '../../types';
import { sendMagicLinkEmail } from '../../services/email.service';
import { randomUUID } from 'crypto';

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

export class AuthService {
  private generateToken(userId: string, role: UserRole, email?: string): string {
    return jwt.sign(
      { userId, role, email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRY || '7d' } as jwt.SignOptions
    );
  }

  // Magic-link only registration: create user (if not exists) and send verify link
  async magicRegister(email: string) {
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, email_verified, role')
      .eq('email', email)
      .maybeSingle();

    let userId = existing?.id;
    const userRole: UserRole = (existing?.role as UserRole) || 'senior';

    if (!userId) {
      const { data: created, error } = await supabaseAdmin
        .from('users')
        .insert({ email, role: 'senior', auth_provider: 'magic_link', email_verified: false })
        .select('id, role')
        .single();
      if (error || !created) {
        throw new AppError('Failed to create user', 500);
      }
      userId = created.id;
    }

    const { magicLink } = await this.generateMagicLink(email);

    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'user',
      entity_id: userId,
      action: 'magic_register_link_sent',
      user_id: userId
    });

    return { user: { id: userId, email, role: userRole }, pendingEmailVerification: true, magicLink };
  }

  // Magic-link only login: require existing user; send sign-in link
  async magicLogin(email: string) {
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, email_verified')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    const { magicLink } = await this.generateMagicLink(email);

    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'user',
      entity_id: user.id,
      action: 'magic_login_link_sent',
      user_id: user.id
    });

    return { user: { id: user.id, email: user.email, role: user.role }, emailVerified: user.email_verified === true, magicLink };
  }
  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' } as jwt.SignOptions
    );
  }

  async register(data: RegisterData) {
    const { email, password, role, name } = data;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error: userError } = await supabaseAdmin
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
      logger.error('User creation failed:', userError);
      throw new AppError('Failed to create user', 500);
    }

    if (role === 'senior') {
      const { error: seniorError } = await supabaseAdmin
        .from('seniors')
        .insert({
          user_id: user.id,
          name,
          date_of_birth: new Date().toISOString().split('T')[0],
          preferences: { font_size: 'large', contrast: 'normal' }
        });

      if (seniorError) {
        logger.error('Senior profile creation failed:', seniorError);
        throw new AppError('Failed to create senior profile', 500);
      }
    } else if (role === 'caregiver') {
      const { error: caregiverError } = await supabaseAdmin
        .from('caregivers')
        .insert({
          user_id: user.id,
          name
        });

      if (caregiverError) {
        logger.error('Caregiver profile creation failed:', caregiverError);
        throw new AppError('Failed to create caregiver profile', 500);
      }
    }

    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'user',
        entity_id: user.id,
        action: 'register',
        user_id: user.id,
        changes: { role, auth_provider: 'password' }
      });
    // Immediately send magic link for email verification/sign-in
    await this.generateMagicLink(email!);
    return { user: { id: user.id, email: user.email, role: user.role }, pendingEmailVerification: true };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, password_hash, email_verified')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      throw new AppError('User not found', 404);
    }

    const ok = user.password_hash ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) {
      throw new AppError('Wrong password', 401);
    }

    // Send a magic link to complete login/verification each time
    await this.generateMagicLink(email);

    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'user',
        entity_id: user.id,
        action: 'login_magic_link_sent',
        user_id: user.id
      });

    return { user: { id: user.id, email: user.email, role: user.role }, emailVerified: user.email_verified === true };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid refresh token', 401);
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', decoded.userId)
        .maybeSingle();

      if (error || !user) {
        throw new AppError('User not found', 404);
      }

      const newToken = this.generateToken(user.id, user.role, user.email);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async generateMagicLink(email: string) {
    // Upsert user by email; default role senior and auth_provider magic_link if created
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', email)
      .maybeSingle();

    let userId = existing?.id;

    if (!userId) {
      const { data: created, error: insertErr } = await supabaseAdmin
        .from('users')
        .insert({ email, role: 'senior', auth_provider: 'magic_link' })
        .select('id, role')
        .single();
      if (insertErr || !created) {
        logger.error('Failed to create user for magic link:', insertErr);
        throw new AppError('Failed to create user', 500);
      }
      userId = created.id;
    }

    const jti = randomUUID();
    const token = jwt.sign(
      { userId, type: 'magic_link', email, jti },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    // Persist JTI for single-use enforcement
    await supabaseAdmin
      .from('magic_link_uses')
      .insert({ jti, email });

    const frontendLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
    const backendLink = `${process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/api/${process.env.API_VERSION || 'v1'}/auth/verify?token=${token}`;

    try {
      const purpose = existing ? 'signin' : 'verify';
      await sendMagicLinkEmail({ to: email, frontendLink, backendLink, purpose: purpose as any });
    } catch (err) {
      logger.error('Failed to send magic link email:', err);
      // Still return the link for testing purposes when email fails
      return { sent: false, magicLink: backendLink };
    }

    logger.info(`Magic link issued for ${email}`);
    return { sent: true, magicLink: backendLink };
  }

  async verifyMagicLink(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'magic_link') {
        throw new AppError('Invalid magic link', 401);
      }

      // Enforce single-use by checking jti not used
      const { data: ml, error: mlErr } = await supabaseAdmin
        .from('magic_link_uses')
        .select('id, used_at')
        .eq('jti', decoded.jti)
        .maybeSingle();
      if (mlErr || !ml) {
        throw new AppError('Invalid magic link', 401);
      }
      if (ml.used_at) {
        throw new AppError('Magic link already used', 401);
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role, email_verified')
        .eq('id', decoded.userId)
        .maybeSingle();

      if (error || !user) {
        throw new AppError('User not found', 404);
      }

      // mark email verified and consume magic link
      await Promise.all([
        supabaseAdmin
          .from('users')
          .update({ email_verified: true, auth_provider: 'magic_link' })
          .eq('id', decoded.userId),
        supabaseAdmin
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
    } catch (error) {
      // If token expired, delete unverified user automatically as requested
      const err: any = error;
      if (err && err.name === 'TokenExpiredError') {
        const decoded: any = jwt.decode(token);
        if (decoded?.userId) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, email_verified')
            .eq('id', decoded.userId)
            .maybeSingle();
          if (user && user.email_verified !== true) {
            await supabaseAdmin.from('users').delete().eq('id', decoded.userId);
          }
        }
      }
      throw new AppError('Invalid or expired magic link', 401);
    }
  }
}

export default new AuthService();
