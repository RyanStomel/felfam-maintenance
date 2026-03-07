'use client'

import { use, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/components/toast'
import {
  Building2,
  Users,
  Tags,
  Plus,
  Pencil,
  Power,
  Trash2,
  MessageSquare,
  Phone,
} from 'lucide-react'
import { formatPhoneNumberDisplay, normalizePhoneNumber, PHONE_NUMBER_ERROR } from '@/lib/phone'
import { ConfirmModal } from '@/components/confirm-modal'
import { InfoBubble } from '@/components/info-bubble'
import type { Vendor } from '@/lib/types'

type SimpleItem = {
  id: string
  name: string
  active: boolean
}

type VendorFormState = {
  name: string
  phoneNumber: string
  smsEnabled: boolean
  smsBroadcast: boolean
}

type SimpleSectionKey = 'properties' | 'categories'

const emptyVendorForm: VendorFormState = {
  name: '',
  phoneNumber: '',
  smsEnabled: false,
  smsBroadcast: false,
}

export default function SettingsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  use(props.searchParams ?? Promise.resolve({}))
  const supabase = createClient()
  const { toast } = useToast()

  const [properties, setProperties] = useState<SimpleItem[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<SimpleItem[]>([])
  const [loading, setLoading] = useState(true)

  const [newProperty, setNewProperty] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newVendor, setNewVendor] = useState<VendorFormState>(emptyVendorForm)

  const [editingSimple, setEditingSimple] = useState<{
    section: SimpleSectionKey
    id: string
    name: string
  } | null>(null)
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [editingVendor, setEditingVendor] = useState<VendorFormState>(emptyVendorForm)
  const [confirmDelete, setConfirmDelete] = useState<
    { type: 'vendor'; item: Vendor } | { type: 'category'; item: SimpleItem } | null
  >(null)

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll() {
    setLoading(true)
    const [propertiesRes, vendorsRes, categoriesRes] = await Promise.all([
      supabase.from('properties').select('id,name,active').order('name'),
      supabase
        .from('vendors')
        .select('id,name,phone_number,sms_enabled,sms_broadcast,active,created_at')
        .order('name'),
      supabase.from('categories').select('id,name,active').order('name'),
    ])

    setProperties((propertiesRes.data || []) as SimpleItem[])
    setVendors((vendorsRes.data || []) as Vendor[])
    setCategories((categoriesRes.data || []) as SimpleItem[])
    setLoading(false)
  }

  async function addSimpleItem(section: SimpleSectionKey, rawValue: string) {
    const name = rawValue.trim()
    if (!name) return

    const { error } = await supabase.from(section).insert({ name, active: true })
    if (error) {
      toast(`Failed to add ${section.slice(0, -1)}`, 'error')
      return
    }

    if (section === 'properties') setNewProperty('')
    if (section === 'categories') setNewCategory('')

    toast(`${name} added`)
    loadAll()
  }

  function buildVendorPayload(form: VendorFormState) {
    const name = form.name.trim()
    if (!name) {
      toast('Vendor name is required', 'error')
      return null
    }

    const phoneNumber = normalizePhoneNumber(form.phoneNumber)
    if (form.phoneNumber.trim() && !phoneNumber) {
      toast(PHONE_NUMBER_ERROR, 'error')
      return null
    }

    if ((form.smsEnabled || form.smsBroadcast) && !phoneNumber) {
      toast('SMS-enabled vendors need a phone number', 'error')
      return null
    }

    const payload = {
      name,
      phone_number: phoneNumber,
      sms_enabled: form.smsEnabled || form.smsBroadcast,
      sms_broadcast: form.smsBroadcast,
      active: true,
    }
    return payload
  }

  async function addVendor() {
    const payload = buildVendorPayload(newVendor)
    if (!payload) return

    const { error } = await supabase.from('vendors').insert(payload)
    if (error) {
      toast(`Failed to add vendor: ${error.message}`, 'error')
      return
    }

    setNewVendor(emptyVendorForm)
    toast(`${payload.name} added`)
    loadAll()
  }

  function startSimpleEdit(section: SimpleSectionKey, item: SimpleItem) {
    setEditingSimple({ section, id: item.id, name: item.name })
  }

  async function saveSimpleEdit() {
    if (!editingSimple) return
    const name = editingSimple.name.trim()
    if (!name) return

    const { error } = await supabase
      .from(editingSimple.section)
      .update({ name })
      .eq('id', editingSimple.id)

    if (error) {
      toast('Failed to save changes', 'error')
      return
    }

    toast('Saved')
    setEditingSimple(null)
    loadAll()
  }

  function startVendorEdit(vendor: Vendor) {
    setEditingVendorId(vendor.id)
    setEditingVendor({
      name: vendor.name,
      phoneNumber: vendor.phone_number || '',
      smsEnabled: vendor.sms_enabled,
      smsBroadcast: vendor.sms_broadcast,
    })
  }

  async function saveVendorEdit(id: string) {
    const payload = buildVendorPayload(editingVendor)
    if (!payload) return

    const { error } = await supabase.from('vendors').update(payload).eq('id', id)
    if (error) {
      toast('Failed to save vendor changes', 'error')
      return
    }

    toast('Vendor saved')
    setEditingVendorId(null)
    setEditingVendor(emptyVendorForm)
    loadAll()
  }

  async function toggleActive(section: 'properties' | 'vendors' | 'categories', item: SimpleItem | Vendor) {
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

  function openDeleteVendorModal(vendor: Vendor) {
    setConfirmDelete({ type: 'vendor', item: vendor })
  }

  function openDeleteCategoryModal(item: SimpleItem) {
    setConfirmDelete({ type: 'category', item })
  }

  async function executeDelete() {
    if (!confirmDelete) return
    if (confirmDelete.type === 'vendor') {
      const { error } = await supabase.from('vendors').delete().eq('id', confirmDelete.item.id)
      if (error) {
        toast(`Failed to delete vendor: ${error.message}`, 'error')
        return
      }
      toast(`${confirmDelete.item.name} deleted`)
    } else {
      const { error } = await supabase.from('categories').delete().eq('id', confirmDelete.item.id)
      if (error) {
        toast(`Failed to delete category: ${error.message}`, 'error')
        return
      }
      toast(`${confirmDelete.item.name} deleted`)
    }
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
        <p className="text-sm text-gray-500 mt-1">
          Manage properties, vendors, categories, and SMS notification recipients
        </p>
      </div>

      <SimpleSection
        icon={<Building2 className="w-5 h-5 text-navy" />}
        title="Properties"
        placeholder="Add property"
        value={newProperty}
        onChange={setNewProperty}
        onAdd={() => addSimpleItem('properties', newProperty)}
        items={properties}
        editingItem={editingSimple?.section === 'properties' ? editingSimple : null}
        onEditingNameChange={(name) =>
          setEditingSimple((current) => (current ? { ...current, name } : current))
        }
        onEdit={(item) => startSimpleEdit('properties', item)}
        onSave={saveSimpleEdit}
        onCancel={() => setEditingSimple(null)}
        onToggle={(item) => toggleActive('properties', item)}
      />

      <VendorsSection
        vendors={vendors}
        newVendor={newVendor}
        setNewVendor={setNewVendor}
        editingVendorId={editingVendorId}
        editingVendor={editingVendor}
        setEditingVendor={setEditingVendor}
        onAdd={addVendor}
        onEdit={startVendorEdit}
        onSave={saveVendorEdit}
        onCancel={() => {
          setEditingVendorId(null)
          setEditingVendor(emptyVendorForm)
        }}
        onToggle={(vendor) => toggleActive('vendors', vendor)}
        onDelete={openDeleteVendorModal}
      />

      <SimpleSection
        icon={<Tags className="w-5 h-5 text-navy" />}
        title="Categories"
        placeholder="Add category"
        value={newCategory}
        onChange={setNewCategory}
        onAdd={() => addSimpleItem('categories', newCategory)}
        items={categories}
        editingItem={editingSimple?.section === 'categories' ? editingSimple : null}
        onEditingNameChange={(name) =>
          setEditingSimple((current) => (current ? { ...current, name } : current))
        }
        onEdit={(item) => startSimpleEdit('categories', item)}
        onSave={saveSimpleEdit}
        onCancel={() => setEditingSimple(null)}
        onToggle={(item) => toggleActive('categories', item)}
        onDelete={openDeleteCategoryModal}
      />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        title={confirmDelete ? `Delete ${confirmDelete.item.name}?` : ''}
        message="This cannot be undone."
      />
    </div>
  )
}

function SimpleSection({
  icon,
  title,
  placeholder,
  value,
  onChange,
  onAdd,
  items,
  editingItem,
  onEditingNameChange,
  onEdit,
  onSave,
  onCancel,
  onToggle,
  onDelete,
}: {
  icon: ReactNode
  title: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onAdd: () => void
  items: SimpleItem[]
  editingItem: { id: string; name: string } | null
  onEditingNameChange: (value: string) => void
  onEdit: (item: SimpleItem) => void
  onSave: () => void
  onCancel: () => void
  onToggle: (item: SimpleItem) => void
  onDelete?: (item: SimpleItem) => void
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
          onChange={(event) => onChange(event.target.value)}
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
              {editingItem?.id === item.id ? (
                <input
                  value={editingItem.name}
                  onChange={(event) => onEditingNameChange(event.target.value)}
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

              {editingItem?.id === item.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={onSave}
                    className="px-3 py-2 rounded-lg bg-navy text-white text-sm min-h-[40px]"
                  >
                    Save
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm min-h-[40px]"
                  >
                    Cancel
                  </button>
                </div>
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
              {onDelete && (
                <button
                  onClick={() => onDelete(item)}
                  className="p-2 rounded-lg hover:bg-red-50 min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function VendorsSection({
  vendors,
  newVendor,
  setNewVendor,
  editingVendorId,
  editingVendor,
  setEditingVendor,
  onAdd,
  onEdit,
  onSave,
  onCancel,
  onToggle,
  onDelete,
}: {
  vendors: Vendor[]
  newVendor: VendorFormState
  setNewVendor: (value: VendorFormState | ((current: VendorFormState) => VendorFormState)) => void
  editingVendorId: string | null
  editingVendor: VendorFormState
  setEditingVendor: (value: VendorFormState | ((current: VendorFormState) => VendorFormState)) => void
  onAdd: () => void
  onEdit: (vendor: Vendor) => void
  onSave: (id: string) => void
  onCancel: () => void
  onToggle: (vendor: Vendor) => void
  onDelete: (vendor: Vendor) => void
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-navy" />
        <h2 className="font-semibold text-gray-900">Vendors / Assignees</h2>
      </div>

      <VendorEditor
        title="Add vendor or assignee"
        state={newVendor}
        onChange={setNewVendor}
        onSave={onAdd}
        saveLabel="Add"
      />

      {vendors.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">No vendors yet.</p>
      ) : (
        <ul className="space-y-3">
          {vendors.map((vendor) => {
            const isEditing = editingVendorId === vendor.id

            return (
              <li key={vendor.id} className="rounded-xl border border-gray-100 p-3 space-y-3">
                {isEditing ? (
                  <VendorEditor
                    title="Edit vendor"
                    state={editingVendor}
                    onChange={setEditingVendor}
                    onSave={() => onSave(vendor.id)}
                    saveLabel="Save"
                    onCancel={onCancel}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">{vendor.name}</span>
                        {!vendor.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Inactive
                          </span>
                        )}
                        {vendor.sms_enabled ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            SMS enabled
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            SMS off
                          </span>
                        )}
                        {vendor.sms_broadcast && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Global recipient
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {formatPhoneNumberDisplay(vendor.phone_number)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {vendor.sms_broadcast ? 'Gets all request SMS updates' : 'Only assigned-request SMS'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => onEdit(vendor)}
                        className="p-2 rounded-lg hover:bg-gray-100 min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => onToggle(vendor)}
                        className="p-2 rounded-lg hover:bg-gray-100 min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                        title={vendor.active ? 'Deactivate' : 'Activate'}
                      >
                        <Power
                          className={`w-4 h-4 ${vendor.active ? 'text-green-600' : 'text-gray-400'}`}
                        />
                      </button>
                      <button
                        onClick={() => onDelete(vendor)}
                        className="p-2 rounded-lg hover:bg-red-50 min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function VendorEditor({
  title,
  state,
  onChange,
  onSave,
  saveLabel,
  onCancel,
}: {
  title: string
  state: VendorFormState
  onChange: (value: VendorFormState | ((current: VendorFormState) => VendorFormState)) => void
  onSave: () => void
  saveLabel: string
  onCancel?: () => void
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <input
        value={state.name}
        onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
        placeholder="Vendor or assignee name"
      />
      <input
        value={state.phoneNumber}
        onChange={(event) =>
          onChange((current) => ({ ...current, phoneNumber: event.target.value }))
        }
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base min-h-[44px]"
        placeholder="Phone number"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
          <input
            type="checkbox"
            checked={state.smsEnabled}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                smsEnabled: event.target.checked,
                smsBroadcast: event.target.checked ? current.smsBroadcast : false,
              }))
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700 flex-1">Enable SMS for assigned updates</span>
          <InfoBubble content="This person receives SMS notifications only when they are assigned to a request. They'll get alerts for new requests, work log entries, and status changes—but only for requests they're working on." />
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
          <input
            type="checkbox"
            checked={state.smsBroadcast}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                smsBroadcast: event.target.checked,
                smsEnabled: event.target.checked ? true : current.smsEnabled,
              }))
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700 flex-1">Send all request/work/status SMS</span>
          <InfoBubble content="This person receives SMS for every request in the system—new requests, work updates, and status changes—regardless of who is assigned. Use for managers or coordinators who need full visibility." />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="px-4 py-3 rounded-xl bg-navy text-white font-medium min-h-[44px] inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {saveLabel}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium min-h-[44px]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
