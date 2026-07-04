// Custom sign-up: creates an unconfirmed user, emails a 6-digit code via Resend.
// Public endpoint (no user JWT yet) — deploy with verify_jwt = false.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  })
}

async function sha256(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const EMAIL_FROM = Deno.env.get("VERIFY_EMAIL_FROM") ?? "Board <onboarding@resend.dev>"
const CODE_TTL_MIN = 10
const RESEND_COOLDOWN_S = 45

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

function emailHtml(code: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:40px 16px;">
    <div style="max-width:420px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
      <div style="padding:28px 32px 8px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:#0d9488;color:#fff;font-weight:700;font-size:18px;">B</div>
        <h1 style="margin:20px 0 6px;font-size:20px;color:#1c1917;">Confirm your email</h1>
        <p style="margin:0;font-size:14px;color:#78716c;line-height:1.5;">Enter this code in Board to finish creating your account. It expires in ${CODE_TTL_MIN} minutes.</p>
      </div>
      <div style="padding:24px 32px 32px;">
        <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#0d9488;text-align:center;background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:18px 0;">${code}</div>
        <p style="margin:20px 0 0;font-size:12px;color:#a8a29e;line-height:1.5;">If you didn't request this, you can safely ignore this email — no account will be created.</p>
      </div>
    </div>
  </body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  let email = ""
  let password = ""
  try {
    const body = await req.json()
    email = String(body.email ?? "").trim().toLowerCase()
    password = String(body.password ?? "")
  } catch {
    return json({ error: "bad_request" }, 400)
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "invalid_email" }, 400)
  if (password.length < 6) return json({ error: "weak_password" }, 400)

  // Does an account already exist for this email?
  const { data: statusRows, error: statusErr } = await admin.rpc("auth_user_status", {
    p_email: email,
  })
  if (statusErr) {
    console.error("auth_user_status error", statusErr)
    return json({ error: "server_error" }, 500)
  }
  const existing = Array.isArray(statusRows) ? statusRows[0] : statusRows

  if (existing?.confirmed) return json({ error: "already_registered" }, 409)

  let userId: string
  if (existing?.user_id) {
    // Unconfirmed account — refresh the password and re-send a code.
    const { error } = await admin.auth.admin.updateUserById(existing.user_id, { password })
    if (error) {
      console.error("updateUserById error", error)
      return json({ error: "server_error" }, 500)
    }
    userId = existing.user_id
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    })
    if (error || !data.user) {
      console.error("createUser error", error)
      return json({ error: "server_error" }, 500)
    }
    userId = data.user.id
  }
  void userId

  // Throttle repeated code requests for the same email.
  const { data: recent } = await admin
    .from("email_verifications")
    .select("created_at")
    .eq("email", email)
    .gte("created_at", new Date(Date.now() - RESEND_COOLDOWN_S * 1000).toISOString())
    .limit(1)
  if (recent && recent.length > 0) return json({ error: "rate_limited" }, 429)

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set")
    return json({ error: "email_not_configured" }, 500)
  }

  const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000))
  const codeHash = await sha256(`${email}:${code}`)

  await admin.from("email_verifications").delete().eq("email", email)
  const { error: insErr } = await admin.from("email_verifications").insert({
    email,
    code_hash: codeHash,
    purpose: "signup",
    expires_at: new Date(Date.now() + CODE_TTL_MIN * 60 * 1000).toISOString(),
  })
  if (insErr) {
    console.error("insert verification error", insErr)
    return json({ error: "server_error" }, 500)
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: `${code} is your Board verification code`,
      html: emailHtml(code),
    }),
  })
  if (!res.ok) {
    console.error("resend error", res.status, await res.text())
    return json({ error: "email_send_failed" }, 502)
  }

  return json({ ok: true })
})
