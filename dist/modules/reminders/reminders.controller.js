"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersController = void 0;
const reminders_service_1 = __importDefault(require("./reminders.service"));
const errorHandler_1 = require("../../middleware/errorHandler");
class RemindersController {
    getRemindersForSenior = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const { seniorId } = req.params;
        const reminders = await reminders_service_1.default.getRemindersForSenior(seniorId, user.id, user.role);
        res.status(200).json({
            success: true,
            data: reminders
        });
    });
    getReminderById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const reminder = await reminders_service_1.default.getReminderById(id);
        res.status(200).json({
            success: true,
            data: reminder
        });
    });
    createReminder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const reminder = await reminders_service_1.default.createReminder(req.body, user.id);
        res.status(201).json({
            success: true,
            message: 'Reminder created successfully',
            data: reminder
        });
    });
    updateReminder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const { id } = req.params;
        const reminder = await reminders_service_1.default.updateReminder(id, req.body, user.id);
        res.status(200).json({
            success: true,
            message: 'Reminder updated successfully',
            data: reminder
        });
    });
    deleteReminder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const user = req.user;
        const { id } = req.params;
        await reminders_service_1.default.deleteReminder(id, user.id);
        res.status(200).json({
            success: true,
            message: 'Reminder deleted successfully'
        });
    });
    getDoseEvents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { seniorId } = req.params;
        const { startDate, endDate } = req.query;
        const events = await reminders_service_1.default.getDoseEvents(seniorId, startDate, endDate);
        res.status(200).json({
            success: true,
            data: events
        });
    });
    confirmDoseEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { eventId } = req.params;
        const { method, notes } = req.body;
        const event = await reminders_service_1.default.confirmDoseEvent(eventId, method, notes);
        res.status(200).json({
            success: true,
            message: 'Dose event confirmed',
            data: event
        });
    });
    skipDoseEvent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { eventId } = req.params;
        const { notes } = req.body;
        const event = await reminders_service_1.default.skipDoseEvent(eventId, notes);
        res.status(200).json({
            success: true,
            message: 'Dose event skipped',
            data: event
        });
    });
    getAdherenceStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
        const { seniorId } = req.params;
        const days = parseInt(req.query.days) || 30;
        const stats = await reminders_service_1.default.getAdherenceStats(seniorId, days);
        res.status(200).json({
            success: true,
            data: stats
        });
    });
}
exports.RemindersController = RemindersController;
exports.default = new RemindersController();
//# sourceMappingURL=reminders.controller.js.map