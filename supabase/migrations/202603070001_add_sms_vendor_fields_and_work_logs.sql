alter table vendors
  add column if not exists phone_number text,
  add column if not exists sms_enabled boolean default false,
  add column if not exists sms_broadcast boolean default false;

alter table vendors
  drop constraint if exists vendors_phone_number_check;

alter table vendors
  add constraint vendors_phone_number_check
  check (phone_number is null or phone_number ~ '^\+[1-9][0-9]{9,14}$');

create table if not exists work_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  summary text,
  hours_spent numeric,
  cost numeric,
  created_at timestamptz default now()
);
