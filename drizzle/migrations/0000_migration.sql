
create type public.app_role as enum ('client', 'provider', 'admin');
create type public.request_status as enum ('nouvelle','devis_recu','accepte','en_cours','termine','annule','litige');
create type public.quote_status as enum ('envoye','accepte','refuse','retire');
create type public.contract_status as enum ('en_attente','actif','en_cours','termine','annule','litige');
create type public.dispute_status as enum ('ouvert','en_examen','resolu','rejete');
create type public.client_kind as enum ('particulier','entreprise','proprietaire','gestionnaire');

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default false
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  active boolean not null default false
);
grant select on public.cities, public.categories to anon, authenticated;
grant all on public.cities, public.categories to service_role;
alter table public.cities enable row level security;
alter table public.categories enable row level security;
create policy "cities readable" on public.cities for select to anon, authenticated using (true);
create policy "categories readable" on public.categories for select to anon, authenticated using (true);

insert into public.cities (name, active) values
 ('Ouagadougou', true), ('Bobo-Dioulasso', false), ('Koudougou', false),
 ('Ouahigouya', false), ('Banfora', false), ('Kaya', false), ('Fada N''Gourma', false);
insert into public.categories (slug, name, active) values
 ('plomberie','Plomberie',true), ('electricite','Électricité',true), ('maintenance','Maintenance',true),
 ('maconnerie','Maçonnerie',false), ('peinture','Peinture',false), ('carrelage','Carrelage',false);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  city_id uuid references public.cities(id),
  district text,
  client_kind public.client_kind default 'particulier',
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_active_user(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _user_id and suspended = false)
$$;

create policy "read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.provider_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null default '',
  trade text,
  description text,
  experience_years int check (experience_years is null or experience_years between 0 and 70),
  verified boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);
create table public.provider_categories (
  provider_id uuid references public.provider_profiles(user_id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (provider_id, category_id)
);
create table public.provider_cities (
  provider_id uuid references public.provider_profiles(user_id) on delete cascade,
  city_id uuid references public.cities(id) on delete cascade,
  primary key (provider_id, city_id)
);

create table public.job_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  city_id uuid not null references public.cities(id),
  district text not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 3000),
  budget_min int check (budget_min is null or budget_min >= 0),
  budget_max int check (budget_max is null or budget_max >= 0),
  deadline text,
  status public.request_status not null default 'nouvelle',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.job_requests (status, category_id, city_id);
create index on public.job_requests (client_id);

create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.job_requests(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.job_requests(id) on delete cascade,
  provider_id uuid not null default auth.uid() references public.provider_profiles(user_id) on delete cascade,
  total_price int not null check (total_price > 0),
  materials_cost int not null default 0 check (materials_cost >= 0),
  labor_cost int not null default 0 check (labor_cost >= 0),
  materials_details text,
  duration_days int not null check (duration_days between 1 and 365),
  message text,
  status public.quote_status not null default 'envoye',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, provider_id)
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.job_requests(id) on delete cascade,
  quote_id uuid not null unique references public.quotes(id),
  client_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.profiles(id),
  amount int not null,
  duration_days int not null,
  client_confirmed_at timestamptz,
  provider_confirmed_at timestamptz,
  status public.contract_status not null default 'en_attente',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  amount int not null,
  method text not null default 'hors_plateforme',
  status text not null default 'non_traite',
  external_reference text,
  created_at timestamptz not null default now()
);
create table public.app_settings (
  key text primary key,
  value numeric not null
);
insert into public.app_settings values ('commission_rate', 0.05);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null unique references public.contracts(id) on delete cascade,
  rate numeric not null,
  amount int not null,
  status text not null default 'prevue',
  created_at timestamptz not null default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id),
  target_id uuid not null references public.profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (contract_id, author_id)
);
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  reason text not null,
  status public.dispute_status not null default 'ouvert',
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create or replace function public.is_contract_party(_contract_id uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.contracts where id = _contract_id and (client_id = _uid or provider_id = _uid))
$$;
create or replace function public.shares_contract(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.contracts where (client_id=_a and provider_id=_b) or (client_id=_b and provider_id=_a))
$$;
create or replace function public.can_view_request(_request_id uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.job_requests r
    where r.id = _request_id and (
      r.client_id = _uid
      or public.has_role(_uid,'admin')
      or (public.has_role(_uid,'provider') and r.status in ('nouvelle','devis_recu'))
      or exists (select 1 from public.quotes q where q.request_id = r.id and q.provider_id = _uid)
    ))
$$;

