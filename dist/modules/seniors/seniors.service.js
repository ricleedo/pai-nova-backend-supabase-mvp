"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeniorsService = void 0;
const supabase_1 = require("../../config/supabase");
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = __importDefault(require("../../config/logger"));
class SeniorsService {
    async getAllSeniors(userId, userRole, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        let query = supabase_1.supabaseAdmin
            .from('seniors')
            .select('*, users!inner(email, phone)', { count: 'exact' });
        if (userRole === 'caregiver') {
            const { data: caregiver } = await supabase_1.supabaseAdmin
                .from('caregivers')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();
            if (!caregiver) {
                throw new errorHandler_1.AppError('Caregiver profile not found', 404);
            }
            const { data: seniorCaregivers } = await supabase_1.supabaseAdmin
                .from('senior_caregivers')
                .select('senior_id')
                .eq('caregiver_id', caregiver.id);
            const seniorIds = seniorCaregivers?.map(sc => sc.senior_id) || [];
            query = query.in('id', seniorIds);
        }
        else if (userRole === 'senior') {
            query = query.eq('user_id', userId);
        }
        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });
        if (error) {
            logger_1.default.error('Failed to fetch seniors:', error);
            throw new errorHandler_1.AppError('Failed to fetch seniors', 500);
        }
        return {
            seniors: data,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        };
    }
    async getSeniorById(seniorId, userId, userRole) {
        let query = supabase_1.supabaseAdmin
            .from('seniors')
            .select(`
        *,
        users!inner(email, phone, role),
        institutions(id, name, type),
        senior_caregivers(
          id,
          relationship,
          permissions,
          caregivers(id, name, user_id)
        )
      `)
            .eq('id', seniorId);
        if (userRole === 'senior') {
            query = query.eq('user_id', userId);
        }
        const { data: senior, error } = await query.maybeSingle();
        if (error) {
            logger_1.default.error('Failed to fetch senior:', error);
            throw new errorHandler_1.AppError('Failed to fetch senior', 500);
        }
        if (!senior) {
            throw new errorHandler_1.AppError('Senior not found', 404);
        }
        if (userRole === 'caregiver') {
            const hasAccess = senior.senior_caregivers?.some((sc) => sc.caregivers.user_id === userId);
            if (!hasAccess) {
                throw new errorHandler_1.AppError('Access denied', 403);
            }
        }
        return senior;
    }
    async createSenior(data, createdBy) {
        const { user_id, name, date_of_birth, emergency_contact, institution_id, preferences } = data;
        const { data: senior, error } = await supabase_1.supabaseAdmin
            .from('seniors')
            .insert({
            user_id,
            name,
            date_of_birth,
            emergency_contact: emergency_contact || {},
            institution_id,
            preferences: preferences || { font_size: 'large', contrast: 'normal' }
        })
            .select()
            .single();
        if (error) {
            logger_1.default.error('Failed to create senior:', error);
            throw new errorHandler_1.AppError('Failed to create senior', 500);
        }
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'senior',
            entity_id: senior.id,
            action: 'create',
            user_id: createdBy,
            changes: data
        });
        return senior;
    }
    async updateSenior(seniorId, data, userId, userRole) {
        if (userRole === 'caregiver') {
            const { data: caregiver } = await supabase_1.supabaseAdmin
                .from('caregivers')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();
            if (!caregiver) {
                throw new errorHandler_1.AppError('Caregiver profile not found', 404);
            }
            const { data: relationship } = await supabase_1.supabaseAdmin
                .from('senior_caregivers')
                .select('permissions')
                .eq('senior_id', seniorId)
                .eq('caregiver_id', caregiver.id)
                .maybeSingle();
            if (!relationship || !relationship.permissions?.edit) {
                throw new errorHandler_1.AppError('No edit permission for this senior', 403);
            }
        }
        const { data: senior, error } = await supabase_1.supabaseAdmin
            .from('seniors')
            .update(data)
            .eq('id', seniorId)
            .select()
            .single();
        if (error) {
            logger_1.default.error('Failed to update senior:', error);
            throw new errorHandler_1.AppError('Failed to update senior', 500);
        }
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'senior',
            entity_id: seniorId,
            action: 'update',
            user_id: userId,
            changes: data
        });
        return senior;
    }
    async deleteSenior(seniorId, userId) {
        const { error } = await supabase_1.supabaseAdmin
            .from('seniors')
            .delete()
            .eq('id', seniorId);
        if (error) {
            logger_1.default.error('Failed to delete senior:', error);
            throw new errorHandler_1.AppError('Failed to delete senior', 500);
        }
        await supabase_1.supabaseAdmin
            .from('audit_logs')
            .insert({
            entity_type: 'senior',
            entity_id: seniorId,
            action: 'delete',
            user_id: userId
        });
        return { message: 'Senior deleted successfully' };
    }
    async assignCaregiver(seniorId, caregiverId, relationship, permissions) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('senior_caregivers')
            .insert({
            senior_id: seniorId,
            caregiver_id: caregiverId,
            relationship,
            permissions: permissions || { view: true, edit: false, manage_reminders: false }
        })
            .select()
            .single();
        if (error) {
            logger_1.default.error('Failed to assign caregiver:', error);
            throw new errorHandler_1.AppError('Failed to assign caregiver', 500);
        }
        return data;
    }
}
exports.SeniorsService = SeniorsService;
exports.default = new SeniorsService();
//# sourceMappingURL=seniors.service.js.map