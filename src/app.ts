import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import countriesRoutes from './routes/countriesRoutes';
import ordersRoutes from './routes/ordersRoutes'; // 👈 Importamos

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Rutas
app.use('/api/countries', countriesRoutes);
app.use('/api/orders', ordersRoutes); // 👈 Conectamos la ruta de órdenes

app.get('/', (req, res) => {
  res.send('Globo eSIM API is running 🎈');
});

export default app;