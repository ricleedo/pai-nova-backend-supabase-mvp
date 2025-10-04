import { ReminderType } from '../../types';
export declare class RemindersService {
    getRemindersForSenior(seniorId: string, _userId: string, _userRole: string): Promise<any[]>;
    getReminderById(reminderId: string): Promise<any>;
    createReminder(data: {
        senior_id: string;
        type: ReminderType;
        title: string;
        description?: string;
        schedule_cron: string;
        active?: boolean;
    }, createdBy: string): Promise<any>;
    updateReminder(reminderId: string, data: any, userId: string): Promise<any>;
    deleteReminder(reminderId: string, userId: string): Promise<{
        message: string;
    }>;
    getDoseEvents(seniorId: string, startDate?: string, endDate?: string): Promise<any[]>;
    confirmDoseEvent(eventId: string, method: 'tap' | 'voice' | 'caregiver', notes?: string): Promise<any>;
    skipDoseEvent(eventId: string, notes?: string): Promise<any>;
    getAdherenceStats(seniorId: string, days?: number): Promise<{
        total: number;
        confirmed: number;
        missed: number;
        skipped: number;
        pending: number;
        adherenceRate: string | number;
    }>;
}
declare const _default: RemindersService;
export default _default;
//# sourceMappingURL=reminders.service.d.ts.map