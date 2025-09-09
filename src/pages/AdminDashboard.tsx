import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  DollarSign, 
  Activity, 
  Settings, 
  Key, 
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { aiService } from '../services/aiService';

interface AdminStats {
  totalUsers: number;
  totalMessages: number;
  freeUsers: number;
  premiumUsers: number;
  enterpriseUsers: number;
  activeUsers: number;
  revenue: number;
  apiCalls: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
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

  // API Configuration State
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('openrouter/sonoma-dusk-alpha');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check admin authentication
    const isAdminAuth = localStorage.getItem('vaaniai-admin-auth');
    if (!isAdminAuth) {
      navigate('/admin/login');
      return;
    }

    loadStats();
    loadApiConfig();
  }, [navigate]);

  const loadStats = () => {
    // Mock stats for demo
    setStats({
      totalUsers: 1250,
      totalMessages: 45680,
      freeUsers: 1100,
      premiumUsers: 120,
      enterpriseUsers: 30,
      activeUsers: 890,
      revenue: 185000,
      apiCalls: 91360
    });
  };

  const loadApiConfig = () => {
    const config = aiService.getApiConfig();
    setApiKey(config.openrouter_key || '');
    setSelectedModel(config.selected_model || 'openrouter/sonoma-dusk-alpha');
  };

  const handleSaveApiConfig = async () => {
    setIsLoading(true);
    setMessage('');
    setTestResult(null);

    try {
      // Save to local storage
      aiService.updateApiKey(apiKey);
      aiService.updateSelectedModel(selectedModel);
      
      setMessage('✅ API कॉन्फ़िगरेशन सफलतापूर्वक सेव हो गई!');
      setTestResult('success');
      
      setTimeout(() => {
        setMessage('');
        setTestResult(null);
      }, 3000);
    } catch (error) {
      setMessage('❌ कॉन्फ़िगरेशन सेव करने में त्रुटि हुई।');
      setTestResult('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestApi = async () => {
    if (!apiKey.trim()) {
      setMessage('⚠️ कृपया API Key दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    setMessage('🔄 API कनेक्शन टेस्ट हो रहा है...');

    try {
      // Temporarily update the service with new config
      aiService.updateApiKey(apiKey);
      aiService.updateSelectedModel(selectedModel);
      
      const success = await aiService.testConnection();
      
      if (success) {
        setTestResult('success');
        setMessage('✅ API कनेक्शन सफल! सब कुछ काम कर रहा है।');
      } else {
        setTestResult('error');
        setMessage('❌ API कनेक्शन असफल। कृपया API Key जांचें।');
      }
    } catch (error) {
      setTestResult('error');
      setMessage('❌ API टेस्ट में त्रुटि हुई।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vaaniai-admin-auth');
    navigate('/admin/login');
  };

  const tabs = [
    { id: 'overview', label: 'ओवरव्यू', icon: Activity },
    { id: 'api', label: 'API सेटिंग्स', icon: Key }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Settings className="h-8 w-8 text-red-600" />
              <h1 className="text-xl font-bold text-gray-900">VaaniAI एडमिन पैनल</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              लॉगआउट
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">सिस्टम ओवरव्यू</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">कुल उपयोगकर्ता</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">कुल संदेश</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">कुल आय</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">API कॉल्स</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.apiCalls.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">प्लान वितरण</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{stats.freeUsers}</p>
                  <p className="text-sm text-gray-600">मुफ़्त उपयोगकर्ता</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.premiumUsers}</p>
                  <p className="text-sm text-gray-600">प्रीमियम उपयोगकर्ता</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.enterpriseUsers}</p>
                  <p className="text-sm text-gray-600">एंटरप्राइज़ उपयोगकर्ता</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Settings Tab */}
        {activeTab === 'api' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">API कॉन्फ़िगरेशन</h2>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">🔑 Local Storage API Configuration</h3>
                <p className="text-sm text-blue-800 mb-2">
                  यह कॉन्फ़िगरेशन केवल Local Storage में सेव होती है। तेज़ और सुरक्षित।
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• OpenRouter API key यहाँ सेट करें</li>
                  <li>• Sonoma Dusk Alpha model vision और text दोनों support करता है</li>
                  <li>• सभी changes तुरंत apply होते हैं</li>
                  <li>• कोई database dependency नहीं</li>
                </ul>
              </div>

              {/* API Key Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model (Vision + Text Support)
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="openrouter/sonoma-dusk-alpha">Sonoma Dusk Alpha (Recommended - Fast + Vision)</option>
                  <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo (Text Only)</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                  <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                  <option value="google/gemini-flash-1.5">Gemini Flash 1.5</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Sonoma Dusk Alpha सबसे तेज़ है और image analysis भी करता है
                </p>
              </div>

              {/* Status Message */}
              {message && (
                <div className={`mb-6 p-3 rounded-lg ${
                  testResult === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : testResult === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <div className="flex items-center">
                    {testResult === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
                    {testResult === 'error' && <XCircle className="h-5 w-5 mr-2" />}
                    <span>{message}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleTestApi}
                  disabled={isLoading || !apiKey.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : testResult === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : testResult === 'error' ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  <span>{isLoading ? 'टेस्ट हो रहा है...' : 'API टेस्ट करें'}</span>
                </button>

                <button
                  onClick={handleSaveApiConfig}
                  disabled={!apiKey.trim() || isLoading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>सेव करें</span>
                </button>
              </div>

              {/* Current Status */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">वर्तमान स्थिति:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>API Key:</strong> {apiKey ? `${apiKey.substring(0, 20)}...` : 'Not Set'}</p>
                  <p><strong>Model:</strong> {selectedModel}</p>
                  <p><strong>Storage:</strong> Local Storage (Browser)</p>
                  <p><strong>Status:</strong> {testResult === 'success' ? '✅ Working' : testResult === 'error' ? '❌ Error' : '⚪ Not Tested'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;