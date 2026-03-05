'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/components/toast'
import { Building2, Users, Tags, Plus, Pencil, Power } from 'lucide-react'

type Item = {
  id: string
  name: string
  active: boolean
}

type SectionKey = 'properties' | 'vendors' | 'categories'

export default function SettingsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [properties, setProperties] = useState<Item[]>([])
  const [vendors, setVendors] = useState<Item[]>([])
  const [categories, setCategories] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const [newProperty, setNewProperty] = useState('')
  const [newVendor, setNewVendor] = useState('')
  const [newCategory, setNewCategory] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll() {
    setLoading(true)
    const [p, v, c] = await Promise.all([
      supabase.from('properties').select('id,name,active').order('name'),
      supabase.from('vendors').select('id,name,active').order('name'),
      supabase.from('categories').select('id,name,active').order('name'),
    ])

    setProperties((p.data || []) as Item[])
    setVendors((v.data || []) as Item[])
    setCategories((c.data || []) as Item[])
    setLoading(false)
  }

  async function addItem(section: SectionKey) {
    const stateMap = {
      properties: newProperty,
      vendors: newVendor,
      categories: newCategory,
    }

    const value = stateMap[section].trim()
    if (!value) return

    const { error } = await supabase.from(section).insert({ name: value, active: true })
    if (error) {
      toast(`Failed to add ${section.slice(0, -1)}`, 'error')
      return
    }

    if (section === 'properties') setNewProperty('')
    if (section === 'vendors') setNewVendor('')
    if (section === 'categories') setNewCategory('')

    toast(`${value} added`)
    loadAll()
  }

  function startEdit(item: Item) {
    setEditingId(item.id)
    setEditingName(item.name)
  }

  async function saveEdit(section: SectionKey, id: string) {
    const name = editingName.trim()
    if (!name) return

    const { error } = await supabase.from(section).update({ name }).eq('id', id)
    if (error) {
      toast('Failed to save changes', 'error')
      return
    }

    toast('Saved')
    setEditingId(null)
    setEditingName('')
    loadAll()
  }

  async function toggleActive(section: SectionKey, item: Item) {
    const { error } = await supabase
      .from(section)
      .update({ active: !item.active })
      .eq('id', item.id)

    if (error) {
      toast('Failed to update', 'error')
      return
    }

    toast(`${item.name} ${item.active ? 'deactivated' : 'activated'}`)
    loadAll()
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy mx-auto mt-16" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-navy">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage properties, vendors, and categories</p>
      </div>

      <Section
        icon={<Building2 className="w-5 h-5 text-navy" />}
        title="Properties"
        placeholder="Add property"
        value={newProperty}
        onChange={setNewProperty}
        onAdd={() => addItem('properties')}
        items={properties}
        editingId={editingId}
        editingName={editingName}
        setEditingName={setEditingName}
        onEdit={startEdit}
        onSave={(id) => saveEdit('properties', id)}
        onToggle={(item) => toggleActive('properties', item)}
      />

      <Section
        icon={<Users className="w-5 h-5 text-navy" />}
        title="Vendors / Assignees"
        placeholder="Add vendor or assignee"
        value={newVendor}
        onChange={setNewVendor}
        onAdd={() => addItem('vendors')}
        items={vendors}
        editingId={editingId}
        editingName={editingName}
        setEditingName={setEditingName}
        onEdit={startEdit}
        onSave={(id) => saveEdit('vendors', id)}
        onToggle={(item) => toggleActive('vendors', item)}
      />

      <Section
        icon={<Tags className="w-5 h-5 text-navy" />}
        title="Categories"
        placeholder="Add category"
        value={newCategory}
        onChange={setNewCategory}
        onAdd={() => addItem('categories')}
        items={categories}
        editingId={editingId}
        editingName={editingName}
        setEditingName={setEditingName}
        onEdit={startEdit}
        onSave={(id) => saveEdit('categories', id)}
        onToggle={(item) => toggleActive('categories', item)}
      />
    </div>
  )
}

function Section({
  icon,
  title,
  placeholder,
  value,
  onChange,
  onAdd,
  items,
  editingId,
  editingName,
  setEditingName,
  onEdit,
  onSave,
  onToggle,
}: {
  icon: ReactNode
  title: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onAdd: () => void
  items: Item[]
  editingId: string | null
  editingName: string
  setEditingName: (value: string) => void
  onEdit: (item: Item) => void
  onSave: (id: string) => void
  onToggle: (item: Item) => void
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
          placeholder={placeholder}
        />
        <button
          onClick={onAdd}
          className="px-4 py-3 rounded-xl bg-navy text-white font-medium min-h-[44px] inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No items yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-xl border border-gray-100 p-2"
            >
              {editingId === item.id ? (
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm min-h-[40px]"
                />
              ) : (
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{item.name}</span>
                  {!item.active && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
              )}

              {editingId === item.id ? (
                <button
                  onClick={() => onSave(item.id)}
                  className="px-3 py-2 rounded-lg bg-navy text-white text-sm min-h-[40px]"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => onEdit(item)}
                  className="p-2 rounded-lg hover:bg-gray-100 min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
              )}

              <button
                onClick={() => onToggle(item)}
                className="p-2 rounded-lg hover:bg-gray-100 min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                title={item.active ? 'Deactivate' : 'Activate'}
              >
                <Power className={`w-4 h-4 ${item.active ? 'text-green-600' : 'text-gray-400'}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
