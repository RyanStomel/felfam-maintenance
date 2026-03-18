'use client'

import { use, useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Filter, ArrowUpDown, Building2, User, Users, Clock, MessageSquare, ChevronDown, ChevronUp, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { PriorityBadge } from '@/components/badges'
import { differenceInDays, formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import type { Request, Property, Vendor, Comment, Status } from '@/lib/types'

const statusOptions: { value: Status; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'closed', label: 'Closed' },
]

const statusStyles: Record<Status, string> = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  waiting: 'bg-amber-100 text-amber-800 border-amber-200',
  closed: 'bg-green-100 text-green-800 border-green-200',
}

export default function Dashboard(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  use(props.searchParams ?? Promise.resolve({}))
  const supabase = createClient()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterProperty, setFilterProperty] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest')

  // Expandable comments
  const [expandedComments, setExpandedComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Close modal
  const [closeModal, setCloseModal] = useState<{ req: Request } | null>(null)
  const [closeComment, setCloseComment] = useState('')
  const [closingId, setClosingId] = useState<string | null>(null)
  const closeTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function fetchData() {
      const [reqRes, propRes, vendRes] = await Promise.all([
        supabase
          .from('requests')
          .select('*, properties(*), vendors(*), categories(*), comments(count)')
          .order('created_at', { ascending: false }),
        supabase.from('properties').select('*').eq('active', true).order('name'),
        supabase.from('vendors').select('*').eq('active', true).order('name'),
      ])
      setRequests((reqRes.data as Request[]) || [])
      setProperties((propRes.data as Property[]) || [])
      setVendors((vendRes.data as Vendor[]) || [])
      setLoading(false)
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, waiting: 0, closed: 0 }
    requests.forEach((r) => c[r.status]++)
    return c
  }, [requests])

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  const filtered = useMemo(() => {
    // Default: hide closed. Show closed only when explicitly filtered.
    let list = filterStatus === 'closed'
      ? [...requests]
      : requests.filter((r) => r.status !== 'closed')
    if (filterProperty) list = list.filter((r) => r.property_id === filterProperty)
    if (filterAssignee) list = list.filter((r) => r.assigned_to === filterAssignee)
    if (filterPriority) list = list.filter((r) => r.priority === filterPriority)
    if (filterStatus) list = list.filter((r) => r.status === filterStatus)

    if (sortBy === 'oldest') {
      list = [...list].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    } else if (sortBy === 'priority') {
      list = [...list].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      )
    }

    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, filterProperty, filterAssignee, filterPriority, filterStatus, sortBy])

  const daysOpen = (createdAt: string) => differenceInDays(new Date(), new Date(createdAt))

  const getCommentCount = (req: Request) => {
    if (req.comments && req.comments.length > 0) return req.comments[0].count
    return 0
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, req: Request) => {
    e.stopPropagation()
    const newStatus = e.target.value as Status
    if (newStatus === req.status) return

    // Closing requires a comment — show modal
    if (newStatus === 'closed') {
      setCloseComment('')
      setCloseModal({ req })
      setTimeout(() => closeTextareaRef.current?.focus(), 50)
      return
    }

    await applyStatusChange(req, newStatus)
  }

  const applyStatusChange = async (req: Request, newStatus: Status, comment?: string) => {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? { ...r, status: newStatus, closed_at: newStatus === 'closed' ? new Date().toISOString() : null }
          : r
      )
    )

    const update: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      closed_at: newStatus === 'closed' ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from('requests').update(update).eq('id', req.id)
    if (error) {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? req : r)))
      return
    }

    if (comment?.trim()) {
      const { data: newComment } = await supabase
        .from('comments')
        .insert({ request_id: req.id, author_name: 'Ryan', body: comment.trim() })
        .select()
        .single()

      if (newComment) {
        // Update comment count optimistically
        setRequests((prev) =>
          prev.map((r) => {
            if (r.id !== req.id) return r
            const currentCount = r.comments?.[0]?.count ?? 0
            return { ...r, comments: [{ count: currentCount + 1 }] }
          })
        )
        // Append to expanded comments if open
        setExpandedComments((prev) => ({
          ...prev,
          [req.id]: [newComment as Comment, ...(prev[req.id] || [])],
        }))
      }
    }
  }

  const handleCloseConfirm = async () => {
    if (!closeModal || !closeComment.trim()) return
    setClosingId(closeModal.req.id)
    await applyStatusChange(closeModal.req, 'closed', closeComment)
    setClosingId(null)
    setCloseModal(null)
    setCloseComment('')
  }

  const toggleComments = async (reqId: string) => {
    if (expandedIds.has(reqId)) {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        next.delete(reqId)
        return next
      })
      return
    }

    setExpandedIds((prev) => new Set(prev).add(reqId))

    // Lazy fetch if not already loaded
    if (!expandedComments[reqId]) {
      setLoadingComments((prev) => ({ ...prev, [reqId]: true }))
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('request_id', reqId)
        .order('created_at', { ascending: false })
      setExpandedComments((prev) => ({ ...prev, [reqId]: (data as Comment[]) || [] }))
      setLoadingComments((prev) => ({ ...prev, [reqId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-navy">Felfam Maintenance</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {([
          { label: 'Open', count: counts.open, color: 'bg-blue-500' },
          { label: 'In Progress', count: counts.in_progress, color: 'bg-purple-500' },
          { label: 'Waiting', count: counts.waiting, color: 'bg-amber-500' },
          { label: 'Closed', count: counts.closed, color: 'bg-green-500' },
        ] as const).map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={clsx('w-2.5 h-2.5 rounded-full', item.color)} />
              <span className="text-xs text-gray-500 font-medium">{item.label}</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{item.count}</span>
          </div>
        ))}
      </div>

      {/* Filter / Sort Bar */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors min-h-[44px]',
            showFilters
              ? 'bg-navy text-white border-navy'
              : 'bg-white text-gray-700 border-gray-200'
          )}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button
          onClick={() =>
            setSortBy(sortBy === 'newest' ? 'oldest' : sortBy === 'oldest' ? 'priority' : 'newest')
          }
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 min-h-[44px]"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Priority'}
        </button>
        <span className="ml-auto text-sm text-gray-500">{filtered.length} requests</span>
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="grid grid-cols-2 gap-2 mb-4 bg-white p-3 rounded-xl border border-gray-200">
          <select
            value={filterProperty}
            onChange={(e) => setFilterProperty(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px]"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px]"
          >
            <option value="">All Assignees</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px]"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm min-h-[44px]"
          >
            <option value="">Active (excl. Closed)</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}

      {/* Request Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No open requests</p>
          <p className="text-sm mt-1">Everything is under control!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const commentCount = getCommentCount(req)
            const isExpanded = expandedIds.has(req.id)
            const commentsData = expandedComments[req.id]
            const isLoadingComments = loadingComments[req.id]
            return (
              <div key={req.id}>
                <div
                  onClick={() => router.push(`/requests/${req.id}`)}
                  className={clsx(
                    'bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:bg-gray-50 transition-colors cursor-pointer',
                    isExpanded && 'rounded-b-none'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">
                      {req.title}
                    </h3>
                    <PriorityBadge priority={req.priority} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    {req.properties && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {req.properties.name}
                      </span>
                    )}
                    {req.tenant_name && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {req.tenant_name}
                      </span>
                    )}
                    {req.vendors && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {req.vendors.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {daysOpen(req.created_at)}d open
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={req.status}
                      onChange={(e) => handleStatusChange(e, req)}
                      onClick={(e) => e.stopPropagation()}
                      className={clsx(
                        'text-xs font-semibold rounded-full px-2.5 py-1 border appearance-none cursor-pointer pr-6',
                        statusStyles[req.status]
                      )}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 6px center',
                      }}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="ml-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleComments(req.id)
                        }}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 min-h-[32px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {commentCount > 0 && (
                          <span className="font-medium text-gray-500">{commentCount}</span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                {/* Expanded comments panel */}
                {isExpanded && (
                  <div className="bg-gray-50 border border-t-0 border-gray-200 rounded-b-xl px-4 py-3">
                    {isLoadingComments ? (
                      <div className="flex items-center justify-center py-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy" />
                      </div>
                    ) : commentsData && commentsData.length > 0 ? (
                      <div className="space-y-2">
                        {commentsData.map((c) => (
                          <div key={c.id} className="bg-white rounded-lg p-2.5 border border-gray-100">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-semibold text-xs text-gray-900">{c.author_name}</span>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-2">No comments yet</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <Link
        href="/requests/new"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-navy text-white rounded-full shadow-lg flex items-center justify-center active:bg-navy-dark transition-colors z-40"
      >
        <Plus className="w-7 h-7" />
      </Link>

      {/* Close Task Modal */}
      {closeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0"
          onClick={() => setCloseModal(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Close Task</h2>
              <button onClick={() => setCloseModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-1 font-medium truncate">{closeModal.req.title}</p>
            <p className="text-xs text-gray-400 mb-3">A closing comment is required before marking this task as closed.</p>
            <textarea
              ref={closeTextareaRef}
              value={closeComment}
              onChange={(e) => setCloseComment(e.target.value)}
              placeholder="Describe what was done to resolve this task..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setCloseModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseConfirm}
                disabled={!closeComment.trim() || closingId === closeModal.req.id}
                className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-green-700 transition-colors"
              >
                {closingId === closeModal.req.id ? 'Closing…' : 'Close Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
