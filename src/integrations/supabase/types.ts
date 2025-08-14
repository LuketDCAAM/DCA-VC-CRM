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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      api_configurations: {
        Row: {
          api_key_encrypted: string
          base_url: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          provider: string
          rate_limit_per_minute: number
          updated_at: string
        }
        Insert: {
          api_key_encrypted: string
          base_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          provider: string
          rate_limit_per_minute?: number
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string
          base_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          provider?: string
          rate_limit_per_minute?: number
          updated_at?: string
        }
        Relationships: []
      }
      api_sync_logs: {
        Row: {
          api_provider: string
          completed_at: string | null
          created_by: string
          data_fetched: Json | null
          deal_id: string | null
          error_message: string | null
          id: string
          records_processed: number
          records_updated: number
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          api_provider: string
          completed_at?: string | null
          created_by: string
          data_fetched?: Json | null
          deal_id?: string | null
          error_message?: string | null
          id?: string
          records_processed?: number
          records_updated?: number
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          api_provider?: string
          completed_at?: string | null
          created_by?: string
          data_fetched?: Json | null
          deal_id?: string | null
          error_message?: string | null
          id?: string
          records_processed?: number
          records_updated?: number
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_sync_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
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
      company_funding_rounds: {
        Row: {
          amount_raised: number | null
          created_at: string
          deal_id: string
          external_id: string | null
          external_source: string
          funding_date: string | null
          id: string
          lead_investors: string[] | null
          participating_investors: string[] | null
          round_type: string
          valuation_post_money: number | null
          valuation_pre_money: number | null
        }
        Insert: {
          amount_raised?: number | null
          created_at?: string
          deal_id: string
          external_id?: string | null
          external_source: string
          funding_date?: string | null
          id?: string
          lead_investors?: string[] | null
          participating_investors?: string[] | null
          round_type: string
          valuation_post_money?: number | null
          valuation_pre_money?: number | null
        }
        Update: {
          amount_raised?: number | null
          created_at?: string
          deal_id?: string
          external_id?: string | null
          external_source?: string
          funding_date?: string | null
          id?: string
          lead_investors?: string[] | null
          participating_investors?: string[] | null
          round_type?: string
          valuation_post_money?: number | null
          valuation_pre_money?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_funding_rounds_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
          name: string | null
          phone: string | null
          portfolio_company_id: string | null
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
          name?: string | null
          phone?: string | null
          portfolio_company_id?: string | null
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
          name?: string | null
          phone?: string | null
          portfolio_company_id?: string | null
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
          {
            foreignKeyName: "contacts_portfolio_company_id_fkey"
            columns: ["portfolio_company_id"]
            isOneToOne: false
            referencedRelation: "portfolio_companies"
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
      deal_investors: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          investor_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          investor_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          investor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_investors_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_investors_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company_name: string
          company_type: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          crunchbase_url: string | null
          deal_lead: string | null
          deal_score: number | null
          deal_source: string | null
          description: string | null
          employee_count_range: string | null
          external_data_last_synced: string | null
          external_data_sync_status: string | null
          founded_year: number | null
          headquarters_location: string | null
          id: string
          is_priority_deal: boolean | null
          last_call_date: string | null
          last_funding_date: string | null
          linkedin_url: string | null
          location: string | null
          next_steps: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          post_money_valuation: number | null
          priority_rank: number | null
          relationship_owner: string | null
          revenue: number | null
          round_size: number | null
          round_stage: Database["public"]["Enums"]["round_stage"] | null
          sector: string | null
          source_date: string | null
          tags: string[] | null
          total_funding_raised: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          company_name: string
          company_type?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          crunchbase_url?: string | null
          deal_lead?: string | null
          deal_score?: number | null
          deal_source?: string | null
          description?: string | null
          employee_count_range?: string | null
          external_data_last_synced?: string | null
          external_data_sync_status?: string | null
          founded_year?: number | null
          headquarters_location?: string | null
          id?: string
          is_priority_deal?: boolean | null
          last_call_date?: string | null
          last_funding_date?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_steps?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          post_money_valuation?: number | null
          priority_rank?: number | null
          relationship_owner?: string | null
          revenue?: number | null
          round_size?: number | null
          round_stage?: Database["public"]["Enums"]["round_stage"] | null
          sector?: string | null
          source_date?: string | null
          tags?: string[] | null
          total_funding_raised?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          company_name?: string
          company_type?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          crunchbase_url?: string | null
          deal_lead?: string | null
          deal_score?: number | null
          deal_source?: string | null
          description?: string | null
          employee_count_range?: string | null
          external_data_last_synced?: string | null
          external_data_sync_status?: string | null
          founded_year?: number | null
          headquarters_location?: string | null
          id?: string
          is_priority_deal?: boolean | null
          last_call_date?: string | null
          last_funding_date?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_steps?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          post_money_valuation?: number | null
          priority_rank?: number | null
          relationship_owner?: string | null
          revenue?: number | null
          round_size?: number | null
          round_stage?: Database["public"]["Enums"]["round_stage"] | null
          sector?: string | null
          source_date?: string | null
          tags?: string[] | null
          total_funding_raised?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      external_investors: {
        Row: {
          created_at: string
          external_id: string | null
          external_source: string
          firm_name: string | null
          id: string
          name: string
          profile_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          external_source: string
          firm_name?: string | null
          id?: string
          name: string
          profile_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          external_source?: string
          firm_name?: string | null
          id?: string
          name?: string
          profile_data?: Json | null
          updated_at?: string
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
          last_call_date: string | null
          linkedin_url: string | null
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
          last_call_date?: string | null
          linkedin_url?: string | null
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
          last_call_date?: string | null
          linkedin_url?: string | null
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
      lp_engagements: {
        Row: {
          capital_called: number | null
          capital_returned: number | null
          commitment_amount: number | null
          committed_date: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          engagement_stage:
            | Database["public"]["Enums"]["engagement_stage"]
            | null
          id: string
          investment_focus: string[] | null
          last_interaction_date: string | null
          linkedin_url: string | null
          location: string | null
          lp_name: string
          lp_type: string | null
          next_steps: string | null
          notes: string | null
          relationship_owner: string | null
          tags: string[] | null
          ticket_size_max: number | null
          ticket_size_min: number | null
          updated_at: string
        }
        Insert: {
          capital_called?: number | null
          capital_returned?: number | null
          commitment_amount?: number | null
          committed_date?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          engagement_stage?:
            | Database["public"]["Enums"]["engagement_stage"]
            | null
          id?: string
          investment_focus?: string[] | null
          last_interaction_date?: string | null
          linkedin_url?: string | null
          location?: string | null
          lp_name: string
          lp_type?: string | null
          next_steps?: string | null
          notes?: string | null
          relationship_owner?: string | null
          tags?: string[] | null
          ticket_size_max?: number | null
          ticket_size_min?: number | null
          updated_at?: string
        }
        Update: {
          capital_called?: number | null
          capital_returned?: number | null
          commitment_amount?: number | null
          committed_date?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          engagement_stage?:
            | Database["public"]["Enums"]["engagement_stage"]
            | null
          id?: string
          investment_focus?: string[] | null
          last_interaction_date?: string | null
          linkedin_url?: string | null
          location?: string | null
          lp_name?: string
          lp_type?: string | null
          next_steps?: string | null
          notes?: string | null
          relationship_owner?: string | null
          tags?: string[] | null
          ticket_size_max?: number | null
          ticket_size_min?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      microsoft_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outlook_calendar_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          deals_updated: number | null
          error_message: string | null
          events_processed: number | null
          id: string
          started_at: string
          status: string
          sync_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deals_updated?: number | null
          error_message?: string | null
          events_processed?: number | null
          id?: string
          started_at?: string
          status: string
          sync_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deals_updated?: number | null
          error_message?: string | null
          events_processed?: number | null
          id?: string
          started_at?: string
          status?: string
          sync_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_id_outlook_sync"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outlook_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          items_failed: number | null
          items_processed: number | null
          started_at: string
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          started_at?: string
          status: string
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_companies: {
        Row: {
          company_name: string
          created_at: string
          created_by: string
          description: string | null
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
          description?: string | null
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
          description?: string | null
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
          assigned_to: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          investor_id: string | null
          is_completed: boolean
          outlook_created_date: string | null
          outlook_last_sync: string | null
          outlook_modified_date: string | null
          outlook_task_id: string | null
          portfolio_company_id: string | null
          priority: string | null
          reminder_date: string
          send_email_reminder: boolean | null
          status: string | null
          sync_status: string | null
          task_type: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          description?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          investor_id?: string | null
          is_completed?: boolean
          outlook_created_date?: string | null
          outlook_last_sync?: string | null
          outlook_modified_date?: string | null
          outlook_task_id?: string | null
          portfolio_company_id?: string | null
          priority?: string | null
          reminder_date: string
          send_email_reminder?: boolean | null
          status?: string | null
          sync_status?: string | null
          task_type?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          investor_id?: string | null
          is_completed?: boolean
          outlook_created_date?: string | null
          outlook_last_sync?: string | null
          outlook_modified_date?: string | null
          outlook_task_id?: string | null
          portfolio_company_id?: string | null
          priority?: string | null
          reminder_date?: string
          send_email_reminder?: boolean | null
          status?: string | null
          sync_status?: string | null
          task_type?: string | null
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
      task_assignments: {
        Row: {
          assigned_to: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          rejected_reason: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_approvals_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_approvals_user_id_fkey2"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      find_potential_duplicates: {
        Args: {
          p_company_name: string
          p_contact_email?: string
          p_linkedin_url?: string
          p_user_id?: string
          p_website?: string
        }
        Returns: {
          company_name: string
          confidence_level: string
          confidence_score: number
          contact_email: string
          contact_name: string
          created_at: string
          deal_id: string
          linkedin_url: string
          match_reasons: string[]
          pipeline_stage: string
          website: string
        }[]
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          approval_status: string
          created_at: string
          email: string
          name: string
          roles: string[]
          user_id: string
        }[]
      }
      get_task_assignees: {
        Args: { task_id: string }
        Returns: {
          email: string
          id: string
          name: string
        }[]
      }
      get_user_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          id: string
          name: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_approved: {
        Args: { _user_id: string }
        Returns: boolean
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "viewer"
      company_status: "Active" | "Exited" | "Dissolved"
      engagement_stage:
        | "Prospect"
        | "Initial Contact"
        | "Due Diligence"
        | "Negotiation"
        | "Committed"
        | "Active"
        | "Inactive"
        | "Declined"
      investment_stage:
        | "Pre-Seed"
        | "Seed"
        | "Series A"
        | "Series B"
        | "Series C"
        | "Growth"
        | "Late Stage"
      pipeline_stage:
        | "Inactive"
        | "Initial Review"
        | "Scorecard"
        | "One Pager"
        | "Due Diligence"
        | "Memo"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user", "viewer"],
      company_status: ["Active", "Exited", "Dissolved"],
      engagement_stage: [
        "Prospect",
        "Initial Contact",
        "Due Diligence",
        "Negotiation",
        "Committed",
        "Active",
        "Inactive",
        "Declined",
      ],
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
        "Inactive",
        "Initial Review",
        "Scorecard",
        "One Pager",
        "Due Diligence",
        "Memo",
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
