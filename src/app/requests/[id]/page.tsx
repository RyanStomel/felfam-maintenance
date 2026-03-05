'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Clock,
  Edit3,
  Save,
  X,
  Send,
  Camera,
  FileUp,
  Download,
  Image as ImageIcon,
  FileText,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { PriorityBadge, StatusBadge } from '@/components/badges'
import { useToast } from '@/components/toast'
import { format, differenceInDays } from 'date-fns'
import { clsx } from 'clsx'
import type { Request, Property, Vendor, Category, Comment, Attachment, WorkLog, Priority, Status } from '@/lib/types'

type Tab = 'details' | 'work' | 'comments' | 'files' | 'status'

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [request, setRequest] = useState<Request | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [editing, setEditing] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editPropertyId, setEditPropertyId] = useState('')
  const [editUnitArea, setEditUnitArea] = useState('')
  const [editTenantName, setEditTenantName] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('medium')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

  // Work log state — new entry form
  const [workSummary, setWorkSummary] = useState('')
  const [hoursSpent, setHoursSpent] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [savingWorkLog, setSavingWorkLog] = useState(false)

  // Comment state
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentBody, setCommentBody] = useState('')

  const fetchRequest = useCallback(async () => {
    const { data } = await supabase
      .from('requests')
      .select('*, properties(*), vendors(*), categories(*)')
      .eq('id', id)
      .single()
    if (data) {
      setRequest(data as Request)
      setWorkSummary(data.work_summary || '')
      setHoursSpent(data.hours_spent?.toString() || '')
      setTotalCost(data.total_cost?.toString() || '')
    }
  }, [id, supabase])

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('request_id', id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }, [id, supabase])

  const fetchAttachments = useCallback(async () => {
    const { data } = await supabase
      .from('attachments')
      .select('*')
      .eq('request_id', id)
      .order('uploaded_at', { ascending: false })
    setAttachments(data || [])
  }, [id, supabase])

  const fetchWorkLogs = useCallback(async () => {
    const { data } = await supabase
      .from('work_logs')
      .select('*')
      .eq('request_id', id)
      .order('created_at', { ascending: false })
    setWorkLogs(data || [])
  }, [id, supabase])

  useEffect(() => {
    async function load() {
      const [, , propRes, vendRes, catRes] = await Promise.all([
        fetchRequest(),
        fetchComments(),
        supabase.from('properties').select('*').eq('active', true).order('name'),
        supabase.from('vendors').select('*').eq('active', true).order('name'),
        supabase.from('categories').select('*').eq('active', true).order('name'),
      ])
      await Promise.all([fetchAttachments(), fetchWorkLogs()])
      setProperties(propRes.data || [])
      setVendors(vendRes.data || [])
      setCategories(catRes.data || [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const startEditing = () => {
    if (!request) return
    setEditTitle(request.title)
    setEditPropertyId(request.property_id || '')
    setEditUnitArea(request.unit_area || '')
    setEditTenantName(request.tenant_name || '')
    setEditCategoryId(request.category_id || '')
    setEditPriority(request.priority)
    setEditAssignedTo(request.assigned_to || '')
    setEditDescription(request.description || '')
    setEditDueDate(request.due_date || '')
    setEditing(true)
  }

  const saveEdit = async () => {
    const { error } = await supabase
      .from('requests')
      .update({
        title: editTitle,
        property_id: editPropertyId || null,
        unit_area: editUnitArea || null,
        tenant_name: editTenantName || null,
        category_id: editCategoryId || null,
        priority: editPriority,
        assigned_to: editAssignedTo || null,
        description: editDescription || null,
        due_date: editDueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      toast('Failed to save', 'error')
    } else {
      toast('Request updated!')
      setEditing(false)
      fetchRequest()
    }
  }

  const addWorkLogEntry = async () => {
    if (!workSummary.trim() && !hoursSpent && !totalCost) return
    setSavingWorkLog(true)
    const { error } = await supabase.from('work_logs').insert({
      request_id: id,
      summary: workSummary.trim() || null,
      hours_spent: hoursSpent ? parseFloat(hoursSpent) : null,
      cost: totalCost ? parseFloat(totalCost) : null,
    })
    setSavingWorkLog(false)
    if (error) {
      toast('Failed to save entry', 'error')
    } else {
      toast('Work entry added!')
      setWorkSummary('')
      setHoursSpent('')
      setTotalCost('')
      fetchWorkLogs()
    }
  }

  const addComment = async () => {
    if (!commentAuthor.trim() || !commentBody.trim()) return
    const { error } = await supabase.from('comments').insert({
      request_id: id,
      author_name: commentAuthor.trim(),
      body: commentBody.trim(),
    })
    if (error) {
      toast('Failed to add comment', 'error')
    } else {
      setCommentBody('')
      fetchComments()
    }
  }

  const changeStatus = async (newStatus: Status) => {
    if (newStatus === 'closed') {
      if (!confirm('Mark this request as closed?')) return
    }
    const update: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus === 'closed') {
      update.closed_at = new Date().toISOString()
    } else {
      update.closed_at = null
    }
    const { error } = await supabase.from('requests').update(update).eq('id', id)
    if (error) {
      toast('Failed to update status', 'error')
    } else {
      toast(`Status changed to ${newStatus.replace('_', ' ')}`)
      fetchRequest()
    }
  }

  const uploadFile = async (files: FileList | null, attachmentType: string) => {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      const path = `${id}/${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('maintenance-files')
        .upload(path, file)

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('maintenance-files')
          .getPublicUrl(path)

        await supabase.from('attachments').insert({
          request_id: id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          attachment_type: attachmentType,
        })
      }
    }
    toast('File(s) uploaded!')
    fetchAttachments()
  }

  const deleteAttachment = async (att: Attachment) => {
    if (!confirm(`Delete ${att.file_name}?`)) return
    await supabase.from('attachments').delete().eq('id', att.id)
    toast('Attachment deleted')
    fetchAttachments()
  }

  if (loading || !request) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy" />
      </div>
    )
  }

  const isOverdue =
    request.due_date &&
    request.status !== 'closed' &&
    new Date(request.due_date) < new Date()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'work', label: `Work Log${workLogs.length > 0 ? ` (${workLogs.length})` : ''}` },
    { key: 'comments', label: `Comments (${comments.length})` },
    { key: 'files', label: `Files (${attachments.length})` },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="px-4 py-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <button
          onClick={() => router.push('/')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{request.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-2">
            {request.properties && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {request.properties.name}
              </span>
            )}
            {request.vendors && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {request.vendors.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(request.created_at), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {differenceInDays(new Date(), new Date(request.created_at))}d open
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 -mx-4 px-4 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px] transition-colors',
              activeTab === tab.key
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Details */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {!editing ? (
            <>
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm min-h-[44px]"
              >
                <Edit3 className="w-4 h-4" /> Edit Details
              </button>
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                <DetailRow label="Title" value={request.title} />
                <DetailRow label="Property" value={request.properties?.name} />
                <DetailRow label="Unit/Area" value={request.unit_area} />
                <DetailRow label="Tenant" value={request.tenant_name} />
                <DetailRow label="Category" value={request.categories?.name} />
                <DetailRow label="Priority" value={request.priority} />
                <DetailRow label="Assigned To" value={request.vendors?.name} />
                <DetailRow label="Description" value={request.description} />
                <DetailRow
                  label="Due Date"
                  value={
                    request.due_date
                      ? format(new Date(request.due_date), 'MMM d, yyyy')
                      : null
                  }
                  highlight={!!isOverdue}
                />
                <DetailRow label="Submitter" value={request.submitter_name} />
                <DetailRow
                  label="Created"
                  value={format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white font-medium text-sm min-h-[44px]"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm min-h-[44px]"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
              <EditField label="Title" value={editTitle} onChange={setEditTitle} />
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Property</label>
                <select
                  value={editPropertyId}
                  onChange={(e) => setEditPropertyId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
                >
                  <option value="">None</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <EditField label="Unit/Area" value={editUnitArea} onChange={setEditUnitArea} />
              <EditField label="Tenant Name" value={editTenantName} onChange={setEditTenantName} />
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Assigned To</label>
                <select
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
                >
                  <option value="">Unassigned</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Work Log */}
      {activeTab === 'work' && (
        <div className="space-y-4">

          {/* Running totals */}
          {workLogs.length > 0 && (() => {
            const totalHrs = workLogs.reduce((s, l) => s + (l.hours_spent || 0), 0)
            const totalCostSum = workLogs.reduce((s, l) => s + (l.cost || 0), 0)
            return (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-700 mt-0.5">{totalHrs % 1 === 0 ? totalHrs : totalHrs.toFixed(1)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-500 font-medium uppercase tracking-wide">Total Cost</p>
                  <p className="text-2xl font-bold text-green-700 mt-0.5">${totalCostSum.toFixed(2)}</p>
                </div>
              </div>
            )
          })()}

          {/* Past entries */}
          {workLogs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">History</h3>
              <div className="space-y-2">
                {workLogs.map((log) => (
                  <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400 font-medium">
                        {format(new Date(log.created_at), 'MMM d, yyyy · h:mm a')}
                      </span>
                      <div className="flex items-center gap-2">
                        {log.hours_spent != null && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {log.hours_spent}h
                          </span>
                        )}
                        {log.cost != null && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            ${log.cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    {log.summary && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{log.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New entry form */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Add Work Entry</h3>
            <textarea
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base bg-white"
              placeholder="What was done? What still needs attention?"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px] bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <label className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 cursor-pointer hover:border-navy hover:text-navy min-h-[48px] bg-white">
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">Receipt</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => uploadFile(e.target.files, 'receipt')} />
              </label>
              <label className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 cursor-pointer hover:border-navy hover:text-navy min-h-[48px] bg-white">
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadFile(e.target.files, 'completion_photo')} />
              </label>
            </div>
            <button
              onClick={addWorkLogEntry}
              disabled={savingWorkLog || (!workSummary.trim() && !hoursSpent && !totalCost)}
              className="w-full py-3.5 rounded-xl bg-navy text-white font-semibold text-base min-h-[52px] disabled:opacity-50"
            >
              {savingWorkLog ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        </div>
      )}

      {/* TAB: Comments */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-900">{c.author_name}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(c.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
            <input
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px]"
              placeholder="Your name"
            />
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm"
              placeholder="Write a comment..."
            />
            <button
              onClick={addComment}
              disabled={!commentAuthor.trim() || !commentBody.trim()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-navy text-white font-medium text-sm disabled:opacity-50 min-h-[44px]"
            >
              <Send className="w-4 h-4" /> Post Comment
            </button>
          </div>
        </div>
      )}

      {/* TAB: Files */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <label className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 cursor-pointer hover:border-navy hover:text-navy min-h-[52px]">
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => uploadFile(e.target.files, 'photo')}
              />
            </label>
            <label className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 cursor-pointer hover:border-navy hover:text-navy min-h-[52px]">
              <FileUp className="w-5 h-5" />
              <span className="text-sm font-medium">Upload Doc</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => uploadFile(e.target.files, 'document')}
              />
            </label>
          </div>
          {attachments.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">No files attached</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {attachments.map((att) => {
                const isImage = att.file_type?.startsWith('image/')
                return (
                  <div
                    key={att.id}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                  >
                    {isImage ? (
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.file_url}
                          alt={att.file_name}
                          className="w-full h-32 object-cover"
                        />
                      </a>
                    ) : (
                      <div className="w-full h-32 bg-gray-50 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-gray-600 truncate">{att.file_name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {att.attachment_type.replace('_', ' ')}
                      </p>
                      <div className="flex gap-1 mt-1">
                        <a
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-gray-100"
                        >
                          {isImage ? (
                            <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-gray-500" />
                          )}
                        </a>
                        <button
                          onClick={() => deleteAttachment(att)}
                          className="p-1.5 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: Status */}
      {activeTab === 'status' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">
            Current status: <StatusBadge status={request.status} />
          </p>
          {request.status !== 'open' && (
            <button
              onClick={() => changeStatus('open')}
              className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-base min-h-[52px]"
            >
              Reopen Request
            </button>
          )}
          {request.status !== 'in_progress' && request.status !== 'closed' && (
            <button
              onClick={() => changeStatus('in_progress')}
              className="w-full py-3.5 rounded-xl bg-purple-500 text-white font-semibold text-base min-h-[52px]"
            >
              Mark In Progress
            </button>
          )}
          {request.status !== 'waiting' && request.status !== 'closed' && (
            <button
              onClick={() => changeStatus('waiting')}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-white font-semibold text-base min-h-[52px]"
            >
              Mark Waiting on Parts
            </button>
          )}
          {request.status !== 'closed' && (
            <button
              onClick={() => changeStatus('closed')}
              className="w-full py-3.5 rounded-xl bg-green-600 text-white font-semibold text-base min-h-[52px]"
            >
              Close Request
            </button>
          )}
          {request.status === 'closed' && (
            <button
              onClick={() => changeStatus('open')}
              className="w-full py-3.5 rounded-xl bg-blue-500 text-white font-semibold text-base min-h-[52px]"
            >
              Reopen Request
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | null | undefined
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between items-start px-4 py-3 gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={clsx(
          'text-sm text-right font-medium',
          highlight ? 'text-red-600' : value ? 'text-gray-900' : 'text-gray-300'
        )}
      >
        {value || '—'}
      </span>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
      />
    </div>
  )
}
