"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reminders_controller_1 = __importDefault(require("./reminders.controller"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/seniors/:seniorId/reminders', reminders_controller_1.default.getRemindersForSenior);
router.get('/:id', reminders_controller_1.default.getReminderById);
router.post('/', reminders_controller_1.default.createReminder);
router.put('/:id', reminders_controller_1.default.updateReminder);
router.delete('/:id', reminders_controller_1.default.deleteReminder);
router.get('/seniors/:seniorId/dose-events', reminders_controller_1.default.getDoseEvents);
router.post('/dose-events/:eventId/confirm', reminders_controller_1.default.confirmDoseEvent);
router.post('/dose-events/:eventId/skip', reminders_controller_1.default.skipDoseEvent);
router.get('/seniors/:seniorId/adherence', reminders_controller_1.default.getAdherenceStats);
exports.default = router;
//# sourceMappingURL=reminders.routes.js.map