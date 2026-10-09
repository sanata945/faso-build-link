import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, Empty, Field, Loading, PageTitle, Row, StatusBadge } from "@/components/ui-kit";
import { budgetText, dateFr, errMsg, fcfa, quoteStatusLabel, requestStatusLabel } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/demandes/$id")({
  head: () => ({
    meta: [
      { title: "Détail de la demande — FasoLink Pro" },
      { name: "description", content: "Détail d'une demande de travaux et des devis associés." },
      { property: "og:title", content: "Demande de travaux — FasoLink Pro" },
      { property: "og:description", content: "Détail d'une demande et de ses devis." },
    ],
  }),
  component: Detail,
});

function useRequest(id: string) {
  return useQuery({
    queryKey: ["request", id],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("job_requests")
        .select("*, categories(name), cities(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!r) return null;
      const [{ data: photos }, { data: quotes }, { data: contract }] = await Promise.all([
        supabase.from("job_photos").select("storage_path").eq("request_id", id),
        supabase
          .from("quotes")
          .select("*, provider_profiles(display_name, trade, verified, rating_avg, rating_count, experience_years)")
          .eq("request_id", id)
          .order("total_price"),
        supabase.from("contracts").select("id").eq("request_id", id).maybeSingle(),
      ]);
      let urls: string[] = [];
      if (photos?.length) {
        const { data } = await supabase.storage
          .from("job-photos")
          .createSignedUrls(photos.map((p) => p.storage_path), 3600);
        urls = (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
      }
      return { r, urls, quotes: quotes ?? [], contractId: contract?.id ?? null };
    },
  });
}

function Detail() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const { data, isLoading } = useRequest(id);
  if (isLoading || !me) return <Loading />;
  if (!data) return <Empty>Demande introuvable ou non accessible.</Empty>;
  const { r } = data;
  const isOwner = r.client_id === me.id;

  return (
    <div className="space-y-5">
      <PageTitle title={r.title} subtitle={`${r.categories?.name} · ${r.cities?.name}, ${r.district}`} />
      <Card>
        <div className="mb-2">
          <StatusBadge {...requestStatusLabel[r.status]} />
        </div>
        <p className="whitespace-pre-line text-sm">{r.description}</p>
        <div className="mt-3 border-t pt-2">
          <Row k="Budget indicatif" v={budgetText(r.budget_min, r.budget_max)} />
          <Row k="Délai souhaité" v={r.deadline ?? "—"} />
          <Row k="Publiée le" v={dateFr(r.created_at)} />
        </div>
        {data.urls.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {data.urls.map((u) => (
              <a key={u} href={u} target="_blank" rel="noreferrer">
                <img src={u} alt="Photo des travaux" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
              </a>
            ))}
          </div>
        )}
      </Card>

      {data.contractId && (
        <Button asChild size="lg" className="w-full">
          <Link to="/contrats/$id" params={{ id: data.contractId }}>Voir la fiche de contrat</Link>
        </Button>
      )}

      {isOwner ? (
        <ClientQuotes data={data} />
      ) : me.isProvider ? (
        <ProviderQuote requestId={r.id} open={["nouvelle", "devis_recu"].includes(r.status)} quote={data.quotes.find((q) => q.provider_id === me.id)} />
      ) : null}
    </div>
  );
}

type Data = NonNullable<ReturnType<typeof useRequest>["data"]>;

