export declare class SchedulerService {
    private tasks;
    start(): void;
    checkPendingReminders(): Promise<void>;
    checkMissedDoses(): Promise<void>;
    generateDailyAlerts(): Promise<void>;
    stop(): void;
}
declare const _default: SchedulerService;
export default _default;
//# sourceMappingURL=scheduler.service.d.ts.map