import "server-only";

export const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
export const ownerEmail = () => process.env.OWNER_EMAIL || "";

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

/** Wraps plain paragraphs in a simple branded HTML email. */
function layout(title: string, lines: string[], cta?: { label: string; url: string }) {
  const body = lines.map((l) => `<p style="margin:0 0 14px;line-height:1.6">${esc(l)}</p>`).join("");
  const button = cta
    ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="background:#e8b062;color:#1a1410;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">${esc(cta.label)}</a></p>`
    : "";
  return `<div style="background:#f6f1ea;padding:32px 12px;font-family:Helvetica,Arial,sans-serif;color:#2a221b">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
    <p style="font-family:Georgia,serif;font-size:22px;letter-spacing:.08em;margin:0 0 24px">LUMORA</p>
    <h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>${body}${button}
    <p style="margin:28px 0 0;font-size:12px;color:#8a7d70">Lumora — Luminaires et art mural imprimés en 3D, fabriqués en Tunisie.</p>
  </div></div>`;
}

/** Never throws: an email failure must not break an order. */
export async function sendEmail(to: string, subject: string, lines: string[], cta?: { label: string; url: string }) {
  if (!to) return;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] to=${to} subject="${subject}"\n  ${lines.join("\n  ")}${cta ? `\n  -> ${cta.url}` : ""}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Lumora <onboarding@resend.dev>",
        to,
        subject,
        html: layout(subject, lines, cta),
      }),
    });
    if (!res.ok) console.error("[email] failed", res.status, await res.text());
  } catch (e) {
    console.error("[email] error", e);
  }
}
