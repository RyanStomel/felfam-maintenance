'use client'

import { useRef, useState } from 'react'
import { Camera, ImageIcon, X } from 'lucide-react'

interface ImageUploadProps {
  label?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  selectedCount?: number
  className?: string
}

export function ImageUpload({
  label = 'Add Photos',
  multiple = true,
  onFiles,
  selectedCount,
  className = '',
}: ImageUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)

  const handle = (ref: React.RefObject<HTMLInputElement | null>) => {
    setOpen(false)
    ref.current?.click()
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) onFiles(files)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className={`relative ${className}`}>
      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={multiple}
        className="hidden"
        onChange={onChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={onChange}
      />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-navy hover:text-navy transition-colors min-h-[56px]"
      >
        <Camera className="w-5 h-5" />
        <span className="text-base font-medium">
          {selectedCount ? `${selectedCount} photo(s) selected` : label}
        </span>
      </button>

      {/* Chooser popup */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Add Photo</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => handle(cameraRef)}
              className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 transition-colors text-left min-h-[56px]"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Take Photo</p>
                <p className="text-xs text-gray-400">Open camera</p>
              </div>
            </button>
            <div className="h-px bg-gray-100 mx-4" />
            <button
              type="button"
              onClick={() => handle(galleryRef)}
              className="flex items-center gap-3 w-full px-4 py-4 hover:bg-gray-50 transition-colors text-left min-h-[56px]"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Choose from Library</p>
                <p className="text-xs text-gray-400">Select existing photo</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
