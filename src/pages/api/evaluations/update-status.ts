import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { calculateDivider, calculateFinalScore, calculateTotalPoints, calculateMaxPoints } from '@/lib/scoreCalculator';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Update the type definitions
interface UpdateRequestBody {
  evaluationId: string;
  status: string;
  feedback?: string;
  manualScores?: any; // Add manual scores
  criticalSkills?: string[]; // Add critical skills
  adjustedScores?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { evaluationId, status, feedback, manualScores, criticalSkills, adjustedScores } = req.body as UpdateRequestBody;
    
    console.log(`Update evaluation ${evaluationId} with:`, {
      status,
      hasManualScores: !!manualScores,
      hasCriticalSkills: !!criticalSkills,
      hasAdjustedScores: !!adjustedScores && Object.keys(adjustedScores).length > 0
    });
    
    if (manualScores) {
      console.log("Manual scores received:", manualScores);
    }
    
    if (criticalSkills) {
      console.log("Critical skills received:", criticalSkills);
    }
    
    if (!evaluationId || !status) {
      return res.status(400).json({ message: 'Missing evaluationId or status' });
    }

    console.log(`Updating evaluation ${evaluationId} to status: ${status}`);
    
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
    
    if (userRoleError || !userRoleData) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Get the evaluation to check if the coach is assigned
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single();
      
    if (evalError) {
      console.error('Error fetching evaluation:', evalError);
      return res.status(500).json({ message: 'Failed to fetch evaluation', details: evalError.message });
    }
    
    // Verify permissions
    const canUpdate = (
      (userRoleData.role === 'admin') || 
      (userRoleData.role === 'coach' && evaluation.coach_id === userData.user.id)
    );
    
    if (!canUpdate) {
      return res.status(403).json({ message: 'Forbidden - You do not have permission to update this evaluation' });
    }
    
    // Map requested status to allowed database status values
    // Based on evaluations_status_check constraint which allows: 
    // 'pending', 'completed', 'review_requested', 'reviewed', 'error'
    let dbStatus = status;
    if (status === 'coach_reviewing') {
      // Use 'review_requested' as the closest allowed status
      dbStatus = 'review_requested';
    } else if (status === 'published') {
      // Use 'reviewed' as the closest allowed status
      dbStatus = 'reviewed';
    }
    
    // Prepare the current results and update data
    const currentResults = evaluation?.results || {};
    
    // Prepare update data
    const updateData: any = { status: dbStatus };
    
    // Update results with manual scores, critical skills, and adjusted scores if provided
    updateData.results = {
      ...currentResults
    };
    
    if (manualScores) {
      updateData.results.manual_scores = manualScores;
    }
    
    if (criticalSkills) {
      updateData.results.critical_skills = criticalSkills;
    }
    
    if (adjustedScores && Object.keys(adjustedScores).length > 0) {
      updateData.results.adjusted_analysis = adjustedScores;
    }
    
    // When status is published/reviewed, calculate the final score
    if (status === 'published' || dbStatus === 'reviewed') {
      if (!feedback) {
        return res.status(400).json({ message: 'Feedback is required when publishing an evaluation' });
      }
      
      // Get all skill scores for this evaluation
      const { data: skillScores, error: skillScoresError } = await supabase
        .from('skill_settings_and_scores')
        .select('*')
        .eq('evaluation_id', evaluationId);
      
      if (skillScoresError) {
        console.error('Error fetching skill scores for final calculation:', skillScoresError);
        // Continue without calculating the final score
      } else if (skillScores && skillScores.length > 0) {
        // Calculate the total points and max points
        const totalPoints = calculateTotalPoints(skillScores);
        const maxTotalPoints = calculateMaxPoints(skillScores);
        
        // Calculate the divider
        const divider = calculateDivider(maxTotalPoints);
        
        // Calculate the final score
        const finalScore = calculateFinalScore(totalPoints, divider);
        
        console.log(`Calculated final score: ${finalScore} (total points: ${totalPoints}, max: ${maxTotalPoints}, divider: ${divider})`);
        
        // Process and categorize all skill scores
        const categorySummary = calculateCategorySummary(skillScores);

        // Add final score to the update data
        updateData.final_score = finalScore;
        updateData.results.categories_summary = categorySummary;
      }
      
      updateData.coach_feedback = feedback;
      updateData.completed_at = new Date().toISOString();
    }
    
    // When updating the database, log the full update payload
    console.log(`Updating evaluation ${evaluationId} with payload:`, updateData);
    
    // Update the evaluation
    const { data, error } = await supabase
      .from('evaluations')
      .update(updateData)
      .eq('id', evaluationId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating evaluation:', error);
      return res.status(500).json({ message: 'Failed to update evaluation', details: error.message });
    }
    
    // After the update, log the result to confirm it was successful
    if (data) {
      console.log(`Successfully updated evaluation ${evaluationId}`);
      console.log("Updated data includes manual scores:", !!data.results?.manual_scores);
      console.log("Updated data includes critical skills:", !!data.results?.critical_skills);
    }
    
    console.log(`Successfully updated evaluation ${evaluationId} to DB status ${dbStatus} (requested: ${status})`);
    return res.status(200).json({...data, requested_status: status});
  } catch (error) {
    console.error('Error in update-status API:', error);
    return res.status(500).json({
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to calculate category summaries
function calculateCategorySummary(scores) {
  const categories = {
    "Nervousness": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Voice": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Body Language": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Expressions": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 }, 
    "Language": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Ultimate Level": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 }
  };
  
  // Process all scores by category
  scores.forEach(score => {
    const category = getParentClassForSkill(score.skill_id);
    
    if (categories[category]) {
      const scoreValue = score.adjusted_score !== null && score.adjusted_score !== undefined
        ? score.adjusted_score
        : score.actual_score;
        
      if (scoreValue !== null && scoreValue !== undefined) {
        const weight = score.weight || 1;
        const maxScore = score.max_score || 10;
        const points = scoreValue * weight;
        
        categories[category].count += 1;
        categories[category].rawPoints += points;
        categories[category].maxPossible += (maxScore * weight);
      }
    }
  });
  
  // Calculate percentage scores for each category
  Object.keys(categories).forEach(category => {
    const data = categories[category];
    if (data.maxPossible > 0) {
      data.score = Math.round((data.rawPoints / data.maxPossible) * 100);
    }
  });
  
  return categories;
}

function getParentClassForSkill(skillId) {
  if (skillId >= 1 && skillId <= 6) return "Nervousness";
  if (skillId >= 7 && skillId <= 32) return "Voice";
  if (skillId >= 33 && skillId <= 75) return "Body Language";
  if (skillId >= 76 && skillId <= 84) return "Expressions";
  if (skillId >= 85 && skillId <= 102) return "Language";
  if (skillId >= 103 && skillId <= 110) return "Ultimate Level";
  return "Unknown";
}
