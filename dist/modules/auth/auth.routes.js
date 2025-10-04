"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const auth_1 = require("../../middleware/auth");
const validator_1 = require("../../middleware/validator");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string().min(8),
        role: zod_1.z.enum(['senior', 'caregiver', 'institution_admin', 'super_admin']),
        name: zod_1.z.string().min(1)
    }).refine(data => data.email || data.phone, {
        message: 'Either email or phone is required'
    })
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string()
    }).refine(data => data.email || data.phone, {
        message: 'Either email or phone is required'
    })
});
const magicLinkSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email()
    })
});
const verifyMagicLinkSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string()
    })
});
const refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string()
    })
});
router.post('/register', (0, validator_1.validate)(registerSchema), auth_controller_1.default.register);
router.post('/login', (0, validator_1.validate)(loginSchema), auth_controller_1.default.login);
router.post('/refresh', (0, validator_1.validate)(refreshTokenSchema), auth_controller_1.default.refreshToken);
router.post('/magic-link', (0, validator_1.validate)(magicLinkSchema), auth_controller_1.default.sendMagicLink);
router.post('/verify-magic-link', (0, validator_1.validate)(verifyMagicLinkSchema), auth_controller_1.default.verifyMagicLink);
router.get('/profile', auth_1.authenticateToken, auth_controller_1.default.getProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map