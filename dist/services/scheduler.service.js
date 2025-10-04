"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const supabase_1 = require("../config/supabase");
const logger_1 = __importDefault(require("../config/logger"));
class SchedulerService {
    tasks = new Map();
    start() {
        logger_1.default.info('Starting scheduler service');
        node_cron_1.default.schedule('*/5 * * * *', this.checkPendingReminders.bind(this));
        logger_1.default.info('Scheduled reminder check job (every 5 minutes)');
        node_cron_1.default.schedule('0 * * * *', this.checkMissedDoses.bind(this));
        logger_1.default.info('Scheduled missed dose check job (every hour)');
        node_cron_1.default.schedule('0 0 * * *', this.generateDailyAlerts.bind(this));
        logger_1.default.info('Scheduled daily alert generation (midnight)');
    }
    async checkPendingReminders() {
        try {
            logger_1.default.info('Checking for upcoming reminders...');
            const { data: reminders, error } = await supabase_1.supabaseAdmin
                .from('reminders')
                .select('*')
                .eq('active', true);
            if (error) {
                logger_1.default.error('Error fetching reminders:', error);
                return;
            }
            for (const reminder of reminders || []) {
                logger_1.default.info(`Processing reminder: ${reminder.id} - ${reminder.title}`);
            }
            logger_1.default.info(`Processed ${reminders?.length || 0} reminders`);
        }
        catch (error) {
            logger_1.default.error('Error in checkPendingReminders:', error);
        }
    }
    async checkMissedDoses() {
        try {
            logger_1.default.info('Checking for missed doses...');
            const now = new Date().toISOString();
            const { data: missedEvents, error } = await supabase_1.supabaseAdmin
                .from('dose_events')
                .select('*, seniors(name), reminders(title)')
                .eq('status', 'pending')
                .lt('scheduled_at', now);
            if (error) {
                logger_1.default.error('Error fetching missed doses:', error);
                return;
            }
            for (const event of missedEvents || []) {
                await supabase_1.supabaseAdmin
                    .from('dose_events')
                    .update({ status: 'missed' })
                    .eq('id', event.id);
                await supabase_1.supabaseAdmin
                    .from('alerts')
                    .insert({
                    senior_id: event.senior_id,
                    type: 'missed_dose',
                    severity: 'warning',
                    message: `Missed: ${event.reminders.title}`
                });
                logger_1.default.info(`Marked dose event ${event.id} as missed`);
            }
            logger_1.default.info(`Found ${missedEvents?.length || 0} missed doses`);
        }
        catch (error) {
            logger_1.default.error('Error in checkMissedDoses:', error);
        }
    }
    async generateDailyAlerts() {
        try {
            logger_1.default.info('Generating daily adherence alerts...');
            const { data: seniors, error } = await supabase_1.supabaseAdmin
                .from('seniors')
                .select('id, name');
            if (error) {
                logger_1.default.error('Error fetching seniors:', error);
                return;
            }
            for (const senior of seniors || []) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const { data: events } = await supabase_1.supabaseAdmin
                    .from('dose_events')
                    .select('status')
                    .eq('senior_id', senior.id)
                    .gte('scheduled_at', thirtyDaysAgo.toISOString());
                if (!events || events.length === 0)
                    continue;
                const total = events.length;
                const confirmed = events.filter(e => e.status === 'confirmed').length;
                const adherenceRate = (confirmed / total) * 100;
                if (adherenceRate < 80) {
                    await supabase_1.supabaseAdmin
                        .from('alerts')
                        .insert({
                        senior_id: senior.id,
                        type: 'low_adherence',
                        severity: adherenceRate < 60 ? 'critical' : 'warning',
                        message: `Adherence rate is ${adherenceRate.toFixed(1)}% over the last 30 days`
                    });
                    logger_1.default.info(`Low adherence alert created for senior ${senior.id}`);
                }
            }
            logger_1.default.info('Daily alert generation complete');
        }
        catch (error) {
            logger_1.default.error('Error in generateDailyAlerts:', error);
        }
    }
    stop() {
        logger_1.default.info('Stopping scheduler service');
        this.tasks.forEach((task, key) => {
            task.stop();
            logger_1.default.info(`Stopped task: ${key}`);
        });
        this.tasks.clear();
    }
}
exports.SchedulerService = SchedulerService;
exports.default = new SchedulerService();
//# sourceMappingURL=scheduler.service.js.map