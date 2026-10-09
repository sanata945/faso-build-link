import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Role = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type Me = {
  id: string;
  email: string | null;
  profile: Profile | null;
  roles: Role[];
  isClient: boolean;
  isProvider: boolean;
  isAdmin: boolean;
};

export const meQueryKey = ["me"] as const;

export async function fetchMe(): Promise<Me | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  const r = (roles ?? []).map((x) => x.role);
  return {
    id: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
    roles: r,
    isClient: r.includes("client"),
    isProvider: r.includes("provider"),
    isAdmin: r.includes("admin"),
  };
}

export function useMe() {
  return useQuery({ queryKey: meQueryKey, queryFn: fetchMe, staleTime: 60_000 });
}
