import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Empty, Loading, PageTitle, StatusBadge } from "@/components/ui-kit";
import { budgetText, dateFr, requestStatusLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/demandes/")({
  head: () => ({
    meta: [
      { title: "Mes demandes — FasoLink Pro" },
      { name: "description", content: "Liste de vos demandes de travaux et de leurs devis." },
      { property: "og:title", content: "Mes demandes — FasoLink Pro" },
      { property: "og:description", content: "Suivez vos demandes de travaux." },
    ],
  }),
  component: Demandes,
});

function Demandes() {
  const { data: me } = useMe();
  const { data, isLoading } = useQuery({
    enabled: !!me,
    queryKey: ["my-requests-all", me?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_requests")
        .select("id, title, status, created_at, district, budget_min, budget_max, categories(name), quotes(count)")
        .eq("client_id", me!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageTitle
        title="Mes demandes"
        action={
          <Button asChild size="sm">
            <Link to="/demandes/nouvelle">+ Nouvelle</Link>
          </Button>
        }
      />
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Vous n'avez publié aucune demande.</Empty>
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <Link key={r.id} to="/demandes/$id" params={{ id: r.id }} className="surface block p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{r.title}</span>
                <StatusBadge {...requestStatusLabel[r.status]} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.categories?.name} · {r.district} · {dateFr(r.created_at)}
              </p>
              <p className="mt-1 text-sm">
                {budgetText(r.budget_min, r.budget_max)} · <b>{r.quotes?.[0]?.count ?? 0}</b> devis
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