grant select on public.profiles to authenticated;
grant update (full_name, phone, city_id, district, client_kind) on public.profiles to authenticated;
grant select on public.provider_profiles to authenticated;
grant update (display_name, trade, description, experience_years) on public.provider_profiles to authenticated;
grant select, insert, delete on public.provider_categories, public.provider_cities to authenticated;
grant select, delete on public.job_requests to authenticated;
grant insert (category_id, city_id, district, title, description, budget_min, budget_max, deadline) on public.job_requests to authenticated;
grant update (category_id, district, title, description, budget_min, budget_max, deadline) on public.job_requests to authenticated;
grant select, insert, delete on public.job_photos to authenticated;
grant select on public.quotes to authenticated;
grant insert (request_id, total_price, materials_cost, labor_cost, materials_details, duration_days, message) on public.quotes to authenticated;
grant update (total_price, materials_cost, labor_cost, materials_details, duration_days, message) on public.quotes to authenticated;
grant select on public.contracts, public.payments, public.commissions, public.disputes to authenticated;
grant select on public.reviews to authenticated;
grant insert (contract_id, rating, comment) on public.reviews to authenticated;
grant all on public.profiles, public.provider_profiles, public.provider_categories, public.provider_cities,
  public.job_requests, public.job_photos, public.quotes, public.contracts, public.payments,
  public.commissions, public.reviews, public.disputes, public.app_settings to service_role;

alter table public.profiles enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.provider_categories enable row level security;
alter table public.provider_cities enable row level security;
alter table public.job_requests enable row level security;
alter table public.job_photos enable row level security;
alter table public.quotes enable row level security;
alter table public.contracts enable row level security;
alter table public.payments enable row level security;
alter table public.commissions enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;
alter table public.app_settings enable row level security;

create policy "profiles select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin') or public.shares_contract(auth.uid(), id));
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "provider profiles select" on public.provider_profiles for select to authenticated using (true);
create policy "provider profiles update own" on public.provider_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "provider cats select" on public.provider_categories for select to authenticated using (true);
create policy "provider cats insert own" on public.provider_categories for insert to authenticated with check (provider_id = auth.uid());
create policy "provider cats delete own" on public.provider_categories for delete to authenticated using (provider_id = auth.uid());
create policy "provider cities select" on public.provider_cities for select to authenticated using (true);
create policy "provider cities insert own" on public.provider_cities for insert to authenticated with check (provider_id = auth.uid());
create policy "provider cities delete own" on public.provider_cities for delete to authenticated using (provider_id = auth.uid());

create policy "requests select" on public.job_requests for select to authenticated
  using (public.can_view_request(id, auth.uid()));
create policy "requests insert client" on public.job_requests for insert to authenticated
  with check (client_id = auth.uid() and public.has_role(auth.uid(),'client') and public.is_active_user(auth.uid()));
create policy "requests update own open" on public.job_requests for update to authenticated
  using (client_id = auth.uid() and status in ('nouvelle','devis_recu'))
  with check (client_id = auth.uid());
create policy "requests delete own new" on public.job_requests for delete to authenticated
  using (client_id = auth.uid() and status = 'nouvelle');

create policy "photos select" on public.job_photos for select to authenticated
  using (public.can_view_request(request_id, auth.uid()));
create policy "photos insert own" on public.job_photos for insert to authenticated
  with check (exists (select 1 from public.job_requests r where r.id = request_id and r.client_id = auth.uid()));
create policy "photos delete own" on public.job_photos for delete to authenticated
  using (exists (select 1 from public.job_requests r where r.id = request_id and r.client_id = auth.uid()));

create policy "quotes select" on public.quotes for select to authenticated
  using (provider_id = auth.uid() or public.has_role(auth.uid(),'admin')
    or exists (select 1 from public.job_requests r where r.id = request_id and r.client_id = auth.uid()));
create policy "quotes insert provider" on public.quotes for insert to authenticated
  with check (provider_id = auth.uid() and public.has_role(auth.uid(),'provider') and public.is_active_user(auth.uid())
    and exists (select 1 from public.job_requests r where r.id = request_id and r.status in ('nouvelle','devis_recu') and r.client_id <> auth.uid()));
create policy "quotes update own pending" on public.quotes for update to authenticated
  using (provider_id = auth.uid() and status = 'envoye') with check (provider_id = auth.uid());

