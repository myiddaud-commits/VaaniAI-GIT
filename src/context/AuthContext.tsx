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
  const [guestMessagesUsed, setGuestMessagesUsed] = useState(0);
  const [isGuest, setIsGuest] = useState(false);

  // Guest message limit
  const GUEST_MESSAGE_LIMIT = 20;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // Check if user is in guest mode
        const guestMode = localStorage.getItem('vaaniai-guest-mode');
        const guestMessages = parseInt(localStorage.getItem('vaaniai-guest-messages') || '0');
        
        if (guestMode === 'true') {
          setIsGuest(true);
          setGuestMessagesUsed(guestMessages);
        }
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        setIsGuest(false);
        localStorage.removeItem('vaaniai-guest-mode');
        localStorage.removeItem('vaaniai-guest-messages');
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        // Maintain guest state if it was active
        const guestMode = localStorage.getItem('vaaniai-guest-mode');
        if (guestMode === 'true') {
          setIsGuest(true);
          const guestMessages = parseInt(localStorage.getItem('vaaniai-guest-messages') || '0');
          setGuestMessagesUsed(guestMessages);
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (data) {
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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Sign up with Supabase Auth
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
        console.error('Registration error:', error);
        return false;
      }

      if (data.user) {
        // Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name,
            email,
            plan: 'free',
            messages_used: 0,
            messages_limit: 100
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return false;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
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

  const enableGuestMode = () => {
    setIsGuest(true);
    setGuestMessagesUsed(0);
    localStorage.setItem('vaaniai-guest-mode', 'true');
    localStorage.setItem('vaaniai-guest-messages', '0');
  };

  const incrementGuestMessageCount = (): boolean => {
    if (!isGuest) return false;
    
    if (guestMessagesUsed >= GUEST_MESSAGE_LIMIT) {
      return false;
    }

    const newCount = guestMessagesUsed + 1;
    setGuestMessagesUsed(newCount);
    localStorage.setItem('vaaniai-guest-messages', newCount.toString());
    return true;
  };

  const incrementMessageCount = async (): Promise<boolean> => {
    // Handle guest users
    if (isGuest) {
      return incrementGuestMessageCount();
    }

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
    isGuest,
    guestMessagesUsed,
    guestMessageLimit: GUEST_MESSAGE_LIMIT,
    login,
    register,
    logout,
    updatePlan,
    incrementMessageCount,
    enableGuestMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};