import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Villes et catégories : rarement modifiées, chargées une seule fois.
export function useRefs() {
  return useQuery({
    queryKey: ["refs"],
    staleTime: Infinity,
    queryFn: async () => {
      const [c, k] = await Promise.all([
        supabase.from("cities").select("*").order("name"),
        supabase.from("categories").select("*").order("name"),
      ]);
      return { cities: c.data ?? [], categories: k.data ?? [] };
    },
  });
}
