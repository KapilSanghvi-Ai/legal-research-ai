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
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          source_id: string
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          source_id?: string
          tags?: string[] | null
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
      research_sessions: {
        Row: {
          context_tags: string[] | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          context_tags?: string[] | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          context_tags?: string[] | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      case_stage: "assessment" | "cita" | "itat" | "closed"
      case_status: "drafting" | "research" | "hearing" | "archived"
      citation_purpose: "support" | "distinguish" | "reference"
      document_type:
        | "memo"
        | "sof"
        | "goa"
        | "submission"
        | "reply"
        | "brief"
        | "toa"
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
      case_stage: ["assessment", "cita", "itat", "closed"],
      case_status: ["drafting", "research", "hearing", "archived"],
      citation_purpose: ["support", "distinguish", "reference"],
      document_type: [
        "memo",
        "sof",
        "goa",
        "submission",
        "reply",
        "brief",
        "toa",
      ],
    },
  },
} as const
