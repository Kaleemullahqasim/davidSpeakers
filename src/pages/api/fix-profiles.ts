import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function fixProfiles(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'This endpoint is only available in development mode' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return res.status(401).json({ message: 'Invalid token', error: authError });
    }

    // First ensure the profiles table exists
    const { error: tableError } = await supabase.from('profiles').select('id').limit(1);
    
    if (tableError && tableError.code === '42P01') { // Table does not exist
      return res.status(500).json({ 
        message: 'The profiles table does not exist. Please create it first using the debug tools.',
        error: tableError
      });
    }
    
    // Now fetch all users without checking their auth session
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      return res.status(500).json({ 
        message: 'Error fetching users list', 
        error: usersError
      });
    }
    
    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      return res.status(500).json({ 
        message: 'Error fetching profiles', 
        error: profilesError
      });
    }
    
    // Create a map of profiles by user ID
    const profilesMap = new Map();
    profiles?.forEach(profile => {
      profilesMap.set(profile.id, profile);
    });
    
    // Check which users don't have profiles and create them
    const results = [];
    const usersToFix = [];
    
    for (const user of users?.users || []) {
      if (!profilesMap.has(user.id)) {
        // No profile found for this user, determine role based on email pattern
        let role = 'student'; // Default role
        
        if (user.email?.includes('admin')) {
          role = 'admin';
        } else if (user.email?.includes('coach')) {
          role = 'coach';
        }
        
        usersToFix.push({
          id: user.id,
          email: user.email,
          role
        });
        
        results.push({
          id: user.id,
          email: user.email,
          action: 'create',
          newRole: role
        });
      } else {
        // Profile exists, check if role matches email pattern
        const profile = profilesMap.get(user.id);
        let expectedRole = profile.role;
        
        if (user.email?.includes('admin') && profile.role !== 'admin') {
          expectedRole = 'admin';
        } else if (user.email?.includes('coach') && profile.role !== 'coach') {
          expectedRole = 'coach';
        } else if (!user.email?.includes('admin') && !user.email?.includes('coach') && profile.role !== 'student') {
          expectedRole = 'student';
        }
        
        if (expectedRole !== profile.role) {
          usersToFix.push({
            id: user.id,
            email: user.email,
            role: expectedRole
          });
          
          results.push({
            id: user.id,
            email: user.email,
            action: 'update',
            oldRole: profile.role,
            newRole: expectedRole
          });
        }
      }
    }
    
    // Apply fixes if requested
    if (req.body?.apply === true) {
      const updateResults = [];
      
      for (const user of usersToFix) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            role: user.role,
            updated_at: new Date().toISOString()
          });
        
        updateResults.push({
          id: user.id,
          email: user.email,
          success: !error,
          error: error ? error.message : null
        });
      }
      
      return res.status(200).json({
        message: 'Profile fixes applied',
        fixes: results,
        updates: updateResults
      });
    }
    
    // Just return the analysis without applying fixes
    return res.status(200).json({
      message: 'Profile analysis completed',
      fixes: results,
      profilesWithoutFixes: profiles?.filter(p => !results.find(r => r.id === p.id))
    });
    
  } catch (error) {
    console.error('Error in fix-profiles API:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
} 