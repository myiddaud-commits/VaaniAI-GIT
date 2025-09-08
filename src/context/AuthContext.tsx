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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
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
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login with Supabase for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error.message);
        
        // If Supabase fails, try localStorage fallback for demo purposes
        console.log('Trying localStorage fallback...');
        const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);
        
        if (user) {
          console.log('Found user in localStorage, setting session...');
          setUser({
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            messagesUsed: user.messagesUsed,
            messagesLimit: user.messagesLimit,
            createdAt: user.createdAt
          });
          localStorage.setItem('vaaniai-user', JSON.stringify(user));
          return true;
        }
        
        return false;
      }

      console.log('Supabase login successful');
      return !!data.user;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting registration for:', email);
      
      // First try Supabase registration
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
        console.error('Supabase registration error:', error);
        
        // If Supabase fails, create user in localStorage as fallback
        console.log('Creating user in localStorage as fallback...');
        const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
        
        // Check if user already exists
        const existingUser = users.find((u: any) => u.email === email);
        if (existingUser) {
          console.log('User already exists in localStorage, attempting login...');
          return await login(email, password);
        }
        
        // Create new user in localStorage
        const newUser = {
          id: Date.now().toString(),
          name,
          email,
          password,
          plan: 'free' as const,
          messagesUsed: 0,
          messagesLimit: 100,
          createdAt: new Date().toISOString(),
        };
        
        users.push(newUser);
        localStorage.setItem('vaaniai-users', JSON.stringify(users));
        
        // Set current user
        setUser({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          plan: newUser.plan,
          messagesUsed: newUser.messagesUsed,
          messagesLimit: newUser.messagesLimit,
          createdAt: newUser.createdAt
        });
        localStorage.setItem('vaaniai-user', JSON.stringify(newUser));
        
        console.log('User created successfully in localStorage');
        return true;
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
        // Consider registration successful even without immediate session
        return true;
      }

      return !!data.user;
    } catch (error) {
      console.error('Registration catch error:', error);
      
      // Fallback to localStorage registration
      console.log('Fallback to localStorage registration...');
      const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
      
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        plan: 'free' as const,
        messagesUsed: 0,
        messagesLimit: 100,
        createdAt: new Date().toISOString(),
      };
      
      users.push(newUser);
      localStorage.setItem('vaaniai-users', JSON.stringify(users));
      
      setUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        plan: newUser.plan,
        messagesUsed: newUser.messagesUsed,
        messagesLimit: newUser.messagesLimit,
        createdAt: newUser.createdAt
      });
      localStorage.setItem('vaaniai-user', JSON.stringify(newUser));
      
      return true;
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