import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Save, Eye, EyeOff, Camera, Download, Trash2, Shield, Bell, Globe, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PreferencesForm {
  language: string;
  theme: string;
  notifications: boolean;
  emailUpdates: boolean;
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [preferences, setPreferences] = useState({
    language: 'hi',
    theme: 'light',
    notifications: true,
    emailUpdates: false
  });

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  const passwordForm = useForm<PasswordForm>();
  const preferencesForm = useForm<PreferencesForm>();

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email
      });
      loadPreferences();
    }
  }, [user, profileForm]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setPreferences({
          language: data.language || 'hi',
          theme: data.theme || 'light',
          notifications: data.notifications || true,
          emailUpdates: data.email_updates || false
        });
        preferencesForm.reset(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async (data: ProfileForm) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          email: data.email
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // If email changed, update auth email
      if (data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        });

        if (emailError) {
          throw emailError;
        }

        showMessage('success', 'प्रोफाइल अपडेट हो गया! नए ईमेल की पुष्टि के लिए अपना इनबॉक्स चेक करें।');
      } else {
        showMessage('success', 'प्रोफाइल सफलतापूर्वक अपडेट हो गया!');
      }

      // Refresh user data
      window.location.reload();
    } catch (error: any) {
      console.error('Profile update error:', error);
      showMessage('error', error.message || 'प्रोफाइल अपडेट करने में त्रुटि हुई।');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      showMessage('error', 'नया पासवर्ड और पुष्टि पासवर्ड मैच नहीं कर रहे।');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        throw error;
      }

      showMessage('success', 'पासवर्ड सफलतापूर्वक बदल दिया गया!');
      passwordForm.reset();
    } catch (error: any) {
      console.error('Password change error:', error);
      showMessage('error', error.message || 'पासवर्ड बदलने में त्रुटि हुई।');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async (data: PreferencesForm) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          language: data.language,
          theme: data.theme,
          notifications: data.notifications,
          email_updates: data.emailUpdates
        });

      if (error) {
        throw error;
      }

      setPreferences(data);
      showMessage('success', 'प्राथमिकताएं सफलतापूर्वक अपडेट हो गईं!');
    } catch (error: any) {
      console.error('Preferences update error:', error);
      showMessage('error', 'प्राथमिकताएं अपडेट करने में त्रुटि हुई।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      // Get user's chat sessions and messages
      const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          messages (*)
        `)
        .eq('user_id', user.id);

      if (sessionsError) {
        throw sessionsError;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const exportData = {
        profile,
        sessions,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vaaniai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'डेटा सफलतापूर्वक एक्सपोर्ट हो गया!');
    } catch (error: any) {
      console.error('Export error:', error);
      showMessage('error', 'डेटा एक्सपोर्ट करने में त्रुटि हुई।');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'क्या आप वाकई अपना खाता डिलीट करना चाहते हैं? यह क्रिया अपरिवर्तनीय है और आपका सारा डेटा हमेशा के लिए खो जाएगा।'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'खाता डिलीट करने की पुष्टि के लिए "DELETE" टाइप करें:'
    );

    if (doubleConfirm !== 'DELETE') {
      showMessage('error', 'खाता डिलीट नहीं किया गया।');
      return;
    }

    setIsLoading(true);
    try {
      // Delete user data (profiles table has CASCADE delete)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

      if (authError) {
        console.error('Auth delete error:', authError);
        // Continue even if auth delete fails
      }

      showMessage('success', 'खाता सफलतापूर्वक डिलीट हो गया।');
      
      // Logout and redirect
      setTimeout(() => {
        logout();
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      console.error('Delete account error:', error);
      showMessage('error', 'खाता डिलीट करने में त्रुटि हुई।');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'प्रोफाइल', icon: User },
    { id: 'security', label: 'सुरक्षा', icon: Shield },
    { id: 'preferences', label: 'प्राथमिकताएं', icon: Bell },
    { id: 'data', label: 'डेटा', icon: Download }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            प्रोफाइल एक्सेस करने के लिए लॉगिन करें
          </h2>
          <a href="/login" className="text-whatsapp-primary hover:text-whatsapp-dark">
            लॉगिन करें
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-whatsapp-primary to-whatsapp-dark rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-1 bg-whatsapp-light text-whatsapp-dark text-xs rounded-full capitalize">
                  {user.plan} प्लान
                </span>
                <span className="text-sm text-gray-500">
                  {user.messagesUsed}/{user.messagesLimit} संदेश उपयोग किए गए
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-whatsapp-light text-whatsapp-dark'
                          : 'text-gray-600 hover:bg-gray-50'
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

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">प्रोफाइल जानकारी</h2>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        नाम
                      </label>
                      <input
                        {...profileForm.register('name', { required: 'नाम आवश्यक है' })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
                      />
                      {profileForm.formState.errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ईमेल
                      </label>
                      <div className="mb-2">
                        <p className="text-sm text-gray-500">
                          ⚠️ ईमेल बदलने पर नए ईमेल की पुष्टि आवश्यक होगी
                        </p>
                      </div>
                      <input
                        {...profileForm.register('email', {
                          required: 'ईमेल आवश्यक है',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'वैध ईमेल पता दर्ज करें'
                          }
                        })}
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">खाता जानकारी</h4>
                      <div className="space-y-2 text-sm text-blue-800">
                        <p><strong>सदस्यता तिथि:</strong> {new Date(user.createdAt).toLocaleDateString('hi-IN')}</p>
                        <p><strong>वर्तमान प्लान:</strong> <span className="capitalize">{user.plan}</span></p>
                        <p><strong>संदेश उपयोग:</strong> {user.messagesUsed}/{user.messagesLimit}</p>
                        <p><strong>उपयोग प्रतिशत:</strong> {Math.round((user.messagesUsed / user.messagesLimit) * 100)}%</p>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-whatsapp-primary text-white px-6 py-2 rounded-lg hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:ring-offset-2 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isLoading ? 'सेव हो रहा है...' : 'सेव करें'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">सुरक्षा सेटिंग्स</h2>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-yellow-900 mb-2">🔐 सुरक्षा सुझाव</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• मजबूत पासवर्ड का उपयोग करें (कम से कम 8 अक्षर)</li>
                      <li>• अपर केस, लोअर केस, नंबर और विशेष चिह्न शामिल करें</li>
                      <li>• नियमित रूप से पासवर्ड बदलते रहें</li>
                    </ul>
                  </div>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        वर्तमान पासवर्ड
                      </label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('currentPassword', { required: 'वर्तमान पासवर्ड आवश्यक है' })}
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        नया पासवर्ड
                      </label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('newPassword', {
                            required: 'नया पासवर्ड आवश्यक है',
                            minLength: { value: 8, message: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए' }
                          })}
                          type={showNewPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        नया पासवर्ड की पुष्टि करें
                      </label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('confirmPassword', { required: 'पासवर्ड की पुष्टि आवश्यक है' })}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-whatsapp-primary text-white px-6 py-2 rounded-lg hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:ring-offset-2 disabled:opacity-50"
                    >
                      <Lock className="h-4 w-4" />
                      <span>{isLoading ? 'बदल रहा है...' : 'पासवर्ड बदलें'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">प्राथमिकताएं</h2>
                  <form onSubmit={preferencesForm.handleSubmit(handlePreferencesUpdate)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        भाषा
                      </label>
                      <select
                        {...preferencesForm.register('language')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
                      >
                        <option value="hi">हिंदी</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        थीम
                      </label>
                      <select
                        {...preferencesForm.register('theme')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:border-transparent"
                      >
                        <option value="light">लाइट</option>
                        <option value="dark">डार्क</option>
                        <option value="auto">ऑटो</option>
                      </select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            नोटिफिकेशन
                          </label>
                          <p className="text-sm text-gray-500">
                            ऐप नोटिफिकेशन प्राप्त करें
                          </p>
                        </div>
                        <input
                          {...preferencesForm.register('notifications')}
                          type="checkbox"
                          className="h-4 w-4 text-whatsapp-primary focus:ring-whatsapp-primary border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            ईमेल अपडेट
                          </label>
                          <p className="text-sm text-gray-500">
                            नई सुविधाओं के बारे में ईमेल प्राप्त करें
                          </p>
                        </div>
                        <input
                          {...preferencesForm.register('emailUpdates')}
                          type="checkbox"
                          className="h-4 w-4 text-whatsapp-primary focus:ring-whatsapp-primary border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-whatsapp-primary text-white px-6 py-2 rounded-lg hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-whatsapp-primary focus:ring-offset-2 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isLoading ? 'सेव हो रहा है...' : 'सेव करें'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">डेटा प्रबंधन</h2>
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">डेटा एक्सपोर्ट</h3>
                      <p className="text-gray-600 mb-4">
                        अपना सारा डेटा JSON फॉर्मेट में डाउनलोड करें
                      </p>
                      <button
                        onClick={handleExportData}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>डेटा एक्सपोर्ट करें</span>
                      </button>
                    </div>

                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h3 className="text-lg font-medium text-red-900 mb-2">खाता डिलीट करें</h3>
                      <p className="text-red-700 mb-4">
                        ⚠️ यह क्रिया अपरिवर्तनीय है। आपका सारा डेटा हमेशा के लिए खो जाएगा।
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{isLoading ? 'डिलीट हो रहा है...' : 'खाता डिलीट करें'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;