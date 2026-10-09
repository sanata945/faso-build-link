import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { useRefs } from "@/lib/refs";
import { Button } from "@/components/ui/button";
import { Card, Field, Loading, PageTitle } from "@/components/ui-kit";
import { clientKindLabel, errMsg } from "@/lib/labels";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil — FasoLink Pro" },
      { name: "description", content: "Gérez vos informations personnelles et votre profil métier." },
      { property: "og:title", content: "Mon profil — FasoLink Pro" },
      { property: "og:description", content: "Informations du compte FasoLink Pro." },
    ],
  }),
  component: Profil,
});



function Profil() {
  const { data: me } = useMe();
  const { data: refs } = useRefs();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const provider = useQuery({
    enabled: !!me?.isProvider,
    queryKey: ["provider-profile", me?.id],
    queryFn: async () => {
      const [p, cats] = await Promise.all([
        supabase.from("provider_profiles").select("*").eq("user_id", me!.id).single(),
        supabase.from("provider_categories").select("category_id").eq("provider_id", me!.id),
      ]);
      return { p: p.data, cats: (cats.data ?? []).map((c) => c.category_id) };
    },
  });

  if (!me || !refs || (me.isProvider && !provider.data)) return <Loading />;
  const p = me.profile;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: String(f.get("full_name")),
          phone: String(f.get("phone") || "") || null,
          city_id: String(f.get("city_id")),
          district: String(f.get("district") || "") || null,
          client_kind: (f.get("client_kind") as Database["public"]["Enums"]["client_kind"]) ?? "particulier",
        })
        .eq("id", me!.id);
      if (error) throw error;

      if (me!.isProvider) {
        const exp = String(f.get("experience_years") || "");
        const { error: e2 } = await supabase
          .from("provider_profiles")
          .update({
            display_name: String(f.get("full_name")),
            trade: String(f.get("trade") || "") || null,
            description: String(f.get("description") || "") || null,
            experience_years: exp ? Number(exp) : null,
          })
          .eq("user_id", me!.id);
        if (e2) throw e2;
        const chosen = f.getAll("cats").map(String);
        const before = provider.data?.cats ?? [];
        const toAdd = chosen.filter((c) => !before.includes(c));
        const toDel = before.filter((c) => !chosen.includes(c));
        if (toAdd.length)
          await supabase.from("provider_categories").insert(toAdd.map((category_id) => ({ provider_id: me!.id, category_id })));
        if (toDel.length)
          await supabase.from("provider_categories").delete().eq("provider_id", me!.id).in("category_id", toDel);
      }
      await qc.invalidateQueries();
      toast.success("Profil enregistré");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const pp = provider.data?.p;
  return (
    <div className="space-y-4">
      <PageTitle title="Mon profil" subtitle={me.email ?? undefined} />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="space-y-4">
          <Field label="Nom complet ou entreprise">
            <input name="full_name" required defaultValue={p?.full_name} className="field" />
          </Field>
          <Field label="Téléphone">
            <input name="phone" type="tel" defaultValue={p?.phone ?? ""} className="field" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville">
              <select name="city_id" defaultValue={p?.city_id ?? ""} className="field">
                {refs.cities.map((c) => (
                  <option key={c.id} value={c.id} disabled={!c.active}>
                    {c.name}
                    {!c.active ? " (bientôt)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quartier">
              <input name="district" defaultValue={p?.district ?? ""} className="field" />
            </Field>
          </div>
          {me.isClient && (
            <Field label="Type de client">
              <select name="client_kind" defaultValue={p?.client_kind ?? "particulier"} className="field">
                {Object.entries(clientKindLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </Card>

        {me.isProvider && pp && (
          <Card className="space-y-4">
            <h2 className="font-bold">Profil métier</h2>
            {pp.verified && <p className="text-xs font-semibold text-success">✓ Profil vérifié par FasoLink</p>}
            <Field label="Métier principal">
              <input name="trade" defaultValue={pp.trade ?? ""} placeholder="Ex. Plombier" className="field" />
            </Field>
            <Field label="Années d'expérience">
              <input name="experience_years" type="number" min={0} max={70} defaultValue={pp.experience_years ?? ""} className="field" />
            </Field>
            <Field label="Présentation">
              <textarea name="description" rows={3} defaultValue={pp.description ?? ""} className="field" />
            </Field>
            <div>
              <span className="text-sm font-semibold">Catégories de travaux</span>
              <div className="mt-2 space-y-2">
                {refs.categories.filter((c) => c.active).map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="cats" value={c.id} defaultChecked={provider.data?.cats.includes(c.id)} className="h-5 w-5 accent-primary" />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
          </Card>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
      <Button variant="outline" className="w-full" onClick={signOut}>
        Se déconnecter
      </Button>
    </div>
  );
}
