import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { AdminStats, ApiConfig } from '../types/admin';

interface AdminContextType {
  // User management
  getUsers: () => User[];
  updateUserPlan: (userId: string, plan: 'free' | 'premium' | 'enterprise') => void;
  deleteUser: (userId: string) => void;
  
  // API configuration
  getApiConfig: () => ApiConfig;
  updateApiConfig: (config: ApiConfig) => void;
  
  // Statistics
  getStats: () => AdminStats;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const getUsers = (): User[] => {
    return JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
  };

  const updateUserPlan = (userId: string, plan: 'free' | 'premium' | 'enterprise') => {
    const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex !== -1) {
      const limits = {
        free: 100,
        premium: 5000,
        enterprise: 999999
      };
      users[userIndex] = { ...users[userIndex], plan, messagesLimit: limits[plan] };
      localStorage.setItem('vaaniai-users', JSON.stringify(users));
      
      // Update current user if it's the same user
      const currentUser = JSON.parse(localStorage.getItem('vaaniai-user') || 'null');
      if (currentUser && currentUser.id === userId) {
        const updatedCurrentUser = { ...currentUser, plan, messagesLimit: limits[plan] };
        localStorage.setItem('vaaniai-user', JSON.stringify(updatedCurrentUser));
      }
    }
  };

  const deleteUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
    const filteredUsers = users.filter((u: any) => u.id !== userId);
    localStorage.setItem('vaaniai-users', JSON.stringify(filteredUsers));
  };

  const getApiConfig = (): ApiConfig => {
    const saved = localStorage.getItem('vaaniai-api-config');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Return default config if none exists
    return {
      openaiKey: '',
      geminiKey: '',
      claudeKey: '',
      rateLimit: 100,
      maxTokens: 4000,
      temperature: 0.7
    };
  };

  const updateApiConfig = (config: ApiConfig) => {
    localStorage.setItem('vaaniai-api-config', JSON.stringify(config));
    
    // Update the AI service with new API key
    import('../services/aiService').then(({ aiService }) => {
      if (config.openaiKey) {
        aiService.updateApiKey(config.openaiKey);
      }
    });
  };

  const getStats = (): AdminStats => {
    const users = getUsers();
    const chatSessions = JSON.parse(localStorage.getItem('vaaniai-chat-sessions') || '[]');
    const totalMessages = chatSessions.reduce((total: number, session: any) => {
      return total + (session.messages ? session.messages.length : 0);
    }, 0);

    const freeUsers = users.filter(user => user.plan === 'free').length;
    const premiumUsers = users.filter(user => user.plan === 'premium').length;
    const enterpriseUsers = users.filter(user => user.plan === 'enterprise').length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = users.filter(user => {
      const userCreated = new Date(user.createdAt);
      return userCreated >= sevenDaysAgo;
    }).length;

    const revenue = (premiumUsers * 499) + (enterpriseUsers * 2000);
    const apiCalls = totalMessages * 2;

    return {
      totalUsers: users.length,
      totalMessages,
      freeUsers,
      premiumUsers,
      enterpriseUsers,
      activeUsers,
      revenue,
      apiCalls
    };
  };

  const value: AdminContextType = {
    getUsers,
    updateUserPlan,
    deleteUser,
    getApiConfig,
    updateApiConfig,
    getStats,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};