export type Tone = "info" | "success" | "warning" | "danger" | "muted";

export const requestStatusLabel: Record<string, { label: string; tone: Tone }> = {
  nouvelle: { label: "Nouvelle demande", tone: "info" },
  devis_recu: { label: "Devis reçu", tone: "warning" },
  accepte: { label: "Accepté", tone: "success" },
  en_cours: { label: "En cours", tone: "info" },
  termine: { label: "Terminé", tone: "success" },
  annule: { label: "Annulé", tone: "muted" },
  litige: { label: "Litige", tone: "danger" },
};

export const quoteStatusLabel: Record<string, { label: string; tone: Tone }> = {
  envoye: { label: "En attente de réponse", tone: "warning" },
  accepte: { label: "Accepté", tone: "success" },
  refuse: { label: "Refusé", tone: "muted" },
  retire: { label: "Retiré", tone: "muted" },
};

export const contractStatusLabel: Record<string, { label: string; tone: Tone }> = {
  en_attente: { label: "En attente du prestataire", tone: "warning" },
  actif: { label: "Signé par les deux parties", tone: "success" },
  en_cours: { label: "Travaux en cours", tone: "info" },
  termine: { label: "Terminé", tone: "success" },
  annule: { label: "Annulé", tone: "muted" },
  litige: { label: "Litige", tone: "danger" },
};

export const disputeStatusLabel: Record<string, string> = {
  ouvert: "Ouvert",
  en_examen: "En examen",
  resolu: "Résolu",
  rejete: "Rejeté",
};

export const clientKindLabel: Record<string, string> = {
  particulier: "Particulier",
  entreprise: "Entreprise",
  proprietaire: "Propriétaire",
  gestionnaire: "Gestionnaire d'immeuble",
};

export function fcfa(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export function dateFr(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function budgetText(min: number | null, max: number | null) {
  if (min == null && max == null) return "Budget non précisé";
  if (min != null && max != null) return `${fcfa(min)} – ${fcfa(max)}`;
  return min != null ? `À partir de ${fcfa(min)}` : `Jusqu'à ${fcfa(max)}`;
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Une erreur est survenue";
}
