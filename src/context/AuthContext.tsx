import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    const savedUser = localStorage.getItem('vaaniai-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('vaaniai-user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Mock registration - in real app, this would call an API
    const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
    
    if (users.find((u: any) => u.email === email)) {
      return false; // User already exists
    }

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

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('vaaniai-user', JSON.stringify(userWithoutPassword));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vaaniai-user');
  };

  const updatePlan = (plan: 'free' | 'premium' | 'enterprise') => {
    if (!user) return;

    const limits = {
      free: 100,
      premium: 5000,
      enterprise: 999999
    };

    const updatedUser = {
      ...user,
      plan,
      messagesLimit: limits[plan]
    };

    setUser(updatedUser);
    localStorage.setItem('vaaniai-user', JSON.stringify(updatedUser));

    // Update in users array
    const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], plan, messagesLimit: limits[plan] };
      localStorage.setItem('vaaniai-users', JSON.stringify(users));
    }
  };

  const incrementMessageCount = (): boolean => {
    if (!user) return false;
    
    if (user.messagesUsed >= user.messagesLimit) {
      return false;
    }

    const updatedUser = {
      ...user,
      messagesUsed: user.messagesUsed + 1
    };

    setUser(updatedUser);
    localStorage.setItem('vaaniai-user', JSON.stringify(updatedUser));

    // Update in users array
    const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].messagesUsed = updatedUser.messagesUsed;
      localStorage.setItem('vaaniai-users', JSON.stringify(users));
    }

    return true;
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