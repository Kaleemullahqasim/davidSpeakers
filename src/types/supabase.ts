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
      coach_profiles: {
        Row: {
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          specializations: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          specializations?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          specializations?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      admin_audit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
      }
      video_submissions: {
        Row: {
          id: string
          student_id: string
          title: string
          video_url: string
          description: string | null
          target_audience: string | null
          status: 'pending' | 'assigned' | 'evaluated'
          evaluation_deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          video_url: string
          description?: string | null
          target_audience?: string | null
          status?: 'pending' | 'assigned' | 'evaluated'
          evaluation_deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          video_url?: string
          description?: string | null
          target_audience?: string | null
          status?: 'pending' | 'assigned' | 'evaluated'
          evaluation_deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coach_assignments: {
        Row: {
          id: string
          video_id: string
          coach_id: string
          assigned_by: string
          assignment_note: string | null
          status: 'pending' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          coach_id: string
          assigned_by: string
          assignment_note?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          coach_id?: string
          assigned_by?: string
          assignment_note?: string | null
          status?: 'pending' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          assignment_id: string
          coach_id: string
          video_id: string
          student_id: string
          feedback: string
          grammar_score: number | null
          vocabulary_score: number | null
          clarity_score: number | null
          structure_score: number | null
          delivery_score: number | null
          engagement_score: number | null
          overall_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          coach_id: string
          video_id: string
          student_id: string
          feedback: string
          grammar_score?: number | null
          vocabulary_score?: number | null
          clarity_score?: number | null
          structure_score?: number | null
          delivery_score?: number | null
          engagement_score?: number | null
          overall_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          coach_id?: string
          video_id?: string
          student_id?: string
          feedback?: string
          grammar_score?: number | null
          vocabulary_score?: number | null
          clarity_score?: number | null
          structure_score?: number | null
          delivery_score?: number | null
          engagement_score?: number | null
          overall_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      video_comments: {
        Row: {
          id: string
          evaluation_id: string
          timestamp_seconds: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          evaluation_id: string
          timestamp_seconds: number
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          evaluation_id?: string
          timestamp_seconds?: number
          comment?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      coach_status: 'pending' | 'approved' | 'rejected'
    }
  }
}