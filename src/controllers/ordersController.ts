import { Request, Response, NextFunction } from 'express';
import { AiraloService } from '../services/airaloService';
import { prisma } from '../lib/db';
import { sendEsimEmail } from '../lib/mailer';
import { AppError } from '../middleware/errorHandler';
import { CreateOrderInput } from '../schemas/order.schema';
import logger from '../lib/logger';

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { packageId, email } = req.body as CreateOrderInput;

  // Registramos la orden como "pendiente" antes de llamar a Airalo
  // Así tenemos trazabilidad aunque falle el proceso
  let dbOrder = await prisma.order.create({
    data: { packageId, customerEmail: email, status: 'pending' },
  });

  try {
    const airaloOrder = await AiraloService.createOrder(packageId, email);

    // Actualizamos la orden con los datos de Airalo
    dbOrder = await prisma.order.update({
      where: { id: dbOrder.id },
      data: {
        airaloOrderId: airaloOrder.id,
        airaloOrderCode: airaloOrder.code,
        iccid: airaloOrder.iccid,
        qrcode: airaloOrder.qrcode,
        qrcodeUrl: airaloOrder.qrcode_url,
        price: airaloOrder.price,
        currency: airaloOrder.currency,
        installationGuides: airaloOrder.installation_guides
          ? JSON.stringify(airaloOrder.installation_guides)
          : null,
        status: 'completed',
      },
    });

    logger.info('Orden completada', {
      orderId: dbOrder.id,
      packageId,
      email,
      airaloCode: dbOrder.airaloOrderCode,
    });

    // Enviamos el email con el QR (no bloqueante — no tiramos error si falla)
    sendEsimEmail(email, {
      airaloOrderCode: dbOrder.airaloOrderCode,
      iccid: dbOrder.iccid,
      qrcodeUrl: dbOrder.qrcodeUrl,
      qrcode: dbOrder.qrcode,
      price: dbOrder.price,
      currency: dbOrder.currency,
    });

    res.status(201).json({
      success: true,
      data: {
        id: dbOrder.id,
        code: dbOrder.airaloOrderCode,
        currency: dbOrder.currency,
        price: dbOrder.price,
        iccid: dbOrder.iccid,
        qrcode: dbOrder.qrcode,
        qrcode_url: dbOrder.qrcodeUrl,
        installation_guides: airaloOrder.installation_guides,
      },
    });
  } catch (error: any) {
    // Marcamos la orden como fallida para auditoría
    await prisma.order
      .update({ where: { id: dbOrder.id }, data: { status: 'failed' } })
      .catch(() => {});

    logger.error('Error creando orden', {
      packageId,
      email,
      error: error.message,
    });

    next(
      new AppError(
        502,
        error?.response?.data?.meta?.message || error.message || 'Error al procesar la compra'
      )
    );
  }
};

export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id <= 0) {
    return next(new AppError(400, 'ID de orden inválido'));
  }

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    return next(new AppError(404, 'Orden no encontrada'));
  }

  res.json({
    success: true,
    data: {
      id: order.id,
      code: order.airaloOrderCode,
      status: order.status,
      currency: order.currency,
      price: order.price,
      iccid: order.iccid,
      qrcode: order.qrcode,
      qrcode_url: order.qrcodeUrl,
      installation_guides: order.installationGuides
        ? JSON.parse(order.installationGuides)
        : null,
      createdAt: order.createdAt,
    },
  });
};

export const listOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const status = req.query.status as string | undefined;

  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        airaloOrderCode: true,
        packageId: true,
        customerEmail: true,
        status: true,
        price: true,
        currency: true,
        iccid: true,
        createdAt: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
};
