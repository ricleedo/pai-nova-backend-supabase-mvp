import { Request, Response } from 'express';
import seniorsService from './seniors.service';
import { asyncHandler } from '../../middleware/errorHandler';

export class SeniorsController {
  getAllSeniors = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await seniorsService.getAllSeniors(user.id, user.role, page, limit);

    res.status(200).json({
      success: true,
      data: result.seniors,
      pagination: result.pagination
    });
  });

  getSeniorById = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    const senior = await seniorsService.getSeniorById(id, user.id, user.role);

    res.status(200).json({
      success: true,
      data: senior
    });
  });

  createSenior = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const senior = await seniorsService.createSenior(req.body, user.id);

    res.status(201).json({
      success: true,
      message: 'Senior created successfully',
      data: senior
    });
  });

  updateSenior = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    const senior = await seniorsService.updateSenior(id, req.body, user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Senior updated successfully',
      data: senior
    });
  });

  deleteSenior = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    await seniorsService.deleteSenior(id, user.id);

    res.status(200).json({
      success: true,
      message: 'Senior deleted successfully'
    });
  });

  assignCaregiver = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { caregiver_id, relationship, permissions } = req.body;

    const result = await seniorsService.assignCaregiver(id, caregiver_id, relationship, permissions);

    res.status(201).json({
      success: true,
      message: 'Caregiver assigned successfully',
      data: result
    });
  });
}

export default new SeniorsController();
