import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn, getUserFromSession } from '../../lib/auth-service';
import { useAuthStore } from '../../store';

export function LoginForm() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    console.log('LoginForm mounted');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('Login form submitted');

    // Set a timeout to prevent UI from getting stuck
    const maxTimeout = setTimeout(() => {
      if (loading) {
        console.error('Login request took too long - forcing UI reset');
        setLoading(false);
        setError('The request is taking longer than expected. You may continue waiting or try again later.');
      }
    }, 30000); // 30 second UI timeout as a fallback

    try {
      const data = await signIn(formData.email, formData.password);
      console.log('Sign in returned data:', data ? 'yes' : 'no');

      if (data.session) {
        console.log('Session exists, getting user data');
        // Get user data from session
        const userData = await getUserFromSession(data.session);
        
        if (userData) {
          console.log('Setting user in store:', userData.role);
          setUser(userData);
          
          // Redirect based on role
          console.log('Redirecting based on role:', userData.role);
          switch (userData.role) {
            case 'student':
              navigate('/student');
              break;
            case 'coach':
              navigate('/coach');
              break;
            case 'admin':
              navigate('/admin');
              break;
            default:
              navigate('/');
          }
        } else {
          console.error('No user data returned from getUserFromSession');
          setError('Failed to get user data. Please try again.');
          setLoading(false);
        }
      } else {
        console.error('No session returned from signIn');
        setError('Authentication failed. Please check your credentials.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Provide more user-friendly error messages
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          setError('Connection to the server timed out. Please check your internet connection and try again.');
        } else if (err.message.includes('Invalid login')) {
          setError('Invalid email or password. Please check your credentials.');
        } else if (err.message.includes('not confirmed')) {
          setError('Your email has not been confirmed yet. Please check your inbox and verify your email.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred during sign in. Please try again later.');
      }
      setLoading(false);
    } finally {
      clearTimeout(maxTimeout);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg max-w-md w-full mx-auto p-8">
      <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
        Sign in to your account
      </h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin loading-spinner mr-2" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 