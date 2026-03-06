-- Felfam Maintenance — Full Database Schema
-- Run this in the Supabase SQL Editor to set up all tables.

-- Properties
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Vendors / Assignees
create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text check (phone_number is null or phone_number ~ '^\+[1-9][0-9]{9,14}$'),
  sms_enabled boolean default false,
  sms_broadcast boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

-- Maintenance Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean default true
);

-- Maintenance Requests
create table requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  property_id uuid references properties(id),
  unit_area text,
  tenant_name text,
  category_id uuid references categories(id),
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  assigned_to uuid references vendors(id),
  description text,
  status text check (status in ('open','in_progress','waiting','closed')) default 'open',
  due_date date,
  hours_spent numeric,
  total_cost numeric,
  work_summary text,
  submitter_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz default now()
);

-- Work log entries
create table work_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  summary text,
  hours_spent numeric,
  cost numeric,
  created_at timestamptz default now()
);

-- File attachments
create table attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  attachment_type text check (attachment_type in ('photo','document','receipt','invoice','completion_photo')) default 'document',
  uploaded_at timestamptz default now()
);

-- Seed data
insert into properties (name) values ('Oakville'), ('Collinsville'), ('Pointe 44');
insert into vendors (name) values ('Jordan'), ('JBR Heating'), ('Lakeside Roofing');
insert into categories (name) values ('HVAC'), ('Plumbing'), ('Electrical'), ('Appliance'), ('Landscaping'), ('Roofing'), ('General'), ('Other');

-- Storage bucket (run separately in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('maintenance-files', 'maintenance-files', true);
