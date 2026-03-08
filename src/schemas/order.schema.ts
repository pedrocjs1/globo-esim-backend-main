import { z } from 'zod';

export const createOrderSchema = z.object({
  packageId: z
    .string()
    .min(1, 'packageId es requerido')
    .max(100)
    .regex(/^[a-zA-Z0-9_\-]+$/, 'packageId contiene caracteres inválidos'),
  email: z
    .string()
    .email('Email inválido')
    .max(254),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
