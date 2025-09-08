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
      console.log('Attempting registration for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: undefined, // Disable email confirmation
        },
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Handle specific error cases
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          console.log('User already exists, attempting login...');
          return await login(email, password);
        }
        
        if (error.message.includes('Email not confirmed')) {
          console.log('Email confirmation required, but user created');
          return true; // Consider registration successful even without email confirmation
        }
        
        return false;
      }

      console.log('Registration response:', data);
      
      // If user is immediately available (email confirmation disabled)
      if (data.user && data.session) {
        console.log('Registration successful with immediate session');
        return true;
      }
      
      // If user created but needs confirmation
      if (data.user && !data.session) {
        console.log('User created, email confirmation may be required');
        // Try to sign in immediately (works if email confirmation is disabled)
        return await login(email, password);
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


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};