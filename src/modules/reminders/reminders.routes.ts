import { Router } from 'express';
import remindersController from './reminders.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/seniors/:seniorId/reminders', remindersController.getRemindersForSenior);
router.get('/:id', remindersController.getReminderById);
router.post('/', remindersController.createReminder);
router.put('/:id', remindersController.updateReminder);
router.delete('/:id', remindersController.deleteReminder);

router.get('/seniors/:seniorId/dose-events', remindersController.getDoseEvents);
router.post('/dose-events/:eventId/confirm', remindersController.confirmDoseEvent);
router.post('/dose-events/:eventId/skip', remindersController.skipDoseEvent);
router.get('/seniors/:seniorId/adherence', remindersController.getAdherenceStats);

export default router;
