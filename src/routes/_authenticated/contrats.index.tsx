import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Empty, Loading, PageTitle, StatusBadge } from "@/components/ui-kit";
import { contractStatusLabel, dateFr, fcfa } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/contrats/")({
  head: () => ({
    meta: [
      { title: "Mes contrats — FasoLink Pro" },
      { name: "description", content: "Contrats et suivi des missions en cours." },
      { property: "og:title", content: "Mes contrats — FasoLink Pro" },
      { property: "og:description", content: "Suivi de vos missions." },
    ],
  }),
  component: Contrats,
});

function Contrats() {
  const { data, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      // Les règles de la base ne renvoient que les contrats dont vous êtes partie.
      const { data, error } = await supabase
        .from("contracts")
        .select("id, status, amount, created_at, job_requests(title, district)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageTitle title="Mes contrats" />
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Aucun contrat. Un contrat est créé quand un client accepte un devis.</Empty>
      ) : (
        <div className="space-y-3">
          {data.map((c) => (
            <Link key={c.id} to="/contrats/$id" params={{ id: c.id }} className="surface block p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{c.job_requests?.title}</span>
                <StatusBadge {...contractStatusLabel[c.status]} />
              </div>
              <p className="mt-1 text-sm">
                {fcfa(c.amount)} · <span className="text-muted-foreground">{dateFr(c.created_at)}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
