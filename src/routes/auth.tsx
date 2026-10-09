import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

const search = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["client", "provider"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Connexion — FasoLink Pro" },
      { name: "description", content: "Connectez-vous ou créez votre compte client ou prestataire FasoLink Pro." },
      { property: "og:title", content: "Connexion — FasoLink Pro" },
      { property: "og:description", content: "Accédez à votre espace FasoLink Pro." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const s = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(s.mode ?? "signin");
  const [role, setRole] = useState<"client" | "provider">(s.role ?? "client");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/espace", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("E-mail ou mot de passe incorrect, ou e-mail non confirmé.");
        navigate({ to: "/espace", replace: true });
      } else {
        const full_name = String(f.get("full_name") ?? "").trim();
        const phone = String(f.get("phone") ?? "").trim();
        if (full_name.length < 2) throw new Error("Indiquez votre nom.");
        if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/espace", data: { full_name, phone, role } },
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="faso-stripe h-1.5" />
      <div className="mx-auto max-w-md px-4 py-8">
        <a href="/" className="font-display text-xl font-bold text-primary">
          FasoLink <span className="text-terre">Pro</span>
        </a>
        {sent ? (
          <div className="surface mt-6 p-5">
            <h1 className="text-lg font-bold">Vérifiez votre e-mail</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Un lien de confirmation vous a été envoyé. Cliquez dessus pour activer votre compte, puis connectez-vous.
            </p>
            <Button className="mt-4 w-full" onClick={() => { setSent(false); setMode("signin"); }}>
              Aller à la connexion
            </Button>
          </div>
        ) : (
          <div className="surface mt-6 p-5">
            <div className="mb-5 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-semibold">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn("rounded-md py-2", mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                >
                  {m === "signin" ? "Connexion" : "Inscription"}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <span className="text-sm font-semibold">Je suis</span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {([
                        ["client", "Client", "J'ai des travaux"],
                        ["provider", "Prestataire", "Je propose mes services"],
                      ] as const).map(([v, t, d]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRole(v)}
                          className={cn(
                            "rounded-lg border p-3 text-left",
                            role === v ? "border-primary bg-secondary" : "bg-card",
                          )}
                        >
                          <span className="block font-semibold">{t}</span>
                          <span className="text-xs text-muted-foreground">{d}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Nom complet ou entreprise">
                    <input name="full_name" required className="field" autoComplete="name" />
                  </Field>
                  <Field label="Téléphone" hint="Visible uniquement par l'autre partie d'un contrat.">
                    <input name="phone" type="tel" className="field" placeholder="+226 70 00 00 00" autoComplete="tel" />
                  </Field>
                </>
              )}
              <Field label="E-mail">
                <input name="email" type="email" required className="field" autoComplete="email" />
              </Field>
              <Field label="Mot de passe" hint={mode === "signup" ? "8 caractères minimum." : undefined}>
                <input
                  name="password"
                  type="password"
                  required
                  className="field"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </Field>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Patientez…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
