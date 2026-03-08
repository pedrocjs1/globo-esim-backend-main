import nodemailer from 'nodemailer';
import logger from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EsimOrderData {
  airaloOrderCode: string | null;
  iccid: string | null;
  qrcodeUrl: string | null;
  qrcode: string | null;
  price: number | null;
  currency: string | null;
}

export async function sendEsimEmail(to: string, order: EsimOrderData) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn('SMTP no configurado — email de eSIM no enviado');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Globo eSIM" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: '🎈 Tu eSIM está lista — Globo eSIM',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎈 Globo eSIM</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Tu conexión global está lista</p>
          </div>

          <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #059669;">¡Tu eSIM fue activada exitosamente!</h2>
            <p>Gracias por tu compra. A continuación encontrás todos los datos para instalar tu eSIM.</p>

            <div style="background: white; border: 1px solid #d1fae5; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="margin-top: 0; color: #065f46;">Datos de tu eSIM</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Código de orden</td>
                  <td style="padding: 8px 0; font-weight: bold;">${order.airaloOrderCode ?? 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">ICCID</td>
                  <td style="padding: 8px 0; font-weight: bold; font-family: monospace;">${order.iccid ?? 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Precio</td>
                  <td style="padding: 8px 0; font-weight: bold;">${order.price} ${order.currency}</td>
                </tr>
              </table>
            </div>

            ${
              order.qrcodeUrl
                ? `
            <div style="text-align: center; margin: 24px 0;">
              <h3>Escaneá este QR para instalar tu eSIM</h3>
              <img src="${order.qrcodeUrl}" alt="QR Code eSIM" style="width: 220px; height: 220px; border: 4px solid #10b981; border-radius: 12px; padding: 8px;" />
            </div>
            `
                : ''
            }

            ${
              order.qrcode
                ? `
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #475569;"><strong>Código LPA para instalación manual:</strong></p>
              <code style="font-size: 12px; word-break: break-all; color: #0f172a;">${order.qrcode}</code>
            </div>
            `
                : ''
            }

            <div style="margin-top: 32px;">
              <h3>¿Cómo instalar tu eSIM?</h3>
              <ol style="color: #475569; line-height: 1.8;">
                <li>Abrí los ajustes de tu celular</li>
                <li>Ir a <strong>"Celular"</strong> o <strong>"Red móvil"</strong></li>
                <li>Seleccioná <strong>"Agregar plan de datos"</strong> o <strong>"Agregar eSIM"</strong></li>
                <li>Escaneá el código QR o ingresá el código LPA manualmente</li>
                <li>¡Activá la línea al llegar a destino!</li>
              </ol>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #64748b; font-size: 14px;">¿Necesitás ayuda? Respondé este email o escribinos.</p>
              <p style="color: #94a3b8; font-size: 12px;">© 2025 Globo eSIM — Conectividad global sin complicaciones</p>
            </div>
          </div>
        </div>
      `,
    });

    logger.info(`Email de eSIM enviado a ${to}`);
  } catch (err) {
    logger.error('Error enviando email de eSIM:', { error: (err as Error).message, to });
  }
}
