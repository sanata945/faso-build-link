import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, Empty, Loading, PageTitle, StatusBadge } from "@/components/ui-kit";
import { contractStatusLabel, dateFr, disputeStatusLabel, errMsg, fcfa, requestStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — FasoLink Pro" },
      { name: "description", content: "Gestion des utilisateurs, demandes, devis et litiges." },
      { property: "og:title", content: "Administration — FasoLink Pro" },
      { property: "og:description", content: "Tableau de bord administrateur." },
    ],
  }),
  component: Admin,
});

type Tab = "stats" | "users" | "requests" | "contracts" | "disputes";

function Admin() {
  const { data: me } = useMe();
  const [tab, setTab] = useState<Tab>("stats");
  if (!me) return <Loading />;
  if (!me.isAdmin) return <Empty>Accès réservé aux administrateurs.</Empty>;
  const tabs: [Tab, string][] = [
    ["stats", "Vue d'ensemble"],
    ["users", "Utilisateurs"],
    ["requests", "Demandes"],
    ["contracts", "Contrats"],
    ["disputes", "Litiges"],
  ];
  return (
    <div>
      <PageTitle title="Administration" />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold", tab === k ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "stats" && <Stats />}
      {tab === "users" && <Users meId={me.id} />}
      {tab === "requests" && <Requests />}
      {tab === "contracts" && <Contracts />}
      {tab === "disputes" && <Disputes />}
    </div>
  );
}

function Stats() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const c = (t: "profiles" | "job_requests" | "quotes" | "contracts" | "disputes") =>
        supabase.from(t).select("id", { count: "exact", head: true }).then((r) => r.count ?? 0);
      const [users, requests, quotes, contracts, disputes, comm] = await Promise.all([
        c("profiles"), c("job_requests"), c("quotes"), c("contracts"), c("disputes"),
        supabase.from("commissions").select("amount"),
      ]);
      return { users, requests, quotes, contracts, disputes, commissions: (comm.data ?? []).reduce((a, x) => a + x.amount, 0) };
    },
  });
  const items: [string, string | number | undefined][] = [
    ["Utilisateurs", data?.users],
    ["Demandes", data?.requests],
    ["Devis", data?.quotes],
    ["Contrats", data?.contracts],
    ["Litiges", data?.disputes],
    ["Commissions prévues", data ? fcfa(data.commissions) : undefined],
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(([k, v]) => (
        <Card key={k} className="p-3">
          <p className="text-xl font-bold text-primary">{v ?? "–"}</p>
          <p className="text-xs text-muted-foreground">{k}</p>
        </Card>
      ))}
      <p className="col-span-2 text-xs text-muted-foreground">Commissions calculées à titre indicatif : aucun paiement réel n'est encaissé en V1.</p>
    </div>
  );
}

function Users({ meId }: { meId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [p, r, pp] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("provider_profiles").select("user_id, verified"),
      ]);
      const roles: Record<string, string[]> = {};
      (r.data ?? []).forEach((x) => (roles[x.user_id] ??= []).push(x.role));
      const verified = Object.fromEntries((pp.data ?? []).map((x) => [x.user_id, x.verified]));
      return (p.data ?? []).map((u) => ({ ...u, roles: roles[u.id] ?? [], verified: verified[u.id] }));
    },
  });
  if (isLoading) return <Loading />;
  const roleFr: Record<string, string> = { client: "Client", provider: "Prestataire", admin: "Admin" };
  return (
    <div className="space-y-2">
      {data?.map((u) => (
        <Card key={u.id} className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{u.full_name || "(sans nom)"}</p>
              <p className="text-xs text-muted-foreground">
                {u.roles.map((r) => roleFr[r]).join(", ")} · {u.phone ?? "—"} · {dateFr(u.created_at)}
              </p>
            </div>
            {u.suspended && <StatusBadge label="Suspendu" tone="danger" />}
          </div>
          {u.id !== meId && (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const { error } = await supabase.rpc("admin_set_suspended", { _user_id: u.id, _suspended: !u.suspended });
                  if (error) return void toast.error(errMsg(error));
                  qc.invalidateQueries({ queryKey: ["admin-users"] });
                }}
              >
                {u.suspended ? "Réactiver" : "Suspendre"}
              </Button>
              {u.roles.includes("provider") && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const { error } = await supabase.rpc("admin_set_verified", { _user_id: u.id, _verified: !u.verified });
                    if (error) return void toast.error(errMsg(error));
                    qc.invalidateQueries({ queryKey: ["admin-users"] });
                  }}
                >
                  {u.verified ? "Retirer la vérification" : "Marquer vérifié"}
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function Requests() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_requests")
        .select("id, title, status, created_at, district, categories(name), quotes(count)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });
  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty>Aucune demande.</Empty>;
  return (
    <div className="space-y-2">
      {data.map((r) => (
        <Link key={r.id} to="/demandes/$id" params={{ id: r.id }} className="surface block p-3">
          <div className="flex justify-between gap-2">
            <span className="font-semibold">{r.title}</span>
            <StatusBadge {...requestStatusLabel[r.status]} />
          </div>
          <p className="text-xs text-muted-foreground">
            {r.categories?.name} · {r.district} · {r.quotes?.[0]?.count ?? 0} devis · {dateFr(r.created_at)}
          </p>
        </Link>
      ))}
    </div>
  );
}

function Contracts() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-contracts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("id, status, amount, created_at, job_requests(title)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });
  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty>Aucun contrat.</Empty>;
  return (
    <div className="space-y-2">
      {data.map((c) => (
        <Link key={c.id} to="/contrats/$id" params={{ id: c.id }} className="surface block p-3">
          <div className="flex justify-between gap-2">
            <span className="font-semibold">{c.job_requests?.title}</span>
            <StatusBadge {...contractStatusLabel[c.status]} />
          </div>
          <p className="text-xs text-muted-foreground">
            {fcfa(c.amount)} · {dateFr(c.created_at)}
          </p>
        </Link>
      ))}
    </div>
  );
}

function Disputes() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data, isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data } = await supabase.from("disputes").select("*, contracts(job_requests(title))").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty>Aucun litige signalé.</Empty>;
  async function resolve(id: string, status: "en_examen" | "resolu" | "rejete") {
    const { error } = await supabase.rpc("admin_resolve_dispute", { _dispute_id: id, _status: status, _resolution: notes[id] ?? "" });
    if (error) return void toast.error(errMsg(error));
    toast.success("Litige mis à jour");
    qc.invalidateQueries({ queryKey: ["admin-disputes"] });
  }
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <Card key={d.id} className="space-y-2">
          <div className="flex justify-between gap-2">
            <Link to="/contrats/$id" params={{ id: d.contract_id }} className="font-semibold text-primary">
              {d.contracts?.job_requests?.title}
            </Link>
            <span className="text-sm">{disputeStatusLabel[d.status]}</span>
          </div>
          <p className="text-sm">{d.reason}</p>
          {d.resolution && <p className="text-xs text-muted-foreground">Décision : {d.resolution}</p>}
          {!["resolu", "rejete"].includes(d.status) && (
            <>
              <textarea
                rows={2}
                className="field"
                placeholder="Décision / commentaire"
                value={notes[d.id] ?? ""}
                onChange={(e) => setNotes({ ...notes, [d.id]: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline" onClick={() => resolve(d.id, "en_examen")}>Examiner</Button>
                <Button size="sm" onClick={() => resolve(d.id, "resolu")}>Résolu</Button>
                <Button size="sm" variant="secondary" onClick={() => resolve(d.id, "rejete")}>Rejeter</Button>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
