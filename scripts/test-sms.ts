/**
 * Test script to trigger SMS notification and capture any errors.
 * Run: npx tsx scripts/test-sms.ts
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local')
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

async function main() {
  const mode = process.argv[2] // 'direct' = send to invalid number to capture Telnyx error
  const requestId = process.argv[3] || '4060f3d8-602f-4882-bce0-db033e798bdb'

  console.log('TELNYX_API_KEY:', process.env.TELNYX_API_KEY ? 'set' : 'missing')
  console.log('TELNYX_FROM_NUMBER:', process.env.TELNYX_FROM_NUMBER || 'missing')
  console.log(
    'TELNYX_MESSAGING_PROFILE_ID:',
    process.env.TELNYX_MESSAGING_PROFILE_ID ? 'set' : 'missing (optional)'
  )

  if (mode === 'direct') {
    const { sendTelnyxSms } = await import('../src/lib/telnyx-sms')
    if (!process.env.TELNYX_API_KEY || !process.env.TELNYX_FROM_NUMBER) {
      console.error('Missing TELNYX_API_KEY or TELNYX_FROM_NUMBER')
      process.exit(1)
    }
    try {
      await sendTelnyxSms({
        apiKey: process.env.TELNYX_API_KEY,
        from: process.env.TELNYX_FROM_NUMBER,
        to: '+15551234567', // Invalid/test number
        text: 'Test',
        messagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID?.trim() || undefined,
      })
      console.log('Unexpected: message was accepted')
    } catch (err: unknown) {
      console.error('Telnyx error (expected for invalid number):')
      console.error('  message:', (err as Error)?.message)
      console.error('  status:', (err as { status?: number })?.status)
      console.error('  full:', err)
    }
    return
  }

  console.log('Testing SMS notification for request:', requestId)
  const { sendRequestSmsNotification } = await import('../src/lib/notifications')

  try {
    await sendRequestSmsNotification(requestId, {
      type: 'work_log_added',
      workLog: { summary: 'Test work log', hours_spent: 1, cost: 50 },
    })
    console.log('SMS notification completed (no errors thrown)')
  } catch (err) {
    console.error('SMS notification error:', err)
    if (err && typeof err === 'object' && 'message' in err) {
      console.error('Message:', (err as Error).message)
      if ('status' in err) console.error('HTTP status:', (err as Error & { status?: number }).status)
    }
  }
}

main()
