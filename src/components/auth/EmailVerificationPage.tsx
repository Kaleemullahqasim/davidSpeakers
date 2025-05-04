import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function EmailVerificationPage() {
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'initial' | 'success' | 'error'>('initial');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract email from URL if it exists
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    
    // Check for confirmation tokens in the URL
    // (Supabase may redirect back with tokens)
    if (location.hash.includes('access_token') || location.hash.includes('confirmation_token')) {
      handleManualVerification();
    }
  }, [location]);

  const handleManualVerification = async () => {
    try {
      setVerifying(true);

      // Try to extract tokens from the URL hash
      const hashParams = new URLSearchParams(location.hash.substring(1)); // Remove the leading #
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const confirmationToken = hashParams.get('confirmation_token');
      const type = hashParams.get('type');

      if (type === 'recovery' || type === 'signup') {
        // This means the user has confirmed their email
        setVerificationStatus('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        return;
      }

      // Use the token if available
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        setVerificationStatus('success');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        return;
      }

      // If token is not in the URL and we have an email, try to check if it's verified
      if (email) {
        // This is just a rough check as we can't actually verify from client-side
        // In a real app, this would be a server endpoint
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'dummy_password_just_to_check', // This will fail but will tell us if email is verified
          });

          if (signInError) {
            if (signInError.message.toLowerCase().includes('not confirmed')) {
              // Email is still not confirmed
              setVerificationStatus('error');
              setError('Your email is not confirmed yet. Please check your inbox and spam folder.');
            } else if (signInError.message.toLowerCase().includes('invalid login')) {
              // If we get invalid login, that means the email exists and is verified
              // (otherwise we'd get "not confirmed")
              setVerificationStatus('success');
              setTimeout(() => {
                navigate('/login');
              }, 3000);
            }
          }
        } catch (e) {
          console.error('Error checking email verification:', e);
        }
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationStatus('error');
      setError('There was an error verifying your email. Please try again or contact support.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setResending(true);
      setError(null);

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (resendError) {
        throw resendError;
      }

      // Show success message
      setError('Verification email has been resent. Please check your inbox.');
    } catch (error) {
      console.error('Error resending verification:', error);
      setError('Failed to resend verification email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {verificationStatus === 'success' ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : verificationStatus === 'error' ? (
            <AlertCircle className="h-16 w-16 text-red-500" />
          ) : (
            <Mail className="h-16 w-16 text-indigo-600" />
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {verificationStatus === 'success'
            ? 'Email Verified!'
            : verificationStatus === 'error'
            ? 'Verification Failed'
            : 'Check your email'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {verificationStatus === 'success' ? (
            'Your email has been verified successfully. Redirecting to login...'
          ) : verificationStatus === 'error' ? (
            'We encountered an issue verifying your email. Please try the options below.'
          ) : (
            <>
              We've sent a verification link to your email address.
              <br />
              Please click on the link to verify your account.
            </>
          )}
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {verificationStatus !== 'success' && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={verifying || resending}
                  />
                </div>

                {error && (
                  <div className={`text-sm p-2 rounded ${error.includes('resent') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-600'}`}>
                    {error}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={handleManualVerification}
                    disabled={verifying || !email}
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      'Check Verification Status'
                    )}
                  </button>
                  <button
                    onClick={handleResendVerification}
                    disabled={resending || !email}
                    className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                </div>
              </>
            )}

            <p className="text-center text-sm text-gray-600">
              {verificationStatus === 'success' ? (
                'You will be redirected to the login page shortly.'
              ) : (
                'After verifying your email, you can'
              )}
            </p>
            <Link
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 