import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract evaluation ID from the URL
    const evaluationId = req.query.id as string;
    
    if (!evaluationId) {
      return res.status(400).json({ message: 'Evaluation ID is required' });
    }

    // Get the authorization header to verify identity
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required', details: 'Missing or invalid token' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Log for debugging
    console.log(`API: Fetching evaluation ${evaluationId} with token ${token.substring(0, 10)}...`);
    
    // Verify token and get user with better error handling
    let userData;
    try {
      const { data, error: authError } = await supabase.auth.getUser(token);
      if (authError) {
      console.error('Auth error:', authError);
        // Try to refresh or provide more specific error
        if (authError.message?.includes('invalid') || authError.message?.includes('expired')) {
          return res.status(401).json({ 
            message: 'Token expired or invalid', 
            details: 'Please refresh the page and try again',
            code: 'TOKEN_EXPIRED'
          });
        }
        return res.status(401).json({ 
          message: 'Authentication failed', 
          details: authError.message,
          code: 'AUTH_FAILED'
        });
      }
      
      if (!data?.user) {
        return res.status(401).json({ 
          message: 'User not found', 
          details: 'Invalid authentication token',
          code: 'USER_NOT_FOUND'
        });
      }
      
      userData = data;
    } catch (error) {
      console.error('Network error during auth:', error);
      return res.status(503).json({ 
        message: 'Authentication service temporarily unavailable', 
        details: 'Please try again in a moment',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
    
    // Check user role from users table
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();
    
    const isAdmin = userRoleData?.role === 'admin';
    
    // Fix: Correctly specify the relationships for the users table
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select(`
        *,
        student:user_id (id, name, email),
        coach:coach_id (id, name, email)
      `)
      .eq('id', evaluationId)
      .single();
    
    if (evalError) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    // Check if user has access (either as coach, student, or admin)
    const isOwner = evaluation.user_id === userData.user.id;
    const isCoach = evaluation.coach_id === userData.user.id;
    
    console.log(`API: User access check - isOwner: ${isOwner}, isCoach: ${isCoach}, isAdmin: ${isAdmin}, userId: ${userData.user.id}`);
    
    // Allow access if the user is owner, coach, or admin
    if (!isOwner && !isCoach && !isAdmin) {
      return res.status(403).json({ message: 'Access denied to this evaluation' });
    }
    
    // IMPORTANT: Consider both 'published' AND 'reviewed' statuses as valid for students to view
    // Added "completed" status as well to ensure all final evals are visible
    // Only apply this restriction to students, not to coaches or admins
    if (isOwner && !isCoach && !isAdmin && 
        evaluation.status !== 'published' && 
        evaluation.status !== 'reviewed' && 
        evaluation.status !== 'completed') {
      console.log(`Warning: Student accessing unpublished evaluation: ${evaluationId}, Status: ${evaluation.status}`);
      
      // For unpublished evaluations, provide limited data
      return res.status(200).json({
        id: evaluation.id,
        title: evaluation.title,
        status: evaluation.status,
        video_id: evaluation.video_id,
        created_at: evaluation.created_at,
        student: evaluation.student,
        coach: evaluation.coach,
        message: 'Your evaluation is currently being reviewed by your coach and will be available soon.'
      });
    }
    
    // Ensure we fetch all related skill scores separately for better performance
    const { data: skillScores, error: scoreError } = await supabase
      .from('skill_settings_and_scores')
      .select('*')
      .eq('evaluation_id', evaluationId);
    
    if (scoreError) {
      console.error('Error fetching skill scores:', scoreError);
    }
    
    // Add the skill scores directly to the results object for easy access
    const evaluationWithScores = {
      ...evaluation,
      results: {
        ...evaluation.results,
        skill_scores: skillScores || []
      }
    };
    
    // Return the full evaluation data for completed or coach-viewed evaluations    
    return res.status(200).json(evaluationWithScores);
    
  } catch (error) {
    console.error('Error in evaluation API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
