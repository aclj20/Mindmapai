const nodemailer = require('nodemailer');

const BRAND_COLOR = '#6E59A5';
const LOGO_URL = 'https://amazn-bucket-gestor.s3.us-east-2.amazonaws.com/mindmapa/public/favicon.png';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header con logo y nombre -->
          <tr>
            <td style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${LOGO_URL}" alt="MindMap AI" width="36" height="36" style="display:block;border-radius:8px;" />
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:15px;font-weight:600;color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:-0.01em;">MindMap AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;line-height:1.6;">
                Este mensaje fue enviado automáticamente, por favor no respondas a este correo.<br />
                Si no realizaste esta acción, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendVerificationEmail(to, code) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV EMAIL] Verificación para ${to}: ${code}`);
    return;
  }

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#09090b;">Verifica tu dirección de correo</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">
      Para completar tu registro, introduce el siguiente código en la aplicación.
    </p>

    <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Código de verificación</p>
      <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:10px;color:#09090b;font-variant-numeric:tabular-nums;">${code}</p>
    </div>

    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
      Este código es válido durante <strong style="color:#52525b;">10 minutos</strong>.
      No lo compartas con nadie.
    </p>
  `;

  await getTransporter().sendMail({
    from: `"MindMap AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Código de verificación',
    html: baseTemplate(content),
  });
}

async function sendPasswordResetEmail(to, code) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV EMAIL] Recuperación para ${to}: ${code}`);
    return;
  }

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#09090b;">Restablece tu contraseña</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.6;">
      Recibimos una solicitud para restablecer la contraseña asociada a esta cuenta.
      Introduce el siguiente código para continuar.
    </p>

    <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">Código de recuperación</p>
      <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:10px;color:#09090b;font-variant-numeric:tabular-nums;">${code}</p>
    </div>

    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
      Este código expira en <strong style="color:#52525b;">10 minutos</strong>.
      Si no solicitaste este cambio, tu cuenta sigue segura y puedes ignorar este mensaje.
    </p>
  `;

  await getTransporter().sendMail({
    from: `"MindMap AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Restablece tu contraseña',
    html: baseTemplate(content),
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
