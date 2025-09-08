import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, ChatContextType, ChatSession } from '../types';
import { useAuth } from './AuthContext';
import { aiService } from '../services/aiService';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { user, incrementMessageCount } = useAuth();

  // Load chat sessions and history on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('vaaniai-chat-sessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        
        // Load the most recent session or create a new one
        if (parsedSessions.length > 0) {
          const lastSession = parsedSessions[parsedSessions.length - 1];
          setCurrentSessionId(lastSession.id);
          setMessages(lastSession.messages);
        } else {
          createNewSession();
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('vaaniai-chat-sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Update current session messages when messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages, updatedAt: new Date().toISOString() }
          : session
      ));
    }
  }, [messages, currentSessionId]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'नई चैट',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      
      // If we deleted the current session, switch to another one or create new
      if (sessionId === currentSessionId) {
        if (filtered.length > 0) {
          const lastSession = filtered[filtered.length - 1];
          setCurrentSessionId(lastSession.id);
          setMessages(lastSession.messages);
        } else {
          createNewSession();
        }
      }
      
      return filtered;
    });
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title }
        : session
    ));
  };

  const sendMessage = async (text: string): Promise<void> => {
    if (user && !incrementMessageCount()) {
      // Handle message limit exceeded
      const limitMessage: Message = {
        id: Date.now().toString(),
        text: "😔 आपकी मासिक संदेश सीमा समाप्त हो गई है। कृपया अपना प्लान अपग्रेड करें। 📈",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }

    // Auto-generate session title from first message
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length === 0 && currentSession.title === 'नई चैट') {
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
      updateSessionTitle(currentSessionId!, title);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Get AI response using OpenRouter API
      const aiResponse = await aiService.generateResponse(text, !user);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback message in case of error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "🙏 क्षमा करें, अभी मैं उत्तर नहीं दे सकता। कृपया पुनः प्रयास करें। 🔄",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    if (currentSessionId) {
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [], updatedAt: new Date().toISOString() }
          : session
      ));
      setMessages([]);
    }
  };

  const clearAllSessions = () => {
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
    localStorage.removeItem('vaaniai-chat-sessions');
    createNewSession();
  };

  const value: ChatContextType = {
    messages,
    isTyping,
    sessions,
    currentSessionId,
    sendMessage,
    clearChat,
    clearAllSessions,
    createNewSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};