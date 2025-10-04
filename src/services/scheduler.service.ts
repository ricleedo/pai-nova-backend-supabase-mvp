import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';

export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  start() {
    logger.info('Starting scheduler service');

    cron.schedule('*/5 * * * *', this.checkPendingReminders.bind(this));
    logger.info('Scheduled reminder check job (every 5 minutes)');

    cron.schedule('0 * * * *', this.checkMissedDoses.bind(this));
    logger.info('Scheduled missed dose check job (every hour)');

    cron.schedule('0 0 * * *', this.generateDailyAlerts.bind(this));
    logger.info('Scheduled daily alert generation (midnight)');
  }

  async checkPendingReminders() {
    try {
      logger.info('Checking for upcoming reminders...');


      const { data: reminders, error } = await supabaseAdmin
        .from('reminders')
        .select('*')
        .eq('active', true);

      if (error) {
        logger.error('Error fetching reminders:', error);
        return;
      }

      for (const reminder of reminders || []) {
        logger.info(`Processing reminder: ${reminder.id} - ${reminder.title}`);
      }

      logger.info(`Processed ${reminders?.length || 0} reminders`);
    } catch (error) {
      logger.error('Error in checkPendingReminders:', error);
    }
  }

  async checkMissedDoses() {
    try {
      logger.info('Checking for missed doses...');

      const now = new Date().toISOString();

      const { data: missedEvents, error } = await supabaseAdmin
        .from('dose_events')
        .select('*, seniors(name), reminders(title)')
        .eq('status', 'pending')
        .lt('scheduled_at', now);

      if (error) {
        logger.error('Error fetching missed doses:', error);
        return;
      }

      for (const event of missedEvents || []) {
        await supabaseAdmin
          .from('dose_events')
          .update({ status: 'missed' })
          .eq('id', event.id);

        await supabaseAdmin
          .from('alerts')
          .insert({
            senior_id: event.senior_id,
            type: 'missed_dose',
            severity: 'warning',
            message: `Missed: ${event.reminders.title}`
          });

        logger.info(`Marked dose event ${event.id} as missed`);
      }

      logger.info(`Found ${missedEvents?.length || 0} missed doses`);
    } catch (error) {
      logger.error('Error in checkMissedDoses:', error);
    }
  }

  async generateDailyAlerts() {
    try {
      logger.info('Generating daily adherence alerts...');

      const { data: seniors, error } = await supabaseAdmin
        .from('seniors')
        .select('id, name');

      if (error) {
        logger.error('Error fetching seniors:', error);
        return;
      }

      for (const senior of seniors || []) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: events } = await supabaseAdmin
          .from('dose_events')
          .select('status')
          .eq('senior_id', senior.id)
          .gte('scheduled_at', thirtyDaysAgo.toISOString());

        if (!events || events.length === 0) continue;

        const total = events.length;
        const confirmed = events.filter(e => e.status === 'confirmed').length;
        const adherenceRate = (confirmed / total) * 100;

        if (adherenceRate < 80) {
          await supabaseAdmin
            .from('alerts')
            .insert({
              senior_id: senior.id,
              type: 'low_adherence',
              severity: adherenceRate < 60 ? 'critical' : 'warning',
              message: `Adherence rate is ${adherenceRate.toFixed(1)}% over the last 30 days`
            });

          logger.info(`Low adherence alert created for senior ${senior.id}`);
        }
      }

      logger.info('Daily alert generation complete');
    } catch (error) {
      logger.error('Error in generateDailyAlerts:', error);
    }
  }

  stop() {
    logger.info('Stopping scheduler service');
    this.tasks.forEach((task, key) => {
      task.stop();
      logger.info(`Stopped task: ${key}`);
    });
    this.tasks.clear();
  }
}

export default new SchedulerService();
