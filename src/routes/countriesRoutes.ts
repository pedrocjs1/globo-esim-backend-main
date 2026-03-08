import { Router } from 'express';
import { getCountries, getCountryDetails } from '../controllers/countriesController';
import { readLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /api/countries
router.get('/', readLimiter, getCountries);

// GET /api/countries/:slug  (ej: /api/countries/japan)
router.get('/:slug', readLimiter, getCountryDetails);

export default router;
