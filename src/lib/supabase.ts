import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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
    };
  };
}