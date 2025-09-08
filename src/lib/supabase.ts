import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase environment variables not configured. Using localStorage fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          plan: 'free' | 'premium' | 'enterprise';
          messages_used: number;
          messages_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          plan?: 'free' | 'premium' | 'enterprise';
          messages_used?: number;
          messages_limit?: number;
        };
        Update: {
          name?: string;
          email?: string;
          plan?: 'free' | 'premium' | 'enterprise';
          messages_used?: number;
          messages_limit?: number;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title?: string;
        };
        Update: {
          title?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          content: string;
          sender: 'user' | 'bot';
          created_at: string;
        };
        Insert: {
          session_id: string;
          user_id: string;
          content: string;
          sender: 'user' | 'bot';
        };
        Update: {
          content?: string;
        };
      };
      pricing_plans: {
        Row: {
          id: string;
          name: string;
          name_hindi: string;
          price: number;
          currency: string;
          billing_cycle: 'monthly' | 'yearly';
          messages_limit: number;
          features: string[];
          features_hindi: string[];
          is_active: boolean;
          is_popular: boolean;
          created_at: string;
        };
      };
      api_configs: {
        Row: {
          id: string;
          openai_key: string | null;
          gemini_key: string | null;
          claude_key: string | null;
          openrouter_key: string | null;
          selected_model: string;
          rate_limit: number;
          max_tokens: number;
          temperature: number;
          updated_at: string;
        };
        Insert: {
          openai_key?: string;
          gemini_key?: string;
          claude_key?: string;
          openrouter_key?: string;
          selected_model?: string;
          rate_limit?: number;
          max_tokens?: number;
          temperature?: number;
        };
        Update: {
          openai_key?: string;
          gemini_key?: string;
          claude_key?: string;
          openrouter_key?: string;
          selected_model?: string;
          rate_limit?: number;
          max_tokens?: number;
          temperature?: number;
        };
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'super_admin';
          created_at: string;
        };
      };
      user_analytics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          messages_sent: number;
          session_count: number;
          total_time_spent: number;
        };
      };
      system_analytics: {
        Row: {
          id: string;
          date: string;
          total_users: number;
          active_users: number;
          total_messages: number;
          api_calls: number;
          revenue: number;
          created_at: string;
        };
      };
      api_usage_logs: {
        Row: {
          id: string;
          user_id: string | null;
          endpoint: string;
          model_used: string;
          tokens_used: number;
          response_time: number;
          status: 'success' | 'error' | 'timeout';
          error_message: string | null;
          created_at: string;
        };
      };
    };
  };
}