import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface AdminLoginForm {
  username: string;
  password: string;
}

const AdminLoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminLoginForm>();

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);
    setError('');

    // Mock admin authentication
    if (data.username === 'admin' && data.password === 'admin123') {
      localStorage.setItem('vaaniai-admin-auth', 'true');
      navigate('/admin');
    } else {
      setError('गलत उपयोगकर्ता नाम या पासवर्ड');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Shield className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          एडमिन लॉगिन
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          सिस्टम प्रबंधन के लिए लॉगिन करें
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-700">
          {/* Demo Credentials Display */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <h3 className="text-sm font-medium text-gray-300 mb-2">डेमो क्रेडेंशियल्स:</h3>
            <div className="text-sm text-gray-400">
              <p>उपयोगकर्ता नाम: <span className="text-white font-mono">admin</span></p>
              <p>पासवर्ड: <span className="text-white font-mono">admin123</span></p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                उपयोगकर्ता नाम
              </label>
              <div className="mt-1">
                <input
                  {...register('username', {
                    required: 'उपयोगकर्ता नाम आवश्यक है'
                  })}
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="admin"
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-400">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                पासवर्ड
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'पासवर्ड आवश्यक है'
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-600 rounded-md placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="admin123"
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
                <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'लॉगिन हो रहा है...' : 'एडमिन लॉगिन'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              केवल अधिकृत व्यवस्थापकों के लिए
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;