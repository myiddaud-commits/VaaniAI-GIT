export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'premium' | 'enterprise';
  messagesUsed: number;
  messagesLimit: number;
  createdAt: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePlan: (plan: 'free' | 'premium' | 'enterprise') => void;
  incrementMessageCount: () => boolean;
}

export interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  sendMessage: (text: string, imageFile?: File) => Promise<void>;
  clearChat: () => void;
  clearAllSessions: () => void;
  createNewSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
}

export interface Plan {
  id: 'free' | 'premium' | 'enterprise';
  name: string;
  price: string;
  messages: string;
  features: string[];
  popular?: boolean;
}