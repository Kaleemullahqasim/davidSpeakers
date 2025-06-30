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
    const { evaluationId } = req.query;
    
    if (!evaluationId) {
      return res.status(400).json({ message: 'Evaluation ID is required' });
    }

    console.log(`Fetching scores for evaluation ${evaluationId}`);
    
    // Get the authorization header to verify identity
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Check if the user is a coach
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();
    
    if (userRoleError || !userRoleData || userRoleData.role !== 'coach') {
      return res.status(403).json({ message: 'Forbidden - Coach access required' });
    }
    
    // Get all scores for this evaluation
    const { data: scores, error: scoresError } = await supabase
      .from('skill_settings_and_scores')
      .select('*')
      .eq('evaluation_id', evaluationId);
    
    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return res.status(500).json({ message: 'Failed to fetch scores' });
    }
    
    // Get the evaluation to fetch any other necessary data
    // Fix: Remove updated_at and use only created_at which does exist in the database
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('results, created_at, scores_updated_at')
      .eq('id', evaluationId)
      .single();
    
    if (evalError) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    console.log(`Found ${scores?.length || 0} scores for evaluation ${evaluationId}`);
    console.log(`Final score from database: ${evaluation.results?.final_score || 'undefined'}`);
    
    return res.status(200).json({ 
      message: 'Scores fetched successfully',
      scores: scores || [],
      finalScore: evaluation.results?.final_score,
      scoreCalculation: evaluation.results?.score_calculation,
      categories: evaluation.results?.categories_summary || {},
      timestamp: evaluation.scores_updated_at || evaluation.created_at, // Use created_at instead of updated_at
      rawResults: evaluation.results
    });
    
  } catch (error) {
    console.error('Error getting scores:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
