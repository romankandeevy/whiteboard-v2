// Verifies the 6-digit code and, on success, marks the user's email confirmed.
// Public endpoint — deploy with verify_jwt = false.
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

const MAX_ATTEMPTS = 5

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  let email = ""
  let code = ""
  try {
    const body = await req.json()
    email = String(body.email ?? "").trim().toLowerCase()
    code = String(body.code ?? "").trim()
  } catch {
    return json({ error: "bad_request" }, 400)
  }

  if (!/^\d{6}$/.test(code)) return json({ error: "invalid_code" }, 400)

  const { data: rows, error } = await admin
    .from("email_verifications")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
  if (error) {
    console.error("select verification error", error)
    return json({ error: "server_error" }, 500)
  }

  const row = rows?.[0]
  if (!row) return json({ error: "expired" }, 400)

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from("email_verifications").delete().eq("email", email)
    return json({ error: "expired" }, 400)
  }
  if (row.attempts >= MAX_ATTEMPTS) return json({ error: "too_many_attempts" }, 429)

  const codeHash = await sha256(`${email}:${code}`)
  if (codeHash !== row.code_hash) {
    await admin
      .from("email_verifications")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id)
    return json({ error: "invalid_code", remaining: MAX_ATTEMPTS - row.attempts - 1 }, 400)
  }

  const { data: statusRows } = await admin.rpc("auth_user_status", { p_email: email })
  const existing = Array.isArray(statusRows) ? statusRows[0] : statusRows
  if (!existing?.user_id) return json({ error: "server_error" }, 500)

  const { error: confirmErr } = await admin.auth.admin.updateUserById(existing.user_id, {
    email_confirm: true,
  })
  if (confirmErr) {
    console.error("confirm error", confirmErr)
    return json({ error: "server_error" }, 500)
  }

  await admin.from("email_verifications").delete().eq("email", email)
  return json({ ok: true })
})
