import { Router } from 'express';
import { getCountries, getCountryDetails } from '../controllers/countriesController';

const router = Router();

// GET /api/countries
router.get('/', getCountries);

// GET /api/countries/:slug (ej: /api/countries/japan)
router.get('/:slug', getCountryDetails);

export default router;