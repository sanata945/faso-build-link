drop policy "requests select" on public.job_requests;
create policy "requests select" on public.job_requests for select to authenticated
  using (client_id = auth.uid()
    or public.has_role(auth.uid(),'admin')
    or (status in ('nouvelle','devis_recu') and public.has_role(auth.uid(),'provider'))
    or exists (select 1 from public.quotes q where q.request_id = job_requests.id and q.provider_id = auth.uid()));