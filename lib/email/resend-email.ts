type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getResendApiKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

function getResendFrom(): string {
  const configured = process.env.RESEND_FROM?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "RESEND_FROM belum dikonfigurasi. Set sender domain terverifikasi untuk produksi.",
    );
  }
  return "Akselerja <onboarding@resend.dev>";
}

export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey());
}

export function buildPasswordResetEmailHtml({
  name,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput): string {
  const safeName = escapeHtml(name || "teman Akselerja");
  const safeResetUrl = escapeHtml(resetUrl);
  const safeExpires = escapeHtml(String(expiresInMinutes));

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Reset password Akselerja</title>
  </head>
  <body style="margin:0;background:#fcfaf6;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e1a13;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Tautan reset password Akselerja berlaku ${safeExpires} menit.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fcfaf6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid #dfdeda;border-radius:14px;overflow:hidden;background:#fcfaf6;">
            <tr>
              <td style="border-bottom:1px solid #dfdeda;padding:20px 24px;background:#fcfaf6;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:26px;height:26px;border-radius:999px;background:#1e1a13;color:#fcfaf6;font-size:15px;font-weight:800;line-height:26px;text-align:center;">&#10003;</td>
                    <td style="padding-left:10px;color:#1e1a13;font-size:17px;font-weight:700;line-height:1;">Akselerja</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 12px;background:#fcfaf6;">
                <p style="margin:0;color:#005455;font-size:13px;font-weight:700;text-transform:uppercase;">Reset password</p>
                <h1 style="margin:12px 0 0;color:#1e1a13;font-size:30px;line-height:1.15;font-weight:700;letter-spacing:0;">Atur ulang password kamu</h1>
                <p style="margin:16px 0 0;color:#615d54;font-size:16px;line-height:1.7;">Halo, <strong style="color:#1e1a13;font-weight:700;">${safeName}</strong>. Klik tombol di bawah untuk membuat password baru dan kembali masuk ke Akselerja.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 26px;background:#fcfaf6;">
                <a href="${safeResetUrl}" style="display:inline-block;border-radius:10px;background:#005455;color:#ecf8f7;font-size:16px;font-weight:700;text-decoration:none;padding:14px 20px;">Reset password sekarang &rarr;</a>
                <p style="margin:16px 0 0;color:#615d54;font-size:14px;line-height:1.65;">Tautan ini berlaku ${safeExpires} menit dan otomatis tidak berlaku setelah digunakan.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 34px;background:#fcfaf6;">
                <div style="border:1px solid #dfdeda;border-radius:14px;background:#f3f2ee;padding:18px 20px;">
                  <p style="margin:0;color:#1e1a13;font-size:14px;font-weight:700;">Kalau ini bukan kamu</p>
                  <p style="margin:8px 0 0;color:#615d54;font-size:14px;line-height:1.65;">Abaikan email ini. Password lama kamu tetap aktif sampai tautan reset berhasil dipakai.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #dfdeda;padding:22px 32px 30px;background:#fcfaf6;">
                <p style="margin:0;color:#615d54;font-size:12px;line-height:1.7;">Tombol tidak bisa dibuka? Salin tautan ini ke browser:</p>
                <p style="margin:8px 0 0;color:#005455;font-size:12px;line-height:1.7;word-break:break-all;">${safeResetUrl}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildPasswordResetEmailText({
  name,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput): string {
  return [
    `Halo, ${name || "teman Akselerja"}`,
    "",
    "Kami menerima permintaan untuk mengatur ulang password akun Akselerja kamu.",
    `Buka tautan ini dalam ${expiresInMinutes} menit:`,
    resetUrl,
    "",
    "Kalau kamu tidak meminta reset password, abaikan email ini.",
  ].join("\n");
}

export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput,
): Promise<void> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFrom(),
      to: [input.to],
      subject: "Reset password Akselerja",
      html: buildPasswordResetEmailHtml(input),
      text: buildPasswordResetEmailText(input),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Resend gagal mengirim email reset (${response.status}): ${detail}`,
    );
  }
}
