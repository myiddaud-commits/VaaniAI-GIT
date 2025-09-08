import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          plan: data.plan,
          messagesUsed: data.messages_used,
          messagesLimit: data.messages_limit,
          createdAt: data.created_at
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return false;
      }

      return !!data.user;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        console.error('Registration error:', error.message);
        // Don't return false for "User already registered" - let Supabase handle it
        if (error.message.includes('User already registered')) {
          // Try to sign in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) {
            console.error('Auto sign-in failed:', signInError.message);
            return false;
          }
          
          return !!signInData.user;
        }
        return false;
      }

      return !!data.user;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updatePlan = async (plan: 'free' | 'premium' | 'enterprise') => {
    if (!user) return;

    const limits = {
      free: 100,
      premium: 5000,
      enterprise: 999999
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          plan, 
          messages_limit: limits[plan] 
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating plan:', error);
        return;
      }

      if (data) {
        setUser({
          ...user,
          plan: data.plan,
          messagesLimit: data.messages_limit
        });
      }
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const incrementMessageCount = async (): Promise<boolean> => {
    if (!user) return false;
    
    if (user.messagesUsed >= user.messagesLimit) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ messages_used: user.messagesUsed + 1 })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error incrementing message count:', error);
        return false;
      }

      if (data) {
        setUser({
          ...user,
          messagesUsed: data.messages_used
        });
      }

      return true;
    } catch (error) {
      console.error('Error incrementing message count:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updatePlan,
    incrementMessageCount,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-whatsapp-primary"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};