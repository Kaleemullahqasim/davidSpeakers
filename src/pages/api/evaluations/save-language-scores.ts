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
    const { evaluationId } = req.body;
    
    if (!evaluationId) {
      return res.status(400).json({ message: 'Evaluation ID is required' });
    }

    console.log(`Saving language scores for evaluation ${evaluationId}`);
    
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
    
    // Get the evaluation to check if coach is assigned and get language analysis
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
    
    // Check if language analysis exists
    const languageAnalysis = evalData.results?.analysis?.language;
    if (!languageAnalysis || Object.keys(languageAnalysis).length === 0) {
      return res.status(400).json({ 
        message: 'No language analysis found. Please run AI language analysis first.' 
      });
    }
    
    console.log(`Found language analysis for ${Object.keys(languageAnalysis).length} skills`);
    
    // Import the skill mapping from skillsData
    const { getSkillById } = require('@/lib/skillsData');
    
    // Prepare skill scores for insertion using the skillsData mapping
    const skillScores = [];
    let processedCount = 0;
    
    for (const [skillIdStr, analysisData] of Object.entries(languageAnalysis) as [string, any][]) {
      const skillId = parseInt(skillIdStr, 10);
      const skillDefinition = getSkillById(skillId);
      
      if (skillDefinition && analysisData && typeof analysisData.score === 'number') {
        // Convert AI score to our scoring system
        // AI gives scores from -10 to +10, we need to map to 0-10 scale
        let normalizedScore = analysisData.score;
        
        // For bad skills (is_good_skill = false), negative scores are expected
        // For good skills (is_good_skill = true), ensure score is positive
        if (skillDefinition.isGoodSkill && normalizedScore < 0) {
          normalizedScore = 0; // Clamp to 0 for good skills
        } else if (!skillDefinition.isGoodSkill && normalizedScore > 0) {
          normalizedScore = 0; // Clamp to 0 for bad skills when positive
        }
        
        // Ensure score is within bounds
        normalizedScore = Math.max(-10, Math.min(10, normalizedScore));
        
        skillScores.push({
          evaluation_id: evaluationId,
          skill_id: skillId, // Use the numeric skill ID directly
          max_score: skillDefinition.maxScore,
          weight: skillDefinition.weight,
          actual_score_ai: normalizedScore,
          adjusted_score: normalizedScore, // Use AI score as adjusted score initially
          is_automated: true,
          points: normalizedScore * skillDefinition.weight
        });
        
        processedCount++;
      }
    }
    
    if (skillScores.length === 0) {
      return res.status(400).json({ 
        message: 'No valid language scores found to save' 
      });
    }
    
    console.log(`Prepared ${skillScores.length} language skill scores for insertion`);
    
    // Delete existing language scores for this evaluation
    // Language skills are IDs 25, 85-102
    const languageSkillIds = [25, ...Array.from({length: 18}, (_, i) => 85 + i)]; // [25, 85, 86, ..., 102]
    const { error: deleteError } = await supabase
      .from('skill_settings_and_scores')
      .delete()
      .eq('evaluation_id', evaluationId)
      .in('skill_id', languageSkillIds);
    
    if (deleteError) {
      console.error('Error deleting existing language scores:', deleteError);
      return res.status(500).json({ message: 'Failed to clear existing language scores' });
    }
    
    console.log('Deleted existing language scores');
    
    // Insert the new language scores
    const { error: insertError } = await supabase
      .from('skill_settings_and_scores')
      .insert(skillScores);
    
    if (insertError) {
      console.error('Error inserting language scores:', insertError);
      return res.status(500).json({ 
        message: 'Failed to save language scores', 
        details: insertError.message 
      });
    }
    
    console.log(`Successfully inserted ${skillScores.length} language scores`);
    
    // Now recalculate the final score and categories using the same logic as save-scores.ts
    const { data: allScores, error: allScoresError } = await supabase
      .from('skill_settings_and_scores')
      .select('*')
      .eq('evaluation_id', evaluationId);
    
    if (allScoresError) {
      console.error('Error fetching all scores:', allScoresError);
      return res.status(500).json({ message: 'Failed to fetch scores for recalculation' });
    }
    
    // Calculate total points for the final score based on ALL scores
    let totalPoints = 0;
    let maxPotentialPoints = 0;
    
    // Process all scores (both new and existing)
    (allScores || []).forEach((score: any) => {
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
    
    console.log(`Total points calculated: ${totalPoints.toFixed(2)}`);
    console.log(`Maximum potential points: ${maxPotentialPoints.toFixed(2)}`);
    
    // Calculate the final score
    let finalScore = 0;
    const customDivider = evalData.results?.custom_divider || (maxPotentialPoints / 110);
    finalScore = totalPoints / customDivider;
    
    // Group scores by category
    const scoresByCategory: Record<string, { count: number, points: number, maxPossible: number }> = {};
    const rawPointsByCategory: Record<string, number> = {};
    const maxPossibleByCategory: Record<string, number> = {};
    const countsByCategory: Record<string, number> = {};

    (allScores || []).forEach((score: any) => {
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
    const categoriesSummary: Record<string, { score: number, count: number, rawPoints: number, maxPossible: number}> = {};
    Object.keys(scoresByCategory).forEach((category: any) => {
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

    console.log("Updated categories summary:", categoriesSummary);
    
    // Update the evaluation with the new final score and calculation details
    const { error: updateError } = await supabase
      .from('evaluations')
      .update({ 
        scores_updated_at: new Date().toISOString(),
        results: {
          ...(evalData.results || {}),
          total_points: totalPoints,
          max_potential_points: maxPotentialPoints,
          custom_divider: customDivider,
          score_calculation: `${totalPoints.toFixed(2)} ÷ ${customDivider.toFixed(4)} = ${finalScore.toFixed(2)}`,
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
      message: 'Language scores saved successfully',
      savedScores: skillScores.length,
      totalSkillCount: allScores?.length || 0,
      totalPoints,
      maxPotentialPoints,
      finalScore,
      categories: scoresByCategory,
      languageCategory: categoriesSummary.language || categoriesSummary.Language
    });
    
  } catch (error) {
    console.error('Error saving language scores:', error);
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