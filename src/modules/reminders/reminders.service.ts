import { supabaseAdmin } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../config/logger';
import { ReminderType } from '../../types';

export class RemindersService {
  async getRemindersForSenior(seniorId: string, _userId: string, _userRole: string) {
    const { data: reminders, error } = await supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('senior_id', seniorId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch reminders:', error);
      throw new AppError('Failed to fetch reminders', 500);
    }

    return reminders;
  }

  async getReminderById(reminderId: string) {
    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch reminder:', error);
      throw new AppError('Failed to fetch reminder', 500);
    }

    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }

    return reminder;
  }

  async createReminder(data: {
    senior_id: string;
    type: ReminderType;
    title: string;
    description?: string;
    schedule_cron: string;
    active?: boolean;
  }, createdBy: string) {
    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .insert({
        ...data,
        created_by: createdBy,
        active: data.active ?? true
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create reminder:', error);
      throw new AppError('Failed to create reminder', 500);
    }

    await supabaseAdmin
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

  async updateReminder(reminderId: string, data: any, userId: string) {
    const { data: reminder, error } = await supabaseAdmin
      .from('reminders')
      .update(data)
      .eq('id', reminderId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update reminder:', error);
      throw new AppError('Failed to update reminder', 500);
    }

    await supabaseAdmin
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

  async deleteReminder(reminderId: string, userId: string) {
    const { error } = await supabaseAdmin
      .from('reminders')
      .update({ active: false })
      .eq('id', reminderId);

    if (error) {
      logger.error('Failed to delete reminder:', error);
      throw new AppError('Failed to delete reminder', 500);
    }

    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'reminder',
        entity_id: reminderId,
        action: 'deactivate',
        user_id: userId
      });

    return { message: 'Reminder deactivated successfully' };
  }

  async getDoseEvents(seniorId: string, startDate?: string, endDate?: string) {
    let query = supabaseAdmin
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
      logger.error('Failed to fetch dose events:', error);
      throw new AppError('Failed to fetch dose events', 500);
    }

    return events;
  }

  async confirmDoseEvent(eventId: string, method: 'tap' | 'voice' | 'caregiver', notes?: string) {
    const { data: event, error } = await supabaseAdmin
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
      logger.error('Failed to confirm dose event:', error);
      throw new AppError('Failed to confirm dose event', 500);
    }

    return event;
  }

  async skipDoseEvent(eventId: string, notes?: string) {
    const { data: event, error } = await supabaseAdmin
      .from('dose_events')
      .update({
        status: 'skipped',
        notes
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to skip dose event:', error);
      throw new AppError('Failed to skip dose event', 500);
    }

    return event;
  }

  async getAdherenceStats(seniorId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: events, error } = await supabaseAdmin
      .from('dose_events')
      .select('status')
      .eq('senior_id', seniorId)
      .gte('scheduled_at', startDate.toISOString());

    if (error) {
      logger.error('Failed to fetch adherence stats:', error);
      throw new AppError('Failed to fetch adherence stats', 500);
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

export default new RemindersService();
