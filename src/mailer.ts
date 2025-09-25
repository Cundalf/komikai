// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Bun no incluye los tipos por defecto, usamos la importación directa
import nodemailer from "nodemailer";

const smtpHost = Bun.env.SMTP_HOST ?? "";
const smtpPort = parseInt(Bun.env.SMTP_PORT ?? "", 10) || 587;
const smtpUser = Bun.env.SMTP_USER ?? "";
const smtpPass = Bun.env.SMTP_PASS ?? "";
const smtpFrom = Bun.env.SMTP_FROM ?? "Komikai <no-reply@komikai.app>";

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn("SMTP credentials are not fully configured.");
}

const transport = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendLoginCodeEmail(targetEmail: string, code: string) {
  const subject = "Tu código de acceso para KomiKAI";

  const html = `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F7F7;padding:24px;font-family:'Poppins',Arial,sans-serif;color:#2E2E2E;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 12px 24px rgba(79,163,255,0.15);">
            <tr>
              <td style="background-color:#4FA3FF;padding:24px;text-align:center;color:#FFFFFF;">
                <h1 style="margin:0;font-size:28px;font-weight:700;">KomiKAI ✨</h1>
                <p style="margin:8px 0 0;font-size:16px;">Desbloquea tus traducciones de manga o manhwa.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin-top:0;font-size:22px;color:#2E2E2E;">Código de verificación</h2>
                <p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hola 👋<br>Usa este código para iniciar sesión y continuar explorando los globos de diálogo de tus mangas o manhwas.</p>
                <div style="display:inline-block;padding:16px 32px;border-radius:999px;background-color:#FF8FAB;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:6px;">${code}</div>
                <p style="margin:24px 0 0;font-size:14px;color:#555;">Caduca en 10 minutos. Si no fuiste tú, ignora este mensaje.</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F7F7F7;padding:16px;text-align:center;font-size:12px;color:#555;">
                <p style="margin:0;">© ${new Date().getFullYear()} KomiKAI. Traducido con cariño 💙</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `KomiKAI - Código de acceso

Tu código es: ${code}
Caduca en 10 minutos.

Si no solicitaste este acceso, ignora este correo.
`;

  await transport.sendMail({
    from: smtpFrom,
    to: targetEmail,
    subject,
    text,
    html,
  });
}

