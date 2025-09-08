import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      setError('पासवर्ड मैच नहीं कर रहे हैं');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await registerUser(data.name, data.email, data.password);
      if (success) {
        navigate('/chat');
      } else {
        setError('पंजीकरण में समस्या हुई। यदि आपका खाता पहले से है, तो लॉगिन करें।');
      }
    } catch (err) {
      setError('पंजीकरण में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <UserPlus className="h-12 w-12 text-whatsapp-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          नया खाता बनाएं
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          या{' '}
          <Link
            to="/login"
            className="font-medium text-whatsapp-primary hover:text-whatsapp-dark"
          >
            अपने खाते में लॉगिन करें
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                नाम
              </label>
              <div className="mt-1">
                <input
                  {...register('name', {
                    required: 'नाम आवश्यक है',
                    minLength: {
                      value: 2,
                      message: 'नाम कम से कम 2 अक्षर का होना चाहिए'
                    }
                  })}
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-whatsapp-primary focus:border-whatsapp-primary"
                  placeholder="अपना नाम दर्ज करें"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                ईमेल
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
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
                  {...register('password', {
                    required: 'पासवर्ड आवश्यक है',
                    minLength: {
                      value: 8,
                      message: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए'
                    }
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                पासवर्ड की पुष्टि करें
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword', {
                    required: 'पासवर्ड की पुष्टि आवश्यक है',
                    validate: value => value === password || 'पासवर्ड मैच नहीं कर रहे हैं'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-whatsapp-primary focus:border-whatsapp-primary"
                  placeholder="पासवर्ड दोबारा दर्ज करें"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-whatsapp-primary hover:bg-whatsapp-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-whatsapp-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'पंजीकरण हो रहा है...' : 'पंजीकरण करें'}
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                पहले से खाता है?{' '}
                <Link
                  to="/login"
                  className="font-medium text-whatsapp-primary hover:text-whatsapp-dark"
                >
                  लॉगिन करें
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;