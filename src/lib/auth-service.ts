import { supabase } from './supabase';
import { defaultAvatars } from '../store';
import { User } from '../types';

/**
 * Sign up a new user
 * 
 * Note: Coach accounts will be created with 'pending' status and require admin approval
 * Admin accounts cannot be created through this function - they're created once during system setup
 */
export async function signUp(
  email: string,
  password: string,
  role: 'student' | 'coach',
  userData: {
    fullName: string;
    studentId?: string;
    specializations?: string;
  }
) {
  try {
    console.log(`Signing up user: ${email} with role: ${role}`);
    
    // Add a timeout for the operation
    const timeoutId = setTimeout(() => {
      console.error('Sign up operation timed out');
      throw new Error('Operation timed out');
    }, 10000);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          role,
          ...(role === 'student' && { student_id: userData.studentId }),
          ...(role === 'coach' && { specializations: userData.specializations }),
          avatar_url: defaultAvatars[role],
        },
      },
    });
    
    clearTimeout(timeoutId);

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }
    
    console.log('Sign up successful, user data:', data.user?.id);

    // If role is coach, create a coach profile entry
    if (role === 'coach' && data.user) {
      try {
        console.log('Creating coach profile for user:', data.user.id);
        console.log('Specializations input:', userData.specializations);
        
        // Convert specializations string to array if it's not already
        let specializationsArray: string[];
        
        if (typeof userData.specializations === 'string') {
          // Split by commas if it's a comma-separated string
          if (userData.specializations.includes(',')) {
            specializationsArray = userData.specializations.split(',').map(s => s.trim());
          } else {
            // Otherwise just use the string as a single item array
            specializationsArray = [userData.specializations.trim()];
          }
        } else if (Array.isArray(userData.specializations)) {
          specializationsArray = userData.specializations;
        } else {
          // Default empty array if undefined or invalid
          specializationsArray = [];
        }
        
        console.log('Formatted specializations array:', specializationsArray);
        
        // First try to see if the coach_profiles table exists
        const { error: tableCheckError } = await supabase
          .from('coach_profiles')
          .select('user_id')
          .limit(1);
          
        if (tableCheckError) {
          console.error('Error checking coach_profiles table:', tableCheckError);
          // Table might not exist, but we'll continue with auth registration
          console.log('Continuing with user registration without coach profile');
          return data;
        }
        
        // Now try to insert the coach profile
        const { error: profileError } = await supabase
          .from('coach_profiles')
          .insert([
            {
              user_id: data.user.id,
              status: 'pending',
              specializations: specializationsArray,
            },
          ]);

        if (profileError) {
          console.error('Error inserting coach profile:', profileError);
          // Don't fail registration if this fails - just log it
          console.log('User registered but coach profile creation failed');
        } else {
          console.log('Coach profile created successfully');
        }
      } catch (e) {
        console.error('Error creating coach profile:', e);
        // Don't throw error here - we want to return the user data even if profile creation fails
        console.log('User registered but coach profile creation failed with exception');
      }
    }

    return data;
  } catch (e) {
    console.error('Error in signUp:', e);
    throw e;
  }
}

/**
 * Sign in a user with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    console.log('Attempting to sign in:', email);
    
    // Increase timeout to 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Sign in timed out - server may be unresponsive'));
      }, 30000); // Increase to 30 seconds from 10 seconds
    });
    
    // The actual auth request
    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Race between timeout and actual request
    const { data, error } = await Promise.race([
      authPromise,
      timeoutPromise.then(() => {
        throw new Error('Sign in timed out'); 
      })
    ]) as any;
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    console.log('Sign in successful:', data.user?.id);
    return data;
  } catch (e) {
    console.error('Error in signIn:', e);
    // Capture timeout errors specifically
    if (e instanceof Error && e.message.includes('timed out')) {
      throw new Error('Connection to authentication server timed out. Please check your network connection and try again.');
    }
    throw e;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    console.log('Signing out user');
    
    // Add a timeout for the operation
    const timeoutId = setTimeout(() => {
      console.error('Sign out operation timed out');
      window.location.href = '/login'; // Redirect anyway if timeout
    }, 5000);
    
    const { error } = await supabase.auth.signOut();
    
    clearTimeout(timeoutId);
    
    if (error) throw error;
    console.log('Sign out successful');
    
    // Force a page reload to clear any cached state
    window.location.href = '/login';
  } catch (e) {
    console.error('Error in signOut:', e);
    window.location.href = '/login'; // Redirect anyway on error
  }
}

/**
 * Get the current user session
 */
export async function getSession() {
  try {
    console.log('Getting session...');
    
    // Add a timeout for the operation
    const timeoutId = setTimeout(() => {
      console.error('Get session operation timed out');
      return null;
    }, 5000);
    
    const { data, error } = await supabase.auth.getSession();
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    
    console.log('Session found:', data.session ? 'yes' : 'no');
    return data.session;
  } catch (e) {
    console.error('Error in getSession:', e);
    // Don't throw here, return null to allow graceful fallback
    return null;
  }
}

/**
 * Get detailed user data from a session
 */
export async function getUserFromSession(session: any): Promise<User | null> {
  try {
    if (!session?.user) {
      console.log('No user in session');
      return null;
    }
    
    console.log('Getting user data for session user:', session.user.id);
    
    // Add a timeout for the operation
    const timeoutId = setTimeout(() => {
      console.error('Get user operation timed out');
      return null;
    }, 5000);
    
    const { data, error } = await supabase.auth.getUser();
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('Get user error:', error);
      return fallbackUserFromSession(session);
    }
    
    const role = data.user?.user_metadata?.role || 'student';
    const fullName = data.user?.user_metadata?.full_name || '';
    const avatarUrl = data.user?.user_metadata?.avatar_url || defaultAvatars[role as keyof typeof defaultAvatars];
    
    const userData = {
      id: session.user.id,
      name: fullName,
      email: session.user.email || '',
      role: role as 'student' | 'coach' | 'admin',
      avatarUrl,
    };
    
    console.log('User data retrieved:', userData.name, userData.role);
    return userData;
  } catch (e) {
    console.error('Error in getUserFromSession:', e);
    return fallbackUserFromSession(session);
  }
}

// Helper function to create a fallback user from session
function fallbackUserFromSession(session: any): User | null {
  if (!session?.user) return null;
  
  return {
    id: session.user.id,
    name: session.user.email?.split('@')[0] || 'User',
    email: session.user.email || '',
    role: 'student', // Default to student if we can't determine role
    avatarUrl: defaultAvatars['student'],
  };
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  try {
    console.log('Requesting password reset for:', email);
    
    // Add a timeout for the operation
    const timeoutId = setTimeout(() => {
      console.error('Password reset operation timed out');
      throw new Error('Password reset timed out');
    }, 10000);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    clearTimeout(timeoutId);
    
    if (error) throw error;
    console.log('Password reset email sent');
  } catch (e) {
    console.error('Error in resetPassword:', e);
    throw e;
  }
} 