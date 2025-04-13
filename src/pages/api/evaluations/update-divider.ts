import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { calculateFinalScore } from '@/lib/scoreCalculator';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface UpdateDividerBody {
  evaluationId: string;
  divider: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evaluationId, divider } = req.body as UpdateDividerBody;
    
    if (!evaluationId || typeof divider !== 'number' || divider <= 0) {
      return res.status(400).json({ 
        message: 'Invalid evaluationId or divider value',
        details: `Divider must be a positive number, received: ${divider}`
      });
    }

    console.log(`Updating divider for evaluation ${evaluationId} to: ${divider.toFixed(4)}`);
    
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
    
    // Get the evaluation and check if coach is assigned
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single();
    
    if (evalError || !evaluation) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    if (evaluation.coach_id !== userData.user.id) {
      return res.status(403).json({ message: 'You are not assigned to this evaluation' });
    }
    
    // Get all skill scores to recalculate final score with new divider
    const { data: skillScores, error: skillScoresError } = await supabase
      .from('skill_settings_and_scores')
      .select('*')
      .eq('evaluation_id', evaluationId);
    
    if (skillScoresError) {
      console.error('Error fetching skill scores:', skillScoresError);
      return res.status(500).json({ message: 'Failed to fetch skill scores' });
    }

    if (!skillScores || skillScores.length === 0) {
      console.warn('No skill scores found for this evaluation');
    }
    
    // Calculate total points
    const totalPoints = skillScores?.reduce((sum, skill) => {
      const scoreToUse = skill.is_automated 
        ? (skill.adjusted_score !== null ? skill.adjusted_score : skill.actual_score_ai) 
        : skill.actual_score;
      
      // Handle null/undefined scores
      const numericScore = scoreToUse !== null && scoreToUse !== undefined ? scoreToUse : 0;
      
      return sum + (numericScore * skill.weight);
    }, 0) || 0;
    
    console.log(`Total points from ${skillScores?.length || 0} skills: ${totalPoints.toFixed(2)}`);
    
    // Calculate new final score
    const finalScore = calculateFinalScore(totalPoints, divider);
    console.log(`New final score: ${finalScore.toFixed(2)} (total: ${totalPoints.toFixed(2)} ÷ ${divider.toFixed(4)})`);
    
    // Calculate maximum potential score for reference
    const maxPotentialPoints = skillScores?.reduce((sum, skill) => {
      return sum + (skill.max_score * skill.weight);
    }, 0) || 0;
    
    const maxPossibleScore = maxPotentialPoints / divider;
    console.log(`Maximum possible score with this divider: ${maxPossibleScore.toFixed(2)}`);
    
    // Store the custom divider and update final score
    const currentResults = evaluation.results || {};
    const updatedResults = {
      ...currentResults,
      custom_divider: divider,
      max_potential_points: maxPotentialPoints,
      max_possible_score: maxPossibleScore,
      total_points: totalPoints,
      final_score: finalScore, // CRITICAL: Set final_score in results object
      score_calculation: `${totalPoints.toFixed(2)} ÷ ${divider.toFixed(4)} = ${finalScore.toFixed(2)}`
    };

    // Update both the results object and the top-level final_score field
    const { error: updateError } = await supabase
      .from('evaluations')
      .update({
        results: updatedResults,
        // IMPORTANT: Update the top-level final_score field too
        // This ensures it's visible in all queries
        final_score: finalScore
      })
      .eq('id', evaluationId);
    
    if (updateError) {
      console.error('Error updating divider:', updateError);
      return res.status(500).json({ message: 'Failed to update divider' });
    }
    
    console.log(`Divider updated successfully. New final score: ${finalScore.toFixed(2)}`);
    return res.status(200).json({ 
      message: 'Divider updated successfully',
      divider,
      finalScore, // Return as finalScore for backward compatibility
      updatedFinalScore: finalScore, // Also provide as updatedFinalScore to match component expectations
      totalPoints,
      maxPotentialPoints,
      maxPossibleScore
    });
  } catch (error) {
    console.error('Error in update-divider API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
