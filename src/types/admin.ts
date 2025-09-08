export interface AdminStats {
  totalUsers: number;
  totalMessages: number;
  freeUsers: number;
  premiumUsers: number;
  enterpriseUsers: number;
  activeUsers: number;
  revenue: number;
  apiCalls: number;
}

export interface ApiConfig {
  openaiKey: string;
  geminiKey: string;
  claudeKey: string;
  rateLimit: number;
  maxTokens: number;
  temperature: number;
}

export interface PricingPlan {
  id: 'free' | 'premium' | 'enterprise';
  name: string;
  nameHindi: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  messagesLimit: number;
  features: string[];
  featuresHindi: string[];
  isActive: boolean;
  isPopular: boolean;
  customFeatures?: {
    apiAccess: boolean;
    prioritySupport: boolean;
    customIntegration: boolean;
    analytics: boolean;
    whiteLabel: boolean;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  amount: number;
  paymentMethod: string;
  nextBilling?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  date: string;
  plan: string;
  paymentMethod: string;
  invoiceNumber: string;
}

export interface Analytics {
  date: string;
  users: number;
  messages: number;
  revenue: number;
  apiCalls: number;
  errors: number;
}

export interface ApiUsage {
  userId: string;
  userName: string;
  endpoint: string;
  calls: number;
  lastUsed: string;
  status: 'active' | 'blocked';
}