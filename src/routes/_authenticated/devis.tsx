import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { Empty, Loading, PageTitle, StatusBadge } from "@/components/ui-kit";
import { dateFr, fcfa, quoteStatusLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/devis")({
  head: () => ({
    meta: [
      { title: "Mes devis — FasoLink Pro" },
      { name: "description", content: "Suivi des devis envoyés aux clients." },
      { property: "og:title", content: "Mes devis — FasoLink Pro" },
      { property: "og:description", content: "Suivi de vos devis." },
    ],
  }),
  component: MesDevis,
});

function MesDevis() {
  const { data: me } = useMe();
  const { data, isLoading } = useQuery({
    enabled: !!me?.isProvider,
    queryKey: ["my-quotes", me?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, total_price, duration_days, status, created_at, request_id, job_requests(title, district)")
        .eq("provider_id", me!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  if (!me) return <Loading />;
  if (!me.isProvider) return <Empty>Réservé aux prestataires.</Empty>;
  return (
    <div>
      <PageTitle title="Mes devis" />
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Vous n'avez encore envoyé aucun devis.</Empty>
      ) : (
        <div className="space-y-3">
          {data.map((q) => (
            <Link key={q.id} to="/demandes/$id" params={{ id: q.request_id }} className="surface block p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{q.job_requests?.title}</span>
                <StatusBadge {...quoteStatusLabel[q.status]} />
              </div>
              <p className="mt-1 text-sm">
                {fcfa(q.total_price)} · {q.duration_days} j · <span className="text-muted-foreground">{dateFr(q.created_at)}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
