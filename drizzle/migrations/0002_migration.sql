create or replace function public.has_quoted(_request_id uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.quotes where request_id = _request_id and provider_id = _uid)
$$;
drop policy "requests select" on public.job_requests;
create policy "requests select" on public.job_requests for select to authenticated
  using (client_id = auth.uid()
    or public.has_role(auth.uid(),'admin')
    or (status in ('nouvelle','devis_recu') and public.has_role(auth.uid(),'provider'))
    or public.has_quoted(id, auth.uid()));