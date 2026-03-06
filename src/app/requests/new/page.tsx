'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileUp, ArrowLeft } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/components/toast'
import { clsx } from 'clsx'
import type { Property, Vendor, Category, Priority } from '@/lib/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  property_id: z.string().min(1, 'Property is required'),
  unit_area: z.string().optional(),
  tenant_name: z.string().optional(),
  category_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-300' },
]

export default function NewRequestPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [docs, setDocs] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  })

  const selectedPriority = watch('priority')

  useEffect(() => {
    async function load() {
      const [p, v, c] = await Promise.all([
        supabase.from('properties').select('*').eq('active', true).order('name'),
        supabase.from('vendors').select('*').eq('active', true).order('name'),
        supabase.from('categories').select('*').eq('active', true).order('name'),
      ])
      setProperties(p.data || [])
      setVendors(v.data || [])
      setCategories(c.data || [])
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          category_id: data.category_id || null,
          assigned_to: data.assigned_to || null,
          due_date: data.due_date || null,
        }),
      })

      const payload = (await response.json()) as { request?: { id: string }; error?: string }
      if (!response.ok || !payload.request) {
        throw new Error(payload.error || 'Failed to create request')
      }

      const req = payload.request

      // Upload files
      const allFiles = [
        ...photos.map((f) => ({ file: f, type: 'photo' as const })),
        ...docs.map((f) => ({ file: f, type: 'document' as const })),
      ]

      for (const { file, type } of allFiles) {
        const path = `${req.id}/${Date.now()}-${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('maintenance-files')
          .upload(path, file)

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('maintenance-files')
            .getPublicUrl(path)

          await supabase.from('attachments').insert({
            request_id: req.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            attachment_type: type,
          })
        }
      }

      toast('Request created successfully!')
      router.push('/')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to create request', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-navy">New Request</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            {...register('title')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
            placeholder="Brief description of the issue"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Property */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <select
            {...register('property_id')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
          >
            <option value="">Select a property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.property_id && (
            <p className="text-red-500 text-sm mt-1">{errors.property_id.message}</p>
          )}
        </div>

        {/* Unit / Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit / Area (optional)</label>
          <input
            {...register('unit_area')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
            placeholder="e.g. Unit 2B, Lobby, Roof"
          />
        </div>

        {/* Tenant Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name (optional)</label>
          <input
            {...register('tenant_name')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
            placeholder="Tenant's name"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
          <select
            {...register('category_id')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setValue('priority', p.value)}
                className={clsx(
                  'py-2.5 px-2 rounded-xl text-sm font-semibold border-2 transition-all min-h-[44px]',
                  selectedPriority === p.value
                    ? `${p.color} border-current ring-2 ring-current/20`
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
          <select
            {...register('assigned_to')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
          >
            <option value="">Select assignee</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base"
            placeholder="Describe the issue in detail..."
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
          <input
            {...register('due_date')}
            type="date"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
          <ImageUpload
            onFiles={(files) => setPhotos((prev) => [...prev, ...files])}
            selectedCount={photos.length}
          />
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Documents (optional)</label>
          <label className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 cursor-pointer hover:border-navy hover:text-navy transition-colors min-h-[56px]">
            <FileUp className="w-5 h-5" />
            <span className="text-base font-medium">
              {docs.length > 0 ? `${docs.length} file(s) selected` : 'Add Documents'}
            </span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setDocs(Array.from(e.target.files || []))}
            />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-navy text-white text-lg font-semibold hover:bg-navy-dark active:bg-navy-dark transition-colors disabled:opacity-50 min-h-[56px]"
        >
          {submitting ? 'Creating...' : 'Create Request'}
        </button>
      </form>
    </div>
  )
}
