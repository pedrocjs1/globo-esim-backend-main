import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export function adminAuth(req: Request, _res: Response, next: NextFunction) {
  if (!env.ADMIN_API_KEY) {
    return next(new AppError(503, 'Rutas de admin no habilitadas'));
  }

  const key = req.headers['x-admin-key'];
  if (!key || key !== env.ADMIN_API_KEY) {
    return next(new AppError(401, 'No autorizado'));
  }

  next();
}
