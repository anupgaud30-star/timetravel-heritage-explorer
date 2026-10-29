/**
 * Supabase Database type definitions.
 * Generated from: supabase gen types typescript --project-id <your-project>
 * Or hand-written to match the SQL schema in supabase/migrations/*.sql
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // uuid, references auth.users
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          monument_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monument_id: string;
          added_at?: string;
        };
        Update: {
          monument_id?: string;
        };
      };
      user_history: {
        Row: {
          id: string;
          user_id: string;
          monument_id: string;
          visited_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monument_id: string;
          visited_at?: string;
        };
        Update: {
          visited_at?: string;
        };
      };
      quiz_results: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          total: number;
          difficulty: string;
          category: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          total: number;
          difficulty: string;
          category: string;
          completed_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
