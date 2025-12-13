import { Request, Response } from 'express';
import { AiraloService } from '../services/airaloService';

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await AiraloService.getCountries();
    res.json({ success: true, data: countries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// NUEVO: Obtener detalles y planes de un país
export const getCountryDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const packages = await AiraloService.getPackagesBySlug(slug);
    
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error obteniendo planes' });
  }
};