import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-whatsapp-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <MessageCircle className="h-8 w-8" />
            <span className="text-xl font-bold">VaaniAI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-whatsapp-light transition-colors">
              HOME
            </Link>
            {user && (
              <Link to="/chat" className="hover:text-whatsapp-light transition-colors">
                CHAT
              </Link>
            )}
            <Link to="/plans" className="hover:text-whatsapp-light transition-colors">
              PLANS
            </Link>
            <Link to="/about" className="hover:text-whatsapp-light transition-colors">
              ABOUT US
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 hover:text-whatsapp-light transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>{user.name}</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <div className="text-gray-500">{user.email}</div>
                      <div className="text-xs mt-1">
                        Plan: <span className="font-medium capitalize">{user.plan}</span>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      प्रोफाइल सेटिंग्स
                    </Link>
                    <Link
                      to="/plans"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      प्लान अपग्रेड करें
                    </Link>
                    <button
                      onClick={() => {
                        const chatSessions = localStorage.getItem('vaaniai-chat-sessions');
                        if (chatSessions) {
                          const blob = new Blob([chatSessions], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `vaaniai-chat-sessions-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      📥 सभी चैट डाउनलोड करें
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      लॉगआउट
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="hover:text-whatsapp-light transition-colors"
                >
                  LOGIN
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-whatsapp-primary px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  REGISTER
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-whatsapp-light"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-whatsapp-dark">
              <Link
                to="/"
                className="block px-3 py-2 text-white hover:text-whatsapp-light"
                onClick={() => setIsMenuOpen(false)}
              >
                HOME
              </Link>
              {user && (
                <Link
                  to="/chat"
                  className="block px-3 py-2 text-white hover:text-whatsapp-light"
                  onClick={() => setIsMenuOpen(false)}
                >
                  CHAT
                </Link>
              )}
              <Link
                to="/plans"
                className="block px-3 py-2 text-white hover:text-whatsapp-light"
                onClick={() => setIsMenuOpen(false)}
              >
                PLANS
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-white hover:text-whatsapp-light"
                onClick={() => setIsMenuOpen(false)}
              >
                ABOUT US
              </Link>
              
              {user ? (
                <div className="border-t border-whatsapp-dark pt-3 mt-3">
                  <div className="px-3 py-2 text-white">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-whatsapp-light">{user.email}</div>
                    <div className="text-xs mt-1">
                      Plan: <span className="font-medium capitalize">{user.plan}</span>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-white hover:text-whatsapp-light"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    प्रोफाइल सेटिंग्स
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-white hover:text-whatsapp-light flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    लॉगआउट
                  </button>
                </div>
              ) : (
                <div className="border-t border-whatsapp-dark pt-3 mt-3 space-y-1">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-white hover:text-whatsapp-light"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 bg-white text-whatsapp-primary rounded-md mx-3 text-center hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    REGISTER
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;