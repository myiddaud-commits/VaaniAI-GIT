import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, User, Bot, AlertCircle, Plus, MessageSquare, Edit2, X, Menu, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Link } from 'react-router-dom';

const ChatPage: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [guestMessages, setGuestMessages] = useState(5);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { 
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
    updateSessionTitle 
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Load guest messages from localStorage
    if (!user) {
      const today = new Date().toDateString();
      const savedData = localStorage.getItem('vaaniai-guest-data');
      
      if (savedData) {
        const guestData = JSON.parse(savedData);
        if (guestData.date === today) {
          setGuestMessages(guestData.remaining);
        } else {
          // New day, reset to 20 messages
          setGuestMessages(20);
          localStorage.setItem('vaaniai-guest-data', JSON.stringify({
            date: today,
            remaining: 20
          }));
        }
      } else {
        // First time, set to 20 messages
        setGuestMessages(20);
        localStorage.setItem('vaaniai-guest-data', JSON.stringify({
          date: today,
          remaining: 20
        }));
      }
    }
  }, [user]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('chat-sidebar');
      const menuButton = document.getElementById('menu-button');
      
      if (isSidebarOpen && sidebar && !sidebar.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Check guest message limit
    if (!user && guestMessages <= 0) {
      return;
    }

    // Decrement guest messages if not logged in
    if (!user) {
      const newGuestMessages = guestMessages - 1;
      setGuestMessages(newGuestMessages);
      const today = new Date().toDateString();
      localStorage.setItem('vaaniai-guest-data', JSON.stringify({
        date: today,
        remaining: newGuestMessages
      }));
    }

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
    
    // Close sidebar on mobile after sending message
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleEditTitle = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = () => {
    if (editingSessionId && editingTitle.trim()) {
      updateSessionTitle(editingSessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('hi-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const usagePercentage = user ? (user.messagesUsed / user.messagesLimit) * 100 : ((20 - guestMessages) / 20) * 100;
  const isNearLimit = user ? usagePercentage >= 80 : guestMessages <= 5;
  const isAtLimit = user ? user.messagesUsed >= user.messagesLimit : guestMessages <= 0;

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" />
      )}

      {/* Sidebar */}
      <div 
        id="chat-sidebar"
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 z-50 w-80 md:w-72 lg:w-80 h-full transition-transform duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col shadow-lg md:shadow-none`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">चैट सेशन्स</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <button
            onClick={() => {
              createNewSession();
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 bg-whatsapp-primary hover:bg-whatsapp-dark text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>नई चैट</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 px-4">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">अभी तक कोई चैट नहीं है</p>
              <p className="text-xs text-gray-400 mt-1">नई चैट शुरू करें</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center space-x-3 p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                  session.id === currentSessionId
                    ? 'bg-whatsapp-light border border-whatsapp-primary/20'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => {
                  switchSession(session.id);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
              >
                <MessageSquare className={`h-4 w-4 flex-shrink-0 ${
                  session.id === currentSessionId ? 'text-whatsapp-primary' : 'text-gray-400'
                }`} />
                
                {editingSessionId === session.id ? (
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 bg-white border border-gray-300 text-gray-800 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveTitle();
                      }}
                      className="text-green-500 hover:text-green-600 p-1"
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{session.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {session.messages.length} संदेश
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTitle(session.id, session.title);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                        title="नाम बदलें"
                      >
                        <Edit2 className="h-3 w-3 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('क्या आप इस चैट को डिलीट करना चाहते हैं?')) {
                            deleteSession(session.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-100 rounded-full transition-colors"
                        title="डिलीट करें"
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              if (confirm('क्या आप सभी चैट्स को डिलीट करना चाहते हैं?')) {
                clearAllSessions();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            className="w-full text-left text-sm text-gray-600 hover:text-red-600 transition-colors py-2 px-3 rounded-lg hover:bg-red-50"
          >
            🗑️ सभी चैट्स साफ़ करें
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                id="menu-button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {isSidebarOpen ? <ChevronLeft className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-whatsapp-primary to-whatsapp-dark rounded-full flex items-center justify-center shadow-sm">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">VaaniAI असिस्टेंट</h1>
                  <p className="text-sm text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    ऑनलाइन
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('क्या आप वर्तमान चैट को साफ़ करना चाहते हैं?')) {
                  clearChat();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="वर्तमान चैट साफ़ करें"
            >
              <Trash2 className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Usage Indicator */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">
              {user ? (
                `संदेश: ${user.messagesUsed}/${user.messagesLimit}`
              ) : (
                `गेस्ट मैसेज: ${guestMessages}/20`
              )}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 capitalize">
              {user ? `${user.plan} प्लान` : 'गेस्ट मोड'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isAtLimit
                  ? 'bg-red-500'
                  : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-whatsapp-primary'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          {(isNearLimit || isAtLimit) && (
            <div className={`mt-2 flex items-center text-sm ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`}>
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="flex-1">
                {isAtLimit ? (
                  user ? 'मासिक सीमा समाप्त हो गई है।' : 'गेस्ट मैसेज समाप्त हो गए हैं!'
                ) : (
                  user ? 'आपकी मासिक सीमा समाप्त होने वाली है।' : 'आपके गेस्ट मैसेज समाप्त होने वाले हैं!'
                )}
              </span>
              <Link 
                to={user ? "/plans" : "/register"} 
                className="ml-2 text-whatsapp-primary hover:text-whatsapp-dark font-medium underline"
              >
                {user ? 'अपग्रेड करें' : 'साइन अप करें'}
              </Link>
            </div>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 pb-safe">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8 px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-whatsapp-primary to-whatsapp-dark rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                {user ? 'VaaniAI में आपका स्वागत है!' : 'VaaniAI में आपका स्वागत है!'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {user 
                  ? 'मुझसे हिंदी में कुछ भी पूछें। मैं आपकी सहायता करने के लिए यहाँ हूँ।'
                  : `मुझसे हिंदी में कुछ भी पूछें! आपके पास आज ${guestMessages} मुफ़्त मैसेज हैं।`
                }
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl shadow-sm ${
                  message.sender === 'user' 
                    ? 'bg-whatsapp-primary text-white ml-auto rounded-br-md' 
                    : 'bg-white text-gray-800 mr-auto border border-gray-200 rounded-bl-md'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'bot' && (
                    <Bot className="h-4 w-4 text-whatsapp-primary flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed break-words">{message.text}</p>
                    <p className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-whatsapp-light' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.sender === 'user' && (
                    <User className="h-4 w-4 text-whatsapp-light flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="max-w-xs bg-white text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-whatsapp-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">टाइप कर रहे हैं...</p>
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4 pb-safe">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="यहाँ अपना संदेश टाइप करें..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent text-sm placeholder-gray-500 bg-gray-50 min-h-[44px]"
              disabled={isAtLimit}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping || isAtLimit}
              className="bg-whatsapp-primary text-white p-3 rounded-full hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          {isAtLimit && (
            <p className="text-xs text-red-600 mt-2 text-center">
              {user 
                ? 'संदेश भेजने के लिए कृपया अपना प्लान अपग्रेड करें'
                : 'आज के मैसेज समाप्त! कल फिर कोशिश करें या साइन अप करें'
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;