create policy "contracts select parties" on public.contracts for select to authenticated
  using (client_id = auth.uid() or provider_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "payments select parties" on public.payments for select to authenticated
  using (public.is_contract_party(contract_id, auth.uid()) or public.has_role(auth.uid(),'admin'));
create policy "commissions select admin" on public.commissions for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy "disputes select" on public.disputes for select to authenticated
  using (public.is_contract_party(contract_id, auth.uid()) or public.has_role(auth.uid(),'admin'));
create policy "reviews select" on public.reviews for select to authenticated using (true);
create policy "reviews insert party" on public.reviews for insert to authenticated
  with check (author_id = auth.uid() and exists (
    select 1 from public.contracts c where c.id = contract_id and c.status = 'termine'
      and (c.client_id = auth.uid() or c.provider_id = auth.uid())));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_req_updated before update on public.job_requests for each row execute function public.touch_updated_at();
create trigger trg_quote_updated before update on public.quotes for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare _role public.app_role;
begin
  _role := case when new.raw_user_meta_data->>'role' = 'provider' then 'provider'::public.app_role else 'client'::public.app_role end;
  insert into public.profiles (id, full_name, phone, city_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.raw_user_meta_data->>'phone',
          (select id from public.cities where name = 'Ouagadougou'));
  insert into public.user_roles (user_id, role) values (new.id, _role);
  if _role = 'provider' then
    insert into public.provider_profiles (user_id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
    insert into public.provider_cities (provider_id, city_id) select new.id, id from public.cities where name = 'Ouagadougou';
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.on_quote_inserted() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.job_requests set status = 'devis_recu' where id = new.request_id and status = 'nouvelle';
  return new;
end $$;
create trigger trg_quote_inserted after insert on public.quotes for each row execute function public.on_quote_inserted();

create or replace function public.on_review_inserted() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.provider_profiles p set
    rating_count = s.c, rating_avg = s.a
  from (select count(*)::int c, coalesce(avg(rating),0)::numeric(3,2) a from public.reviews where target_id = new.target_id) s
  where p.user_id = new.target_id;
  return new;
end $$;
create trigger trg_review_inserted after insert on public.reviews for each row execute function public.on_review_inserted();

create or replace function public.set_review_target() returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select * into c from public.contracts where id = new.contract_id;
  new.author_id := auth.uid();
  new.target_id := case when c.client_id = auth.uid() then c.provider_id else c.client_id end;
  return new;
end $$;
create trigger trg_review_target before insert on public.reviews for each row execute function public.set_review_target();

create or replace function public.accept_quote(_quote_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare q record; r record; _contract uuid;
begin
  select * into q from public.quotes where id = _quote_id for update;
  if not found then raise exception 'Devis introuvable'; end if;
  select * into r from public.job_requests where id = q.request_id for update;
  if r.client_id <> auth.uid() then raise exception 'Action non autorisée'; end if;
  if not public.is_active_user(auth.uid()) then raise exception 'Compte suspendu'; end if;
  if r.status not in ('nouvelle','devis_recu') or q.status <> 'envoye' then raise exception 'Ce devis ne peut plus être accepté'; end if;
  update public.quotes set status = 'accepte' where id = q.id;
  update public.quotes set status = 'refuse' where request_id = r.id and id <> q.id and status = 'envoye';
  update public.job_requests set status = 'accepte' where id = r.id;
  insert into public.contracts (request_id, quote_id, client_id, provider_id, amount, duration_days, client_confirmed_at)
  values (r.id, q.id, r.client_id, q.provider_id, q.total_price, q.duration_days, now()) returning id into _contract;
  return _contract;
end $$;

create or replace function public.refuse_quote(_quote_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q record;
begin
  select q2.* into q from public.quotes q2 join public.job_requests r on r.id = q2.request_id
   where q2.id = _quote_id and r.client_id = auth.uid();
  if not found then raise exception 'Action non autorisée'; end if;
  if q.status <> 'envoye' then raise exception 'Ce devis a déjà été traité'; end if;
  update public.quotes set status = 'refuse' where id = _quote_id;
end $$;

create or replace function public.withdraw_quote(_quote_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.quotes set status = 'retire' where id = _quote_id and provider_id = auth.uid() and status = 'envoye';
  if not found then raise exception 'Action non autorisée'; end if;
end $$;

create or replace function public.confirm_contract(_contract_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.contracts set provider_confirmed_at = now(), status = 'actif'
   where id = _contract_id and provider_id = auth.uid() and status = 'en_attente';
  if not found then raise exception 'Action non autorisée'; end if;
end $$;

create or replace function public.set_mission_status(_contract_id uuid, _status public.contract_status) returns void
language plpgsql security definer set search_path = public as $$
declare c record; _uid uuid := auth.uid(); _admin boolean; _rate numeric;
begin
  select * into c from public.contracts where id = _contract_id for update;
  if not found then raise exception 'Contrat introuvable'; end if;
  _admin := public.has_role(_uid,'admin');
  if not (_admin or _uid in (c.client_id, c.provider_id)) then raise exception 'Action non autorisée'; end if;

  if _status = 'en_cours' then
    if not (_admin or (_uid = c.provider_id and c.status = 'actif')) then raise exception 'Transition non autorisée'; end if;
    update public.contracts set status = 'en_cours', started_at = now() where id = c.id;
    update public.job_requests set status = 'en_cours' where id = c.request_id;
  elsif _status = 'termine' then
    if not (_admin or (_uid = c.client_id and c.status = 'en_cours')) then raise exception 'Seul le client confirme la fin des travaux'; end if;
    update public.contracts set status = 'termine', completed_at = now() where id = c.id;
    update public.job_requests set status = 'termine' where id = c.request_id;
    select value into _rate from public.app_settings where key = 'commission_rate';
    insert into public.commissions (contract_id, rate, amount) values (c.id, coalesce(_rate,0), round(c.amount * coalesce(_rate,0)))
      on conflict (contract_id) do nothing;
    insert into public.payments (contract_id, amount) values (c.id, c.amount);
  elsif _status = 'annule' then
    if not (_admin or c.status in ('en_attente','actif')) then raise exception 'Annulation impossible à ce stade, ouvrez un litige'; end if;
    update public.contracts set status = 'annule' where id = c.id;
    update public.job_requests set status = 'annule' where id = c.request_id;
  else
    raise exception 'Transition non autorisée';
  end if;
end $$;

create or replace function public.cancel_request(_request_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.job_requests set status = 'annule'
   where id = _request_id and client_id = auth.uid() and status in ('nouvelle','devis_recu');
  if not found then raise exception 'Action non autorisée'; end if;
  update public.quotes set status = 'refuse' where request_id = _request_id and status = 'envoye';
end $$;

create or replace function public.open_dispute(_contract_id uuid, _reason text) returns uuid
language plpgsql security definer set search_path = public as $$
declare c record; _id uuid;
begin
  select * into c from public.contracts where id = _contract_id;
  if not found or auth.uid() not in (c.client_id, c.provider_id) then raise exception 'Action non autorisée'; end if;
  if c.status not in ('actif','en_cours','termine') then raise exception 'Litige impossible pour ce contrat'; end if;
  if char_length(coalesce(_reason,'')) < 10 then raise exception 'Décrivez le problème (10 caractères minimum)'; end if;
  insert into public.disputes (contract_id, opened_by, reason) values (c.id, auth.uid(), _reason) returning id into _id;
  update public.contracts set status = 'litige' where id = c.id;
  update public.job_requests set status = 'litige' where id = c.request_id;
  return _id;
end $$;

create or replace function public.admin_resolve_dispute(_dispute_id uuid, _status public.dispute_status, _resolution text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Réservé aux administrateurs'; end if;
  update public.disputes set status = _status, resolution = _resolution,
    resolved_at = case when _status in ('resolu','rejete') then now() else null end
   where id = _dispute_id;
end $$;

create or replace function public.admin_set_suspended(_user_id uuid, _suspended boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Réservé aux administrateurs'; end if;
  if _user_id = auth.uid() then raise exception 'Vous ne pouvez pas vous suspendre vous-même'; end if;
  update public.profiles set suspended = _suspended where id = _user_id;
end $$;

create or replace function public.admin_set_verified(_user_id uuid, _verified boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Réservé aux administrateurs'; end if;
  update public.provider_profiles set verified = _verified where user_id = _user_id;
end $$;

revoke execute on function public.accept_quote, public.refuse_quote, public.withdraw_quote, public.confirm_contract,
  public.set_mission_status, public.cancel_request, public.open_dispute, public.admin_resolve_dispute,
  public.admin_set_suspended, public.admin_set_verified from public, anon;
grant execute on function public.accept_quote, public.refuse_quote, public.withdraw_quote, public.confirm_contract,
  public.set_mission_status, public.cancel_request, public.open_dispute, public.admin_resolve_dispute,
  public.admin_set_suspended, public.admin_set_verified to authenticated;

create policy "job photos upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'job-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "job photos read" on storage.objects for select to authenticated
  using (bucket_id = 'job-photos' and public.can_view_request(((storage.foldername(name))[2])::uuid, auth.uid()));
create policy "job photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'job-photos' and (storage.foldername(name))[1] = auth.uid()::text);
