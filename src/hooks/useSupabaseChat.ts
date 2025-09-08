import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  sender: 'user' | 'bot';
  created_at: string;
}

export const useSupabaseChat = () => {
  const { user, profile, incrementMessageCount } = useSupabaseAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user's chat sessions
  const loadSessions = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
    } else {
      setSessions(data || []);
      
      // Set current session to the most recent one
      if (data && data.length > 0 && !currentSession) {
        setCurrentSession(data[0]);
      }
    }
  }, [user, currentSession]);

  // Load messages for current session
  const loadMessages = useCallback(async () => {
    if (!currentSession) {
      setMessages([]);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', currentSession.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages(data || []);
    }
  }, [currentSession]);

  // Create new chat session
  const createNewSession = async (): Promise<ChatSession | null> => {
    if (!user) return null;

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
      return null;
    }

    setSessions(prev => [data, ...prev]);
    setCurrentSession(data);
    setMessages([]);
    return data;
  };

  // Switch to different session
  const switchSession = (session: ChatSession) => {
    setCurrentSession(session);
  };

  // Update session title
  const updateSessionTitle = async (sessionId: string, title: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId);

    if (!error) {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title } : s
      ));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title } : null);
      }
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (!error) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSession(remainingSessions[0]);
        } else {
          await createNewSession();
        }
      }
    }
  };

  // Send message
  const sendMessage = async (content: string): Promise<void> => {
    if (!user || !profile || !currentSession) return;

    // Check message limit
    if (!await incrementMessageCount()) {
      const limitMessage: Message = {
        id: `temp-${Date.now()}`,
        session_id: currentSession.id,
        user_id: user.id,
        content: "😔 आपकी मासिक संदेश सीमा समाप्त हो गई है। कृपया अपना प्लान अपग्रेड करें। 📈",
        sender: 'bot',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, limitMessage]);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      session_id: currentSession.id,
      user_id: user.id,
      content,
      sender: 'user',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Save user message to database
    const { data: savedUserMessage, error: userError } = await supabase
      .from('messages')
      .insert({
        session_id: currentSession.id,
        user_id: user.id,
        content,
        sender: 'user'
      })
      .select()
      .single();

    if (userError) {
      console.error('Error saving user message:', userError);
      return;
    }

    // Update the temporary message with real ID
    setMessages(prev => prev.map(msg => 
      msg.id === userMessage.id ? savedUserMessage : msg
    ));

    // Auto-update session title if it's the first message
    if (messages.length === 0 && currentSession.title === 'नई चैट') {
      const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
      await updateSessionTitle(currentSession.id, title);
    }

    setIsTyping(true);

    try {
      // Get AI response (using your existing AI service)
      const { aiService } = await import('../services/aiService');
      const aiResponse = await aiService.generateResponse(content, false);
      
      // Add bot message
      const botMessage: Message = {
        id: `temp-bot-${Date.now()}`,
        session_id: currentSession.id,
        user_id: user.id,
        content: aiResponse.message,
        sender: 'bot',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);

      // Save bot message to database
      const { data: savedBotMessage, error: botError } = await supabase
        .from('messages')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          content: aiResponse.message,
          sender: 'bot'
        })
        .select()
        .single();

      if (!botError && savedBotMessage) {
        setMessages(prev => prev.map(msg => 
          msg.id === botMessage.id ? savedBotMessage : msg
        ));
      }

      // Log API usage
      await supabase.rpc('log_api_usage', {
        p_user_id: user.id,
        p_endpoint: 'chat/completions',
        p_model_used: 'openrouter/sonoma-dusk-alpha',
        p_tokens_used: Math.ceil(content.length / 4), // Rough token estimate
        p_response_time: 1000, // Mock response time
        p_status: aiResponse.error ? 'error' : 'success',
        p_error_message: aiResponse.error || null
      });

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: `temp-error-${Date.now()}`,
        session_id: currentSession.id,
        user_id: user.id,
        content: "🙏 क्षमा करें, अभी मैं उत्तर नहीं दे सकता। कृपया पुनः प्रयास करें। 🔄",
        sender: 'bot',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);

      // Save error message
      await supabase
        .from('messages')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          content: errorMessage.content,
          sender: 'bot'
        });
    } finally {
      setIsTyping(false);
    }
  };

  // Clear current session messages
  const clearCurrentSession = async () => {
    if (!currentSession) return;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('session_id', currentSession.id);

    if (!error) {
      setMessages([]);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user || !currentSession) return;

    // Subscribe to new messages in current session
    const messagesSubscription = supabase
      .channel(`messages:${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user, currentSession]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    sessions,
    currentSession,
    messages,
    isTyping,
    loading,
    createNewSession,
    switchSession,
    updateSessionTitle,
    deleteSession,
    sendMessage,
    clearCurrentSession,
  };
};