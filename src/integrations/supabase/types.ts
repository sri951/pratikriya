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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      detective_cases: {
        Row: {
          case_number: string
          completed_steps: number
          confidence: number
          correct_answer: string
          created_at: string
          id: string
          misconception: string
          probes: Json
          question: string
          repair_path: Json
          report: Json
          root_cause: string
          root_cause_confidence: number
          status: string
          student_answer: string
          subject: string
          tags: string[]
          time_taken_seconds: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_number: string
          completed_steps?: number
          confidence?: number
          correct_answer?: string
          created_at?: string
          id?: string
          misconception?: string
          probes?: Json
          question: string
          repair_path?: Json
          report?: Json
          root_cause?: string
          root_cause_confidence?: number
          status?: string
          student_answer?: string
          subject?: string
          tags?: string[]
          time_taken_seconds?: number
          topic?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_number?: string
          completed_steps?: number
          confidence?: number
          correct_answer?: string
          created_at?: string
          id?: string
          misconception?: string
          probes?: Json
          question?: string
          repair_path?: Json
          report?: Json
          root_cause?: string
          root_cause_confidence?: number
          status?: string
          student_answer?: string
          subject?: string
          tags?: string[]
          time_taken_seconds?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      doubts: {
        Row: {
          answer: Json
          created_at: string
          id: string
          question: string
          tags: string[]
          user_id: string
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: string
          question: string
          tags?: string[]
          user_id: string
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: string
          question?: string
          tags?: string[]
          user_id?: string
        }
        Relationships: []
      }
      exam_attempts: {
        Row: {
          accuracy: number
          created_at: string
          exam_id: string
          feedback: string
          id: string
          missing_concepts: string[]
          mistakes: string[]
          per_question: Json
          revise_topics: string[]
          score: number
          strengths: string[]
          user_id: string
        }
        Insert: {
          accuracy: number
          created_at?: string
          exam_id: string
          feedback?: string
          id?: string
          missing_concepts?: string[]
          mistakes?: string[]
          per_question: Json
          revise_topics?: string[]
          score: number
          strengths?: string[]
          user_id: string
        }
        Update: {
          accuracy?: number
          created_at?: string
          exam_id?: string
          feedback?: string
          id?: string
          missing_concepts?: string[]
          mistakes?: string[]
          per_question?: Json
          revise_topics?: string[]
          score?: number
          strengths?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          answer_key: Json
          created_at: string
          difficulty: string
          id: string
          question_count: number
          questions: Json
          source_name: string | null
          title: string
          topics: string[]
          user_id: string
        }
        Insert: {
          answer_key: Json
          created_at?: string
          difficulty: string
          id?: string
          question_count: number
          questions: Json
          source_name?: string | null
          title: string
          topics?: string[]
          user_id: string
        }
        Update: {
          answer_key?: Json
          created_at?: string
          difficulty?: string
          id?: string
          question_count?: number
          questions?: Json
          source_name?: string | null
          title?: string
          topics?: string[]
          user_id?: string
        }
        Relationships: []
      }
      note_cards: {
        Row: {
          back: string
          category: string
          created_at: string
          difficulty: string
          due_at: string
          front: string
          id: string
          learned: boolean
          note_id: string
          stage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          category?: string
          created_at?: string
          difficulty?: string
          due_at?: string
          front: string
          id?: string
          learned?: boolean
          note_id: string
          stage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          category?: string
          created_at?: string
          difficulty?: string
          due_at?: string
          front?: string
          id?: string
          learned?: boolean
          note_id?: string
          stage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_cards_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "study_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      study_notes: {
        Row: {
          chapter: string
          created_at: string
          extracted_text: string
          id: string
          pack: Json
          source_name: string | null
          source_type: string
          subject: string
          title: string
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter?: string
          created_at?: string
          extracted_text?: string
          id?: string
          pack?: Json
          source_name?: string | null
          source_type?: string
          subject?: string
          title: string
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: string
          created_at?: string
          extracted_text?: string
          id?: string
          pack?: Json
          source_name?: string | null
          source_type?: string
          subject?: string
          title?: string
          topics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teach_messages: {
        Row: {
          attachment_type: string | null
          content: string
          created_at: string
          emotion: string
          id: string
          kind: string
          knowledge: number
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          attachment_type?: string | null
          content?: string
          created_at?: string
          emotion?: string
          id?: string
          kind?: string
          knowledge?: number
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          attachment_type?: string | null
          content?: string
          created_at?: string
          emotion?: string
          id?: string
          kind?: string
          knowledge?: number
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teach_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "teach_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      teach_sessions: {
        Row: {
          chapter: string
          corrections: number
          created_at: string
          emotion: string
          id: string
          knowledge: number
          notebook: Json
          personality: string
          report: Json | null
          status: string
          subject: string
          topics: string[]
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          chapter?: string
          corrections?: number
          created_at?: string
          emotion?: string
          id?: string
          knowledge?: number
          notebook?: Json
          personality?: string
          report?: Json | null
          status?: string
          subject?: string
          topics?: string[]
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          chapter?: string
          corrections?: number
          created_at?: string
          emotion?: string
          id?: string
          knowledge?: number
          notebook?: Json
          personality?: string
          report?: Json | null
          status?: string
          subject?: string
          topics?: string[]
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
