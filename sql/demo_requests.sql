-- Demo account requests from partners
create table demo_requests (
  id uuid default gen_random_uuid() primary key,
  partner_id uuid references partners(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table demo_requests enable row level security;

-- Partner can view own requests
create policy "Partners can view own requests"
  on demo_requests for select using (
    partner_id in (select id from partners where user_id = auth.uid())
  );

-- Partner can create requests
create policy "Partners can create requests"
  on demo_requests for insert with check (
    partner_id in (select id from partners where user_id = auth.uid())
  );

-- Admins can do everything
create policy "Admins can do everything"
  on demo_requests for all using (
    exists (select 1 from partners where user_id = auth.uid() and is_admin = true)
  );
