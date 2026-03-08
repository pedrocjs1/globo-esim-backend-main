import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import logger from '../lib/logger';

dotenv.config();

const AIRALO_BASE =
  process.env.AIRALO_API_BASE || 'https://sandbox-partners-api.airalo.com';
const CLIENT_ID = process.env.AIRALO_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AIRALO_CLIENT_SECRET || '';

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

export const AiraloService = {
  // --- AUTENTICACIÓN ---
  getAccessToken: async (): Promise<string> => {
    const now = Date.now();
    if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 60_000) {
      return cachedToken;
    }

    const form = new FormData();
    form.append('client_id', CLIENT_ID);
    form.append('client_secret', CLIENT_SECRET);
    form.append('grant_type', 'client_credentials');

    const response = await axios.post(`${AIRALO_BASE}/v2/token`, form, {
      headers: { Accept: 'application/json', ...form.getHeaders() },
      timeout: 10_000,
    });

    const tokenData = response.data.data;
    cachedToken = tokenData.access_token;
    const expiresInSeconds = tokenData.expires_in ?? 24 * 60 * 60;
    tokenExpiresAt = now + expiresInSeconds * 1000;

    logger.info('Token de Airalo renovado');
    return cachedToken as string;
  },

  // --- OBTENER PAÍSES (con paginación completa) ---
  getCountries: async () => {
    const token = await AiraloService.getAccessToken();
    const uniqueMap = new Map<string, { slug: string; name: string; code: string; image: string | null }>();

    let page = 1;
    const limit = 100;

    while (true) {
      const response = await axios.get(`${AIRALO_BASE}/v2/packages`, {
        params: { limit, page },
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        timeout: 15_000,
      });

      const rawData: any[] = response.data.data ?? [];

      rawData.forEach((item: any) => {
        if (!uniqueMap.has(item.slug)) {
          uniqueMap.set(item.slug, {
            slug: item.slug,
            name: item.title,
            code: item.country_code,
            image: item.image ? item.image.url : null,
          });
        }
      });

      // Si trajo menos de `limit` registros, no hay más páginas
      if (rawData.length < limit) break;
      page++;
    }

    logger.info(`Países obtenidos: ${uniqueMap.size}`);
    return Array.from(uniqueMap.values());
  },

  // --- OBTENER PAQUETES POR PAÍS ---
  getPackagesBySlug: async (slug: string) => {
    const countries = await AiraloService.getCountries();
    const country = countries.find((c) => c.slug === slug);

    if (!country) throw new Error(`País no encontrado: ${slug}`);

    const token = await AiraloService.getAccessToken();
    logger.info(`Buscando planes para: ${country.name} (${country.code})`);

    const response = await axios.get(`${AIRALO_BASE}/v2/packages`, {
      params: {
        'filter[country]': country.code,
        'filter[type]': 'local',
        limit: 20,
      },
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      timeout: 15_000,
    });

    const countriesData = response.data.data;
    const targetCountry = countriesData.find((c: any) => c.country_code === country.code);

    if (!targetCountry || !targetCountry.operators) return [];

    const allPlans: any[] = [];
    targetCountry.operators.forEach((operator: any) => {
      if (operator.packages) {
        operator.packages.forEach((pkg: any) => {
          allPlans.push({
            id: pkg.id,
            title: pkg.title,
            data: pkg.data,
            validity: pkg.day ? `${pkg.day} Días` : pkg.validity,
            price: pkg.price,
            image: operator.image ? operator.image.url : null,
            operator: operator.title,
          });
        });
      }
    });

    return allPlans;
  },

  // --- CREAR ORDEN (COMPRAR eSIM) ---
  createOrder: async (packageId: string, email: string) => {
    const token = await AiraloService.getAccessToken();
    logger.info(`Creando orden en Airalo para paquete: ${packageId}`);

    const form = new FormData();
    form.append('quantity', '1');
    form.append('package_id', packageId);
    form.append('type', 'esim');
    form.append('description', 'Compra desde Globo eSIM');

    const response = await axios.post(`${AIRALO_BASE}/v2/orders`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...form.getHeaders(),
      },
      timeout: 30_000,
    });

    const orderData = response.data.data;
    const sim = orderData.sims && orderData.sims[0];

    return {
      id: orderData.id,
      code: orderData.code,
      currency: orderData.currency,
      price: orderData.price,
      iccid: sim ? sim.iccid : null,
      qrcode: sim ? sim.qrcode : null,
      qrcode_url: sim ? sim.qrcode_url : null,
      installation_guides: orderData.installation_guides,
    };
  },
};
