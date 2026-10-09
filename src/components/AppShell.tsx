import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, ClipboardList, PlusCircle, FileSignature, User, Search, Receipt, Shield } from "lucide-react";
import { useMe } from "@/lib/auth";

type Item = { to: string; label: string; icon: typeof Home };

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();

  const items: Item[] = [{ to: "/espace", label: "Accueil", icon: Home }];
  if (me?.isClient) {
    items.push(
      { to: "/demandes", label: "Demandes", icon: ClipboardList },
      { to: "/demandes/nouvelle", label: "Publier", icon: PlusCircle },
    );
  }
  if (me?.isProvider) {
    items.push(
      { to: "/opportunites", label: "Chantiers", icon: Search },
      { to: "/devis", label: "Mes devis", icon: Receipt },
    );
  }
  items.push({ to: "/contrats", label: "Contrats", icon: FileSignature });
  if (me?.isAdmin) items.push({ to: "/admin", label: "Admin", icon: Shield });
  items.push({ to: "/profil", label: "Profil", icon: User });

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 border-b bg-card">
        <div className="faso-stripe h-1" />
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
          <Link to="/espace" className="font-display text-lg font-bold text-primary">
            FasoLink <span className="text-terre">Pro</span>
          </Link>
          <span className="truncate text-xs text-muted-foreground">{me?.profile?.full_name}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-card">
        <div className="mx-auto flex max-w-3xl justify-around">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.to === "/demandes" || it.to === "/espace" }}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              <it.icon className="h-5 w-5" />
              <span className="truncate">{it.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
