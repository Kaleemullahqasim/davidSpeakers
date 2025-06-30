import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getParentClassForSkill } from '@/lib/skillsData';

interface SkillCategoryCardProps {
  title: string;
  skills: any[];
  scores?: any[];
  showDescription?: boolean;
}

export function SkillCategoryCard({ title, skills = [], scores = [], showDescription = false }: SkillCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  
  // Get scores specific to this category
  const categoryScores = scores.filter((score: any) => {
    if (!score || !score.skill_id) return false;
    const category = getParentClassForSkill(score.skill_id);
    return category === title;
  });
  
  // Debug info - hidden in production
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`SkillCategoryCard "${title}" - Received scores:`, scores);
      console.log(`SkillCategoryCard "${title}" - Category-specific scores:`, categoryScores);
    }
  }, [title, scores, categoryScores]);
  
  // This card can receive skills in two formats:
  // 1. Array of skill objects
  // 2. Array of skill IDs
  // We need to handle both cases
  const skillsToProcess = skills.map((skill: any) => {
    if (typeof skill === 'object' && skill !== null) {
      return skill;
    } else {
      // If it's just an ID, return a minimal object
      return { id: skill, skill_id: skill };
    }
  });
  
  // Match each skill with its score
  const scoredSkills = skillsToProcess.map((skill: any) => {
    const skillId = skill.id || skill.skill_id;
    const scoreData = categoryScores.find((s: any) => s.skill_id === skillId);
    
    // Get score value with fallbacks
    const scoreValue = scoreData 
      ? (scoreData.adjusted_score !== undefined 
          ? scoreData.adjusted_score
          : scoreData.actual_score !== undefined 
            ? scoreData.actual_score 
            : scoreData.actual_score_ai)
      : null;
    
    const maxScore = scoreData?.max_score || 10;
    const weight = scoreData?.weight || 1;
    const isGoodSkill = skill.isGoodSkill === false ? false : true;
    
    return {
      ...skill,
      name: skill.name || `Skill #${skillId}`,
      scoreValue,
      maxScore,
      weight,
      isGoodSkill,
      hasScore: scoreValue !== null && scoreValue !== undefined
    };
  });
  
  // Skills that actually have scores
  const skillsWithScores = scoredSkills.filter((s: any) => s.hasScore);
  
  // Calculate totals
  const totalRawPoints = skillsWithScores.reduce((sum: any, skill: any) => {
    return sum + (skill.scoreValue * skill.weight);
  }, 0);
  
  const maxPossiblePoints = skillsWithScores.reduce((sum: any, skill: any) => {
    const maxVal = skill.isGoodSkill ? skill.maxScore : 0;
    return sum + (maxVal * skill.weight);
  }, 0);
  
  // Calculate percentage score (avoid division by zero)
  const categoryPercentage = maxPossiblePoints > 0 
    ? Math.round((totalRawPoints / maxPossiblePoints) * 100) 
    : 0;
  
  // Toggle expanded state
  const toggleExpand = () => setIsExpanded(!isExpanded);
  
  // If there are no skills at all
  if (skillsToProcess.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No skills evaluated</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-gray-500 italic">
            No skills were evaluated in this category
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {categoryScores.length > 0 
                ? `${skillsWithScores.length} of ${skillsToProcess.length} skills scored` 
                : `${skillsToProcess.length} skills ${scores.length > 0 ? '(not scored yet)' : ''}`
              }
            </CardDescription>
          </div>
          <Badge className={`${getProgressColor(categoryPercentage)}`}>
            {categoryPercentage}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <Progress 
            value={categoryPercentage} 
            className={`h-2 ${getProgressColor(categoryPercentage)}`}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{totalRawPoints.toFixed(1)} points</span>
            <span>out of {maxPossiblePoints.toFixed(1)}</span>
          </div>
        </div>
        
        <div className={`space-y-3 ${!isExpanded ? 'max-h-[150px] overflow-hidden' : ''}`}>
          {skillsWithScores.length > 0 ? (
            skillsWithScores.map((skill, index) => {
              // Calculate score percentage for progress bar
              const scorePercentage = Math.min(100, Math.max(0, 
                Math.abs((skill.scoreValue / skill.maxScore) * 100)
              ));
              
              return (
                <div key={skill.id || index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className={`text-sm font-medium ${getScoreColor(skill.scoreValue, skill.isGoodSkill)}`}>
                        {skill.scoreValue?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <Progress 
                      value={scorePercentage} 
                      className={`h-1.5 ${skill.isGoodSkill ? "bg-green-500" : "bg-red-500"}`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-2 italic">
              {scores.length > 0 
                ? "No skills have been scored in this category yet" 
                : "No skill scores are available for this evaluation"
              }
            </p>
          )}
        </div>
        
        {skillsToProcess.length > 3 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleExpand} 
            className="w-full mt-4 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" /> Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" /> Show All {skillsToProcess.length} Skills
              </>
            )}
          </Button>
        )}
        
        {showDescription && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="font-medium text-sm mb-2">About this category:</h3>
            <p className="text-xs text-gray-600">
              {getCategoryDescription(title)}
            </p>
          </div>
        )}
        
        {/* Debug toggle only shown in development */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDebugVisible(!debugVisible)} 
              className="w-full text-xs"
            >
              {debugVisible ? "Hide Debug Info" : "Show Debug Info"}
            </Button>
            
            {debugVisible && (
              <div className="mt-2 p-2 bg-gray-100 rounded-md text-xs font-mono overflow-auto max-h-[200px]">
                <div>Category: {title}</div>
                <div>Skills count: {skillsToProcess.length}</div>
                <div>Scores count: {categoryScores.length}</div>
                <div>Skills with scores: {skillsWithScores.length}</div>
                <div>Total points: {totalRawPoints.toFixed(2)}</div>
                <div>Max possible: {maxPossiblePoints.toFixed(2)}</div>
                <div>Percentage: {categoryPercentage}%</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreColor(score: number, isGoodSkill: boolean): string {
  // For good skills (higher is better)
  if (isGoodSkill) {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  } 
  // For bad skills (closer to 0 is better)
  else {
    if (score >= -2) return 'text-green-600';
    if (score >= -4) return 'text-blue-600';
    if (score >= -6) return 'text-yellow-600';
    return 'text-red-600';
  }
}

// Helper function to get category description
function getCategoryDescription(category: string): string {
  switch (category) {
    case 'Nervousness':
      return 'Evaluates how well the speaker manages nervousness, assessing signs like fidgeting, swaying, irrational movements, and overall composure.';
    case 'Voice':
      return 'Measures vocal quality including tone, pitch, volume, pace, clarity, emphasis, and overall vocal variety that engages the audience.';
    case 'Body Language':
      return 'Assesses posture, gestures, movement patterns, eye contact, and overall stage presence during the presentation.';
    case 'Expressions':
      return 'Evaluates facial expressions, emotional conveyance, and how well the speaker connects emotionally with the audience.';
    case 'Language':
      return 'Analyzes language patterns, word choice, rhetorical devices, and overall speech structure and delivery.';
    case 'Ultimate Level':
      return 'Overall speaking ability and potential. Assesses how polished and professional the speaker appears.';
    default:
      return 'Assessment of speaking skills in this category.';
  }
}
