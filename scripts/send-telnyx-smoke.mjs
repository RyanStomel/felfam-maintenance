/**
 * One-off Telnyx smoke sends. Requires TELNYX_API_KEY and TELNYX_FROM_NUMBER.
 * Loads .env.local when present (same KEY=value rules as test-sms.ts).
 *
 * Run: node scripts/send-telnyx-smoke.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
}

const TELNYX_MESSAGES_URL = 'https://api.telnyx.com/v2/messages'

async function sendMessage({ apiKey, from, to, text, messagingProfileId }) {
  const body = { from, to, text }
  if (messagingProfileId) body.messaging_profile_id = messagingProfileId

  const res = await fetch(TELNYX_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  const raw = await res.text()
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = raw
  }

  return { ok: res.ok, status: res.status, body: parsed }
}

function main() {
  const apiKey = process.env.TELNYX_API_KEY?.trim()
  const from = process.env.TELNYX_FROM_NUMBER?.trim()
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID?.trim() || undefined

  if (!apiKey || !from) {
    console.error(
      'Missing TELNYX_API_KEY or TELNYX_FROM_NUMBER. Set them in the environment or .env.local.'
    )
    process.exit(1)
  }

  const sends = [
    { to: '+18185152111', text: 'TEST', label: '+18185152111 → TEST' },
    {
      to: '+13127205643',
      text: 'TEST TEXT MESSAGE FROM PIGJET',
      label: '+13127205643 (312 720-5643) → long body',
    },
  ]

  return Promise.all(
    sends.map(async ({ to, text, label }) => {
      console.log(`Sending: ${label}`)
      const result = await sendMessage({
        apiKey,
        from,
        to,
        text,
        messagingProfileId,
      })
      if (result.ok) {
        console.log(`  OK HTTP ${result.status}`)
      } else {
        console.error(`  FAIL HTTP ${result.status}`, JSON.stringify(result.body, null, 2))
      }
      return result
    })
  )
}

main()
  .then((results) => {
    const failed = results.filter((r) => !r.ok)
    if (failed.length) process.exit(1)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
