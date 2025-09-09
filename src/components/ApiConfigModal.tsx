import React, { useState, useEffect } from 'react';
import { X, Key, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { aiService } from '../services/aiService';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('openrouter/sonoma-dusk-alpha');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfig();
    }
  }, [isOpen]);

  const loadCurrentConfig = () => {
    const config = aiService.getApiConfig();
    setApiKey(config.openrouter_key || '');
    setSelectedModel(config.selected_model || 'openrouter/sonoma-dusk-alpha');
  };

  const handleSave = () => {
    try {
      aiService.updateApiKey(apiKey);
      aiService.updateSelectedModel(selectedModel);
      setMessage('API कॉन्फ़िगरेशन सफलतापूर्वक सेव हो गई!');
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      setMessage('कॉन्फ़िगरेशन सेव करने में त्रुटि हुई।');
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setMessage('कृपया API Key दर्ज करें।');
      return;
    }

    setIsLoading(true);
    setTestResult(null);
    setMessage('');

    try {
      // Temporarily update the service with new config
      aiService.updateApiKey(apiKey);
      aiService.updateSelectedModel(selectedModel);
      
      const success = await aiService.testConnection();
      
      if (success) {
        setTestResult('success');
        setMessage('API कनेक्शन सफल! ✅');
      } else {
        setTestResult('error');
        setMessage('API कनेक्शन असफल। कृपया API Key जांचें। ❌');
      }
    } catch (error) {
      setTestResult('error');
      setMessage('API टेस्ट में त्रुटि हुई।');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Key className="h-5 w-5 mr-2 text-whatsapp-primary" />
            API कॉन्फ़िगरेशन
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">🔑 OpenRouter API Key</h3>
            <p className="text-sm text-blue-800 mb-2">
              तेज़ चैट के लिए अपनी OpenRouter API key दर्ज करें:
            </p>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter.ai</a> पर जाएं</li>
              <li>2. साइन अप करें और API key बनाएं</li>
              <li>3. यहाँ API key पेस्ट करें</li>
            </ol>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
            >
              <option value="openrouter/sonoma-dusk-alpha">Sonoma Dusk Alpha (Fast)</option>
              <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
              <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
              <option value="google/gemini-flash-1.5">Gemini Flash 1.5</option>
            </select>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg ${
              testResult === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : testResult === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleTest}
              disabled={isLoading || !apiKey.trim()}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span>{isLoading ? 'टेस्ट हो रहा है...' : 'टेस्ट करें'}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 flex items-center justify-center space-x-2 bg-whatsapp-primary text-white px-4 py-2 rounded-lg hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>सेव करें</span>
            </button>
          </div>

          {/* Demo Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              💡 <strong>डेमो मोड:</strong> API key के बिना भी आप चैट कर सकते हैं, लेकिन AI responses नहीं मिलेंगे।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigModal;