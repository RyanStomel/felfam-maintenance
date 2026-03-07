'use client'

import { Info } from 'lucide-react'

type InfoBubbleProps = {
  content: string
  className?: string
}

export function InfoBubble({ content, className = '' }: InfoBubbleProps) {
  return (
    <span
      className={`group relative inline-flex shrink-0 ${className}`}
      role="img"
      aria-label="More information"
      title={content}
      tabIndex={0}
    >
      <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
      <span
        className="invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 w-64 px-3 py-2.5 text-sm text-white bg-gray-900 rounded-lg shadow-xl transition-opacity duration-150 pointer-events-none"
        style={{ whiteSpace: 'normal' }}
      >
        {content}
        <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-[6px] border-l-0 border-y-transparent border-r-gray-900" />
      </span>
    </span>
  )
}
