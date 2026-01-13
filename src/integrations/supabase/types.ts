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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          source_id: string
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          source_id: string
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          source_id?: string
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: true
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      case_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          actor_name: string | null
          case_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          actor_name?: string | null
          case_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          actor_name?: string | null
          case_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_research: {
        Row: {
          added_by: string | null
          case_id: string
          created_at: string
          excerpt: string | null
          id: string
          issue_index: number | null
          notes: string | null
          purpose: Database["public"]["Enums"]["citation_purpose"]
          relevance_score: number | null
          source_id: string
        }
        Insert: {
          added_by?: string | null
          case_id: string
          created_at?: string
          excerpt?: string | null
          id?: string
          issue_index?: number | null
          notes?: string | null
          purpose?: Database["public"]["Enums"]["citation_purpose"]
          relevance_score?: number | null
          source_id: string
        }
        Update: {
          added_by?: string | null
          case_id?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          issue_index?: number | null
          notes?: string | null
          purpose?: Database["public"]["Enums"]["citation_purpose"]
          relevance_score?: number | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_research_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_research_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          addition_amount: number | null
          ao_designation: string | null
          ao_name: string | null
          appeal_due_date: string | null
          appeal_number: string | null
          assessed_income: number | null
          assessment_year: string
          client_id: string | null
          client_name: string
          client_pan: string | null
          created_at: string
          created_by: string | null
          demand_amount: number | null
          din_number: string | null
          disputed_amount: number | null
          financial_year: string | null
          gdrive_folder_id: string | null
          id: string
          interest_amount: number | null
          is_archived: boolean | null
          issues: Json | null
          ita_number: string | null
          limitation_date: string | null
          next_hearing_date: string | null
          notes: string | null
          notice_date: string | null
          opposing_party: string | null
          order_date: string | null
          original_income: number | null
          outcome: string | null
          outcome_summary: string | null
          owner_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          penalty_amount: number | null
          relief_amount: number | null
          response_due_date: string | null
          section_involved: string | null
          stage: Database["public"]["Enums"]["case_stage"]
          status: Database["public"]["Enums"]["case_status"]
          tags: string[] | null
          tax_effect: number | null
          team_ids: string[] | null
          updated_at: string
        }
        Insert: {
          addition_amount?: number | null
          ao_designation?: string | null
          ao_name?: string | null
          appeal_due_date?: string | null
          appeal_number?: string | null
          assessed_income?: number | null
          assessment_year: string
          client_id?: string | null
          client_name: string
          client_pan?: string | null
          created_at?: string
          created_by?: string | null
          demand_amount?: number | null
          din_number?: string | null
          disputed_amount?: number | null
          financial_year?: string | null
          gdrive_folder_id?: string | null
          id?: string
          interest_amount?: number | null
          is_archived?: boolean | null
          issues?: Json | null
          ita_number?: string | null
          limitation_date?: string | null
          next_hearing_date?: string | null
          notes?: string | null
          notice_date?: string | null
          opposing_party?: string | null
          order_date?: string | null
          original_income?: number | null
          outcome?: string | null
          outcome_summary?: string | null
          owner_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          penalty_amount?: number | null
          relief_amount?: number | null
          response_due_date?: string | null
          section_involved?: string | null
          stage?: Database["public"]["Enums"]["case_stage"]
          status?: Database["public"]["Enums"]["case_status"]
          tags?: string[] | null
          tax_effect?: number | null
          team_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          addition_amount?: number | null
          ao_designation?: string | null
          ao_name?: string | null
          appeal_due_date?: string | null
          appeal_number?: string | null
          assessed_income?: number | null
          assessment_year?: string
          client_id?: string | null
          client_name?: string
          client_pan?: string | null
          created_at?: string
          created_by?: string | null
          demand_amount?: number | null
          din_number?: string | null
          disputed_amount?: number | null
          financial_year?: string | null
          gdrive_folder_id?: string | null
          id?: string
          interest_amount?: number | null
          is_archived?: boolean | null
          issues?: Json | null
          ita_number?: string | null
          limitation_date?: string | null
          next_hearing_date?: string | null
          notes?: string | null
          notice_date?: string | null
          opposing_party?: string | null
          order_date?: string | null
          original_income?: number | null
          outcome?: string | null
          outcome_summary?: string | null
          owner_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          penalty_amount?: number | null
          relief_amount?: number | null
          response_due_date?: string | null
          section_involved?: string | null
          stage?: Database["public"]["Enums"]["case_stage"]
          status?: Database["public"]["Enums"]["case_status"]
          tags?: string[] | null
          tax_effect?: number | null
          team_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          citations: Json | null
          completion_tokens: number | null
          confidence: string | null
          content: string
          created_at: string
          id: string
          model_used: string | null
          prompt_tokens: number | null
          role: string
          session_id: string
        }
        Insert: {
          citations?: Json | null
          completion_tokens?: number | null
          confidence?: string | null
          content: string
          created_at?: string
          id?: string
          model_used?: string | null
          prompt_tokens?: number | null
          role: string
          session_id: string
        }
        Update: {
          citations?: Json | null
          completion_tokens?: number | null
          confidence?: string | null
          content?: string
          created_at?: string
          id?: string
          model_used?: string | null
          prompt_tokens?: number | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          alt_phone: string | null
          city: string | null
          client_type: Database["public"]["Enums"]["client_type"] | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gdrive_folder_id: string | null
          gstin: string | null
          id: string
          incorporation_date: string | null
          is_active: boolean | null
          name: string
          nature_of_business: string | null
          notes: string | null
          pan: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          tan: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"] | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gdrive_folder_id?: string | null
          gstin?: string | null
          id?: string
          incorporation_date?: string | null
          is_active?: boolean | null
          name: string
          nature_of_business?: string | null
          notes?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          tan?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"] | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gdrive_folder_id?: string | null
          gstin?: string | null
          id?: string
          incorporation_date?: string | null
          is_active?: boolean | null
          name?: string
          nature_of_business?: string | null
          notes?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          tan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          case_id: string | null
          category: string | null
          content: string | null
          content_format: string | null
          created_at: string
          created_by: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          file_size: number | null
          file_url: string | null
          gdrive_file_id: string | null
          id: string
          is_latest: boolean | null
          mime_type: string | null
          notes: string | null
          parent_version_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tags: string[] | null
          template_id: string | null
          template_name: string | null
          title: string
          updated_at: string
          variables: Json | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          case_id?: string | null
          category?: string | null
          content?: string | null
          content_format?: string | null
          created_at?: string
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          file_size?: number | null
          file_url?: string | null
          gdrive_file_id?: string | null
          id?: string
          is_latest?: boolean | null
          mime_type?: string | null
          notes?: string | null
          parent_version_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          template_name?: string | null
          title: string
          updated_at?: string
          variables?: Json | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          case_id?: string | null
          category?: string | null
          content?: string | null
          content_format?: string | null
          created_at?: string
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          file_size?: number | null
          file_url?: string | null
          gdrive_file_id?: string | null
          id?: string
          is_latest?: boolean | null
          mime_type?: string | null
          notes?: string | null
          parent_version_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          template_name?: string | null
          title?: string
          updated_at?: string
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      gdrive_uploads: {
        Row: {
          case_id: string | null
          client_id: string | null
          description: string | null
          document_id: string | null
          file_name: string
          file_size: number | null
          folder_type: string
          gdrive_file_id: string
          id: string
          mime_type: string | null
          parent_folder_id: string | null
          tags: string[] | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          case_id?: string | null
          client_id?: string | null
          description?: string | null
          document_id?: string | null
          file_name: string
          file_size?: number | null
          folder_type: string
          gdrive_file_id: string
          id?: string
          mime_type?: string | null
          parent_folder_id?: string | null
          tags?: string[] | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string | null
          client_id?: string | null
          description?: string | null
          document_id?: string | null
          file_name?: string
          file_size?: number | null
          folder_type?: string
          gdrive_file_id?: string
          id?: string
          mime_type?: string | null
          parent_folder_id?: string | null
          tags?: string[] | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdrive_uploads_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdrive_uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdrive_uploads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      hearings: {
        Row: {
          adjournment_reason: string | null
          appearing_counsel: string | null
          arguments_summary: string | null
          bench: string | null
          case_id: string
          cause_list_number: string | null
          court_room: string | null
          created_at: string
          created_by: string | null
          documents_filed: string[] | null
          forum: string
          hearing_date: string
          hearing_time: string | null
          id: string
          item_number: number | null
          next_date: string | null
          order_date: string | null
          order_summary: string | null
          outcome: string | null
          preparation_notes: string | null
          status: Database["public"]["Enums"]["hearing_status"] | null
          updated_at: string
        }
        Insert: {
          adjournment_reason?: string | null
          appearing_counsel?: string | null
          arguments_summary?: string | null
          bench?: string | null
          case_id: string
          cause_list_number?: string | null
          court_room?: string | null
          created_at?: string
          created_by?: string | null
          documents_filed?: string[] | null
          forum: string
          hearing_date: string
          hearing_time?: string | null
          id?: string
          item_number?: number | null
          next_date?: string | null
          order_date?: string | null
          order_summary?: string | null
          outcome?: string | null
          preparation_notes?: string | null
          status?: Database["public"]["Enums"]["hearing_status"] | null
          updated_at?: string
        }
        Update: {
          adjournment_reason?: string | null
          appearing_counsel?: string | null
          arguments_summary?: string | null
          bench?: string | null
          case_id?: string
          cause_list_number?: string | null
          court_room?: string | null
          created_at?: string
          created_by?: string | null
          documents_filed?: string[] | null
          forum?: string
          hearing_date?: string
          hearing_time?: string | null
          id?: string
          item_number?: number | null
          next_date?: string | null
          order_date?: string | null
          order_summary?: string | null
          outcome?: string | null
          preparation_notes?: string | null
          status?: Database["public"]["Enums"]["hearing_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_fragments: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          paragraph_num: number
          source_id: string
          token_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          paragraph_num: number
          source_id: string
          token_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          paragraph_num?: number
          source_id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_fragments_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          category: string | null
          created_at: string
          file_type: string | null
          fragment_count: number | null
          gdrive_file_id: string
          id: string
          indexed_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_type?: string | null
          fragment_count?: number | null
          gdrive_file_id: string
          id?: string
          indexed_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_type?: string | null
          fragment_count?: number | null
          gdrive_file_id?: string
          id?: string
          indexed_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      research_sessions: {
        Row: {
          context_tags: string[] | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context_tags?: string[] | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context_tags?: string[] | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          query: string
          results_count: number | null
          session_id: string | null
          source_ids: string[] | null
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id?: string
          query: string
          results_count?: number | null
          session_id?: string | null
          source_ids?: string[] | null
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          query?: string
          results_count?: number | null
          session_id?: string | null
          source_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      source_fragments: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          paragraph_num: number
          source_id: string
          token_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          paragraph_num: number
          source_id: string
          token_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          paragraph_num?: number
          source_id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "source_fragments_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          bench: string | null
          cached_at: string
          citation: string
          court: string | null
          full_text: string | null
          headnote: string | null
          id: string
          ik_doc_id: string
          judgment_date: string | null
          sections_cited: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          bench?: string | null
          cached_at?: string
          citation: string
          court?: string | null
          full_text?: string | null
          headnote?: string | null
          id?: string
          ik_doc_id: string
          judgment_date?: string | null
          sections_cited?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          bench?: string | null
          cached_at?: string
          citation?: string
          court?: string | null
          full_text?: string | null
          headnote?: string | null
          id?: string
          ik_doc_id?: string
          judgment_date?: string | null
          sections_cited?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_by: string | null
          assigned_to: string | null
          case_id: string | null
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          estimated_hours: number | null
          id: string
          is_recurring: boolean | null
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          recurrence_pattern: Json | null
          reminder_date: string | null
          reminder_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          case_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_hours?: number | null
          id?: string
          is_recurring?: boolean | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurrence_pattern?: Json | null
          reminder_date?: string | null
          reminder_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          case_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_hours?: number | null
          id?: string
          is_recurring?: boolean | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          recurrence_pattern?: Json | null
          reminder_date?: string | null
          reminder_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          compact_mode: boolean | null
          created_at: string
          deadline_reminder_days: number | null
          deadline_reminders: boolean | null
          default_view: string | null
          email_notifications: boolean | null
          hearing_reminder_days: number | null
          hearing_reminders: boolean | null
          id: string
          research_alerts: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compact_mode?: boolean | null
          created_at?: string
          deadline_reminder_days?: number | null
          deadline_reminders?: boolean | null
          default_view?: string | null
          email_notifications?: boolean | null
          hearing_reminder_days?: number | null
          hearing_reminders?: boolean | null
          id?: string
          research_alerts?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compact_mode?: boolean | null
          created_at?: string
          deadline_reminder_days?: number | null
          deadline_reminders?: boolean | null
          default_view?: string | null
          email_notifications?: boolean | null
          hearing_reminder_days?: number | null
          hearing_reminders?: boolean | null
          id?: string
          research_alerts?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_upcoming_deadlines: {
        Args: { days_ahead?: number }
        Returns: {
          assessment_year: string
          case_id: string
          client_name: string
          days_until: number
          deadline_date: string
          description: string
          type: string
        }[]
      }
      match_knowledge_fragments: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          created_at: string
          gdrive_file_id: string
          id: string
          paragraph_num: number
          similarity: number
          source_id: string
          source_name: string
        }[]
      }
      match_source_fragments: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          citation: string
          content: string
          court: string
          id: string
          paragraph_num: number
          similarity: number
          source_id: string
        }[]
      }
    }
    Enums: {
      case_stage: "assessment" | "cita" | "itat" | "closed" | "hc"
      case_status: "drafting" | "research" | "hearing" | "archived"
      citation_purpose: "support" | "distinguish" | "reference"
      client_type:
        | "individual"
        | "huf"
        | "company"
        | "firm"
        | "trust"
        | "aop"
        | "government"
      document_type:
        | "memo"
        | "sof"
        | "goa"
        | "submission"
        | "reply"
        | "brief"
        | "toa"
      hearing_status:
        | "scheduled"
        | "adjourned"
        | "part_heard"
        | "heard"
        | "decided"
        | "withdrawn"
      payment_status:
        | "nil"
        | "partial"
        | "full"
        | "refund_pending"
        | "refund_received"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "pending"
        | "in_progress"
        | "review"
        | "completed"
        | "cancelled"
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
      case_stage: ["assessment", "cita", "itat", "closed", "hc"],
      case_status: ["drafting", "research", "hearing", "archived"],
      citation_purpose: ["support", "distinguish", "reference"],
      client_type: [
        "individual",
        "huf",
        "company",
        "firm",
        "trust",
        "aop",
        "government",
      ],
      document_type: [
        "memo",
        "sof",
        "goa",
        "submission",
        "reply",
        "brief",
        "toa",
      ],
      hearing_status: [
        "scheduled",
        "adjourned",
        "part_heard",
        "heard",
        "decided",
        "withdrawn",
      ],
      payment_status: [
        "nil",
        "partial",
        "full",
        "refund_pending",
        "refund_received",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "pending",
        "in_progress",
        "review",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
