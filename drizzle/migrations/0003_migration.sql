revoke insert, update, delete, truncate, references, trigger on
  public.profiles, public.user_roles, public.provider_profiles, public.job_requests, public.quotes,
  public.contracts, public.payments, public.commissions, public.reviews, public.disputes,
  public.app_settings, public.cities, public.categories, public.job_photos,
  public.provider_categories, public.provider_cities from authenticated, anon;
revoke all on public.app_settings from authenticated, anon;
revoke all on public.profiles, public.user_roles, public.provider_profiles, public.job_requests, public.quotes,
  public.contracts, public.payments, public.commissions, public.reviews, public.disputes, public.job_photos,
  public.provider_categories, public.provider_cities from anon;

grant update (full_name, phone, city_id, district, client_kind) on public.profiles to authenticated;
grant update (display_name, trade, description, experience_years) on public.provider_profiles to authenticated;
grant insert, delete on public.provider_categories, public.provider_cities to authenticated;
grant delete on public.job_requests to authenticated;
grant insert (category_id, city_id, district, title, description, budget_min, budget_max, deadline) on public.job_requests to authenticated;
grant update (category_id, district, title, description, budget_min, budget_max, deadline) on public.job_requests to authenticated;
grant insert, delete on public.job_photos to authenticated;
grant insert (request_id, total_price, materials_cost, labor_cost, materials_details, duration_days, message) on public.quotes to authenticated;
grant update (total_price, materials_cost, labor_cost, materials_details, duration_days, message) on public.quotes to authenticated;
grant insert (contract_id, rating, comment) on public.reviews to authenticated;

revoke execute on function public.accept_quote, public.refuse_quote, public.withdraw_quote, public.confirm_contract,
  public.set_mission_status, public.cancel_request, public.open_dispute, public.admin_resolve_dispute,
  public.admin_set_suspended, public.admin_set_verified from anon;