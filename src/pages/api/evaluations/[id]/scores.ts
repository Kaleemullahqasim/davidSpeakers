import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map skill type to ID ranges
const skillTypeRanges = {
  nervousness: { min: 1, max: 6 },
  voice: { min: 7, max: 32 },
  bodyLanguage: { min: 33, max: 75 },
  expressions: { min: 76, max: 84 },
  language: { min: 85, max: 102 },
  ultimateLevel: { min: 103, max: 110 }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, type } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Missing evaluation ID' });
    }

    // If no type is specified, fetch all scores
    if (type && typeof type === 'string' && !skillTypeRanges[type as keyof typeof skillTypeRanges]) {
      return res.status(400).json({ message: 'Invalid skill type' });
    }

    console.log(`Fetching ${type || 'all'} scores for evaluation ${id}`);
    
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
    
    // Get the evaluation to check permissions
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('coach_id, user_id')
      .eq('id', id)
      .single();
    
    if (evalError || !evaluation) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    // Check permissions
    const isCoach = evaluation.coach_id === userData.user.id;
    const isOwner = evaluation.user_id === userData.user.id;
    
    if (!isCoach && !isOwner) {
      return res.status(403).json({ message: 'You do not have permission to access this evaluation' });
    }
    
    let scores;
    let scoresError;
    let range;
    
    if (type) {
      // Get the skill range for the requested type
      range = skillTypeRanges[type as keyof typeof skillTypeRanges];
      
      // Get scores for the specific skill type
      const result = await supabase
        .from('skill_settings_and_scores')
        .select('*')
        .eq('evaluation_id', id)
        .gte('skill_id', range.min)
        .lte('skill_id', range.max);
      
      scores = result.data;
      scoresError = result.error;
    } else {
      // Get all scores for the evaluation
      const result = await supabase
        .from('skill_settings_and_scores')
        .select('*')
        .eq('evaluation_id', id);
      
      scores = result.data;
      scoresError = result.error;
      range = null;
    }
    
    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return res.status(500).json({ message: 'Failed to fetch scores', details: scoresError.message });
    }
    
    console.log(`Found ${scores?.length || 0} scores for ${type || 'all'} skills`);
    
    return res.status(200).json({
      scores: scores || [],
      skillType: type,
      range
    });
  } catch (error) {
    console.error('Error in GET evaluation scores API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
