import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Zap, Wrench, ShieldCheck, FileText, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FasoLink Pro — Trouvez un artisan fiable à Ouagadougou" },
      {
        name: "description",
        content: "Publiez vos travaux, recevez des devis de plombiers, électriciens et techniciens de maintenance à Ouagadougou.",
      },
      { property: "og:title", content: "FasoLink Pro — Artisans du bâtiment au Burkina Faso" },
      { property: "og:description", content: "Demandes de travaux, devis comparés et contrats clairs, depuis votre téléphone." },
    ],
  }),
  component: Index,
});

const cats = [
  { icon: Droplets, name: "Plomberie" },
  { icon: Zap, name: "Électricité" },
  { icon: Wrench, name: "Maintenance" },
];

function Index() {
  return (
    <div className="min-h-screen">
      <div className="faso-stripe h-1.5" />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <span className="font-display text-lg font-bold text-primary">
          FasoLink <span className="text-terre">Pro</span>
        </span>
        <Link to="/auth" className="text-sm font-semibold text-primary">
          Se connecter
        </Link>
      </header>

      <section className="faso-pattern text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="mb-3 inline-block rounded-full bg-soleil px-3 py-1 text-xs font-bold text-soleil-foreground">
            Lancement à Ouagadougou
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Vos travaux, des artisans sérieux, des devis clairs.
          </h1>
          <p className="mt-3 max-w-xl text-primary-foreground/85">
            Publiez votre besoin, comparez les devis et signez un contrat simple avec le prestataire choisi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth" search={{ mode: "signup", role: "client" }}>Publier une demande</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/auth" search={{ mode: "signup", role: "provider" }}>Je suis prestataire</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
        <section>
          <h2 className="mb-4 text-lg font-bold">Métiers disponibles</h2>
          <div className="grid grid-cols-3 gap-3">
            {cats.map((c) => (
              <div key={c.name} className="surface flex flex-col items-center gap-2 p-4 text-center">
                <c.icon className="h-7 w-7 text-terre" />
                <span className="text-sm font-semibold">{c.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Bientôt : maçonnerie, peinture, carrelage et d'autres villes.</p>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold">Comment ça marche</h2>
          <ol className="space-y-3">
            {[
              { icon: FileText, t: "Décrivez vos travaux", d: "Catégorie, quartier, budget, délai et photos si besoin." },
              { icon: Handshake, t: "Comparez les devis", d: "Prix, matériaux, main-d'œuvre et délai côte à côte." },
              { icon: ShieldCheck, t: "Signez et suivez", d: "Un contrat confirmé par les deux parties et un suivi clair." },
            ].map((s, i) => (
              <li key={s.t} className="surface flex gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{s.t}</p>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        FasoLink Pro · Burkina Faso · Version de test
      </footer>
    </div>
  );
}
