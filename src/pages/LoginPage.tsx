import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      const success = await login(data.email, data.password);
      if (success) {
        navigate('/chat');
      } else {
        setError('लॉगिन में समस्या हुई। कृपया ईमेल और पासवर्ड जांचें।');
      }
    } catch (err) {
      setError('लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // First try to login with demo credentials
      try {
        const success = await login('demo@example.com', 'demo123');
        if (success) {
          navigate('/chat');
          return;
        }
      } catch (loginError) {
        // If login fails, the demo user doesn't exist, so we need to register them
        console.log('Demo user does not exist, creating...');
      }

      // Register demo user if login failed
      const registerSuccess = await register('डेमो उपयोगकर्ता', 'demo@example.com', 'demo123');

      if (registerSuccess) {
        navigate('/chat');
      } else {
        setError('डेमो अकाउंट बनाने में समस्या हुई।');
      }
    } catch (err) {
      setError('डेमो लॉगिन में त्रुटि हुई।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <LogIn className="h-12 w-12 text-whatsapp-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          अपने खाते में लॉगिन करें
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          या{' '}
          <Link
            to="/register"
            className="font-medium text-whatsapp-primary hover:text-whatsapp-dark"
          >
            नया खाता बनाएं
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                ईमेल
              </label>
              <div className="mt-1">
                <input
                  {...formRegister('email', {
                    required: 'ईमेल आवश्यक है',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'वैध ईमेल पता दर्ज करें'
                    }
                  })}
                  type="email"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-whatsapp-primary focus:border-whatsapp-primary"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                पासवर्ड
              </label>
              <div className="mt-1 relative">
                <input
                  {...formRegister('password', {
                    required: 'पासवर्ड आवश्यक है'
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-whatsapp-primary focus:border-whatsapp-primary"
                  placeholder="पासवर्ड दर्ज करें"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-whatsapp-primary hover:text-whatsapp-dark"
                >
                  पासवर्ड भूल गए?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-whatsapp-primary hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">या</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                डेमो अकाउंट से लॉगिन करें
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                खाता नहीं है?{' '}
                <Link
                  to="/register"
                  className="font-medium text-whatsapp-primary hover:text-whatsapp-dark"
                >
                  पंजीकरण करें
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;