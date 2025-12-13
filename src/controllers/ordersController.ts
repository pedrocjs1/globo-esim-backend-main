import { Request, Response } from 'express';
import { AiraloService } from '../services/airaloService';

export const createOrder = async (req: Request, res: Response) => {
  try {
    // El frontend nos enviará el ID del paquete y (opcionalmente) el email
    const { packageId, email } = req.body;

    if (!packageId) {
      return res.status(400).json({ success: false, message: 'Falta el packageId' });
    }

    // Llamamos al servicio para comprar en Airalo
    const order = await AiraloService.createOrder(packageId, email);

    // Si todo sale bien, devolvemos los datos (incluyendo el QR)
    res.json({ success: true, data: order });

  } catch (error: any) {
    console.error('Error en controller createOrder:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Error al crear la orden' });
  }
};