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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evaluationId, criticalSkills } = req.body;
    
    if (!evaluationId) {
      return res.status(400).json({ message: 'Evaluation ID is required' });
    }

    console.log(`Saving critical skills for evaluation ${evaluationId}:`, criticalSkills);
    
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
    
    // Get the current evaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('results')
      .eq('id', evaluationId)
      .single();
    
    if (evalError) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    // Update the evaluation with the critical skills
    const { error: updateError } = await supabase
      .from('evaluations')
      .update({
        results: {
          ...evaluation.results,
          critical_skills: criticalSkills
        }
      })
      .eq('id', evaluationId);
    
    if (updateError) {
      console.error('Error updating critical skills:', updateError);
      return res.status(500).json({ message: 'Failed to save critical skills' });
    }
    
    return res.status(200).json({ 
      message: 'Critical skills saved successfully',
      criticalSkills
    });
    
  } catch (error) {
    console.error('Error saving critical skills:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
