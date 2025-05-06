import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function syncUserRoles(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Verify authorization token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return res.status(401).json({ message: 'Invalid token', error: authError });
    }
    
    // Get user ID from auth
    const userId = authData.user.id;
    const userEmail = authData.user.email;
    
    // Determine the correct role based on email pattern or specified role
    let targetRole = req.body.role;
    
    if (!targetRole) {
      // Default role inference from email if not explicitly provided
      if (userEmail?.includes('admin')) {
        targetRole = 'admin';
      } else if (userEmail?.includes('coach')) {
        targetRole = 'coach';
      } else {
        targetRole = 'student';
      }
    }
    
    // Validate the role
    if (!['admin', 'coach', 'student'].includes(targetRole)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    // Store results
    const updateResults = [];
    
    // Update the profile in the profiles table
    const { data: profileUpdateData, error: profileUpdateError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail,
        role: targetRole,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select();
    
    updateResults.push({
      table: 'profiles',
      success: !profileUpdateError,
      error: profileUpdateError ? profileUpdateError.message : null,
      data: profileUpdateData
    });
    
    // Update the user in the users table
    const { data: userUpdateData, error: userUpdateError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userEmail,
        role: targetRole,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select();
    
    updateResults.push({
      table: 'users',
      success: !userUpdateError,
      error: userUpdateError ? userUpdateError.message : null,
      data: userUpdateData
    });
    
    // Return success and updates
    return res.status(200).json({
      message: 'User role successfully synchronized across tables',
      userId,
      userEmail,
      role: targetRole,
      updates: updateResults
    });
    
  } catch (error) {
    console.error('Error in sync-user-roles API:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
} 