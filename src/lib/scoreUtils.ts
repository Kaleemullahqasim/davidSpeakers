import { getParentClassForSkill } from './skillsData';

/**
 * Extract skills from score data that belong to a specific category
 */
export function extractSkillsByCategory(scores: any[] = [], category: string): any[] {
  if (!scores || !Array.isArray(scores)) {
    return [];
  }
  
  return scores.filter(score => {
    if (!score || !score.skill_id) return false;
    const skillCategory = getParentClassForSkill(score.skill_id);
    return skillCategory === category;
  });
}

/**
 * Process category scores from different possible data structures
 */
export function processCategoryScores(categoryData: any): {
  score: number;
  count: number;
  rawPoints: number;
  maxPossible: number;
} {
  // Default values
  const result = {
    score: 0,
    count: 0,
    rawPoints: 0,
    maxPossible: 0
  };
  
  if (!categoryData) return result;
  
  // Handle different data structures
  if (typeof categoryData === 'object') {
    // Handle case where data has score property
    if (categoryData.score !== undefined) {
      result.score = Math.round(categoryData.score || 0);
    }
    
    // Get count, rawPoints, and maxPossible with various possible property names
    result.count = categoryData.count || 0;
    result.rawPoints = categoryData.rawPoints || categoryData.raw_points || 0;
    result.maxPossible = categoryData.maxPossible || categoryData.max_possible || 0;
  } else if (typeof categoryData === 'number') {
    // Handle case where data is just a number (the score)
    result.score = Math.round(categoryData || 0);
  }
  
  return result;
}

/**
 * Get color class for progress bar based on score
 */
export function getProgressColorClass(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Get text color class based on score
 */
export function getScoreTextColorClass(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get badge color class based on score
 */
export function getBadgeColorClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 hover:bg-green-100';
  if (score >= 60) return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
  return 'bg-red-100 text-red-800 hover:bg-red-100';
}
