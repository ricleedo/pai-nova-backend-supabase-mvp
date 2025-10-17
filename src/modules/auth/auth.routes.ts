import { Router } from 'express';
import authController from './auth.controller';
import { authenticateToken } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const magicLinkSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const verifyMagicLinkSchema = z.object({
  body: z.object({
    token: z.string()
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string()
  })
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/magic-link', validate(magicLinkSchema), authController.sendMagicLink);
router.post('/verify-magic-link', validate(verifyMagicLinkSchema), authController.verifyMagicLink);
// Backend-friendly GET verification (for email button clicks)
router.get('/verify', authController.verifyMagicLink);
router.get('/profile', authenticateToken, authController.getProfile);

export default router;
