import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { signUp } from '../../lib/auth-service';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export function RegisterForm({ role = 'student' }: { role?: 'student' | 'coach' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    studentId: '',
    specializations: '',
  });

  const validatePassword = (password: string) => {
    try {
      passwordSchema.parse(password);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePassword(formData.password)) {
      return;
    }

    // Additional validations based on role
    if (role === 'student' && !formData.studentId) {
      setError('Student ID is required');
      return;
    }

    if (role === 'coach' && !formData.specializations) {
      setError('Specializations are required');
      return;
    }

    setLoading(true);

    // Set a timeout to prevent hanging in loading state
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Registration request timed out');
        setLoading(false);
        setError('Request timed out. Please try again.');
      }
    }, 15000);

    try {
      console.log(`Attempting to register ${role} with email: ${formData.email}`);
      
      await signUp(
        formData.email, 
        formData.password, 
        role,
        {
          fullName: formData.fullName,
          studentId: formData.studentId,
          specializations: formData.specializations,
        }
      );

      clearTimeout(timeoutId);
      console.log('Registration successful, navigating to email verification');
      
      // Navigate to verification page with email parameter
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Registration error:', err);
      
      // Extract detailed error message
      let errorMessage = 'An error occurred during registration';
      
      if (err instanceof Error) {
        // Process common Supabase errors
        if (err.message.includes('duplicate key')) {
          errorMessage = 'Email already exists. Please use a different email or sign in.';
        } else if (err.message.includes('specializations')) {
          errorMessage = 'Invalid specializations format. Please enter comma-separated values.';
        } else if (err.message.includes('already exists')) {
          errorMessage = 'User already exists with this email.';
        } else if (err.message.includes('password')) {
          errorMessage = 'Password does not meet requirements.';
        } else {
          // Use the actual error message if available
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={loading}
          />
        </div>

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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={loading}
          />
        </div>

        {role === 'student' && (
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
              Student ID
            </label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              required
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={loading}
            />
          </div>
        )}

        {role === 'coach' && (
          <div>
            <label htmlFor="specializations" className="block text-sm font-medium text-gray-700">
              Specializations
            </label>
            <input
              id="specializations"
              name="specializations"
              type="text"
              required
              placeholder="Enter specializations, separate with commas"
              value={formData.specializations}
              onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple specializations with commas (e.g., "Public Speaking, Debate, Presentation Skills")
            </p>
          </div>
        )}

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
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 8 characters with uppercase, lowercase, number, and special character.
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
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
                Registering...
              </span>
            ) : (
              'Register'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}