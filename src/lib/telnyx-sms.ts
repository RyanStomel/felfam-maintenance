const TELNYX_MESSAGES_URL = 'https://api.telnyx.com/v2/messages'

type TelnyxSendParams = {
  apiKey: string
  from: string
  to: string
  text: string
  messagingProfileId?: string
}

type TelnyxErrorBody = {
  errors?: Array<{ code?: string; title?: string; detail?: string }>
}

export async function sendTelnyxSms({
  apiKey,
  from,
  to,
  text,
  messagingProfileId,
}: TelnyxSendParams): Promise<void> {
  const body: Record<string, string> = {
    from,
    to,
    text,
  }
  if (messagingProfileId) {
    body.messaging_profile_id = messagingProfileId
  }

  const res = await fetch(TELNYX_MESSAGES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (res.ok) return

  let message = `Telnyx HTTP ${res.status}`
  try {
    const errJson = (await res.json()) as TelnyxErrorBody
    const first = errJson.errors?.[0]
    if (first?.detail || first?.title) {
      message = [first.title, first.detail].filter(Boolean).join(': ')
    }
  } catch {
    // ignore parse errors
  }
  const err = new Error(message) as Error & { status?: number }
  err.status = res.status
  throw err
}
