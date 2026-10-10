begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from public, anon, authenticated;
grant select on public.admin_users to authenticated;
create policy "Admins can read own membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create table public.page_content (
  key text primary key check (key in ('hero_description','assortment_description','delivery_description','jobs_description','contact_description')),
  value text not null check (length(btrim(value)) between 1 and 2000),
  updated_at timestamptz not null default now()
);
alter table public.page_content enable row level security;
revoke all on public.page_content from public, anon, authenticated;
grant select on public.page_content to anon, authenticated;
grant update (value) on public.page_content to authenticated;
create policy "Public can read website text" on public.page_content
  for select to anon, authenticated using (true);
create policy "Only approved admins can edit website text" on public.page_content
  for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create function public.stamp_page_content() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
revoke all on function public.stamp_page_content() from public, anon, authenticated;
create trigger stamp_page_content before update on public.page_content
  for each row execute function public.stamp_page_content();

insert into public.page_content (key, value) values
('hero_description', 'Getränke, Energy-Drinks, Snacks, Süßigkeiten, Eis und vieles mehr. Entdecke Happy Eck Kiosk in Hamm!'),
('assortment_description', 'Entdecke unsere große Auswahl.'),
('delivery_description', 'Bestelle bequem per WhatsApp oder finde Happy Eck Kiosk auf Lieferando. Liefermöglichkeiten und Kosten werden bei der Bestellung bestätigt.'),
('jobs_description', 'Du suchst einen Minijob, Teilzeit oder Vollzeit? Besuche unsere eigene Bewerbungsseite.'),
('contact_description', 'Folge uns auf Instagram und TikTok oder schreibe uns direkt.');
-- Existing catalog data remains untouched. RLS does not protect TRUNCATE.
revoke truncate, references, trigger on public.categories, public.products from anon, authenticated;
-- Remove the older permissive product policy so hidden categories hide their products too.
drop policy if exists "Public read products" on public.products;
commit;
