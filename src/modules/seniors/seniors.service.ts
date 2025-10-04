import { supabaseAdmin } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../config/logger';

export class SeniorsService {
  async getAllSeniors(userId: string, userRole: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('seniors')
      .select('*, users!inner(email, phone)', { count: 'exact' });

    if (userRole === 'caregiver') {
      const { data: caregiver } = await supabaseAdmin
        .from('caregivers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!caregiver) {
        throw new AppError('Caregiver profile not found', 404);
      }

      const { data: seniorCaregivers } = await supabaseAdmin
        .from('senior_caregivers')
        .select('senior_id')
        .eq('caregiver_id', caregiver.id);

      const seniorIds = seniorCaregivers?.map(sc => sc.senior_id) || [];
      query = query.in('id', seniorIds);
    } else if (userRole === 'senior') {
      query = query.eq('user_id', userId);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch seniors:', error);
      throw new AppError('Failed to fetch seniors', 500);
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

  async getSeniorById(seniorId: string, userId: string, userRole: string) {
    let query = supabaseAdmin
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
      logger.error('Failed to fetch senior:', error);
      throw new AppError('Failed to fetch senior', 500);
    }

    if (!senior) {
      throw new AppError('Senior not found', 404);
    }

    if (userRole === 'caregiver') {
      const hasAccess = senior.senior_caregivers?.some(
        (sc: any) => sc.caregivers.user_id === userId
      );

      if (!hasAccess) {
        throw new AppError('Access denied', 403);
      }
    }

    return senior;
  }

  async createSenior(data: any, createdBy: string) {
    const { user_id, name, date_of_birth, emergency_contact, institution_id, preferences } = data;

    const { data: senior, error } = await supabaseAdmin
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
      logger.error('Failed to create senior:', error);
      throw new AppError('Failed to create senior', 500);
    }

    await supabaseAdmin
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

  async updateSenior(seniorId: string, data: any, userId: string, userRole: string) {
    if (userRole === 'caregiver') {
      const { data: caregiver } = await supabaseAdmin
        .from('caregivers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!caregiver) {
        throw new AppError('Caregiver profile not found', 404);
      }

      const { data: relationship } = await supabaseAdmin
        .from('senior_caregivers')
        .select('permissions')
        .eq('senior_id', seniorId)
        .eq('caregiver_id', caregiver.id)
        .maybeSingle();

      if (!relationship || !relationship.permissions?.edit) {
        throw new AppError('No edit permission for this senior', 403);
      }
    }

    const { data: senior, error } = await supabaseAdmin
      .from('seniors')
      .update(data)
      .eq('id', seniorId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update senior:', error);
      throw new AppError('Failed to update senior', 500);
    }

    await supabaseAdmin
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

  async deleteSenior(seniorId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('seniors')
      .delete()
      .eq('id', seniorId);

    if (error) {
      logger.error('Failed to delete senior:', error);
      throw new AppError('Failed to delete senior', 500);
    }

    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'senior',
        entity_id: seniorId,
        action: 'delete',
        user_id: userId
      });

    return { message: 'Senior deleted successfully' };
  }

  async assignCaregiver(seniorId: string, caregiverId: string, relationship: string, permissions: any) {
    const { data, error } = await supabaseAdmin
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
      logger.error('Failed to assign caregiver:', error);
      throw new AppError('Failed to assign caregiver', 500);
    }

    return data;
  }
}

export default new SeniorsService();
