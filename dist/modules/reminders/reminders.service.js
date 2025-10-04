"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const supabase_1 = require("../../config/supabase");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = __importDefault(require("../../config/logger"));
class RemindersService {
    async getRemindersForSenior(seniorId, _userId, _userRole) {
        const { data: reminders, error } = await supabase_1.supabaseAdmin
            .from('reminders')
            .select('*')
            .eq('senior_id', seniorId)
            .eq('active', true)
            .order('created_at', { ascending: false });
        if (error) {
            logger_1.default.error('Failed to fetch reminders:', error);
            throw new errorHandler_1.AppError('Failed to fetch reminders', 500);
        }
        return reminders;
    }
    async getReminderById(reminderId) {
        const { data: reminder, error } = await supabase_1.supabaseAdmin
            .from('reminders')
            .select('*')
            .eq('id', reminderId)
            .maybeSingle();
        if (error) {
            logger_1.default.error('Failed to fetch reminder:', error);
            throw new errorHandler_1.AppError('Failed to fetch reminder', 500);
        }
        if (!reminder) {
            throw new errorHandler_1.AppError('Reminder not found', 404);
        }
        return reminder;
    }
    async createReminder(data, createdBy) {
        const { data: reminder, error } = await supabase_1.supabaseAdmin
            .from('reminders')
            .insert({
            ...data,
            created_by: createdBy,
            active: data.active ?? true
        })
            .select()
            .single();
        if (error) {
            logger_1.default.error('Failed to create reminder:', error);
            throw new errorHandler_1.AppError('Failed to create reminder', 500);
        }
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'reminder',
            entity_id: reminder.id,
            action: 'create',
            user_id: createdBy,
            changes: data
        });
        return reminder;
    }
    async updateReminder(reminderId, data, userId) {
        const { data: reminder, error } = await supabase_1.supabaseAdmin
            .from('reminders')
            .update(data)
            .eq('id', reminderId)
            .select()
            .single();
        if (error) {
            logger_1.default.error('Failed to update reminder:', error);
            throw new errorHandler_1.AppError('Failed to update reminder', 500);
        }
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'reminder',
            entity_id: reminderId,
            action: 'update',
            user_id: userId,
            changes: data
        });
        return reminder;
    }
    async deleteReminder(reminderId, userId) {
        const { error } = await supabase_1.supabaseAdmin
            .from('reminders')
            .update({ active: false })
            .eq('id', reminderId);
        if (error) {
            logger_1.default.error('Failed to delete reminder:', error);
            throw new errorHandler_1.AppError('Failed to delete reminder', 500);
        }
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'reminder',
            entity_id: reminderId,
            action: 'deactivate',
            user_id: userId
        });
        return { message: 'Reminder deactivated successfully' };
    }
    async getDoseEvents(seniorId, startDate, endDate) {
        let query = supabase_1.supabaseAdmin
            .from('dose_events')
            .select(`
        *,
        reminders(id, title, type)
      `)
            .eq('senior_id', seniorId)
            .order('scheduled_at', { ascending: false });
        if (startDate) {
            query = query.gte('scheduled_at', startDate);
        }
        if (endDate) {
            query = query.lte('scheduled_at', endDate);
        }
        const { data: events, error } = await query;
        if (error) {
            logger_1.default.error('Failed to fetch dose events:', error);
            throw new errorHandler_1.AppError('Failed to fetch dose events', 500);
        }
        return events;
    }
    async confirmDoseEvent(eventId, method, notes) {
        const { data: event, error } = await supabase_1.supabaseAdmin
            .from('dose_events')
            .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            confirmation_method: method,
            notes
        })
            .eq('id', eventId)
            .select()
            .single();
        if (error) {
            logger_1.default.error('Failed to confirm dose event:', error);
            throw new errorHandler_1.AppError('Failed to confirm dose event', 500);
        }
        return event;
    }
    async skipDoseEvent(eventId, notes) {
        const { data: event, error } = await supabase_1.supabaseAdmin
            .from('dose_events')
            .update({
            status: 'skipped',
            notes
        })
            .eq('id', eventId)
            .select()
            .single();
        if (error) {
            logger_1.default.error('Failed to skip dose event:', error);
            throw new errorHandler_1.AppError('Failed to skip dose event', 500);
        }
        return event;
    }
    async getAdherenceStats(seniorId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const { data: events, error } = await supabase_1.supabaseAdmin
            .from('dose_events')
            .select('status')
            .eq('senior_id', seniorId)
            .gte('scheduled_at', startDate.toISOString());
        if (error) {
            logger_1.default.error('Failed to fetch adherence stats:', error);
            throw new errorHandler_1.AppError('Failed to fetch adherence stats', 500);
        }
        const total = events.length;
        const confirmed = events.filter(e => e.status === 'confirmed').length;
        const missed = events.filter(e => e.status === 'missed').length;
        const skipped = events.filter(e => e.status === 'skipped').length;
        const pending = events.filter(e => e.status === 'pending').length;
        return {
            total,
            confirmed,
            missed,
            skipped,
            pending,
            adherenceRate: total > 0 ? ((confirmed / total) * 100).toFixed(2) : 0
        };
    }
}
exports.RemindersService = RemindersService;
exports.default = new RemindersService();
//# sourceMappingURL=reminders.service.js.map