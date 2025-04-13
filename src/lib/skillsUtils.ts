/**
 * Utility functions for working with skills data
 */

/**
 * Determines the parent category for a skill based on its ID
 */
export function getParentClassForSkill(skillId: number): string {
  if (skillId >= 1 && skillId <= 6) return "Nervousness";
  if (skillId >= 7 && skillId <= 32) return "Voice";
  if (skillId >= 33 && skillId <= 75) return "Body Language";
  if (skillId >= 76 && skillId <= 84) return "Expressions";
  if (skillId >= 85 && skillId <= 102) return "Language";
  if (skillId >= 103 && skillId <= 110) return "Ultimate Level";
  return "Unknown";
}

/**
 * Filter an array of skill scores to only include skills from a specific category
 */
export function getSkillsByCategory(scores: any[] = [], category: string): any[] {
  if (!scores || !Array.isArray(scores)) return [];
  
  return scores.filter(score => {
    const skillId = score.skill_id;
    const skillCategory = getParentClassForSkill(skillId);
    return skillCategory === category;
  });
}

/**
 * Calculate a color for a skill score progress bar
 */
export function getProgressColorClass(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500'; 
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Calculate a text color for a skill score
 */
export function getScoreTextColorClass(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Calculate a color for a score badge
 */
export function getScoreBadgeColorClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 hover:bg-green-100';
  if (score >= 60) return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
  return 'bg-red-100 text-red-800 hover:bg-red-100';
}

/**
 * Process skill scores into categories with statistics
 */
export function calculateCategorySummary(scores: any[]) {
  const categories = {
    "Nervousness": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Voice": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Body Language": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Expressions": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Language": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 },
    "Ultimate Level": { score: 0, count: 0, maxPossible: 0, rawPoints: 0 }
  };
  
  if (!scores || !Array.isArray(scores)) return categories;
  
  // Process all scores by category
  scores.forEach(score => {
    const category = getParentClassForSkill(score.skill_id);
    
    if (categories[category]) {
      const scoreValue = score.adjusted_score !== null && score.adjusted_score !== undefined
        ? score.adjusted_score
        : score.actual_score !== undefined
          ? score.actual_score
          : score.actual_score_ai;
        
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
