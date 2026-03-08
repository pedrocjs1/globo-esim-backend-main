import { Request, Response, NextFunction } from 'express';
import { AiraloService } from '../services/airaloService';
import { AppError } from '../middleware/errorHandler';

export const getCountries = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const countries = await AiraloService.getCountries();
    res.json({ success: true, data: countries });
  } catch (error) {
    next(new AppError(502, 'Error obteniendo países'));
  }
};

export const getCountryDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    // Validación básica del slug para evitar inputs raros
    if (!/^[a-z0-9\-]+$/.test(slug)) {
      return next(new AppError(400, 'Slug inválido'));
    }

    const packages = await AiraloService.getPackagesBySlug(slug);
    res.json({ success: true, data: packages });
  } catch (error: any) {
    if (error.message?.includes('País no encontrado')) {
      return next(new AppError(404, error.message));
    }
    next(new AppError(502, 'Error obteniendo planes'));
  }
};
