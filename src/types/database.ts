/**
 * Supabase database typings.
 *
 * Hand-written to mirror supabase/migrations/0001_schema.sql and 0004_views.sql.
 * If you change the schema, update this file (or regenerate with the Supabase CLI:
 *   supabase gen types typescript --project-id <ref> --schema public > src/types/database.ts
 * ).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";
export type MatchWinner = "home" | "away" | "draw";

export interface Database {
  // Marker required by newer @supabase/postgrest-js generics. Value irrelevant.
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          is_admin: boolean;
          total_points: number;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          total_points?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          total_points?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          external_id: string | null;
          home_team: string;
          away_team: string;
          kickoff_time: string;
          actual_home_score: number | null;
          actual_away_score: number | null;
          winner: MatchWinner | null;
          status: MatchStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          home_team: string;
          away_team: string;
          kickoff_time: string;
          actual_home_score?: number | null;
          actual_away_score?: number | null;
          winner?: MatchWinner | null;
          status?: MatchStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          external_id?: string | null;
          home_team?: string;
          away_team?: string;
          kickoff_time?: string;
          actual_home_score?: number | null;
          actual_away_score?: number | null;
          winner?: MatchWinner | null;
          status?: MatchStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          predicted_winner: MatchWinner;
          predicted_home_score: number;
          predicted_away_score: number;
          points_awarded: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          predicted_winner: MatchWinner;
          predicted_home_score: number;
          predicted_away_score: number;
          points_awarded?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string;
          predicted_winner?: MatchWinner;
          predicted_home_score?: number;
          predicted_away_score?: number;
          points_awarded?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      league_members: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      global_leaderboard: {
        Row: {
          id: string | null;
          display_name: string | null;
          avatar_url: string | null;
          total_points: number | null;
          rank: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      gen_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      recompute_match_scores: {
        Args: { p_match_id: string };
        Returns: void;
      };
      score_prediction: {
        Args: {
          p_winner: MatchWinner;
          p_home: number;
          p_away: number;
          a_winner: MatchWinner | null;
          a_home: number | null;
          a_away: number | null;
        };
        Returns: number;
      };
    };
    Enums: {
      match_status: MatchStatus;
      match_winner: MatchWinner;
    };
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience row aliases used across the app. */
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type PredictionRow = Database["public"]["Tables"]["predictions"]["Row"];
export type LeagueRow = Database["public"]["Tables"]["leagues"]["Row"];
export type LeagueMemberRow = Database["public"]["Tables"]["league_members"]["Row"];
export type GlobalLeaderboardRow = Database["public"]["Views"]["global_leaderboard"]["Row"];
