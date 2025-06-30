import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

const ALLOWED_EMAILS = [
  'admin@davidspeaker.com',
  'coach@davidspeaker.com',
  'student@davidspeaker.com'
];

// This endpoint should only be used in development
export default async function createTestUsers(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'This endpoint is only available in development mode' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const results = [];
    const password = 'Testpassword123'; // Simple password for test accounts
    
    // Create admin user if not exists
    let { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: 'admin@davidspeaker.com',
      password: password,
    });
    
    if (adminError) {
      results.push({ email: 'admin@davidspeaker.com', status: 'error', message: adminError.message });
    } else {
      // Check if user already exists (signUp might return a user even if it exists)
      if (adminData?.user) {
        // Create or update the profile
        const { error: profileError } = await supabase.from('users').upsert({
          id: adminData.user.id,
          email: 'admin@davidspeaker.com',
          name: 'Admin User',
          role: 'admin',
        }, {
          onConflict: 'id'
        });
        
        if (profileError) {
          results.push({ 
            email: 'admin@davidspeaker.com', 
            status: 'partial', 
            message: 'User created but profile update failed: ' + profileError.message 
          });
        } else {
          results.push({ 
            email: 'admin@davidspeaker.com', 
            status: 'success', 
            message: 'Admin user created or already exists' 
          });
        }
      }
    }
    
    // Create coach user if not exists
    let { data: coachData, error: coachError } = await supabase.auth.signUp({
      email: 'coach@davidspeaker.com',
      password: password,
    });
    
    if (coachError) {
      results.push({ email: 'coach@davidspeaker.com', status: 'error', message: coachError.message });
    } else {
      // Check if user already exists
      if (coachData?.user) {
        // Create or update the profile
        const { error: profileError } = await supabase.from('users').upsert({
          id: coachData.user.id,
          email: 'coach@davidspeaker.com',
          name: 'Coach User',
          role: 'coach',
        }, {
          onConflict: 'id'
        });
        
        if (profileError) {
          results.push({ 
            email: 'coach@davidspeaker.com', 
            status: 'partial', 
            message: 'User created but profile update failed: ' + profileError.message 
          });
        } else {
          results.push({ 
            email: 'coach@davidspeaker.com', 
            status: 'success', 
            message: 'Coach user created or already exists' 
          });
        }
      }
    }
    
    // Create student user if not exists
    let { data: studentData, error: studentError } = await supabase.auth.signUp({
      email: 'student@davidspeaker.com',
      password: password,
    });
    
    if (studentError) {
      results.push({ email: 'student@davidspeaker.com', status: 'error', message: studentError.message });
    } else {
      // Check if user already exists
      if (studentData?.user) {
        // Create or update the profile
        const { error: profileError } = await supabase.from('users').upsert({
          id: studentData.user.id,
          email: 'student@davidspeaker.com',
          name: 'Student User',
          role: 'student',
        }, {
          onConflict: 'id'
        });
        
        if (profileError) {
          results.push({ 
            email: 'student@davidspeaker.com', 
            status: 'partial', 
            message: 'User created but profile update failed: ' + profileError.message 
          });
        } else {
          results.push({ 
            email: 'student@davidspeaker.com', 
            status: 'success', 
            message: 'Student user created or already exists' 
          });
        }
      }
    }
    
    // Return the results
    return res.status(200).json({ 
      message: 'Test users setup completed', 
      results,
      testPassword: password
    });
  } catch (error) {
    console.error('Error creating test users:', error);
    return res.status(500).json({ message: 'Failed to create test users', error });
  }
} 