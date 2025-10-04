import { Router } from 'express';
import seniorsController from './seniors.controller';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', seniorsController.getAllSeniors);
router.get('/:id', seniorsController.getSeniorById);
router.post('/', authorizeRoles('institution_admin', 'super_admin'), seniorsController.createSenior);
router.put('/:id', seniorsController.updateSenior);
router.delete('/:id', authorizeRoles('institution_admin', 'super_admin'), seniorsController.deleteSenior);
router.post('/:id/caregivers', authorizeRoles('institution_admin', 'super_admin'), seniorsController.assignCaregiver);

export default router;
