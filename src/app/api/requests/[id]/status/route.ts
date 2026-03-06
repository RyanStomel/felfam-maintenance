import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendRequestSmsNotification } from '@/lib/notifications'
import type { Status } from '@/lib/types'

const schema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting', 'closed']),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await request.json()
    const parsed = schema.parse(payload)

    const supabase = createAdminClient()
    const { data: existing, error: fetchError } = await supabase
      .from('requests')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      throw fetchError || new Error('Request not found')
    }

    const previousStatus = existing.status as Status
    const update: Record<string, string | null> = {
      status: parsed.status,
      updated_at: new Date().toISOString(),
      closed_at: parsed.status === 'closed' ? new Date().toISOString() : null,
    }

    const { data, error } = await supabase
      .from('requests')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw error || new Error('Failed to update status')
    }

    await sendRequestSmsNotification(id, {
      type: 'status_changed',
      previousStatus,
      nextStatus: parsed.status,
    })

    return NextResponse.json({ request: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid status' }, { status: 400 })
    }

    console.error('Update status failed', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
