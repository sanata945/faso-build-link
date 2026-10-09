<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All data access goes through the browser client with RLS; status transitions (accept quote, contract, mission status, disputes, admin actions) only via SECURITY DEFINER SQL functions — why: roles and ownership enforced in the database, not the UI.
- Table privileges for `authenticated` are column-level; never re-grant full INSERT/UPDATE on workflow tables — why: protects status/ownership columns from direct edits.
- Cities and categories are data rows with an `active` flag — why: extend to new cities/trades without code changes.
- Payments/commissions tables exist but no real provider is wired — why: V1 has no live payments.
- `scripts/security-check.ts` verifies forbidden actions against test accounts; run after permission changes.
