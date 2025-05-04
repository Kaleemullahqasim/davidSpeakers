import React, { useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';

export function LoginPage() {
  useEffect(() => {
    console.log('LoginPage component mounted');
    
    // Ensure any required CSS is loaded
    document.body.classList.add('auth-page');
    
    // Set a timeout to check if page is stuck
    const timeoutId = setTimeout(() => {
      const spinner = document.querySelector('.loading-spinner');
      if (spinner) {
        console.error('Login page appears to be stuck with spinner visible');
        // Try to force navigation to the register page as a fallback
        window.location.href = '/register';
      }
    }, 10000);
    
    return () => {
      document.body.classList.remove('auth-page');
      clearTimeout(timeoutId);
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
      
      <div className="flex-grow flex items-center justify-center">
        <LoginForm />
      </div>
      
      <footer className="py-4 text-center text-gray-500 text-sm">
        <p>Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-800">Sign up</Link></p>
        <p className="mt-2">&copy; {new Date().getFullYear()} SpeakWise. All rights reserved.</p>
      </footer>
    </div>
  );
} 