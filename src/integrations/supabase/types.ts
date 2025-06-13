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
      call_notes: {
        Row: {
          call_date: string
          content: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          id: string
          investor_id: string | null
          portfolio_company_id: string | null
          title: string
        }
        Insert: {
          call_date: string
          content?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          id?: string
          investor_id?: string | null
          portfolio_company_id?: string | null
          title: string
        }
        Update: {
          call_date?: string
          content?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          id?: string
          investor_id?: string | null
          portfolio_company_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_notes_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_notes_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_or_firm: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          email: string | null
          id: string
          investor_id: string | null
          name: string
          phone: string | null
          relationship_owner: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          company_or_firm?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          email?: string | null
          id?: string
          investor_id?: string | null
          name: string
          phone?: string | null
          relationship_owner?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_or_firm?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          email?: string | null
          id?: string
          investor_id?: string | null
          name?: string
          phone?: string | null
          relationship_owner?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      current_valuations: {
        Row: {
          current_ownership_percentage: number | null
          id: string
          last_round_post_money_valuation: number | null
          last_round_price_per_share: number | null
          portfolio_company_id: string
          updated_at: string
        }
        Insert: {
          current_ownership_percentage?: number | null
          id?: string
          last_round_post_money_valuation?: number | null
          last_round_price_per_share?: number | null
          portfolio_company_id: string
          updated_at?: string
        }
        Update: {
          current_ownership_percentage?: number | null
          id?: string
          last_round_post_money_valuation?: number | null
          last_round_price_per_share?: number | null
          portfolio_company_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "current_valuations_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: true
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          id: string
          last_call_date: string | null
          location: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          post_money_valuation: number | null
          relationship_owner: string | null
          revenue: number | null
          round_size: number | null
          round_stage: Database["public"]["Enums"]["round_stage"] | null
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          id?: string
          last_call_date?: string | null
          location?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          post_money_valuation?: number | null
          relationship_owner?: string | null
          revenue?: number | null
          round_size?: number | null
          round_stage?: Database["public"]["Enums"]["round_stage"] | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          id?: string
          last_call_date?: string | null
          location?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          post_money_valuation?: number | null
          relationship_owner?: string | null
          revenue?: number | null
          round_size?: number | null
          round_stage?: Database["public"]["Enums"]["round_stage"] | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      file_attachments: {
        Row: {
          created_at: string
          deal_id: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          investor_id: string | null
          portfolio_company_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          investor_id?: string | null
          portfolio_company_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          investor_id?: string | null
          portfolio_company_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount_invested: number
          created_at: string
          id: string
          investment_date: string
          ownership_percentage: number | null
          portfolio_company_id: string
          post_money_valuation: number | null
          price_per_share: number | null
          revenue_at_investment: number | null
        }
        Insert: {
          amount_invested: number
          created_at?: string
          id?: string
          investment_date: string
          ownership_percentage?: number | null
          portfolio_company_id: string
          post_money_valuation?: number | null
          price_per_share?: number | null
          revenue_at_investment?: number | null
        }
        Update: {
          amount_invested?: number
          created_at?: string
          id?: string
          investment_date?: string
          ownership_percentage?: number | null
          portfolio_company_id?: string
          post_money_valuation?: number | null
          price_per_share?: number | null
          revenue_at_investment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      investors: {
        Row: {
          average_check_size: number | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          created_by: string
          firm_name: string | null
          firm_website: string | null
          id: string
          location: string | null
          preferred_investment_stage:
            | Database["public"]["Enums"]["investment_stage"]
            | null
          preferred_sectors: string[] | null
          relationship_owner: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          average_check_size?: number | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          created_by: string
          firm_name?: string | null
          firm_website?: string | null
          id?: string
          location?: string | null
          preferred_investment_stage?:
            | Database["public"]["Enums"]["investment_stage"]
            | null
          preferred_sectors?: string[] | null
          relationship_owner?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          average_check_size?: number | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          firm_name?: string | null
          firm_website?: string | null
          id?: string
          location?: string | null
          preferred_investment_stage?:
            | Database["public"]["Enums"]["investment_stage"]
            | null
          preferred_sectors?: string[] | null
          relationship_owner?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_companies: {
        Row: {
          company_name: string
          created_at: string
          created_by: string
          id: string
          relationship_owner: string | null
          status: Database["public"]["Enums"]["company_status"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          created_by: string
          id?: string
          relationship_owner?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          created_by?: string
          id?: string
          relationship_owner?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          id: string
          investor_id: string | null
          is_completed: boolean
          portfolio_company_id: string | null
          reminder_date: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id?: string | null
          description?: string | null
          id?: string
          investor_id?: string | null
          is_completed?: boolean
          portfolio_company_id?: string | null
          reminder_date: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          investor_id?: string | null
          is_completed?: boolean
          portfolio_company_id?: string | null
          reminder_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_user_approved: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      company_status: "Active" | "Exited" | "Dissolved"
      investment_stage:
        | "Pre-Seed"
        | "Seed"
        | "Series A"
        | "Series B"
        | "Series C"
        | "Growth"
        | "Late Stage"
      pipeline_stage:
        | "Initial Contact"
        | "First Meeting"
        | "Due Diligence"
        | "Term Sheet"
        | "Legal Review"
        | "Invested"
        | "Passed"
      round_stage:
        | "Pre-Seed"
        | "Seed"
        | "Series A"
        | "Series B"
        | "Series C"
        | "Bridge"
        | "Growth"
      user_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user"],
      company_status: ["Active", "Exited", "Dissolved"],
      investment_stage: [
        "Pre-Seed",
        "Seed",
        "Series A",
        "Series B",
        "Series C",
        "Growth",
        "Late Stage",
      ],
      pipeline_stage: [
        "Initial Contact",
        "First Meeting",
        "Due Diligence",
        "Term Sheet",
        "Legal Review",
        "Invested",
        "Passed",
      ],
      round_stage: [
        "Pre-Seed",
        "Seed",
        "Series A",
        "Series B",
        "Series C",
        "Bridge",
        "Growth",
      ],
      user_status: ["pending", "approved", "rejected"],
    },
  },
} as const
