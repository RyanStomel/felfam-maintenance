alter table requests
  drop constraint if exists requests_assigned_to_fkey,
  add constraint requests_assigned_to_fkey
    foreign key (assigned_to) references vendors(id) on delete set null;
