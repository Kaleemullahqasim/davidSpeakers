import React, { useState, useEffect } from 'react';
import { RegisterForm } from './RegisterForm';
import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';

export function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'coach'>('student');

  useEffect(() => {
    console.log('RegisterPage component mounted');
    // Ensure any required CSS is loaded
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4 flex items-center">
          <Mic className="h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">SpeakWise</span>
        </div>
      </header>
      
      <div className="flex-grow flex items-center justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          
          <div className="mt-8">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  onClick={() => setSelectedRole('student')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedRole === 'student'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => setSelectedRole('coach')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedRole === 'coach'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Coach
                </button>
              </div>
              
              <RegisterForm role={selectedRole} />
              
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">Already have an account? </span>
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="py-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} SpeakWise. All rights reserved.</p>
      </footer>
    </div>
  );
} 