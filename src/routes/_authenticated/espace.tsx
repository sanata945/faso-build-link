import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, Empty, Loading, PageTitle, StatusBadge } from "@/components/ui-kit";
import { contractStatusLabel, dateFr, requestStatusLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/espace")({
  head: () => ({
    meta: [
      { title: "Mon espace — FasoLink Pro" },
      { name: "description", content: "Votre tableau de bord FasoLink Pro." },
      { property: "og:title", content: "Mon espace — FasoLink Pro" },
      { property: "og:description", content: "Suivi de vos demandes, devis et contrats." },
    ],
  }),
  component: Espace,
});

function Espace() {
  const { data: me, isLoading } = useMe();
  if (isLoading || !me) return <Loading />;
  const first = me.profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <PageTitle title={`Bonjour ${first}`} subtitle={me.isProvider ? "Espace prestataire" : "Espace client"} />
      {me.profile?.suspended && (
        <Card className="border-destructive text-sm text-destructive">
          Votre compte est suspendu. Contactez l'administrateur.
        </Card>
      )}
      {me.isAdmin && (
        <Button asChild variant="outline" className="w-full">
          <Link to="/admin">Ouvrir le tableau de bord administrateur</Link>
        </Button>
      )}
      {me.isClient && <ClientHome uid={me.id} />}
      {me.isProvider && <ProviderHome uid={me.id} />}
      <ContractsPreview />
    </div>
  );
}

function ClientHome({ uid }: { uid: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["my-requests", uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_requests")
        .select("id, title, status, created_at, categories(name)")
        .eq("client_id", uid)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });
  return (
    <section className="space-y-3">
      <Button asChild size="lg" className="w-full">
        <Link to="/demandes/nouvelle">+ Publier une demande de travaux</Link>
      </Button>
      <h2 className="font-bold">Mes dernières demandes</h2>
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty>Aucune demande pour le moment.</Empty>
      ) : (
        data.map((r) => (
          <Link key={r.id} to="/demandes/$id" params={{ id: r.id }} className="surface block p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{r.title}</span>
              <StatusBadge {...requestStatusLabel[r.status]} />
            </div>
            <span className="text-xs text-muted-foreground">
              {r.categories?.name} · {dateFr(r.created_at)}
            </span>
          </Link>
        ))
      )}
    </section>
  );
}

function ProviderHome({ uid }: { uid: string }) {
  const { data } = useQuery({
    queryKey: ["provider-stats", uid],
    queryFn: async () => {
      const [open, mine] = await Promise.all([
        supabase.from("job_requests").select("id", { count: "exact", head: true }).in("status", ["nouvelle", "devis_recu"]),
        supabase.from("quotes").select("status").eq("provider_id", uid),
      ]);
      const q = mine.data ?? [];
      return {
        open: open.count ?? 0,
        pending: q.filter((x) => x.status === "envoye").length,
        accepted: q.filter((x) => x.status === "accepte").length,
      };
    },
  });
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Chantiers ouverts", data?.open],
          ["Devis en attente", data?.pending],
          ["Devis acceptés", data?.accepted],
        ].map(([k, v]) => (
          <Card key={k as string} className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{v ?? "–"}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{k}</p>
          </Card>
        ))}
      </div>
      <Button asChild size="lg" className="w-full">
        <Link to="/opportunites">Voir les demandes disponibles</Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link to="/profil">Compléter mon profil métier</Link>
      </Button>
    </section>
  );
}

function ContractsPreview() {
  const { data } = useQuery({
    queryKey: ["contracts-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, status, amount, job_requests(title)")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });
  if (!data?.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-bold">Contrats récents</h2>
      {data.map((c) => (
        <Link key={c.id} to="/contrats/$id" params={{ id: c.id }} className="surface flex items-center justify-between gap-2 p-3">
          <span className="font-semibold">{c.job_requests?.title}</span>
          <StatusBadge {...contractStatusLabel[c.status]} />
        </Link>
      ))}
    </section>
  );
}
