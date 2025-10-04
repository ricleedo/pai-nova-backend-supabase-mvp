"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seniors_controller_1 = __importDefault(require("./seniors.controller"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', seniors_controller_1.default.getAllSeniors);
router.get('/:id', seniors_controller_1.default.getSeniorById);
router.post('/', (0, auth_1.authorizeRoles)('institution_admin', 'super_admin'), seniors_controller_1.default.createSenior);
router.put('/:id', seniors_controller_1.default.updateSenior);
router.delete('/:id', (0, auth_1.authorizeRoles)('institution_admin', 'super_admin'), seniors_controller_1.default.deleteSenior);
router.post('/:id/caregivers', (0, auth_1.authorizeRoles)('institution_admin', 'super_admin'), seniors_controller_1.default.assignCaregiver);
exports.default = router;
//# sourceMappingURL=seniors.routes.js.map