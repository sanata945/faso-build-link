export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          value: number
        }
        Insert: {
          key: string
          value: number
        }
        Update: {
          key?: string
          value?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          active: boolean
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          id: string
          rate: number
          status: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          id?: string
          rate: number
          status?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          id?: string
          rate?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          client_confirmed_at: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          duration_days: number
          id: string
          provider_confirmed_at: string | null
          provider_id: string
          quote_id: string
          request_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["contract_status"]
        }
        Insert: {
          amount: number
          client_confirmed_at?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          duration_days: number
          id?: string
          provider_confirmed_at?: string | null
          provider_id: string
          quote_id: string
          request_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
        }
        Update: {
          amount?: number
          client_confirmed_at?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          duration_days?: number
          id?: string
          provider_confirmed_at?: string | null
          provider_id?: string
          quote_id?: string
          request_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "job_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          opened_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          opened_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          opened_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          created_at: string
          id: string
          request_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "job_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      job_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category_id: string
          city_id: string
          client_id: string
          created_at: string
          deadline: string | null
          description: string
          district: string
          id: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category_id: string
          city_id: string
          client_id?: string
          created_at?: string
          deadline?: string | null
          description: string
          district: string
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string
          city_id?: string
          client_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          district?: string
          id?: string
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          external_reference: string | null
          id: string
          method: string
          status: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          external_reference?: string | null
          id?: string
          method?: string
          status?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          external_reference?: string | null
          id?: string
          method?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city_id: string | null
          client_kind: Database["public"]["Enums"]["client_kind"] | null
          created_at: string
          district: string | null
          full_name: string
          id: string
          phone: string | null
          suspended: boolean
        }
        Insert: {
          city_id?: string | null
          client_kind?: Database["public"]["Enums"]["client_kind"] | null
          created_at?: string
          district?: string | null
          full_name?: string
          id: string
          phone?: string | null
          suspended?: boolean
        }
        Update: {
          city_id?: string | null
          client_kind?: Database["public"]["Enums"]["client_kind"] | null
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          suspended?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_categories: {
        Row: {
          category_id: string
          provider_id: string
        }
        Insert: {
          category_id: string
          provider_id: string
        }
        Update: {
          category_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_categories_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      provider_cities: {
        Row: {
          city_id: string
          provider_id: string
        }
        Insert: {
          city_id: string
          provider_id: string
        }
        Update: {
          city_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_cities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      provider_profiles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          experience_years: number | null
          rating_avg: number
          rating_count: number
          trade: string | null
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name?: string
          experience_years?: number | null
          rating_avg?: number
          rating_count?: number
          trade?: string | null
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          experience_years?: number | null
          rating_avg?: number
          rating_count?: number
          trade?: string | null
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "provider_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          duration_days: number
          id: string
          labor_cost: number
          materials_cost: number
          materials_details: string | null
          message: string | null
          provider_id: string
          request_id: string
          status: Database["public"]["Enums"]["quote_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_days: number
          id?: string
          labor_cost?: number
          materials_cost?: number
          materials_details?: string | null
          message?: string | null
          provider_id?: string
          request_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          id?: string
          labor_cost?: number
          materials_cost?: number
          materials_details?: string | null
          message?: string | null
          provider_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "job_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          contract_id: string
          created_at: string
          id: string
          rating: number
          target_id: string
        }
        Insert: {
          author_id?: string
          comment?: string | null
          contract_id: string
          created_at?: string
          id?: string
          rating: number
          target_id: string
        }
        Update: {
          author_id?: string
          comment?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          rating?: number
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_quote: { Args: { _quote_id: string }; Returns: string }
      admin_resolve_dispute: {
        Args: {
          _dispute_id: string
          _resolution: string
          _status: Database["public"]["Enums"]["dispute_status"]
        }
        Returns: undefined
      }
      admin_set_suspended: {
        Args: { _suspended: boolean; _user_id: string }
        Returns: undefined
      }
      admin_set_verified: {
        Args: { _user_id: string; _verified: boolean }
        Returns: undefined
      }
      can_view_request: {
        Args: { _request_id: string; _uid: string }
        Returns: boolean
      }
      cancel_request: { Args: { _request_id: string }; Returns: undefined }
      confirm_contract: { Args: { _contract_id: string }; Returns: undefined }
      has_quoted: {
        Args: { _request_id: string; _uid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: { _user_id: string }; Returns: boolean }
      is_contract_party: {
        Args: { _contract_id: string; _uid: string }
        Returns: boolean
      }
      open_dispute: {
        Args: { _contract_id: string; _reason: string }
        Returns: string
      }
      refuse_quote: { Args: { _quote_id: string }; Returns: undefined }
      set_mission_status: {
        Args: {
          _contract_id: string
          _status: Database["public"]["Enums"]["contract_status"]
        }
        Returns: undefined
      }
      shares_contract: { Args: { _a: string; _b: string }; Returns: boolean }
      withdraw_quote: { Args: { _quote_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "client" | "provider" | "admin"
      client_kind:
        | "particulier"
        | "entreprise"
        | "proprietaire"
        | "gestionnaire"
      contract_status:
        | "en_attente"
        | "actif"
        | "en_cours"
        | "termine"
        | "annule"
        | "litige"
      dispute_status: "ouvert" | "en_examen" | "resolu" | "rejete"
      quote_status: "envoye" | "accepte" | "refuse" | "retire"
      request_status:
        | "nouvelle"
        | "devis_recu"
        | "accepte"
        | "en_cours"
        | "termine"
        | "annule"
        | "litige"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["client", "provider", "admin"],
      client_kind: [
        "particulier",
        "entreprise",
        "proprietaire",
        "gestionnaire",
      ],
      contract_status: [
        "en_attente",
        "actif",
        "en_cours",
        "termine",
        "annule",
        "litige",
      ],
      dispute_status: ["ouvert", "en_examen", "resolu", "rejete"],
      quote_status: ["envoye", "accepte", "refuse", "retire"],
      request_status: [
        "nouvelle",
        "devis_recu",
        "accepte",
        "en_cours",
        "termine",
        "annule",
        "litige",
      ],
    },
  },
} as const
