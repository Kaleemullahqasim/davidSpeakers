import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function checkProfile(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  
  if (method !== 'GET') {
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
    
    // Check if profile exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      return res.status(500).json({ 
        message: 'Error fetching profile', 
        error: profileError,
        errorCode: profileError.code,
        errorMessage: profileError.message,
        actions: 'Create profiles table using SQL script from documentation'
      });
    }
    
    // Return profile data
    return res.status(200).json({
      message: 'Profile data retrieved successfully',
      profile: profileData,
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    });
    
  } catch (error) {
    console.error('Error in check-profile API:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
} 