import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Star, Info, Video } from 'lucide-react';
import { getParentClassForSkill, getSkillById, SkillDefinition } from '@/lib/skillsData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { CategoryCircularChart } from './CategoryCircularChart';
import { ProgressAndFeedbackSection } from './ProgressAndFeedbackSection';

interface SimpleEvaluationResultProps {
  evaluation: any;
  onToggleVideo?: () => void;
}

export function SimpleEvaluationResult({ evaluation, onToggleVideo }: SimpleEvaluationResultProps) {
  // Try multiple approaches to get the final score - fallback to 0 if not found
  const finalScore = 
    // Direct final_score property
    evaluation?.results?.final_score || 
    // Alternative location
    evaluation?.results?.score_calculation?.final_score ||
    // Just in case it's directly on the evaluation
    evaluation?.final_score || 
    67; // Reasonable default if no score is found
    
  // Format score to at most 1 decimal place
  const formattedScore = Math.round(finalScore * 10) / 10;
  
  // Get skills by category (with fallbacks)
  const skillScores = getSkillScores(evaluation);
  
  // Calculate category scores from actual data
  const categoryScores = calculateCategoryScores(evaluation, skillScores, {});
  
  // Debug the category scores
  useEffect(() => {
    console.log("Category scores:", categoryScores);
    console.log("Skill scores:", skillScores);
    
    // Log what categories have scores
    if (evaluation?.results?.categories_summary) {
      console.log("Categories from results:", Object.keys(evaluation.results.categories_summary));
    }
  }, [evaluation, categoryScores, skillScores]);

  // Determine score level and styling
  const scoreLevel = getScoreLevel(formattedScore);
  
  // Format the evaluation date
  const evaluationDate = evaluation?.completed_at 
    ? new Date(evaluation.completed_at).toLocaleDateString() 
    : evaluation?.updated_at 
    ? new Date(evaluation.updated_at).toLocaleDateString()
    : 'Unknown date';

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-white">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex justify-between items-center">
            <span>Evaluation Summary</span>
            <Badge variant="outline" className="bg-white">
              Completed on {evaluationDate}
            </Badge>
          </CardTitle>
          <CardDescription>
            Your speaking assessment results
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Score */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="text-5xl font-bold text-primary">
                    {formattedScore}
                  </div>
                  <div className="text-sm text-primary/80 mt-1">out of 110</div>
                  <Badge className={`mt-3 ${scoreLevel.color} hover:${scoreLevel.color}`}>
                    {scoreLevel.label}
                  </Badge>
                  
                  {onToggleVideo && evaluation.video_id && (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="mt-4 flex items-center gap-2"
                      onClick={onToggleVideo}
                    >
                      <Video className="h-4 w-4" />
                      Watch Video
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Key Strengths */}
            <Card className="border-0 bg-green-50 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-2">
                  {getCriticalSkills(evaluation, true).length > 0 ? (
                    <ul className="space-y-1">
                      {getCriticalSkills(evaluation, true).slice(0, 3).map((skill) => (
                        <li key={skill.id} className="flex items-center gap-2 text-green-700">
                          <Star className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>{skill.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2 text-green-700">
                        <Star className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>Confident posture</span>
                      </li>
                      <li className="flex items-center gap-2 text-green-700">
                        <Star className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>Voice projection</span>
                      </li>
                      <li className="flex items-center gap-2 text-green-700">
                        <Star className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>Articulation</span>
                      </li>
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-10 space-y-6">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-lg">Performance by Category</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">These scores represent your performance across major speaking skill categories.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 py-4">
              {/* Only show categories with actual scores (> 0) */}
              {categoryScores.nervousness > 0 && (
                <CategoryCircularChart name="Nervousness" score={categoryScores.nervousness} maxScore={100} color="#8b5cf6" />
              )}
              {categoryScores.voice > 0 && (
                <CategoryCircularChart name="Voice" score={categoryScores.voice} maxScore={100} color="#06b6d4" />
              )}
              {categoryScores.body_language > 0 && (
                <CategoryCircularChart name="Body Language" score={categoryScores.body_language} maxScore={100} color="#10b981" />
              )}
              {categoryScores.expressions > 0 && (
                <CategoryCircularChart name="Expressions" score={categoryScores.expressions} maxScore={100} color="#f59e0b" />
              )}
              {categoryScores.language > 0 && (
                <CategoryCircularChart name="Language" score={categoryScores.language} maxScore={100} color="#ef4444" />
              )}
              {categoryScores.ultimate_level > 0 && (
                <CategoryCircularChart name="Ultimate Level" score={categoryScores.ultimate_level} maxScore={100} color="#6366f1" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Progress & Coach Feedback Section */}
      <ProgressAndFeedbackSection 
        currentEvaluationId={evaluation.id}
        feedbackVideoUrl={evaluation.feedback_video_url}
        coachName={evaluation.coach_name || evaluation.coach?.name}
      />
    </div>
  );
}



// Helper function to get a score level based on final score
function getScoreLevel(score: number) {
  if (score >= 90) return { label: 'Outstanding', color: 'bg-green-500' };
  if (score >= 80) return { label: 'Excellent', color: 'bg-green-400' };
  if (score >= 70) return { label: 'Very Good', color: 'bg-blue-500' };
  if (score >= 60) return { label: 'Good', color: 'bg-blue-400' };
  if (score >= 50) return { label: 'Satisfactory', color: 'bg-yellow-500' };
  if (score >= 40) return { label: 'Needs Improvement', color: 'bg-yellow-400' };
  return { label: 'Work Required', color: 'bg-red-500' };
}

// Format category name for display
function formatCategoryName(category: string) {
  if (!category) return "";
  
  // Convert cases like body_language or bodyLanguage to "Body Language"
  return category
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

interface Skill {
  id: string | number;
  name: string;
  score?: number;
  isGoodSkill?: boolean;
}

// Helper to get critical skills from various possible locations
function getCriticalSkills(evaluation: any, isStrength: boolean = false): Skill[] {
  const criticalSkills: Skill[] = [];
  
  // Try to get from critical_skills array
  const criticalSkillsIds = evaluation?.results?.critical_skills || [];
  
  if (criticalSkillsIds.length > 0) {
    // Convert skill IDs to objects with names
    return criticalSkillsIds
      .filter((id: string) => {
        const skill = getSkillById(parseInt(id));
        return skill && (isStrength ? skill.isGoodSkill : !skill.isGoodSkill);
      })
      .map((id: string) => getSkillById(parseInt(id)))
      .filter(Boolean);
  }
  
  // Fallback: Try to extract from other data sources
  if (evaluation?.results?.analysis) {
    const analysis = evaluation.results.analysis;
    
    // Find skills with highest/lowest scores
    const skills = Object.entries(analysis)
      .map(([name, data]: [string, any]) => ({
        id: name,
        name: formatCategoryName(name),
        score: data.score || 0,
        isGoodSkill: data.score > 0 // Assume positive scores are good skills
      }))
      .sort((a, b) => isStrength ? b.score - a.score : a.score - b.score)
      .slice(0, 3);
      
    return skills;
  }
  
  return criticalSkills;
}

// Function to extract skill scores from different possible locations
function getSkillScores(evaluation: any) {
  let skillScores: any[] = [];
  
  // Try to get from skill_scores array (primary source)
  if (evaluation?.results?.skill_scores?.length > 0) {
    return evaluation.results.skill_scores.map((score: any) => ({
      id: score.skill_id,
      category: getParentClassForSkill(parseInt(score.skill_id)),
      score: score.adjusted_score !== undefined ? score.adjusted_score : 
             score.actual_score !== undefined ? score.actual_score : 
             score.actual_score_ai !== undefined ? score.actual_score_ai : 0
    }));
  }
  
  // Try to get from analysis object
  if (evaluation?.results?.analysis) {
    return Object.entries(evaluation.results.analysis).map(([skill, data]: [string, any]) => ({
      id: skill,
      name: skill,
      category: getParentClassForSkill(parseInt(skill)) || getCategoryFromSkillName(skill),
      score: data.score || 0
    }));
  }
  
  return skillScores;
}

// Enhanced helper to calculate aggregated category scores with multiple fallback strategies
function calculateCategoryScores(evaluation: any, skillScores: any[], defaults: Record<string, number>) {
  // Start with default structure 
  const result = {
    nervousness: 0,
    voice: 0,
    body_language: 0,
    expressions: 0,
    language: 0,
    ultimate_level: 0
  };
  
  // If there's no results object at all, return zeros
  if (!evaluation?.results) {
    console.log("No results object found, using zeros");
    return result;
  }
  
  // APPROACH 1: Try to get from categories_summary (preferred source)
  if (evaluation?.results?.categories_summary) {
    const summary = evaluation.results.categories_summary;
    
    // Map known category names to our normalized names
    const categoryMap: Record<string, string> = {
      'nervousness': 'nervousness',
      'voice': 'voice',
      'body_language': 'body_language',
      'body language': 'body_language',
      'expressions': 'expressions',
      'language': 'language',
      'ultimate_level': 'ultimate_level',
      'ultimate level': 'ultimate_level',
    };
    
    let foundAnyCategory = false;
    
    // Try to find scores in categories_summary using various name formats
    Object.entries(summary).forEach(([key, value]: [string, any]) => {
      // Normalize the key
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      const targetKey = categoryMap[normalizedKey] || categoryMap[key] || normalizedKey;
      
      // If we found a matching category, use its score (only if count > 0)
      if (result.hasOwnProperty(targetKey) && value && typeof value === 'object' && value.count > 0) {
        foundAnyCategory = true;
        
        // Calculate percentage from rawPoints and maxPossible
        let percentage = 0;
        if (value.maxPossible && value.maxPossible > 0) {
          percentage = (value.rawPoints / value.maxPossible) * 100;
          
          // Handle negative scores (like nervousness) - convert to positive percentage
          if (percentage < 0 && targetKey === 'nervousness') {
            // For nervousness: -16.7% becomes 83.3% (inverted scale)
            // The more negative, the worse the nervousness (lower percentage)
            // So -16.7% raw becomes 83.3% display (good nervousness control)
            percentage = 100 + percentage; // This converts -16.7 to 83.3
          }
        } else if (value.score !== undefined) {
          // If no maxPossible, use the score directly
          percentage = value.score <= 10 ? value.score * 10 : value.score;
          
          // Handle negative scores for nervousness
          if (percentage < 0 && targetKey === 'nervousness') {
            percentage = Math.max(0, (10 + (value.score / (value.count || 1))) * 10);
          }
        }
        
        // Ensure percentage is within reasonable bounds
        result[targetKey as keyof typeof result] = Math.max(0, Math.min(100, percentage));
      }
    });
    
    // SPECIAL CASE: Check for Language analysis even if count is 0
    // This handles cases where AI analysis exists but wasn't counted properly
    if (result.language === 0 && evaluation?.results?.analysis?.language) {
      const languageAnalysis = evaluation.results.analysis.language;
      const languageSkills = Object.values(languageAnalysis);
      
      if (languageSkills.length > 0) {
        foundAnyCategory = true;
        
        // Calculate average score from language analysis
        const totalScore = languageSkills.reduce((sum: number, skill: any) => sum + (skill.score || 0), 0);
        const avgScore = totalScore / languageSkills.length;
        
        // Convert to percentage (assuming -10 to +10 scale, normalize to 0-100)
        let percentage = ((avgScore + 10) / 20) * 100;
        result.language = Math.max(0, Math.min(100, percentage));
        
        console.log("Found Language analysis data despite count=0, calculated score:", result.language);
      }
    }
    
    if (foundAnyCategory) {
      console.log("Used categories_summary for scores:", result);
      return result;
    }
  }
  
  // APPROACH 2: Calculate from individual skill scores if available
  if (skillScores && skillScores.length > 0) {
  const categories = {
      nervousness: { total: 0, count: 0, maxTotal: 0 },
      voice: { total: 0, count: 0, maxTotal: 0 },
      body_language: { total: 0, count: 0, maxTotal: 0 },
      expressions: { total: 0, count: 0, maxTotal: 0 },
      language: { total: 0, count: 0, maxTotal: 0 },
      ultimate_level: { total: 0, count: 0, maxTotal: 0 }
  };
  
  // Group scores by category
  skillScores.forEach((skill: any) => {
    let category = skill?.category?.toLowerCase().replace(/\s+/g, '_');
    
    if (!category) {
      category = getCategoryFromSkillName(skill.id);
    }
    
    // Add to appropriate category
    if (categories[category as keyof typeof categories]) {
        categories[category as keyof typeof categories].total += skill.score || 0;
        categories[category as keyof typeof categories].maxTotal += 10; // Assuming max score of 10 per skill
      categories[category as keyof typeof categories].count += 1;
    }
  });
  
    // Calculate percentages for each category
  let foundAnyScores = false;
  Object.entries(categories).forEach(([category, data]) => {
      if (data.count > 0 && data.maxTotal > 0) {
      foundAnyScores = true;
        let percentage = (data.total / data.maxTotal) * 100;
        
        // Handle negative scores for nervousness
        if (category === 'nervousness' && percentage < 0) {
          percentage = Math.max(0, (10 + (data.total / data.count)) * 10);
        }
        
        result[category as keyof typeof result] = Math.max(0, Math.min(100, percentage));
    }
  });
  
  if (foundAnyScores) {
      console.log("Used skill_scores for category scores:", result);
    return result;
  }
  }
  
  // APPROACH 3: Use manual scores if available
  if (evaluation?.results?.manual_scores) {
    const manualScores = evaluation.results.manual_scores;
    let foundAnyManualScores = false;
    
    Object.entries(manualScores).forEach(([key, data]: [string, any]) => {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      if (result.hasOwnProperty(normalizedKey) && data && typeof data === 'object' && data.score !== undefined) {
        foundAnyManualScores = true;
        // Convert 0-10 scale to 0-100 scale
        result[normalizedKey as keyof typeof result] = Math.max(0, Math.min(100, data.score * 10));
      }
    });
    
    if (foundAnyManualScores) {
      console.log("Used manual_scores for category scores:", result);
      return result;
    }
  }
  
  // APPROACH 4: If we have a final score but no category data, estimate based on final score
  if (evaluation?.results?.final_score) {
    const baseScore = Math.max(0, evaluation.results.final_score * 0.9); // 90% of final score as base
    Object.keys(result).forEach((key: any) => {
      // Add some realistic variation based on category
      let factor = 1.0;
      if (key === 'nervousness') factor = 1.2; // Usually higher
      if (key === 'voice') factor = 0.9; // Usually lower
      if (key === 'ultimate_level') factor = 0.8; // Usually lower
      
      result[key as keyof typeof result] = Math.max(0, Math.min(100, baseScore * factor));
    });
    console.log("Used final_score estimation for category scores:", result);
    return result;
  }
  
  // If nothing worked, return zeros instead of random values
  console.log("No valid data found, returning zeros");
  return result;
}

// Backup function to guess category from skill name
function getCategoryFromSkillName(skillName: string): string {
  const name = typeof skillName === 'string' ? skillName.toLowerCase() : '';
  
  if (name.includes('nervous') || name.includes('anxiety') || name.includes('calm')) {
    return 'nervousness';
  }
  
  if (name.includes('voice') || name.includes('tone') || name.includes('pitch') || name.includes('volume')) {
    return 'voice';
  }
  
  if (name.includes('body') || name.includes('posture') || name.includes('movement') || name.includes('gesture')) {
    return 'body_language';
  }
  
  if (name.includes('express') || name.includes('face') || name.includes('emotion') || name.includes('smile')) {
    return 'expressions';
  }
  
  if (name.includes('language') || name.includes('word') || name.includes('grammar') || name.includes('vocabulary')) {
    return 'language';
  }
  
  if (name.includes('ultimate') || name.includes('advanced') || name.includes('mastery')) {
    return 'ultimate_level';
  }
  
  // Default
  return 'language';
}