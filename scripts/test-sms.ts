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
  const mode = process.argv[2] // 'direct' = send to invalid number to capture Twilio error
  const requestId = process.argv[3] || '4060f3d8-602f-4882-bce0-db033e798bdb'

  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'set' : 'missing')
  console.log('TWILIO_API_KEY_SID:', process.env.TWILIO_API_KEY_SID ? 'set' : 'missing')
  console.log('TWILIO_FROM_NUMBER:', process.env.TWILIO_FROM_NUMBER || 'missing')

  if (mode === 'direct') {
    // Direct Twilio call to invalid number to capture error format
    const twilio = (await import('twilio')).default
    const client = twilio(
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      { accountSid: process.env.TWILIO_ACCOUNT_SID }
    )
    try {
      await client.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to: '+15551234567', // Invalid/test number
        body: 'Test',
      })
      console.log('Unexpected: message was accepted')
    } catch (err: unknown) {
      console.error('Twilio error (expected for invalid number):')
      console.error('  message:', (err as Error)?.message)
      console.error('  code:', (err as { code?: number })?.code)
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
      if ('code' in err) console.error('Code:', (err as Error & { code?: number }).code)
    }
  }
}

main()
