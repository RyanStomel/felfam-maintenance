import { clsx } from 'clsx'
import type { Priority, Status } from '@/lib/types'

const priorityStyles: Record<Priority, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

const statusStyles: Record<Status, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  waiting: 'bg-amber-100 text-amber-800',
  closed: 'bg-green-100 text-green-800',
}

const statusLabels: Record<Status, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  closed: 'Closed',
}

const priorityLabels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        priorityStyles[priority]
      )}
    >
      {priorityLabels[priority]}
    </span>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
