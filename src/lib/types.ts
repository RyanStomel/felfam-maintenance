export interface Property {
  id: string
  name: string
  active: boolean
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  phone_number: string | null
  sms_enabled: boolean
  sms_broadcast: boolean
  active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  active: boolean
}

export interface Request {
  id: string
  title: string
  property_id: string | null
  unit_area: string | null
  tenant_name: string | null
  category_id: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  description: string | null
  status: 'open' | 'in_progress' | 'waiting' | 'closed'
  due_date: string | null
  hours_spent: number | null
  total_cost: number | null
  work_summary: string | null
  submitter_name: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  // Joined fields
  properties?: Property | null
  vendors?: Vendor | null
  categories?: Category | null
}

export interface Comment {
  id: string
  request_id: string
  author_name: string
  body: string
  created_at: string
}

export interface Attachment {
  id: string
  request_id: string
  file_name: string
  file_url: string
  file_type: string | null
  attachment_type: 'photo' | 'document' | 'receipt' | 'invoice' | 'completion_photo'
  uploaded_at: string
}

export interface WorkLog {
  id: string
  request_id: string
  summary: string | null
  hours_spent: number | null
  cost: number | null
  created_at: string
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Status = 'open' | 'in_progress' | 'waiting' | 'closed'
