import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseChat, ChatSession, Message } from '../hooks/useSupabaseChat';

interface SupabaseChatContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: Message[];
  isTyping: boolean;
  loading: boolean;
  createNewSession: () => Promise<ChatSession | null>;
  switchSession: (session: ChatSession) => void;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearCurrentSession: () => Promise<void>;
}

const SupabaseChatContext = createContext<SupabaseChatContextType | undefined>(undefined);

export const useSupabaseChatContext = () => {
  const context = useContext(SupabaseChatContext);
  if (context === undefined) {
    throw new Error('useSupabaseChatContext must be used within a SupabaseChatProvider');
  }
  return context;
};

interface SupabaseChatProviderProps {
  children: ReactNode;
}

export const SupabaseChatProvider: React.FC<SupabaseChatProviderProps> = ({ children }) => {
  const chat = useSupabaseChat();

  return (
    <SupabaseChatContext.Provider value={chat}>
      {children}
    </SupabaseChatContext.Provider>
  );
};