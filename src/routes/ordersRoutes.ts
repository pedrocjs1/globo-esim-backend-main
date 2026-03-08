import { Router } from 'express';
import { createOrder, getOrder, listOrders } from '../controllers/ordersController';
import { validate } from '../middleware/validate';
import { createOrderSchema } from '../schemas/order.schema';
import { orderLimiter, readLimiter } from '../middleware/rateLimiter';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// POST /api/orders — crear orden (compra eSIM)
router.post('/', orderLimiter, validate(createOrderSchema), createOrder);

// GET /api/orders/:id — obtener detalle de una orden (para pantalla de confirmación)
router.get('/:id', readLimiter, getOrder);

// GET /api/orders — listar todas las órdenes (solo admin)
router.get('/', adminAuth, listOrders);

export default router;
