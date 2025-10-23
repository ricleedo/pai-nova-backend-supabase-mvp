"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = __importDefault(require("./auth.service"));
const errorHandler_1 = require("../../middleware/errorHandler");
class AuthController {
    register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const result = await auth_service_1.default.magicRegister(req.body.email);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });
    });
    login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const result = await auth_service_1.default.magicLogin(req.body.email);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: result
        });
    });
    refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { refreshToken } = req.body;
        const result = await auth_service_1.default.refreshToken(refreshToken);
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: result
        });
    });
    sendMagicLink = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { email } = req.body;
        const result = await auth_service_1.default.generateMagicLink(email);
        res.status(200).json({
            success: true,
            message: 'Magic link sent to email',
            data: result
        });
    });
    verifyMagicLink = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const token = (req.method === 'GET') ? req.query.token : req.body.token;
        const result = await auth_service_1.default.verifyMagicLink(token);
        if (req.method === 'GET') {
            // Simple HTML response for convenience when clicking from email
            res.status(200).send(`<!doctype html><html><body>
        <h2>Verification successful</h2>
        <p>You can return to the app now.</p>
      </body></html>`);
        }
        else {
            res.status(200).json({
                success: true,
                message: 'Magic link verified successfully',
                data: result
            });
        }
    });
    getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        res.status(200).json({
            success: true,
            data: { user }
        });
    });
}
exports.AuthController = AuthController;
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map