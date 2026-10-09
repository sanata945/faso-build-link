import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { useRefs } from "./profil";
import { compressImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Card, Empty, Field, Loading, PageTitle } from "@/components/ui-kit";
import { errMsg } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/demandes/nouvelle")({
  head: () => ({
    meta: [
      { title: "Publier une demande — FasoLink Pro" },
      { name: "description", content: "Décrivez vos travaux pour recevoir des devis de prestataires." },
      { property: "og:title", content: "Publier une demande — FasoLink Pro" },
      { property: "og:description", content: "Nouvelle demande de travaux." },
    ],
  }),
  component: Nouvelle,
});

function Nouvelle() {
  const { data: me } = useMe();
  const { data: refs } = useRefs();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  if (!me || !refs) return <Loading />;
  if (!me.isClient) return <Empty>Seuls les comptes clients peuvent publier une demande.</Empty>;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = String(f.get(k) ?? "").replace(/\s/g, "");
      return v ? Number(v) : null;
    };
    const bmin = num("budget_min");
    const bmax = num("budget_max");
    if (bmin != null && bmax != null && bmin > bmax) return toast.error("Le budget minimum dépasse le maximum.");
    setSaving(true);
    try {
      const { data: req, error } = await supabase
        .from("job_requests")
        .insert({
          category_id: String(f.get("category_id")),
          city_id: String(f.get("city_id")),
          district: String(f.get("district")).trim(),
          title: String(f.get("title")).trim(),
          description: String(f.get("description")).trim(),
          budget_min: bmin,
          budget_max: bmax,
          deadline: String(f.get("deadline") || "") || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      for (const [i, file] of files.slice(0, 3).entries()) {
        const blob = await compressImage(file);
        const path = `${me!.id}/${req.id}/${Date.now()}-${i}.jpg`;
        const up = await supabase.storage.from("job-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) {
          toast.error("Une photo n'a pas pu être envoyée.");
          continue;
        }
        await supabase.from("job_photos").insert({ request_id: req.id, storage_path: path });
      }
      await qc.invalidateQueries();
      toast.success("Demande publiée");
      navigate({ to: "/demandes/$id", params: { id: req.id } });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  const activeCats = refs.categories.filter((c) => c.active);
  return (
    <div>
      <PageTitle title="Nouvelle demande" subtitle="Plus votre description est précise, meilleurs seront les devis." />
      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="space-y-4">
          <Field label="Catégorie">
            <select name="category_id" required className="field">
              {activeCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Titre">
            <input name="title" required minLength={3} maxLength={120} placeholder="Ex. Fuite sous l'évier" className="field" />
          </Field>
          <Field label="Description">
            <textarea name="description" required minLength={10} maxLength={3000} rows={4} className="field" placeholder="Décrivez le problème, la surface, l'accès…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville">
              <select name="city_id" required defaultValue={me.profile?.city_id ?? ""} className="field">
                {refs.cities.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quartier">
              <input name="district" required defaultValue={me.profile?.district ?? ""} placeholder="Ex. Ouaga 2000" className="field" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget min (FCFA)">
              <input name="budget_min" inputMode="numeric" pattern="[0-9 ]*" className="field" />
            </Field>
            <Field label="Budget max (FCFA)">
              <input name="budget_max" inputMode="numeric" pattern="[0-9 ]*" className="field" />
            </Field>
          </div>
          <Field label="Délai souhaité">
            <select name="deadline" className="field">
              <option value="Urgent (24 h)">Urgent (24 h)</option>
              <option value="Cette semaine">Cette semaine</option>
              <option value="Ce mois-ci">Ce mois-ci</option>
              <option value="Flexible">Flexible</option>
            </select>
          </Field>
          <Field label="Photos (facultatif, 3 max)" hint="Les photos sont réduites automatiquement pour économiser vos données.">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))}
              className="block w-full text-sm"
            />
          </Field>
        </Card>
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? "Publication…" : "Publier la demande"}
        </Button>
      </form>
    </div>
  );
}
