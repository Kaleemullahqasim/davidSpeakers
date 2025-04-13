export interface SkillScore {
  id: number;
  maxScore: number;
  weight: number;
  actualScore?: number;
  adjustedScore?: number;
  actualScoreAI?: number;
  isAutomated: boolean;
}

export interface ParentClassScore {
  name: string;
  totalPoints: number;
  maxPoints: number;
  skillCount: number;
}

/**
 * Calculates the total points from a set of skills
 * Uses adjusted scores for automated skills if available, otherwise uses AI score
 * Uses actual score for manual skills
 */
export function calculateTotalPoints(skills: SkillScore[]): number {
  const total = skills.reduce((sum: any, skill: any) => {
    // For automated skills, use adjustedScore if available, otherwise use AI score
    // For manual skills, use actualScore
    const scoreToUse = skill.isAutomated 
      ? (skill.adjustedScore !== undefined ? skill.adjustedScore : skill.actualScoreAI) 
      : skill.actualScore;
    
    // Default to 0 if the score is null/undefined
    const numericScore = scoreToUse !== null && scoreToUse !== undefined ? scoreToUse : 0;
    
    return sum + (numericScore * skill.weight);
  }, 0);
  
  // Log for debugging
  console.log(`Total points calculated: ${total.toFixed(2)} from ${skills.length} skills`);
  
  return total;
}

/**
 * Calculates the maximum possible points from skill settings
 * This multiplies each skill's max score by its weight
 */
export function calculateMaxPoints(skills: SkillScore[]): number {
  const total = skills.reduce((sum: any, skill: any) => sum + (skill.maxScore * skill.weight), 0);
  console.log(`Max points calculated: ${total.toFixed(2)} from ${skills.length} skills`);
  return total;
}

/**
 * Calculates the divider based on the maximum total points
 * This ensures the maximum score is 110
 */
export function calculateDivider(maxTotalPoints: number): number {
  if (maxTotalPoints <= 0) return 1; // Prevent division by zero
  const divider = maxTotalPoints / 110;
  console.log(`Divider calculated: ${divider.toFixed(4)} (max points: ${maxTotalPoints.toFixed(2)} ÷ 110)`);
  return divider;
}

/**
 * Calculates the final score by dividing total points by the divider
 */
export function calculateFinalScore(totalPoints: number, divider: number): number {
  if (!divider || divider <= 0) {
    console.warn('Invalid divider provided, using 1.0');
    divider = 1.0;
  }
  
  const score = totalPoints / divider;
  console.log(`Final score calculated: ${score.toFixed(2)} (${totalPoints.toFixed(2)} ÷ ${divider.toFixed(4)})`);
  return score;
}

export function getDefaultMaxScore(isGoodSkill: boolean): number {
  return 10; // All skills have a max score of 10
}

export function getDefaultWeight(isGoodSkill: boolean): number {
  return 1.0; // All skills have a default weight of 1.0
}

// Define which skills are "good" vs "bad"
export function isGoodSkill(skillId: number): boolean {
  // Define the skill IDs that are considered "bad"
  const badSkillIds = [
    // Nervousness (bad)
    1, 2, 3, 4, 5, 6,
    // Voice (mostly good except a few)
    19, 23, 25,
    // Body Language (mixed)
    36, 42, 62,
    // Expressions (mostly good except a few)
    88, 89, 90, 91,
    // No bad skills in Ultimate Level
  ];
  
  return !badSkillIds.includes(skillId);
}

/**
 * Get a description of the final score
 * @param score The final score (0-110)
 * @returns Object with label and color information
 */
export function getScoreDescription(score: number): { label: string; color: string; level: number } {
  if (score >= 90) return { label: 'Outstanding', color: 'green', level: 6 };
  if (score >= 80) return { label: 'Excellent', color: 'green', level: 5 };
  if (score >= 70) return { label: 'Very Good', color: 'blue', level: 4 };
  if (score >= 60) return { label: 'Good', color: 'blue', level: 3 };
  if (score >= 50) return { label: 'Satisfactory', color: 'yellow', level: 2 };
  if (score >= 40) return { label: 'Needs Improvement', color: 'yellow', level: 1 };
  return { label: 'Work Required', color: 'red', level: 0 };
}
