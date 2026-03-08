import dotenv from 'dotenv';
dotenv.config();

const required = [
  'DATABASE_URL',
  'AIRALO_CLIENT_ID',
  'AIRALO_CLIENT_SECRET',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variable de entorno requerida faltante: ${key}`);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,
  DATABASE_URL: process.env.DATABASE_URL as string,
  AIRALO_CLIENT_ID: process.env.AIRALO_CLIENT_ID as string,
  AIRALO_CLIENT_SECRET: process.env.AIRALO_CLIENT_SECRET as string,
  AIRALO_API_BASE: process.env.AIRALO_API_BASE || 'https://sandbox-partners-api.airalo.com',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  // Clave para rutas de admin (opcional — si no está configurada, el admin está deshabilitado)
  ADMIN_API_KEY: process.env.ADMIN_API_KEY,
};
