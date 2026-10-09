import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { Empty, Loading, PageTitle, StatusBadge } from "@/components/ui-kit";
import { budgetText, dateFr, requestStatusLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/opportunites")({
  head: () => ({
    meta: [
      { title: "Demandes disponibles — FasoLink Pro" },
      { name: "description", content: "Demandes de travaux ouvertes correspondant à vos métiers." },
      { property: "og:title", content: "Demandes disponibles — FasoLink Pro" },
      { property: "og:description", content: "Trouvez des chantiers près de chez vous." },
    ],
  }),
  component: Opportunites,
});

function Opportunites() {
  const { data: me } = useMe();
  const [all, setAll] = useState(false);
  const { data, isLoading } = useQuery({
    enabled: !!me?.isProvider,
    queryKey: ["opportunities", me?.id, all],
    queryFn: async () => {
      const [cats, cities, mine] = await Promise.all([
        supabase.from("provider_categories").select("category_id").eq("provider_id", me!.id),
        supabase.from("provider_cities").select("city_id").eq("provider_id", me!.id),
        supabase.from("quotes").select("request_id").eq("provider_id", me!.id),
      ]);
      const catIds = (cats.data ?? []).map((c) => c.category_id);
      const cityIds = (cities.data ?? []).map((c) => c.city_id);
      let q = supabase
        .from("job_requests")
        .select("id, title, district, budget_min, budget_max, deadline, status, created_at, categories(name), cities(name)")
        .in("status", ["nouvelle", "devis_recu"])
        .neq("client_id", me!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!all && catIds.length) q = q.in("category_id", catIds);
      if (!all && cityIds.length) q = q.in("city_id", cityIds);
      const { data, error } = await q;
      if (error) throw error;
      const quoted = new Set((mine.data ?? []).map((m) => m.request_id));
      return { list: data, quoted, noCats: !catIds.length };
    },
  });

  if (!me) return <Loading />;
  if (!me.isProvider) return <Empty>Réservé aux prestataires.</Empty>;

  return (
    <div>
      <PageTitle title="Demandes disponibles" subtitle={all ? "Toutes les catégories" : "Selon vos métiers et votre ville"} />
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="h-5 w-5 accent-primary" />
        Afficher toutes les demandes
      </label>
      {data?.noCats && !all && (
        <p className="mb-3 text-xs text-muted-foreground">
          Astuce : choisissez vos catégories dans <Link to="/profil" className="font-semibold text-primary">Profil</Link> pour filtrer.
        </p>
      )}
      {isLoading ? (
        <Loading />
      ) : !data?.list.length ? (
        <Empty>Aucune demande ouverte pour le moment.</Empty>
      ) : (
        <div className="space-y-3">
          {data.list.map((r) => (
            <Link key={r.id} to="/demandes/$id" params={{ id: r.id }} className="surface block p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{r.title}</span>
                {data.quoted.has(r.id) ? (
                  <StatusBadge label="Devis envoyé" tone="success" />
                ) : (
                  <StatusBadge {...requestStatusLabel[r.status]} />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.categories?.name} · {r.cities?.name}, {r.district} · {dateFr(r.created_at)}
              </p>
              <p className="mt-1 text-sm">
                {budgetText(r.budget_min, r.budget_max)} · {r.deadline}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
