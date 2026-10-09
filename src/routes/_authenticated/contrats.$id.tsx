import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, Empty, Field, Loading, PageTitle, Row, StatusBadge } from "@/components/ui-kit";
import { contractStatusLabel, dateFr, disputeStatusLabel, errMsg, fcfa } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/contrats/$id")({
  head: () => ({
    meta: [
      { title: "Fiche de contrat — FasoLink Pro" },
      { name: "description", content: "Fiche de contrat entre un client et un prestataire." },
      { property: "og:title", content: "Fiche de contrat — FasoLink Pro" },
      { property: "og:description", content: "Détail du contrat et suivi de la mission." },
    ],
  }),
  component: Contrat,
});

const steps = ["en_attente", "actif", "en_cours", "termine"] as const;

function Contrat() {
  const { id } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      const { data: c, error } = await supabase
        .from("contracts")
        .select("*, job_requests(title, description, district, cities(name), categories(name)), quotes(materials_cost, labor_cost, materials_details, message)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!c) return null;
      const [parties, disputes, reviews] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone, district").in("id", [c.client_id, c.provider_id]),
        supabase.from("disputes").select("*").eq("contract_id", id).order("created_at"),
        supabase.from("reviews").select("*").eq("contract_id", id),
      ]);
      const byId = Object.fromEntries((parties.data ?? []).map((p) => [p.id, p]));
      return { c, client: byId[c.client_id], provider: byId[c.provider_id], disputes: disputes.data ?? [], reviews: reviews.data ?? [] };
    },
  });

  if (isLoading || !me) return <Loading />;
  if (!data) return <Empty>Contrat introuvable ou accès non autorisé.</Empty>;
  const { c } = data;
  const isClient = c.client_id === me.id;
  const isProvider = c.provider_id === me.id;

  async function act(fn: () => PromiseLike<{ error: unknown }>, ok: string) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(ok);
    qc.invalidateQueries();
  }
  const setStatus = (s: "en_cours" | "termine" | "annule", ok: string) =>
    act(() => supabase.rpc("set_mission_status", { _contract_id: c.id, _status: s }), ok);

  const stepIdx = steps.indexOf(c.status as (typeof steps)[number]);
  const myReview = data.reviews.find((r) => r.author_id === me.id);

  return (
    <div className="space-y-5">
      <PageTitle title="Fiche de contrat" subtitle={`Réf. ${c.id.slice(0, 8).toUpperCase()}`} />
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{c.job_requests?.title}</h2>
          <StatusBadge {...contractStatusLabel[c.status]} />
        </div>
        {stepIdx >= 0 && (
          <ol className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px]">
            {["Accepté", "Signé", "En cours", "Terminé"].map((s, i) => (
              <li key={s}>
                <div className={`mb-1 h-1.5 rounded-full ${i <= stepIdx ? "bg-primary" : "bg-muted"}`} />
                {s}
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 border-t pt-2">
          <Row k="Montant convenu" v={<b>{fcfa(c.amount)}</b>} />
          <Row k="Dont matériaux" v={fcfa(c.quotes?.materials_cost)} />
          <Row k="Dont main-d'œuvre" v={fcfa(c.quotes?.labor_cost)} />
          <Row k="Délai" v={`${c.duration_days} jour(s)`} />
          <Row k="Lieu" v={`${c.job_requests?.cities?.name}, ${c.job_requests?.district}`} />
          <Row k="Accord client" v={dateFr(c.client_confirmed_at)} />
          <Row k="Accord prestataire" v={c.provider_confirmed_at ? dateFr(c.provider_confirmed_at) : "En attente"} />
          <Row k="Paiement" v="Hors plateforme (V1)" />
        </div>
        {c.quotes?.materials_details && <p className="mt-2 text-sm"><b>Matériaux :</b> {c.quotes.materials_details}</p>}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {[
          ["Client", data.client],
          ["Prestataire", data.provider],
        ].map(([label, p]) => {
          const pp = p as typeof data.client;
          return (
            <Card key={label as string} className="p-3">
              <p className="text-xs text-muted-foreground">{label as string}</p>
              <p className="font-semibold">{pp?.full_name ?? "—"}</p>
              {pp?.phone && (
                <a href={`tel:${pp.phone}`} className="text-sm font-semibold text-primary">
                  {pp.phone}
                </a>
              )}
            </Card>
          );
        })}
      </div>

      <div className="space-y-2">
        {isProvider && c.status === "en_attente" && (
          <Button size="lg" className="w-full" disabled={busy} onClick={() => act(() => supabase.rpc("confirm_contract", { _contract_id: c.id }), "Contrat confirmé")}>
            Confirmer et signer le contrat
          </Button>
        )}
        {isClient && c.status === "en_attente" && (
          <p className="text-center text-sm text-muted-foreground">En attente de la confirmation du prestataire.</p>
        )}
        {isProvider && c.status === "actif" && (
          <Button size="lg" className="w-full" disabled={busy} onClick={() => setStatus("en_cours", "Mission démarrée")}>
            Démarrer les travaux
          </Button>
        )}
        {isClient && c.status === "en_cours" && (
          <Button size="lg" className="w-full" disabled={busy} onClick={() => confirm("Confirmer que les travaux sont terminés ?") && setStatus("termine", "Mission terminée")}>
            Confirmer la fin des travaux
          </Button>
        )}
        {(isClient || isProvider) && ["en_attente", "actif"].includes(c.status) && (
          <Button variant="outline" className="w-full" disabled={busy} onClick={() => confirm("Annuler ce contrat ?") && setStatus("annule", "Contrat annulé")}>
            Annuler le contrat
          </Button>
        )}
        {(isClient || isProvider) && ["actif", "en_cours", "termine"].includes(c.status) && !showDispute && (
          <Button variant="ghost" className="w-full text-destructive" onClick={() => setShowDispute(true)}>
            Signaler un problème (litige)
          </Button>
        )}
        {showDispute && (
          <Card className="space-y-3">
            <Field label="Décrivez le problème">
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="field" />
            </Field>
            <Button
              variant="destructive"
              className="w-full"
              disabled={busy}
              onClick={() =>
                act(() => supabase.rpc("open_dispute", { _contract_id: c.id, _reason: reason }), "Litige transmis à l'administrateur").then(() =>
                  setShowDispute(false),
                )
              }
            >
              Envoyer le signalement
            </Button>
          </Card>
        )}
      </div>

      {data.disputes.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold">Litiges</h2>
          {data.disputes.map((d) => (
            <Card key={d.id} className="text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">{dateFr(d.created_at)}</span>
                <span>{disputeStatusLabel[d.status]}</span>
              </div>
              <p className="mt-1">{d.reason}</p>
              {d.resolution && <p className="mt-1 text-muted-foreground">Décision : {d.resolution}</p>}
            </Card>
          ))}
        </section>
      )}

      {c.status === "termine" && (isClient || isProvider) && (
        <section>
          {myReview ? (
            <Card className="text-sm">Votre avis : {"★".repeat(myReview.rating)} {myReview.comment}</Card>
          ) : (
            <Card className="space-y-3">
              <h2 className="font-bold">Laisser un avis</h2>
              <div className="flex gap-1 text-2xl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? "text-soleil" : "text-muted"} aria-label={`${n} étoiles`}>
                    ★
                  </button>
                ))}
              </div>
              <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className="field" placeholder="Commentaire (facultatif)" />
              <Button
                className="w-full"
                disabled={busy}
                onClick={() =>
                  act(
                    () => supabase.from("reviews").insert({ contract_id: c.id, rating, comment: comment || null } as never),
                    "Merci pour votre avis",
                  )
                }
              >
                Publier l'avis
              </Button>
            </Card>
          )}
        </section>
      )}

      <Link to="/demandes/$id" params={{ id: c.request_id }} className="block text-center text-sm font-semibold text-primary">
        Voir la demande d'origine
      </Link>
    </div>
  );
}
