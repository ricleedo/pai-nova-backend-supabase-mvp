"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeniorsController = void 0;
const seniors_service_1 = __importDefault(require("./seniors.service"));
const errorHandler_1 = require("../../middleware/errorHandler");
class SeniorsController {
    getAllSeniors = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await seniors_service_1.default.getAllSeniors(user.id, user.role, page, limit);
        res.status(200).json({
            success: true,
            data: result.seniors,
            pagination: result.pagination
        });
    });
    getSeniorById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const { id } = req.params;
        const senior = await seniors_service_1.default.getSeniorById(id, user.id, user.role);
        res.status(200).json({
            success: true,
            data: senior
        });
    });
    createSenior = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const senior = await seniors_service_1.default.createSenior(req.body, user.id);
        res.status(201).json({
            success: true,
            message: 'Senior created successfully',
            data: senior
        });
    });
    updateSenior = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const { id } = req.params;
        const senior = await seniors_service_1.default.updateSenior(id, req.body, user.id, user.role);
        res.status(200).json({
            success: true,
            message: 'Senior updated successfully',
            data: senior
        });
    });
    deleteSenior = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const { id } = req.params;
        await seniors_service_1.default.deleteSenior(id, user.id);
        res.status(200).json({
            success: true,
            message: 'Senior deleted successfully'
        });
    });
    assignCaregiver = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const { caregiver_id, relationship, permissions } = req.body;
        const result = await seniors_service_1.default.assignCaregiver(id, caregiver_id, relationship, permissions);
        res.status(201).json({
            success: true,
            message: 'Caregiver assigned successfully',
            data: result
        });
    });
}
exports.SeniorsController = SeniorsController;
exports.default = new SeniorsController();
//# sourceMappingURL=seniors.controller.js.map