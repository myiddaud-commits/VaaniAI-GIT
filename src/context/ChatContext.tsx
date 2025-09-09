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

  // Load user's chat sessions from localStorage
  const loadSessions = async () => {
    try {
      const savedSessions = localStorage.getItem('vaaniai-chat-sessions');
      const formattedSessions: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];

      setSessions(formattedSessions);
      
      // Set current session to the most recent one
      if (formattedSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(formattedSessions[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    }
  };

  // Load messages for current session from localStorage
  const loadMessages = async () => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    try {
      const currentSession = sessions.find(s => s.id === currentSessionId);
      const formattedMessages: Message[] = currentSession?.messages || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  // Save sessions to localStorage
  const saveSessions = (updatedSessions: ChatSession[]) => {
    try {
      localStorage.setItem('vaaniai-chat-sessions', JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  };
  // Create new chat session
  const createNewSession = async () => {
    try {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'नई चैट',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedSessions = [newSession, ...sessions];
      saveSessions(updatedSessions);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  // Switch to different session
  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  // Update session title
  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      const updatedSessions = sessions.map(session => 
        session.id === sessionId ? { ...session, title, updatedAt: new Date().toISOString() } : session
      );
      saveSessions(updatedSessions);
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    try {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      saveSessions(updatedSessions);
      
      if (sessionId === currentSessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id);
        } else {
          await createNewSession();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Send message
  const sendMessage = async (text: string, imageFile?: File): Promise<void> => {
    if (!currentSessionId) {
      return;
    }

    // Check message limit for authenticated users
    if (user && !await incrementMessageCount()) {
      const limitMessage: Message = {
        id: Date.now().toString(),
        text: "😔 आपकी मासिक संदेश सीमा समाप्त हो गई है। कृपया अपना प्लान अपग्रेड करें। 📈",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, limitMessage]);
      
      // Update session with new message
      const updatedSessions = sessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...(session.messages || []), limitMessage], updatedAt: new Date().toISOString() }
          : session
      );
      saveSessions(updatedSessions);
      return;
    }

    let messageContent = text;
    let imageUrl = imageFile ? '' : undefined;
    let imageBase64 = '';
    
    // Handle image if provided
    if (imageFile) {
      try {
        // Convert image to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        
        imageUrl = await base64Promise;
        imageBase64 = imageUrl.split(',')[1];
        
        // Update message content to indicate image was sent
        messageContent = text || 'इमेज भेजी गई';
      } catch (error) {
        console.error('Error processing image:', error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: "❌ इमेज प्रोसेसिंग में त्रुटि हुई। कृपया पुनः प्रयास करें।",
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
    }

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      text: text || 'इमेज भेजी गई',
      sender: 'user',
      timestamp: new Date().toISOString(),
      imageUrl: imageUrl || undefined,
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      // Auto-update session title if it's the first message
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession && currentSession.messages.length === 0) {
        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (currentSession && currentSession.title === 'नई चैट') {
          const title = imageFile ? 
            (text ? `${text.substring(0, 20)}... (इमेज)` : 'इमेज चैट') :
            (text.length > 30 ? text.substring(0, 30) + '...' : text);
          await updateSessionTitle(currentSessionId, title);
        }
      }

      setIsTyping(true);

      // Get AI response - use image analysis if image is present
      const aiResponse = imageBase64 ? 
        await aiService.analyzeImage(imageBase64, text) :
        await aiService.generateResponse(text || '', false);
      
      // Add bot message to UI
      const tempBotMessage: Message = {
        id: `temp-bot-${Date.now()}`,
        text: aiResponse.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, tempBotMessage]);

      // Update session with both messages
      const updatedSessions = sessions.map(session => 
        session.id === currentSessionId 
          ? { 
              ...session, 
              messages: [...(session.messages || []), userMessage, botMessage], 
              updatedAt: new Date().toISOString() 
            }
          : session
      );
      saveSessions(updatedSessions);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "🙏 क्षमा करें, अभी मैं उत्तर नहीं दे सकता। कृपया पुनः प्रयास करें। 🔄",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      // Update session with error message
      const updatedSessions = sessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...(session.messages || []), errorMessage], updatedAt: new Date().toISOString() }
          : session
      );
      saveSessions(updatedSessions);
    } finally {
      setIsTyping(false);
    }
  };

  // Clear current session messages
  const clearChat = async () => {
    if (!currentSessionId) return;

    try {
      const updatedSessions = sessions.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [], updatedAt: new Date().toISOString() }
          : session
      );
      saveSessions(updatedSessions);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  // Clear all sessions
  const clearAllSessions = async () => {
    try {
      localStorage.removeItem('vaaniai-chat-sessions');
      saveSessions([]);
      setMessages([]);
      setCurrentSessionId(null);
      await createNewSession();
    } catch (error) {
      console.error('Error clearing all sessions:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    loadMessages();
  }, [currentSessionId]);

  // Create initial session if none exists
  useEffect(() => {
    if (sessions.length === 0 && !currentSessionId) {
      createNewSession();
    }
  }, [sessions.length, currentSessionId]);

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