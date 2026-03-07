alter table requests
  drop constraint if exists requests_category_id_fkey,
  add constraint requests_category_id_fkey
    foreign key (category_id) references categories(id) on delete set null;
