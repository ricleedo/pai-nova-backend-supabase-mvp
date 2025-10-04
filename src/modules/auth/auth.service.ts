import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../config/logger';
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

export class AuthService {
  private generateToken(userId: string, role: UserRole, email?: string): string {
    return jwt.sign(
      { userId, role, email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRY || '7d' } as jwt.SignOptions
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' } as jwt.SignOptions
    );
  }

  async register(data: RegisterData) {
    const { email, phone, password, role, name } = data;

    if (!email && !phone) {
      throw new AppError('Email or phone number is required', 400);
    }

    const existingUserQuery = supabaseAdmin
      .from('users')
      .select('id');

    if (email) {
      existingUserQuery.eq('email', email);
    } else if (phone) {
      existingUserQuery.eq('phone', phone);
    }

    const { data: existingUser } = await existingUserQuery.maybeSingle();

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    await bcrypt.hash(password, 12);

    const { data: user, error: userError } = await supabaseAdmin
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

    const token = this.generateToken(user.id, user.role, user.email);
    const refreshToken = this.generateRefreshToken(user.id);

    await supabaseAdmin
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

  async login(data: LoginData) {
    const { email, phone } = data;

    if (!email && !phone) {
      throw new AppError('Email or phone number is required', 400);
    }

    const query = supabaseAdmin
      .from('users')
      .select('id, email, phone, role');

    if (email) {
      query.eq('email', email);
    } else if (phone) {
      query.eq('phone', phone);
    }

    const { data: user, error } = await query.maybeSingle();

    if (error || !user) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = this.generateToken(user.id, user.role, user.email);
    const refreshToken = this.generateRefreshToken(user.id);

    await supabaseAdmin
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
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const token = jwt.sign(
      { userId: user.id, type: 'magic_link' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const magicLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;

    logger.info(`Magic link generated for ${email}: ${magicLink}`);

    return { magicLink };
  }

  async verifyMagicLink(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      if (decoded.type !== 'magic_link') {
        throw new AppError('Invalid magic link', 401);
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', decoded.userId)
        .maybeSingle();

      if (error || !user) {
        throw new AppError('User not found', 404);
      }

      const accessToken = this.generateToken(user.id, user.role, user.email);
      const refreshToken = this.generateRefreshToken(user.id);

      return {
        user,
        token: accessToken,
        refreshToken
      };
    } catch (error) {
      throw new AppError('Invalid or expired magic link', 401);
    }
  }
}

export default new AuthService();
