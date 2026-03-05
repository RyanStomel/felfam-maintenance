'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Filter, ArrowUpDown, Building2, User, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { PriorityBadge, StatusBadge } from '@/components/badges'
import { differenceInDays } from 'date-fns'
import { clsx } from 'clsx'
import type { Request, Property, Vendor } from '@/lib/types'

export default function Dashboard() {
  const supabase = createClient()
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

  useEffect(() => {
    async function fetchData() {
      const [reqRes, propRes, vendRes] = await Promise.all([
        supabase
          .from('requests')
          .select('*, properties(*), vendors(*), categories(*)')
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
    let list = requests.filter((r) => r.status !== 'closed')
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
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
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
          {filtered.map((req) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:bg-gray-50 transition-colors"
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
              <div className="mt-2">
                <StatusBadge status={req.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <Link
        href="/requests/new"
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-navy text-white rounded-full shadow-lg flex items-center justify-center active:bg-navy-dark transition-colors z-40"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  )
}
