import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  MessageSquare, 
  DollarSign, 
  Settings, 
  BarChart3, 
  Shield,
  LogOut,
  Menu,
  X,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Copy,
  Calendar,
  User,
  Bot,
  MoreHorizontal,
  Package,
  Star,
  Activity
} from 'lucide-react';
import { AdminStats, ApiConfig, PricingPlan, Subscription, Invoice, Analytics, ApiUsage } from '../types/admin';
import { User as UserType } from '../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // User management states
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'premium' | 'enterprise'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'plan' | 'createdAt' | 'messagesUsed'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Message management states
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [messageFilterSender, setMessageFilterSender] = useState<'all' | 'user' | 'bot'>('all');
  const [messageFilterDate, setMessageFilterDate] = useState('');
  const [messageSortBy, setMessageSortBy] = useState<'timestamp' | 'sender' | 'length'>('timestamp');
  const [messageSortOrder, setMessageSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [messageStats, setMessageStats] = useState({
    totalMessages: 0,
    userMessages: 0,
    botMessages: 0,
    avgMessageLength: 0,
    todayMessages: 0,
    weekMessages: 0,
    monthMessages: 0
  });

  // Load API config from Supabase
  const loadApiConfig = () => {
    supabase
      .from('api_configs')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setApiConfig({
            openaiKey: data.openai_key || '',
            geminiKey: data.gemini_key || '',
            claudeKey: data.claude_key || '',
            rateLimit: data.rate_limit,
            maxTokens: data.max_tokens,
            temperature: data.temperature
          });
        }
      })
      .catch(error => console.error('Error loading API config:', error));
  };

  // Check admin authentication
  useEffect(() => {
    const isAdminAuth = localStorage.getItem('vaaniai-admin-auth');
    if (!isAdminAuth) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Live data from localStorage
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMessages: 0,
    freeUsers: 0,
    premiumUsers: 0,
    enterpriseUsers: 0,
    activeUsers: 0,
    revenue: 0,
    apiCalls: 0
  });

  // Load live data from Supabase
  const loadLiveData = () => {
    Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('messages').select('*'),
      supabase.from('api_usage_logs').select('*')
    ]).then(([usersResult, messagesResult, apiLogsResult]) => {
      const users = usersResult.data || [];
      const messages = messagesResult.data || [];
      const apiLogs = apiLogsResult.data || [];

      // Calculate user distribution
      const freeUsers = users.filter(user => user.plan === 'free').length;
      const premiumUsers = users.filter(user => user.plan === 'premium').length;
      const enterpriseUsers = users.filter(user => user.plan === 'enterprise').length;

      // Calculate active users (users who have sent messages in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = users.filter(user => {
        const userCreated = new Date(user.created_at);
        return userCreated >= sevenDaysAgo;
      }).length;

      // Calculate revenue (premium users * 499 + enterprise users * 2000)
      const revenue = (premiumUsers * 499) + (enterpriseUsers * 2000);

      setStats({
        totalUsers: users.length,
        totalMessages: messages.length,
        freeUsers,
        premiumUsers,
        enterpriseUsers,
        activeUsers,
        revenue,
        apiCalls: apiLogs.length
      });
    }).catch(error => {
      console.error('Error loading live data:', error);
      // Fallback to localStorage if Supabase fails
      try {
        const users: UserType[] = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
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

        setStats({
          totalUsers: users.length,
          totalMessages,
          freeUsers,
          premiumUsers,
          enterpriseUsers,
          activeUsers,
          revenue,
          apiCalls
        });
      } catch (localError) {
        console.error('Error loading fallback data:', localError);
      }
    });
  };

  // Load users from Supabase
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        // Fallback to localStorage
        const localUsers: UserType[] = JSON.parse(localStorage.getItem('vaaniai-users') || '[]');
        setUsers(localUsers);
        return;
      }

      const formattedUsers: UserType[] = data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        messagesUsed: user.messages_used,
        messagesLimit: user.messages_limit,
        createdAt: user.created_at
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  // Load messages from Supabase
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          chat_sessions (
            id,
            title,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error loading messages:', error);
        // Fallback to localStorage
        const chatSessions = JSON.parse(localStorage.getItem('vaaniai-chat-sessions') || '[]');
        const allMessages: any[] = [];
        
        chatSessions.forEach((session: any) => {
          if (session.messages && Array.isArray(session.messages)) {
            session.messages.forEach((message: any) => {
              allMessages.push({
                ...message,
                sessionId: session.id,
                sessionTitle: session.title,
                sessionCreatedAt: session.createdAt
              });
            });
          }
        });
        
        setAllMessages(allMessages);
        calculateMessageStats(allMessages);
        return;
      }

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender,
        timestamp: msg.created_at,
        sessionId: msg.session_id,
        sessionTitle: msg.chat_sessions?.title || 'Unknown Session',
        sessionCreatedAt: msg.chat_sessions?.created_at || msg.created_at
      }));

      setAllMessages(formattedMessages);
      calculateMessageStats(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setAllMessages([]);
    }
  };

  // Update user plan in Supabase
  const updateUserPlan = async (userId: string, plan: 'free' | 'premium' | 'enterprise') => {
    const limits = {
      free: 100,
      premium: 5000,
      enterprise: 999999
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan, 
          messages_limit: limits[plan] 
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user plan:', error);
        return;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, plan, messagesLimit: limits[plan] }
          : user
      ));
      
      loadLiveData(); // Refresh stats
    } catch (error) {
      console.error('Error updating user plan:', error);
    }
  };

  // Delete user from Supabase
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user:', error);
        return;
      }

      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      loadLiveData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Reset user messages in Supabase
  const resetUserMessages = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ messages_used: 0 })
        .eq('id', userId);

      if (error) {
        console.error('Error resetting user messages:', error);
        return;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, messagesUsed: 0 }
          : user
      ));
    } catch (error) {
      console.error('Error resetting user messages:', error);
    }
  };

  // Load data on component mount and set up refresh interval
  useEffect(() => {
    loadLiveData();
    loadUsers();
    loadMessages();
    loadApiConfig();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadLiveData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate message statistics
  const calculateMessageStats = (allMessages: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const userMessages = allMessages.filter(m => m.sender === 'user');
    const botMessages = allMessages.filter(m => m.sender === 'bot');
    const todayMessages = allMessages.filter(m => new Date(m.timestamp) >= today);
    const weekMessages = allMessages.filter(m => new Date(m.timestamp) >= weekAgo);
    const monthMessages = allMessages.filter(m => new Date(m.timestamp) >= monthAgo);
    
    const avgLength = allMessages.length > 0 
      ? allMessages.reduce((sum, m) => sum + m.text.length, 0) / allMessages.length 
      : 0;
    
    setMessageStats({
      totalMessages: allMessages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length,
      avgMessageLength: Math.round(avgLength),
      todayMessages: todayMessages.length,
      weekMessages: weekMessages.length,
      monthMessages: monthMessages.length
    });
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
      return matchesSearch && matchesPlan;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    openaiKey: '', // Keep for backward compatibility
    geminiKey: '', // Keep for backward compatibility  
    claudeKey: '', // Keep for backward compatibility
    rateLimit: 100,
    maxTokens: 4000,
    temperature: 0.7
  });

  const [openRouterConfig, setOpenRouterConfig] = useState({
    apiKey: '',
    selectedModel: 'openrouter/sonoma-dusk-alpha'
  });

  // Save API config to Supabase
  const saveApiConfig = async () => {
    try {
      // First, try to update existing config
      const { data: existingConfig } = await supabase
        .from('api_configs')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existingConfig) {
        // Update existing config
        const { error } = await supabase
          .from('api_configs')
          .update({
            openrouter_key: openRouterConfig.apiKey,
            selected_model: openRouterConfig.selectedModel,
            rate_limit: apiConfig.rateLimit,
            max_tokens: apiConfig.maxTokens,
            temperature: apiConfig.temperature
          })
          .eq('id', existingConfig.id);

        if (error) {
          throw error;
        }
      } else {
        // Insert new config
        const { error } = await supabase
          .from('api_configs')
          .insert({
            openrouter_key: openRouterConfig.apiKey,
            selected_model: openRouterConfig.selectedModel,
            rate_limit: apiConfig.rateLimit,
            max_tokens: apiConfig.maxTokens,
            temperature: apiConfig.temperature
          });

        if (error) {
          throw error;
        }
      }

      // Update AI service with new API key
      if (openRouterConfig.apiKey) {
        const { aiService } = await import('../services/aiService');
        aiService.updateApiKey(openRouterConfig.apiKey);
      }

      alert('API configuration saved successfully to Supabase!');
    } catch (error) {
      console.error('Error saving API config:', error);
      alert('Error saving API configuration to Supabase!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vaaniai-admin-auth');
    navigate('/admin/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'api', label: 'API Config', icon: Settings }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <button
          onClick={loadLiveData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-600">Active: {stats.activeUsers}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-blue-600">API Calls: {stats.apiCalls}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.revenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-purple-600">Premium: {stats.premiumUsers}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Plan Distribution</p>
              <p className="text-2xl font-bold text-gray-900">{stats.freeUsers + stats.premiumUsers + stats.enterpriseUsers}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-2 flex items-center text-sm space-x-2">
            <span className="text-gray-600">Free: {stats.freeUsers}</span>
            <span className="text-blue-600">Premium: {stats.premiumUsers}</span>
            <span className="text-purple-600">Enterprise: {stats.enterpriseUsers}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {users.slice(0, 5).map(user => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getPlanColor(user.plan)}`}>
                  {user.plan}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Today</span>
              <span className="text-sm font-medium">{messageStats.todayMessages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="text-sm font-medium">{messageStats.weekMessages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-sm font-medium">{messageStats.monthMessages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">User Messages</span>
              <span className="text-sm font-medium">{messageStats.userMessages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bot Messages</span>
              <span className="text-sm font-medium">{messageStats.botMessages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Length</span>
              <span className="text-sm font-medium">{messageStats.avgMessageLength} chars</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(filteredUsers, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `vaaniai-users-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="plan">Plan</option>
              <option value="messagesUsed">Messages Used</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPlanColor(user.plan)}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.messagesUsed} / {user.messagesLimit === 999999 ? '∞' : user.messagesLimit}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${user.messagesLimit === 999999 ? 0 : Math.min((user.messagesUsed / user.messagesLimit) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.plan}
                        onChange={(e) => updateUserPlan(user.id, e.target.value as any)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      <button
                        onClick={() => resetUserMessages(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Reset Messages"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterPlan !== 'all' ? 'Try adjusting your filters.' : 'No users have registered yet.'}
          </p>
        </div>
      )}
    </div>
  );

  const renderMessages = () => {
    const messages = allMessages
      .filter(message => {
        const matchesSearch = message.text.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                             message.sessionTitle.toLowerCase().includes(messageSearchTerm.toLowerCase());
        const matchesSender = messageFilterSender === 'all' || message.sender === messageFilterSender;
        const matchesDate = !messageFilterDate || 
                         new Date(message.timestamp).toDateString() === new Date(messageFilterDate).toDateString();
        return matchesSearch && matchesSender && matchesDate;
      })
      .slice(0, 100);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Message Management</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(messages, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `vaaniai-messages-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Message Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-xl font-bold text-gray-900">{messageStats.totalMessages}</p>
              </div>
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Messages</p>
                <p className="text-xl font-bold text-gray-900">{messageStats.userMessages}</p>
              </div>
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bot Messages</p>
                <p className="text-xl font-bold text-gray-900">{messageStats.botMessages}</p>
              </div>
              <Bot className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-xl font-bold text-gray-900">{messageStats.todayMessages}</p>
              </div>
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    placeholder="Search messages..."
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                <select
                  value={messageFilterSender}
                  onChange={(e) => setMessageFilterSender(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Senders</option>
                  <option value="user">User</option>
                  <option value="bot">Bot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={messageFilterDate}
                  onChange={(e) => setMessageFilterDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        message.sender === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {message.sender === 'user' ? '👤 User' : '🤖 Bot'}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
                      <span className="text-xs text-gray-400">Session: {message.sessionTitle}</span>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2">{message.text}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      Length: {message.text.length} characters
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allMessages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
              <p className="mt-1 text-sm text-gray-500">No messages have been sent yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderApiConfig = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">API Configuration</h1>
        <button
          onClick={saveApiConfig}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          <span>Save Config</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">OpenRouter Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OpenRouter API Key</label>
            <div className="relative">
              <input
                type={showApiKeys ? 'text' : 'password'}
                value={openRouterConfig.apiKey}
                onChange={(e) => setOpenRouterConfig({ ...openRouterConfig, apiKey: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-or-v1-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKeys(!showApiKeys)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showApiKeys ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selected Model</label>
            <select
              value={openRouterConfig.selectedModel}
              onChange={(e) => setOpenRouterConfig({ ...openRouterConfig, selectedModel: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="openrouter/sonoma-dusk-alpha">Sonoma Dusk Alpha (Recommended)</option>
              <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
              <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="openai/gpt-4">GPT-4</option>
              <option value="google/gemini-pro">Gemini Pro</option>
              <option value="meta-llama/llama-2-70b-chat">Llama 2 70B</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose the AI model for chat responses. Sonoma Dusk Alpha is optimized for Hindi conversations.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (per minute)</label>
            <input
              type="number"
              value={apiConfig.rateLimit}
              onChange={(e) => setApiConfig({ ...apiConfig, rateLimit: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
            <input
              type="number"
              value={apiConfig.maxTokens}
              onChange={(e) => setApiConfig({ ...apiConfig, maxTokens: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              max="8000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input
              type="number"
              step="0.1"
              value={apiConfig.temperature}
              onChange={(e) => setApiConfig({ ...apiConfig, temperature: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">OpenRouter Status</span>
            <span className={`flex items-center text-sm ${openRouterConfig.apiKey ? 'text-green-600' : 'text-red-600'}`}>
              {openRouterConfig.apiKey ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Not Configured
                </>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Model</span>
            <span className="text-sm text-gray-500">
              {openRouterConfig.selectedModel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rate Limiting</span>
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Enabled
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last API Call</span>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-red-500" />
            {isSidebarOpen && <span className="text-xl font-bold">VaaniAI Admin</span>}
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'messages' && renderMessages()}
          {activeTab === 'api' && renderApiConfig()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;