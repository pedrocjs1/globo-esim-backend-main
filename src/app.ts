import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import countriesRoutes from './routes/countriesRoutes';
import ordersRoutes from './routes/ordersRoutes';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

const app = express();

// Necesario cuando hay un proxy/load balancer adelante (Vercel, Railway, etc.)
app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (apps móviles, curl, Postman en dev)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Limitar tamaño del body para prevenir ataques de payload grande
app.use(express.json({ limit: '10kb' }));

// Rate limiting global
app.use(generalLimiter);

// Rutas
app.use('/api/countries', countriesRoutes);
app.use('/api/orders', ordersRoutes);

// Health check (para monitoreo y deploy)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware de errores centralizado (debe ir al final)
app.use(errorHandler);

export default app;
