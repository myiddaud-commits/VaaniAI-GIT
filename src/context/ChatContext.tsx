import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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

  // Load user's chat sessions
  const loadSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }

      const formattedSessions: ChatSession[] = data.map(session => ({
        id: session.id,
        title: session.title,
        messages: [],
        createdAt: session.created_at,
        updatedAt: session.updated_at
      }));

      setSessions(formattedSessions);
      
      // Set current session to the most recent one
      if (formattedSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(formattedSessions[0].id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Load messages for current session
  const loadMessages = async () => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender,
        timestamp: msg.created_at
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Create new chat session
  const createNewSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'नई चैट'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      const newSession: ChatSession = {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setSessions(prev => [newSession, ...prev]);
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
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session title:', error);
        return;
      }

      setSessions(prev => prev.map(session => 
        session.id === sessionId ? { ...session, title } : session
      ));
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting session:', error);
        return;
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (sessionId === currentSessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          await createNewSession();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Send message
  const sendMessage = async (text: string, imageFile?: File, imageUrl?: string): Promise<void> => {
    if (!user || !currentSessionId) {
      return;
    }

    // Check message limit for authenticated users
    if (!await incrementMessageCount()) {
      const limitMessage: Message = {
        id: Date.now().toString(),
        text: "😔 आपकी मासिक संदेश सीमा समाप्त हो गई है। कृपया अपना प्लान अपग्रेड करें। 📈",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }

    let messageContent = text;
    let imageBase64 = '';
    
    // Handle image if provided
    if (imageFile) {
      try {
        // Extract base64 from the uploaded image URL
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
      text: messageContent,
      sender: 'user',
      timestamp: new Date().toISOString(),
      imageUrl: imageUrl || undefined,
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      // Save user message to database
      const { data: savedUserMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          session_id: currentSessionId,
          user_id: user.id,
          content: messageContent,
          sender: 'user',
          image_url: imageUrl || null
        })
        .select()
        .single();

      if (userError) {
        console.error('Error saving user message:', userError);
        return;
      }

      // Update the temporary message with real data
      setMessages(prev => prev.map(msg => 
        msg.id === tempUserMessage.id 
          ? { ...msg, id: savedUserMessage.id, imageUrl: savedUserMessage.image_url }
          : msg
      ));

      // Auto-update session title if it's the first message
      if (messages.length === 0) {
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
        await aiService.generateResponse(text, false);
      
      // Add bot message to UI
      const tempBotMessage: Message = {
        id: `temp-bot-${Date.now()}`,
        text: aiResponse.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, tempBotMessage]);

      // Save bot message to database
      const { data: savedBotMessage, error: botError } = await supabase
        .from('messages')
        .insert({
          session_id: currentSessionId,
          user_id: user.id,
          content: aiResponse.message,
          sender: 'bot'
        })
        .select()
        .single();

      if (!botError && savedBotMessage) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempBotMessage.id 
            ? { ...msg, id: savedBotMessage.id }
            : msg
        ));
      }

      // Log API usage
      await supabase
        .from('api_usage_logs')
        .insert({
          user_id: user.id,
          endpoint: imageBase64 ? 'vision/analyze' : 'chat/completions',
          model_used: imageBase64 ? 'openai/gpt-4o-mini' : 'openrouter/sonoma-dusk-alpha',
          tokens_used: Math.ceil((text || messageContent).length / 4),
          response_time: 1000,
          status: aiResponse.error ? 'error' : 'success',
          error_message: aiResponse.error || null
        });

    } catch (error) {
      console.error('Error in sendMessage:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "🙏 क्षमा करें, अभी मैं उत्तर नहीं दे सकता। कृपया पुनः प्रयास करें। 🔄",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Clear current session messages
  const clearChat = async () => {
    if (!currentSessionId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('session_id', currentSessionId);

      if (error) {
        console.error('Error clearing chat:', error);
        return;
      }

      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  // Clear all sessions
  const clearAllSessions = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing all sessions:', error);
        return;
      }

      setSessions([]);
      setMessages([]);
      setCurrentSessionId(null);
      await createNewSession();
    } catch (error) {
      console.error('Error clearing all sessions:', error);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !currentSessionId) return;

    // Subscribe to new messages in current session
    const messagesSubscription = supabase
      .channel(`messages:${currentSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${currentSessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          const formattedMessage: Message = {
            id: newMessage.id,
            text: newMessage.content,
            sender: newMessage.sender,
            timestamp: newMessage.created_at
          };
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === formattedMessage.id)) {
              return prev;
            }
            return [...prev, formattedMessage];
          });
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user, currentSessionId]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    loadMessages();
  }, [currentSessionId]);

  // Create initial session if none exists
  useEffect(() => {
    if (user && sessions.length === 0 && !currentSessionId) {
      createNewSession();
    }
  }, [user, sessions.length, currentSessionId]);

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