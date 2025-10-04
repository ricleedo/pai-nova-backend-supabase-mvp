import { Request, Response } from 'express';
export declare class RemindersController {
    getRemindersForSenior: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getReminderById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createReminder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateReminder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteReminder: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getDoseEvents: (req: Request, res: Response, next: import("express").NextFunction) => void;
    confirmDoseEvent: (req: Request, res: Response, next: import("express").NextFunction) => void;
    skipDoseEvent: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAdherenceStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
declare const _default: RemindersController;
export default _default;
//# sourceMappingURL=reminders.controller.d.ts.map