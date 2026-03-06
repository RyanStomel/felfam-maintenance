import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendRequestSmsNotification } from '@/lib/notifications'

const schema = z.object({
  summary: z.string().optional().nullable(),
  hours_spent: z.number().nonnegative().optional().nullable(),
  cost: z.number().nonnegative().optional().nullable(),
})

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await request.json()
    const parsed = schema.parse({
      summary: payload.summary || null,
      hours_spent:
        payload.hours_spent === '' || payload.hours_spent == null
          ? null
          : Number(payload.hours_spent),
      cost: payload.cost === '' || payload.cost == null ? null : Number(payload.cost),
    })

    if (!nullableText(parsed.summary) && parsed.hours_spent == null && parsed.cost == null) {
      return NextResponse.json({ error: 'Work log entry is empty' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('work_logs')
      .insert({
        request_id: id,
        summary: nullableText(parsed.summary),
        hours_spent: parsed.hours_spent,
        cost: parsed.cost,
      })
      .select()
      .single()

    if (error || !data) {
      throw error || new Error('Failed to add work log')
    }

    await sendRequestSmsNotification(id, {
      type: 'work_log_added',
      workLog: {
        summary: data.summary,
        hours_spent: data.hours_spent,
        cost: data.cost,
      },
    })

    return NextResponse.json({ workLog: data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid work log' }, { status: 400 })
    }

    console.error('Create work log failed', error)
    return NextResponse.json({ error: 'Failed to add work log entry' }, { status: 500 })
  }
}
