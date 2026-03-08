import twilio from 'twilio'
import { isValidPhoneNumber } from 'libphonenumber-js'
import type { Status } from '@/lib/types'
import { createAdminClient } from '@/lib/supabase-admin'
import { normalizePhoneNumber } from '@/lib/phone'

type NotificationRecipient = {
  id: string
  name: string
  phone_number: string
}

type NotificationRequest = {
  id: string
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: Status
  assigned_to: string | null
  properties: { name: string } | null
  vendors: { name: string } | null
}

type WorkLogPayload = {
  summary: string | null
  hours_spent: number | null
  cost: number | null
}

type NotificationEvent =
  | { type: 'request_created' }
  | { type: 'work_log_added'; workLog: WorkLogPayload }
  | { type: 'status_changed'; previousStatus: Status; nextStatus: Status }

function titleCaseStatus(status: Status) {
  return status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildRequestUrl(requestId: string) {
  const appBaseUrl = process.env.APP_BASE_URL?.trim()
  if (!appBaseUrl) return null

  try {
    return new URL(`/requests/${requestId}`, appBaseUrl).toString()
  } catch {
    return null
  }
}

function truncate(value: string, length: number) {
  if (value.length <= length) return value
  return `${value.slice(0, length - 1)}…`
}

function buildMessage(request: NotificationRequest, event: NotificationEvent) {
  const propertyName = request.properties?.name || 'Unknown property'
  const assignedName = request.vendors?.name || 'Unassigned'
  const link = buildRequestUrl(request.id)

  if (event.type === 'request_created') {
    return [
      `New request: ${truncate(request.title, 60)}`,
      `Property: ${propertyName}`,
      `Priority: ${titleCaseStatus(request.priority as Status)}`,
      `Assigned: ${assignedName}`,
      link,
    ]
      .filter(Boolean)
      .join(' | ')
  }

  if (event.type === 'work_log_added') {
    const details = [
      event.workLog.summary ? truncate(event.workLog.summary, 70) : null,
      event.workLog.hours_spent != null ? `${event.workLog.hours_spent}h` : null,
      event.workLog.cost != null ? `$${event.workLog.cost.toFixed(2)}` : null,
    ]
      .filter(Boolean)
      .join(' | ')

    return [
      `Work update: ${truncate(request.title, 60)}`,
      details || 'New work log entry added',
      link,
    ]
      .filter(Boolean)
      .join(' | ')
  }

  return [
    `Status update: ${truncate(request.title, 60)}`,
    `${titleCaseStatus(event.previousStatus)} -> ${titleCaseStatus(event.nextStatus)}`,
    link,
  ]
    .filter(Boolean)
    .join(' | ')
}

async function fetchRequestWithJoins(requestId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('requests')
    .select('id,title,priority,status,assigned_to,properties(name),vendors(name)')
    .eq('id', requestId)
    .single()

  if (error || !data) {
    throw new Error('Unable to load request notification context')
  }

  const property = Array.isArray(data.properties) ? data.properties[0] : data.properties
  const vendor = Array.isArray(data.vendors) ? data.vendors[0] : data.vendors

  return {
    id: data.id,
    title: data.title,
    priority: data.priority,
    status: data.status,
    assigned_to: data.assigned_to,
    properties: property ? { name: property.name } : null,
    vendors: vendor ? { name: vendor.name } : null,
  }
}

async function fetchRecipients(assignedTo: string | null) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('id,name,phone_number,sms_enabled,sms_broadcast,active')
    .eq('active', true)
    .eq('sms_enabled', true)
    .not('phone_number', 'is', null)

  if (error || !data) {
    throw new Error('Unable to load SMS recipients')
  }

  const recipients = data.filter((vendor) => vendor.sms_broadcast || vendor.id === assignedTo)
  const deduped = new Map<string, NotificationRecipient>()

  recipients.forEach((vendor) => {
    const phoneNumber = normalizePhoneNumber(vendor.phone_number)
    if (!phoneNumber) return
    if (!deduped.has(phoneNumber)) {
      deduped.set(phoneNumber, {
        id: vendor.id,
        name: vendor.name,
        phone_number: phoneNumber,
      })
    }
  })

  return Array.from(deduped.values())
}

function createTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const apiKeySid = process.env.TWILIO_API_KEY_SID
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET
  const from = normalizePhoneNumber(process.env.TWILIO_FROM_NUMBER)

  if (!accountSid || !apiKeySid || !apiKeySecret || !from) {
    return null
  }

  return {
    client: twilio(apiKeySid, apiKeySecret, { accountSid }),
    from,
  }
}

export async function sendRequestSmsNotification(
  requestId: string,
  event: NotificationEvent
) {
  const twilioConfig = createTwilioClient()
  if (!twilioConfig) {
    console.warn('[SMS] Skipped: Twilio not configured (missing env vars)')
    return
  }

  const request = await fetchRequestWithJoins(requestId)
  const recipients = await fetchRecipients(request.assigned_to)
  if (recipients.length === 0) {
    console.warn('[SMS] Skipped: No recipients (no vendors with sms_enabled)')
    return
  }

  const body = buildMessage(request, event)

  const validRecipients = recipients.filter((r) => {
    if (isValidPhoneNumber(r.phone_number)) return true
    console.warn(
      `[SMS] Skipped invalid number for ${r.name} (${r.phone_number}): not valid E.164 for Twilio`
    )
    return false
  })

  if (validRecipients.length === 0) {
    console.warn('[SMS] No valid recipient numbers after validation')
    return
  }

  const results = await Promise.allSettled(
    validRecipients.map((recipient) =>
      twilioConfig.client.messages.create({
        from: twilioConfig.from,
        to: recipient.phone_number,
        body,
      })
    )
  )

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const err = result.reason
      const recipient = validRecipients[index]?.name || validRecipients[index]?.phone_number
      console.error(`[SMS] Failed to send to ${recipient}:`, err?.message || err)
      if (err && typeof err === 'object' && 'code' in err) {
        console.error('[SMS] Twilio error code:', (err as { code?: number }).code)
      }
    }
  })
}