function ClientQuotes({ data }: { data: Data }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const open = ["nouvelle", "devis_recu"].includes(data.r.status);
  const active = data.quotes.filter((q) => q.status !== "retire");

  async function run(key: string, fn: () => PromiseLike<{ error: unknown; data?: unknown }>, ok: string) {
    setBusy(key);
    const { error, data: res } = await fn();
    setBusy(null);
    if (error) return toast.error(errMsg(error));
    toast.success(ok);
    await qc.invalidateQueries();
    return res;
  }

  async function accept(qid: string) {
    if (!confirm("Accepter ce devis ? Les autres devis seront automatiquement refusés.")) return;
    const res = await run(qid, () => supabase.rpc("accept_quote", { _quote_id: qid }), "Devis accepté, contrat créé");
    if (typeof res === "string") navigate({ to: "/contrats/$id", params: { id: res } });
  }

  return (
    <section className="space-y-3">
      <h2 className="font-bold">Devis reçus ({active.length})</h2>
      {!active.length ? (
        <Empty>Aucun devis pour l'instant. Les prestataires de la zone ont été informés.</Empty>
      ) : (
        <>
          {active.length > 1 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1.5">Prestataire</th>
                    <th>Total</th>
                    <th>Matériaux</th>
                    <th>Main-d'œuvre</th>
                    <th>Délai</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((q, i) => (
                    <tr key={q.id} className="border-t">
                      <td className="py-1.5 font-semibold">{q.provider_profiles?.display_name}</td>
                      <td className={i === 0 ? "font-bold text-success" : ""}>{fcfa(q.total_price)}</td>
                      <td>{fcfa(q.materials_cost)}</td>
                      <td>{fcfa(q.labor_cost)}</td>
                      <td>{q.duration_days} j</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {active.map((q) => (
            <Card key={q.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {q.provider_profiles?.display_name} {q.provider_profiles?.verified && <span className="text-xs text-success">✓ vérifié</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {q.provider_profiles?.trade ?? "Prestataire"}
                    {q.provider_profiles?.rating_count ? ` · ★ ${q.provider_profiles.rating_avg} (${q.provider_profiles.rating_count})` : ""}
                  </p>
                </div>
                <StatusBadge {...quoteStatusLabel[q.status]} />
              </div>
              <div className="mt-2 border-t pt-2">
                <Row k="Prix total" v={<span className="text-base font-bold">{fcfa(q.total_price)}</span>} />
                <Row k="Matériaux" v={fcfa(q.materials_cost)} />
                <Row k="Main-d'œuvre" v={fcfa(q.labor_cost)} />
                <Row k="Délai" v={`${q.duration_days} jour(s)`} />
              </div>
              {q.materials_details && <p className="mt-2 text-sm"><b>Matériaux :</b> {q.materials_details}</p>}
              {q.message && <p className="mt-1 text-sm text-muted-foreground">« {q.message} »</p>}
              {open && q.status === "envoye" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!!busy} onClick={() => run(q.id + "r", () => supabase.rpc("refuse_quote", { _quote_id: q.id }), "Devis refusé")}>
                    Refuser
                  </Button>
                  <Button disabled={!!busy} onClick={() => accept(q.id)}>
                    Accepter
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </>
      )}
      {open && (
        <Button
          variant="ghost"
          className="w-full text-destructive"
          disabled={!!busy}
          onClick={() => confirm("Annuler cette demande ?") && run("cancel", () => supabase.rpc("cancel_request", { _request_id: data.r.id }), "Demande annulée")}
        >
          Annuler la demande
        </Button>
      )}
    </section>
  );
}

type Quote = Data["quotes"][number];

function ProviderQuote({ requestId, open, quote }: { requestId: string; open: boolean; quote?: Quote }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(!quote);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const n = (k: string) => Number(String(f.get(k) ?? "0").replace(/\s/g, "") || 0);
    const payload = {
      materials_cost: n("materials_cost"),
      labor_cost: n("labor_cost"),
      total_price: n("materials_cost") + n("labor_cost"),
      duration_days: n("duration_days"),
      materials_details: String(f.get("materials_details") || "") || null,
      message: String(f.get("message") || "") || null,
    };
    if (payload.total_price <= 0) return toast.error("Indiquez un prix.");
    if (payload.duration_days < 1) return toast.error("Indiquez un délai d'au moins 1 jour.");
    setSaving(true);
    const { error } = quote
      ? await supabase.from("quotes").update(payload).eq("id", quote.id)
      : await supabase.from("quotes").insert({ ...payload, request_id: requestId });
    setSaving(false);
    if (error) return toast.error(errMsg(error));
    toast.success(quote ? "Devis modifié" : "Devis envoyé au client");
    setEditing(false);
    qc.invalidateQueries();
  }

  if (quote && !editing) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Mon devis</h2>
          <StatusBadge {...quoteStatusLabel[quote.status]} />
        </div>
        <div className="mt-2">
          <Row k="Prix total" v={fcfa(quote.total_price)} />
          <Row k="Matériaux" v={fcfa(quote.materials_cost)} />
          <Row k="Main-d'œuvre" v={fcfa(quote.labor_cost)} />
          <Row k="Délai" v={`${quote.duration_days} jour(s)`} />
        </div>
        {quote.status === "envoye" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm("Retirer ce devis ?")) return;
                const { error } = await supabase.rpc("withdraw_quote", { _quote_id: quote.id });
                if (error) return toast.error(errMsg(error));
                toast.success("Devis retiré");
                qc.invalidateQueries();
              }}
            >
              Retirer
            </Button>
            <Button onClick={() => setEditing(true)}>Modifier</Button>
          </div>
        )}
      </Card>
    );
  }
  if (!open) return <Empty>Cette demande n'accepte plus de devis.</Empty>;

  return (
    <form onSubmit={onSubmit}>
      <Card className="space-y-4">
        <h2 className="font-bold">{quote ? "Modifier mon devis" : "Envoyer un devis"}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Matériaux (FCFA)">
            <input name="materials_cost" inputMode="numeric" defaultValue={quote?.materials_cost ?? ""} className="field" />
          </Field>
          <Field label="Main-d'œuvre (FCFA)">
            <input name="labor_cost" inputMode="numeric" required defaultValue={quote?.labor_cost ?? ""} className="field" />
          </Field>
        </div>
        <Field label="Délai d'exécution (jours)">
          <input name="duration_days" type="number" min={1} max={365} required defaultValue={quote?.duration_days ?? ""} className="field" />
        </Field>
        <Field label="Détail des matériaux">
          <textarea name="materials_details" rows={2} defaultValue={quote?.materials_details ?? ""} className="field" placeholder="Ex. 2 robinets, 3 m de tuyau PVC…" />
        </Field>
        <Field label="Message au client">
          <textarea name="message" rows={2} defaultValue={quote?.message ?? ""} className="field" />
        </Field>
        <p className="text-xs text-muted-foreground">Le prix total = matériaux + main-d'œuvre.</p>
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Envoi…" : quote ? "Enregistrer" : "Envoyer le devis"}
        </Button>
      </Card>
    </form>
  );
}
