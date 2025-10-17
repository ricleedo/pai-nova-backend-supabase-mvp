import { Request, Response } from 'express';
import authService from './auth.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.magicRegister(req.body.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.magicLogin(req.body.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  });

  sendMagicLink = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.generateMagicLink(email);

    res.status(200).json({
      success: true,
      message: 'Magic link sent to email',
      data: result
    });
  });

  verifyMagicLink = asyncHandler(async (req: Request, res: Response) => {
    const token = (req.method === 'GET') ? (req.query.token as string) : req.body.token;
    const result = await authService.verifyMagicLink(token);

    if (req.method === 'GET') {
      // Simple HTML response for convenience when clicking from email
      res.status(200).send(`<!doctype html><html><body>
        <h2>Verification successful</h2>
        <p>You can return to the app now.</p>
      </body></html>`);
    } else {
      res.status(200).json({
        success: true,
        message: 'Magic link verified successfully',
        data: result
      });
    }
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    res.status(200).json({
      success: true,
      data: { user }
    });
  });
}

export default new AuthController();
