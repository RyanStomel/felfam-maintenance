import { isValidPhoneNumber } from 'libphonenumber-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizePhoneNumber } from '@/lib/phone'
import { TELNYX_SMS_FROM_E164 } from '@/lib/telnyx-config'
import { sendTelnyxSms } from '@/lib/telnyx-sms'

const schema = z.object({
  to: z.string().min(1),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(500, 'Message is too long'),
})

export async function POST(request: Request) {
  const apiKey = process.env.TELNYX_API_KEY?.trim()
  const from = normalizePhoneNumber(TELNYX_SMS_FROM_E164)
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID?.trim() || undefined

  if (!apiKey || !from) {
    return NextResponse.json(
      { error: 'Telnyx is not configured (missing TELNYX_API_KEY).' },
      { status: 503 }
    )
  }

  try {
    const json = await request.json()
    const parsed = schema.parse(json)
    const to = normalizePhoneNumber(parsed.to)
    if (!to || !isValidPhoneNumber(to)) {
      return NextResponse.json(
        { error: 'Enter a valid phone number in E.164 format or as a 10-digit US number.' },
        { status: 400 }
      )
    }

    await sendTelnyxSms({
      apiKey,
      from,
      to,
      text: parsed.message,
      messagingProfileId,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to send SMS'
    console.error('[SMS test]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
