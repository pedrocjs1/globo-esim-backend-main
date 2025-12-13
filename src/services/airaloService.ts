import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const AIRALO_BASE = process.env.AIRALO_API_BASE || 'https://sandbox-partners-api.airalo.com';
const CLIENT_ID = process.env.AIRALO_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AIRALO_CLIENT_SECRET || '';

// Configuración de Email por defecto para copias (útil para debug)
const DEFAULT_COPY_EMAIL = process.env.AIRALO_DEFAULT_COPY_EMAIL || '';

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

export const AiraloService = {
  // --- AUTENTICACIÓN ---
  getAccessToken: async (): Promise<string> => {
    const now = Date.now();
    if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 60_000) {
      return cachedToken as string;
    }

    try {
      console.log('🔄 Solicitando token a Airalo...');
      const form = new FormData();
      form.append('client_id', CLIENT_ID);
      form.append('client_secret', CLIENT_SECRET);
      form.append('grant_type', 'client_credentials');

      const response = await axios.post(`${AIRALO_BASE}/v2/token`, form, {
        headers: { Accept: 'application/json', ...form.getHeaders() },
      });

      const tokenData = response.data.data;
      cachedToken = tokenData.access_token;
      const expiresInSeconds = tokenData.expires_in ?? 24 * 60 * 60;
      tokenExpiresAt = now + expiresInSeconds * 1000;

      return cachedToken as string;
    } catch (error: any) {
      console.error('❌ Error Auth:', error?.response?.data || error.message);
      throw new Error('Falló la autenticación');
    }
  },

  // --- OBTENER PAÍSES ---
  getCountries: async () => {
    try {
      const token = await AiraloService.getAccessToken();
      const response = await axios.get(`${AIRALO_BASE}/v2/packages?limit=100`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const rawData = response.data.data;
      const uniqueMap = new Map();
      
      rawData.forEach((item: any) => {
        if (!uniqueMap.has(item.slug)) {
          uniqueMap.set(item.slug, {
            slug: item.slug,
            name: item.title,
            code: item.country_code,
            image: item.image ? item.image.url : null
          });
        }
      });

      return Array.from(uniqueMap.values());
    } catch (error: any) {
      console.error('❌ Error Fetch Countries:', error?.message);
      throw new Error('Error obteniendo países');
    }
  },

  // --- OBTENER PAQUETES POR PAÍS ---
  getPackagesBySlug: async (slug: string) => {
    try {
      const countries = await AiraloService.getCountries();
      const country = countries.find((c: any) => c.slug === slug);

      if (!country) throw new Error(`País no encontrado: ${slug}`);

      const token = await AiraloService.getAccessToken();
      console.log(`📦 Buscando planes para: ${country.name} (${country.code})`);
      
      const response = await axios.get(`${AIRALO_BASE}/v2/packages`, {
        params: { 'filter[country]': country.code, 'filter[type]': 'local', limit: 20 },
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
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
              operator: operator.title
            });
          });
        }
      });
      return allPlans;
    } catch (error: any) {
      console.error('❌ Error Fetch Packages:', error?.message);
      return [];
    }
  },

  // --- NUEVO: CREAR ORDEN (COMPRAR eSIM) ---
  createOrder: async (packageId: string, email: string) => {
    try {
      const token = await AiraloService.getAccessToken();
      console.log(`🛒 Creando orden en Airalo para paquete: ${packageId}`);

      const form = new FormData();
      form.append('quantity', '1');
      form.append('package_id', packageId);
      form.append('type', 'esim');
      form.append('description', 'Compra desde Globo eSIM Web');
      
      // Enviamos el email si existe, para que Airalo mande el correo también
      if (email) {
        // En sandbox a veces to_email debe ser real o da error, pero probemos
        // form.append('to_email', email); 
        // form.append('sharing_option', 'link');
      }

      const response = await axios.post(`${AIRALO_BASE}/v2/orders`, form, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          Accept: 'application/json',
          ...form.getHeaders()
        },
      });

      const orderData = response.data.data;
      const sim = orderData.sims && orderData.sims[0];

      // Devolvemos una estructura limpia con lo que necesita el Frontend
      return {
        id: orderData.id,
        code: orderData.code,
        currency: orderData.currency,
        price: orderData.price,
        iccid: sim ? sim.iccid : null,
        qrcode: sim ? sim.qrcode : null, // Este es el string para generar el QR
        qrcode_url: sim ? sim.qrcode_url : null, // URL directa a la imagen del QR
        installation_guides: orderData.installation_guides
      };

    } catch (error: any) {
      console.error('❌ Error Creando Orden:', error?.response?.data || error.message);
      throw new Error(error?.response?.data?.meta?.message || 'Error al procesar la compra en Airalo');
    }
  }
};