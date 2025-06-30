import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function coachProfileCheck(req: NextApiRequest, res: NextApiResponse) {
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
    const userEmail = authData.user.email;
    
    // Check if profile exists in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Check if user exists in users table (the old table that was being used)
    const { data: oldUserData, error: oldUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Determine if this is a coach based on email
    const shouldBeCoach = userEmail?.includes('coach') || false;
    
    // Check if all coaching permissions are set up correctly
    const isProfileCoach = profileData?.role === 'coach';
    const isOldUserCoach = oldUserData?.role === 'coach';
    
    // Compile diagnostic information
    const diagnosticInfo = {
      userId,
      userEmail,
      shouldBeCoach,
      profileExists: !!profileData,
      profileRole: profileData?.role || null,
      isProfileCoach,
      oldUserExists: !!oldUserData,
      oldUserRole: oldUserData?.role || null,
      isOldUserCoach,
      isConsistent: isProfileCoach === isOldUserCoach,
      authMetadata: authData.user.user_metadata || {},
      profileError: profileError ? {
        code: profileError.code,
        message: profileError.message
      } : null,
      oldUserError: oldUserError ? {
        code: oldUserError.code,
        message: oldUserError.message
      } : null
    };
    
    // Return diagnostic information
    return res.status(200).json({
      message: 'Coach profile check completed',
      result: {
        isCoach: isProfileCoach,
        isFullySetUp: isProfileCoach && isOldUserCoach,
        diagnosis: diagnosticInfo,
        fixRecommendation: !isProfileCoach && shouldBeCoach ? 
          'This user should be a coach based on email but is not set as a coach in the profiles table. Use the FixProfiles tool to correct this.' :
          'Profile appears to be set up correctly.'
      }
    });
    
  } catch (error) {
    console.error('Error in coach-profile-check API:', error);
    return res.status(500).json({ message: 'Internal server error', error });
  }
} 