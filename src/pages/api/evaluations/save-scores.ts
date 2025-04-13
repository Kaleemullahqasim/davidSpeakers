import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SkillScoreInput {
  skill_id: number;
  max_score: number;
  weight: number;
  actual_score?: number;
  actual_score_ai?: number;
  adjusted_score?: number;
  is_automated: boolean;
}

interface SaveScoresRequestBody {
  evaluationId: string;
  skills: SkillScoreInput[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evaluationId, skills } = req.body as SaveScoresRequestBody;
    
    if (!evaluationId || !skills || !Array.isArray(skills)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    console.log(`Saving scores for evaluation ${evaluationId}:`, {
      skillCount: skills.length,
      hasAutomatedSkills: skills.some(s => s.is_automated),
      skillIds: skills.map(s => s.skill_id)
    });
    
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
    
    // Get the evaluation to check if coach is assigned
    const { data: evalData, error: evalError } = await supabase
      .from('evaluations')
      .select('id, coach_id, results')
      .eq('id', evaluationId)
      .single();
    
    if (evalError || !evalData) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    if (evalData.coach_id !== userData.user.id) {
      return res.status(403).json({ message: 'You are not assigned to this evaluation' });
    }
    
    // Check if any skills have the skill_id missing
    const invalidSkills = skills.filter(skill => !skill.skill_id);
    if (invalidSkills.length > 0) {
      console.error('Invalid skills without skill_id:', invalidSkills);
      return res.status(400).json({ 
        message: 'Invalid skill data', 
        details: `${invalidSkills.length} skills missing skill_id` 
      });
    }
    
    // Extract the skill IDs being updated
    const skillIdsToUpdate = skills.map(skill => skill.skill_id);
    
    try {
      // Begin a transaction for consistency
      const { error: txnError } = await supabase.rpc('update_scores_transaction', {
        p_evaluation_id: evaluationId,
        p_skill_ids: skillIdsToUpdate
      });
      
      if (txnError) {
        // If the stored procedure doesn't exist, fall back to manual transaction
        console.log("Stored procedure not found, using manual transaction:", txnError.message);
        
        // Only delete scores for the specific skills being updated, not all scores
        if (skillIdsToUpdate.length > 0) {
          const { error: deleteError } = await supabase
            .from('skill_settings_and_scores')
            .delete()
            .eq('evaluation_id', evaluationId)
            .in('skill_id', skillIdsToUpdate);
          
          if (deleteError) {
            console.error('Error deleting existing scores:', deleteError);
            return res.status(500).json({ message: 'Failed to update specific scores' });
          }
          
          console.log(`Deleted existing scores for skill IDs: ${skillIdsToUpdate.join(', ')}`);
        }
        
        // Format the skills for insertion
        const skillScores = skills.map(skill => ({
          evaluation_id: evaluationId,
          skill_id: skill.skill_id,
          max_score: skill.max_score,
          weight: skill.weight,
          actual_score: skill.actual_score,
          actual_score_ai: skill.actual_score_ai,
          adjusted_score: skill.adjusted_score,
          is_automated: skill.is_automated,
          points: (skill.is_automated 
            ? (skill.adjusted_score !== null ? skill.adjusted_score : skill.actual_score_ai) 
            : skill.actual_score) * skill.weight
        }));
        
        // Insert the new/updated scores
        const { error: insertError } = await supabase
          .from('skill_settings_and_scores')
          .insert(skillScores);
        
        if (insertError) {
          console.error('Error inserting skill scores:', insertError);
          
          // Check if it's a duplicate key error (which shouldn't happen since we deleted first)
          if (insertError.code === '23505') {
            return res.status(409).json({ 
              message: 'Conflict with existing scores', 
              details: insertError.message,
              recommendation: 'Try refreshing the page and submitting again'
            });
          }
          
          return res.status(500).json({ 
            message: 'Failed to save skill scores', 
            details: insertError.message 
          });
        }
      }
      
      // Now fetch ALL scores to calculate the final score
      const { data: allScores, error: allScoresError } = await supabase
        .from('skill_settings_and_scores')
        .select('*')
        .eq('evaluation_id', evaluationId);
      
      if (allScoresError) {
        console.error('Error fetching all scores:', allScoresError);
        // Continue anyway - we'll still try to use what we have
      }
      
      // Log the combined scores for debugging
      console.log(`Total scores after update: ${allScores?.length || 0}`);
      
      // Calculate total points for the final score based on ALL scores
      let totalPoints = 0;
      let maxPotentialPoints = 0;
      
      // Process all scores (both new and existing)
      (allScores || []).forEach(score => {
        const scoreToUse = score.adjusted_score !== null && score.adjusted_score !== undefined 
          ? score.adjusted_score 
          : score.actual_score;
          
        if (scoreToUse !== null && scoreToUse !== undefined) {
          const weight = score.weight || 1;
          const points = scoreToUse * weight;
          totalPoints += points;
          maxPotentialPoints += (score.max_score * weight);
        }
      });
      
      console.log(`Total points calculated from all skills: ${totalPoints.toFixed(2)}`);
      console.log(`Maximum potential points: ${maxPotentialPoints.toFixed(2)}`);
      
      // Calculate the final score
      let finalScore = 0;

      // Check if there's already a custom divider set
      if (evalData.results?.custom_divider) {
        // Use the existing custom divider
        const customDivider = evalData.results.custom_divider;
        console.log(`Using existing custom divider: ${customDivider.toFixed(4)}`);
        finalScore = totalPoints / customDivider;
      } else {
        // Calculate appropriate divider based on maximum potential points
        const customDivider = maxPotentialPoints / 110;
        console.log(`Using calculated divider: ${customDivider.toFixed(4)} (${maxPotentialPoints.toFixed(2)} ÷ 110)`);
        finalScore = totalPoints / customDivider;
      }
      
      // Group scores by category for better logging
      const scoresByCategory = {};
      const rawPointsByCategory = {};
      const maxPossibleByCategory = {};
      const countsByCategory = {};

      (allScores || []).forEach(score => {
        const category = getParentClassForSkill(score.skill_id);
        if (!scoresByCategory[category]) {
          scoresByCategory[category] = { count: 0, points: 0, maxPossible: 0 };
          rawPointsByCategory[category] = 0;
          maxPossibleByCategory[category] = 0;
          countsByCategory[category] = 0;
        }
        
        scoresByCategory[category].count++;
        countsByCategory[category]++;
        
        const scoreToUse = score.adjusted_score !== null && score.adjusted_score !== undefined 
          ? score.adjusted_score 
          : score.actual_score;
          
        if (scoreToUse !== null && scoreToUse !== undefined) {
          const weight = score.weight || 1;
          const maxScore = score.max_score || 10;
          const points = scoreToUse * weight;
          
          scoresByCategory[category].points += points;
          scoresByCategory[category].maxPossible += (maxScore * weight);
          
          rawPointsByCategory[category] = (rawPointsByCategory[category] || 0) + points;
          maxPossibleByCategory[category] = (maxPossibleByCategory[category] || 0) + (maxScore * weight);
        }
      });

      // Calculate percentages for each category
      const categoriesSummary = {};
      Object.keys(scoresByCategory).forEach(category => {
        const data = scoresByCategory[category];
        const percentage = data.maxPossible > 0 ? (data.points / data.maxPossible) * 100 : 0;
        
        categoriesSummary[category.toLowerCase()] = {
          score: percentage,
          count: data.count,
          rawPoints: data.points,
          maxPossible: data.maxPossible
        };
        
        // Also add underscore version for compatibility
        const underscoreCategory = category.replace(/ /g, '_').toLowerCase();
        categoriesSummary[underscoreCategory] = {
          score: percentage,
          count: data.count,
          rawPoints: data.points,
          maxPossible: data.maxPossible
        };
      });

      console.log("Scores by category:", scoresByCategory);
      console.log("Categories summary:", categoriesSummary);
      
      // Update the evaluation with the new final score and calculation details
      const { error: updateError } = await supabase
        .from('evaluations')
        .update({ 
          scores_updated_at: new Date().toISOString(),
          results: {
            ...(evalData.results || {}),
            total_points: totalPoints,
            max_potential_points: maxPotentialPoints,
            custom_divider: evalData.results?.custom_divider || (maxPotentialPoints / 110),
            score_calculation: `${totalPoints.toFixed(2)} ÷ ${(evalData.results?.custom_divider || (maxPotentialPoints / 110)).toFixed(4)} = ${finalScore.toFixed(2)}`,
            final_score: finalScore,
            categories_summary: categoriesSummary,
            raw_points: rawPointsByCategory,
            max_possible_points: maxPossibleByCategory,
            skill_counts: countsByCategory
          }
        })
        .eq('id', evaluationId);
      
      if (updateError) {
        console.error('Error updating evaluation with final score:', updateError);
        return res.status(500).json({ 
          message: 'Failed to update final score', 
          details: updateError.message 
        });
      } else {
        console.log(`Successfully updated evaluation with final score: ${finalScore.toFixed(2)}`);
      }
      
      return res.status(200).json({ 
        message: 'Skill scores saved successfully',
        updatedSkillCount: skills.length,
        totalSkillCount: allScores?.length || 0,
        totalPoints,
        maxPotentialPoints,
        divider: evalData.results?.custom_divider || (maxPotentialPoints / 110),
        finalScore,
        categories: scoresByCategory
      });
      
    } catch (insertErr) {
      console.error('Exception during skill insertion:', insertErr);
      return res.status(500).json({ 
        message: 'Exception during skill insertion', 
        details: insertErr instanceof Error ? insertErr.message : 'Unknown error' 
      });
    }
    
  } catch (error) {
    console.error('Error saving skill scores:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to determine the category of a skill
function getParentClassForSkill(skillId: number): string {
  if (skillId >= 1 && skillId <= 6) return "Nervousness";
  if (skillId >= 7 && skillId <= 32) return "Voice";
  if (skillId >= 33 && skillId <= 75) return "Body Language";
  if (skillId >= 76 && skillId <= 84) return "Expressions";
  if (skillId >= 85 && skillId <= 102) return "Language";
  if (skillId >= 103 && skillId <= 110) return "Ultimate Level";
  return "Unknown";
}
