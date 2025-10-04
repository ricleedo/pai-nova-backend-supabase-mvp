import { Request, Response } from 'express';
import remindersService from './reminders.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class RemindersController {
  getRemindersForSenior = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { seniorId } = req.params;

    const reminders = await remindersService.getRemindersForSenior(seniorId, user.id, user.role);

    res.status(200).json({
      success: true,
      data: reminders
    });
  });

  getReminderById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const reminder = await remindersService.getReminderById(id);

    res.status(200).json({
      success: true,
      data: reminder
    });
  });

  createReminder = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const reminder = await remindersService.createReminder(req.body, user.id);

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: reminder
    });
  });

  updateReminder = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    const reminder = await remindersService.updateReminder(id, req.body, user.id);

    res.status(200).json({
      success: true,
      message: 'Reminder updated successfully',
      data: reminder
    });
  });

  deleteReminder = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    await remindersService.deleteReminder(id, user.id);

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  });

  getDoseEvents = asyncHandler(async (req: Request, res: Response) => {
    const { seniorId } = req.params;
    const { startDate, endDate } = req.query;

    const events = await remindersService.getDoseEvents(
      seniorId,
      startDate as string,
      endDate as string
    );

    res.status(200).json({
      success: true,
      data: events
    });
  });

  confirmDoseEvent = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { method, notes } = req.body;

    const event = await remindersService.confirmDoseEvent(eventId, method, notes);

    res.status(200).json({
      success: true,
      message: 'Dose event confirmed',
      data: event
    });
  });

  skipDoseEvent = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { notes } = req.body;

    const event = await remindersService.skipDoseEvent(eventId, notes);

    res.status(200).json({
      success: true,
      message: 'Dose event skipped',
      data: event
    });
  });

  getAdherenceStats = asyncHandler(async (req: Request, res: Response) => {
    const { seniorId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const stats = await remindersService.getAdherenceStats(seniorId, days);

    res.status(200).json({
      success: true,
      data: stats
    });
  });
}

export default new RemindersController();
