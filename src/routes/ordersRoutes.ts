import { Router } from 'express';
import { createOrder } from '../controllers/ordersController';

const router = Router();

// POST /api/orders
router.post('/', createOrder);

export default router;