create table if not exists orders (
  id bigserial primary key,
  owner_sub text not null,
  owner_name text not null default '',
  status text not null default 'pending',
  total_cents integer not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists orders_owner_sub_created_at_idx
  on orders (owner_sub, created_at desc);

create table if not exists order_items (
  id bigserial primary key,
  order_id bigint not null references orders (id) on delete cascade,
  item_id text not null,
  item_name text not null,
  item_kind text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null,
  ice text,
  sugar text,
  drink_name text,
  line_total_cents integer not null
);

create index if not exists order_items_order_id_idx on order_items (order_id);
