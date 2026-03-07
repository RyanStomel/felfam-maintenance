import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendRequestSmsNotification } from '@/lib/notifications'

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  property_id: z.string().uuid('Property is required'),
  unit_area: z.string().optional(),
  tenant_name: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  due_date: z.string().optional().nullable(),
})

function nullableString(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const parsed = schema.parse({
      ...payload,
      category_id: payload.category_id || null,
      assigned_to: payload.assigned_to || null,
      due_date: payload.due_date || null,
    })

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('requests')
      .insert({
        title: parsed.title.trim(),
        property_id: parsed.property_id,
        unit_area: nullableString(parsed.unit_area),
        tenant_name: nullableString(parsed.tenant_name),
        category_id: parsed.category_id,
        priority: parsed.priority,
        assigned_to: parsed.assigned_to,
        description: nullableString(parsed.description),
        due_date: parsed.due_date,
        submitter_name: null,
      })
      .select()
      .single()

    if (error || !data) {
      throw error || new Error('Failed to create request')
    }

    try {
      await sendRequestSmsNotification(data.id, { type: 'request_created' })
    } catch (smsError) {
      console.warn('SMS notification failed (request created successfully)', smsError)
    }

    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid request' }, { status: 400 })
    }

    console.error('Create request failed', error)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}
