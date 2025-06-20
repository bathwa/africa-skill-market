export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      escrow_accounts: {
        Row: {
          country: string
          created_at: string
          details: string
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["escrow_type"]
        }
        Insert: {
          country: string
          created_at?: string
          details: string
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["escrow_type"]
        }
        Update: {
          country?: string
          created_at?: string
          details?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["escrow_type"]
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          access_count: number
          budget: string
          category: string
          client_id: string
          contact_email: string
          contact_phone: string
          country: string
          created_at: string
          description: string
          files: Json | null
          id: string
          is_active: boolean
          location: string
          max_access: number
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string
        }
        Insert: {
          access_count?: number
          budget: string
          category: string
          client_id: string
          contact_email: string
          contact_phone: string
          country: string
          created_at?: string
          description: string
          files?: Json | null
          id?: string
          is_active?: boolean
          location: string
          max_access?: number
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string
        }
        Update: {
          access_count?: number
          budget?: string
          category?: string
          client_id?: string
          contact_email?: string
          contact_phone?: string
          country?: string
          created_at?: string
          description?: string
          files?: Json | null
          id?: string
          is_active?: boolean
          location?: string
          max_access?: number
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunity_access: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_access_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_vouchers: {
        Row: {
          amount: number
          created_at: string
          escrow_account_id: string
          id: string
          processed_at: string | null
          processed_by: string | null
          proof_of_payment: string | null
          reference_number: string
          status: Database["public"]["Enums"]["payment_status"]
          tokens: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          escrow_account_id: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          proof_of_payment?: string | null
          reference_number: string
          status?: Database["public"]["Enums"]["payment_status"]
          tokens: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          escrow_account_id?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          proof_of_payment?: string | null
          reference_number?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tokens: number
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tokens?: number
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tokens?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_completions: {
        Row: {
          client_id: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          id: string
          opportunity_id: string
          provider_id: string
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          provider_id: string
          status?: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_completions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_completions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_access: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_access_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          opportunity_id: string | null
          provider_id: string | null
          rated_user_id: string
          rater_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string | null
          provider_id?: string | null
          rated_user_id: string
          rater_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string | null
          provider_id?: string | null
          rated_user_id?: string
          rater_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          tokens_awarded: number
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          tokens_awarded?: number
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          tokens_awarded?: number
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          category: string
          completed_projects: number
          contact_email: string
          contact_phone: string
          country: string
          created_at: string
          description: string
          experience: number
          id: string
          is_active: boolean
          location: string
          name: string
          rating: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          category: string
          completed_projects?: number
          contact_email: string
          contact_phone: string
          country: string
          created_at?: string
          description: string
          experience?: number
          id?: string
          is_active?: boolean
          location: string
          name: string
          rating?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          category?: string
          completed_projects?: number
          contact_email?: string
          contact_phone?: string
          country?: string
          created_at?: string
          description?: string
          experience?: number
          id?: string
          is_active?: boolean
          location?: string
          name?: string
          rating?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_reference_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_user_tokens: {
        Args: {
          user_id: string
          token_amount: number
          transaction_type: string
          description?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      escrow_type: "mobile_wallet" | "bank"
      opportunity_status: "active" | "completed" | "cancelled"
      payment_status: "pending" | "approved" | "rejected"
      project_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "user" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      escrow_type: ["mobile_wallet", "bank"],
      opportunity_status: ["active", "completed", "cancelled"],
      payment_status: ["pending", "approved", "rejected"],
      project_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["user", "admin", "super_admin"],
    },
  },
} as const
