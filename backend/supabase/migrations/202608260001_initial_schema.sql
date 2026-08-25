begin;

create extension if not exists pgcrypto;

create sequence if not exists public.pickup_number_seq start 100001;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('distributor', 'collector')),
  first_name text not null,
  last_name text not null,
  phone text,
  business_name text,
  address jsonb,
  identity_summary jsonb not null default '{}'::jsonb,
  onboarding_source text not null default 'reko',
  wema_account_hash text unique,
  wema_account_last4 text,
  wema_account_status text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  currency text not null default 'NGN',
  balance numeric(14,2) not null default 0 check (balance >= 0),
  available_balance numeric(14,2) not null default 0 check (available_balance >= 0),
  provider text,
  provider_account_last4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.materials (
  id text primary key,
  name text not null,
  rate numeric(12,2) not null check (rate >= 0),
  trend numeric(8,2) not null default 0,
  examples text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_history (
  id uuid primary key default gen_random_uuid(),
  material_id text not null references public.materials(id),
  rate numeric(12,2) not null,
  effective_at timestamptz not null default now(),
  changed_by uuid references public.profiles(id),
  reason text
);

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  area text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  hours text,
  active boolean not null default true,
  material_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pickups (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default ('RKO-' || lpad(nextval('public.pickup_number_seq')::text, 6, '0')),
  customer_id uuid not null references public.profiles(id),
  collector_id uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','accepted','en_route','arrived','paid','cancelled')),
  address_label text not null,
  latitude double precision not null,
  longitude double precision not null,
  address_notes text,
  pickup_window text not null,
  photo_paths text[] not null default '{}',
  customer_note text,
  estimated_weight numeric(12,2) not null default 0,
  estimated_payout numeric(14,2) not null default 0,
  verified_weight numeric(12,2),
  customer_payout numeric(14,2),
  collector_fee numeric(14,2) not null default 0,
  customer_confirmed boolean not null default false,
  distance_at_acceptance_km numeric(10,2),
  last_collector_location jsonb,
  accepted_at timestamptz,
  en_route_at timestamptz,
  arrived_at timestamptz,
  payout_approved_at timestamptz,
  payout_approved_by uuid references public.profiles(id),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pickup_items (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references public.pickups(id) on delete cascade,
  material_id text not null references public.materials(id),
  estimated_weight numeric(12,2) not null check (estimated_weight > 0),
  rate_at_booking numeric(12,2) not null,
  estimated_payout numeric(14,2) not null,
  verified_weight numeric(12,2),
  rate_at_payout numeric(12,2),
  quality text check (quality in ('clean','mixed','needs_sorting')),
  quality_factor numeric(4,3),
  payout numeric(14,2),
  unique (pickup_id, material_id)
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id),
  user_id uuid not null references public.profiles(id),
  pickup_id uuid references public.pickups(id),
  type text not null,
  direction text not null check (direction in ('credit','debit')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'NGN',
  status text not null default 'completed' check (status in ('pending','completed','failed','reversed')),
  description text,
  provider_reference text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id),
  user_id uuid not null references public.profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  bank_code text not null,
  account_last4 text not null,
  status text not null default 'pending' check (status in ('pending','completed','failed','reversed')),
  provider_reference text unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.wema_onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  account_hash text not null,
  account_last4 text not null,
  account_name text,
  masked_phone text,
  status text not null default 'pending' check (status in ('pending','verified','expired','failed')),
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pickups_customer_idx on public.pickups(customer_id, created_at desc);
create index if not exists pickups_collector_idx on public.pickups(collector_id, created_at desc);
create index if not exists pickups_status_idx on public.pickups(status, created_at desc);
create index if not exists pickup_items_pickup_idx on public.pickup_items(pickup_id);
create index if not exists wallet_transactions_user_idx on public.wallet_transactions(user_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists stations_active_idx on public.stations(active);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger wallets_updated_at before update on public.wallets for each row execute function public.set_updated_at();
create trigger stations_updated_at before update on public.stations for each row execute function public.set_updated_at();
create trigger pickups_updated_at before update on public.pickups for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, first_name, last_name, phone, business_name, onboarding_source)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' in ('distributor','collector') then new.raw_user_meta_data->>'role' else 'distributor' end,
    coalesce(new.raw_user_meta_data->>'firstName', 'REKO'),
    coalesce(new.raw_user_meta_data->>'lastName', 'User'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'businessName',
    coalesce(new.raw_user_meta_data->>'onboardingSource', 'reko')
  );
  insert into public.wallets (user_id, currency) values (new.id, 'NGN');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

create or replace function public.haversine_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

create or replace function public.accept_pickup(p_pickup_id uuid, p_collector_id uuid, p_latitude double precision, p_longitude double precision)
returns public.pickups language plpgsql security definer set search_path = public as $$
declare
  result public.pickups;
  collector_role text;
begin
  select role into collector_role from public.profiles where id = p_collector_id and active = true;
  if collector_role is distinct from 'collector' then raise exception 'COLLECTOR_REQUIRED'; end if;
  select * into result from public.pickups where id = p_pickup_id for update;
  if result.id is null then raise exception 'PICKUP_NOT_FOUND'; end if;
  if result.status <> 'pending' or result.collector_id is not null then raise exception 'ORDER_UNAVAILABLE'; end if;
  update public.pickups set collector_id = p_collector_id, status = 'accepted', accepted_at = now(),
    distance_at_acceptance_km = public.haversine_km(p_latitude, p_longitude, result.latitude, result.longitude)
    where id = p_pickup_id returning * into result;
  insert into public.notifications(user_id,type,title,message,metadata)
    values(result.customer_id,'collector_assigned','Collector assigned',result.public_id || ' has been accepted.',jsonb_build_object('pickupId',result.id));
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(p_collector_id,'pickup.accepted','pickup',result.id,jsonb_build_object('distanceKm',result.distance_at_acceptance_km));
  return result;
end;
$$;

create or replace function public.advance_pickup(p_pickup_id uuid, p_collector_id uuid, p_status text, p_latitude double precision default null, p_longitude double precision default null)
returns public.pickups language plpgsql security definer set search_path = public as $$
declare result public.pickups;
begin
  select * into result from public.pickups where id = p_pickup_id for update;
  if result.id is null or result.collector_id <> p_collector_id then raise exception 'PICKUP_NOT_FOUND'; end if;
  if not ((result.status = 'accepted' and p_status = 'en_route') or (result.status = 'en_route' and p_status = 'arrived')) then raise exception 'INVALID_TRANSITION'; end if;
  update public.pickups set status = p_status,
    en_route_at = case when p_status = 'en_route' then now() else en_route_at end,
    arrived_at = case when p_status = 'arrived' then now() else arrived_at end,
    last_collector_location = case when p_latitude is null then last_collector_location else jsonb_build_object('latitude',p_latitude,'longitude',p_longitude,'updatedAt',now()) end
    where id = p_pickup_id returning * into result;
  insert into public.notifications(user_id,type,title,message,metadata)
    values(result.customer_id,'pickup_' || p_status,case when p_status='en_route' then 'Collector on the way' else 'Collector arrived' end,result.public_id || ' is now ' || replace(p_status,'_',' '),jsonb_build_object('pickupId',result.id));
  insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(p_collector_id,'pickup.' || p_status,'pickup',result.id);
  return result;
end;
$$;

create or replace function public.approve_pickup_payout(p_pickup_id uuid, p_collector_id uuid, p_items jsonb, p_customer_confirmed boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  pickup_record public.pickups;
  item jsonb;
  material_record public.materials;
  item_count integer := 0;
  expected_count integer;
  factor numeric(4,3);
  line_payout numeric(14,2);
  total_payout numeric(14,2) := 0;
  total_weight numeric(12,2) := 0;
  customer_wallet public.wallets;
  collector_wallet public.wallets;
begin
  if p_customer_confirmed is not true then raise exception 'CUSTOMER_CONFIRMATION_REQUIRED'; end if;
  select * into pickup_record from public.pickups where id = p_pickup_id for update;
  if pickup_record.id is null or pickup_record.collector_id <> p_collector_id then raise exception 'PICKUP_NOT_FOUND'; end if;
  if pickup_record.status <> 'arrived' then raise exception 'PICKUP_NOT_READY'; end if;
  select count(*) into expected_count from public.pickup_items where pickup_id = p_pickup_id;
  if jsonb_array_length(p_items) <> expected_count then raise exception 'ITEM_MISMATCH'; end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    select * into material_record from public.materials where id = item->>'materialId' and active = true;
    if material_record.id is null then raise exception 'INVALID_MATERIAL'; end if;
    factor := case item->>'quality' when 'clean' then 1 when 'mixed' then .9 when 'needs_sorting' then .75 else null end;
    if factor is null or (item->>'verifiedWeight')::numeric <= 0 then raise exception 'INVALID_VERIFICATION'; end if;
    line_payout := round((item->>'verifiedWeight')::numeric * material_record.rate * factor, 2);
    update public.pickup_items set verified_weight=(item->>'verifiedWeight')::numeric, rate_at_payout=material_record.rate,
      quality=item->>'quality', quality_factor=factor, payout=line_payout
      where pickup_id=p_pickup_id and material_id=material_record.id;
    if not found then raise exception 'ITEM_MISMATCH'; end if;
    total_payout := total_payout + line_payout;
    total_weight := total_weight + (item->>'verifiedWeight')::numeric;
    item_count := item_count + 1;
  end loop;
  if item_count <> expected_count then raise exception 'ITEM_MISMATCH'; end if;

  select * into customer_wallet from public.wallets where user_id=pickup_record.customer_id for update;
  select * into collector_wallet from public.wallets where user_id=pickup_record.collector_id for update;
  if customer_wallet.id is null or collector_wallet.id is null then raise exception 'WALLET_MISSING'; end if;
  update public.wallets set balance=balance+total_payout, available_balance=available_balance+total_payout where id=customer_wallet.id;
  update public.wallets set balance=balance+pickup_record.collector_fee, available_balance=available_balance+pickup_record.collector_fee where id=collector_wallet.id;
  insert into public.wallet_transactions(wallet_id,user_id,pickup_id,type,direction,amount,description)
    values(customer_wallet.id,pickup_record.customer_id,p_pickup_id,'pickup_credit','credit',total_payout,pickup_record.public_id || ' recycling payout');
  insert into public.wallet_transactions(wallet_id,user_id,pickup_id,type,direction,amount,description)
    values(collector_wallet.id,pickup_record.collector_id,p_pickup_id,'collector_fee','credit',pickup_record.collector_fee,pickup_record.public_id || ' collector service fee');
  update public.pickups set status='paid', verified_weight=total_weight, customer_payout=total_payout,
    customer_confirmed=true, payout_approved_by=p_collector_id, payout_approved_at=now(), completed_at=now()
    where id=p_pickup_id returning * into pickup_record;
  insert into public.notifications(user_id,type,title,message,metadata)
    values(pickup_record.customer_id,'pickup_paid','Pickup paid',pickup_record.public_id || ' added ₦' || total_payout::text || ' to your wallet.',jsonb_build_object('pickupId',pickup_record.id));
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(p_collector_id,'pickup.payout_approved','pickup',pickup_record.id,jsonb_build_object('customerPayout',total_payout,'collectorFee',pickup_record.collector_fee,'verifiedWeight',total_weight));
  return jsonb_build_object('pickup',to_jsonb(pickup_record),'customerPayout',total_payout,'collectorFee',pickup_record.collector_fee);
end;
$$;

revoke all on function public.accept_pickup(uuid,uuid,double precision,double precision) from public, anon, authenticated;
revoke all on function public.advance_pickup(uuid,uuid,text,double precision,double precision) from public, anon, authenticated;
revoke all on function public.approve_pickup_payout(uuid,uuid,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.accept_pickup(uuid,uuid,double precision,double precision) to service_role;
grant execute on function public.advance_pickup(uuid,uuid,text,double precision,double precision) to service_role;
grant execute on function public.approve_pickup_payout(uuid,uuid,jsonb,boolean) to service_role;

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.materials enable row level security;
alter table public.rate_history enable row level security;
alter table public.stations enable row level security;
alter table public.pickups enable row level security;
alter table public.pickup_items enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notifications enable row level security;
alter table public.wema_onboarding_sessions enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_read_own on public.profiles for select to authenticated using (id=auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy wallets_read_own on public.wallets for select to authenticated using (user_id=auth.uid());
create policy transactions_read_own on public.wallet_transactions for select to authenticated using (user_id=auth.uid());
create policy withdrawals_read_own on public.withdrawals for select to authenticated using (user_id=auth.uid());
create policy materials_public_read on public.materials for select to anon, authenticated using (active=true);
create policy rate_history_public_read on public.rate_history for select to anon, authenticated using (true);
create policy stations_public_read on public.stations for select to anon, authenticated using (active=true);
create policy pickups_read_related on public.pickups for select to authenticated using (customer_id=auth.uid() or collector_id=auth.uid() or (status='pending' and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='collector')));
create policy pickup_items_read_related on public.pickup_items for select to authenticated using (exists(select 1 from public.pickups p where p.id=pickup_id and (p.customer_id=auth.uid() or p.collector_id=auth.uid() or (p.status='pending' and exists(select 1 from public.profiles pr where pr.id=auth.uid() and pr.role='collector')))));
create policy notifications_read_own on public.notifications for select to authenticated using (user_id=auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

insert into public.materials(id,name,rate,trend,examples) values
  ('metal','Metal',210,4.8,'Aluminium, copper, steel and cans'),
  ('plastic','Plastic',130,2.1,'Clean PET bottles and containers'),
  ('ewaste','E-waste',180,6.2,'Cables, phones and small devices'),
  ('paper','Paper',100,-1.3,'Cardboard, books and office paper'),
  ('mixed','Mixed',80,1.4,'Sorted household recyclables')
on conflict(id) do update set name=excluded.name,rate=excluded.rate,trend=excluded.trend,examples=excluded.examples,updated_at=now();

insert into public.stations(slug,name,area,address,latitude,longitude,hours,material_ids) values
  ('reko-ikeja','REKO Ikeja Hub','Allen Avenue, Ikeja','44 Allen Avenue, Ikeja, Lagos',6.6018,3.3515,'08:00-19:00',array['metal','plastic','paper']),
  ('greenpoint-vi','GreenPoint VI','Victoria Island','Akin Adesola Street, Victoria Island, Lagos',6.4281,3.4219,'08:00-18:00',array['plastic','ewaste']),
  ('ecodrop-opebi','EcoDrop Opebi','Opebi, Ikeja','Opebi Road, Ikeja, Lagos',6.5887,3.3636,'09:00-17:00',array['metal','paper']),
  ('circular-yaba','Circular Lagos Yaba','Yaba','Herbert Macaulay Way, Yaba, Lagos',6.5158,3.3707,'08:00-18:00',array['metal','plastic','ewaste','paper','mixed'])
on conflict(slug) do update set name=excluded.name,area=excluded.area,address=excluded.address,latitude=excluded.latitude,longitude=excluded.longitude,hours=excluded.hours,material_ids=excluded.material_ids,updated_at=now();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pickup-photos','pickup-photos',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy pickup_photos_insert_own on storage.objects for insert to authenticated
with check (bucket_id='pickup-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy pickup_photos_read_own on storage.objects for select to authenticated
using (bucket_id='pickup-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy pickup_photos_delete_own on storage.objects for delete to authenticated
using (bucket_id='pickup-photos' and (storage.foldername(name))[1]=auth.uid()::text);

alter publication supabase_realtime add table public.pickups;
alter publication supabase_realtime add table public.notifications;

commit;
