import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentScoreSummaryProps {
  evaluation: any;
}

export function StudentScoreSummary({ evaluation }: StudentScoreSummaryProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [scores, setScores] = useState<any>({});
  const [finalScore, setFinalScore] = useState(0);

  // Process evaluation data to extract scores
  useEffect(() => {
    console.log("Processing evaluation for scores:", evaluation);
    
    if (!evaluation?.results) {
      console.log("No results found in evaluation");
      return;
    }

    try {
      // Extract the final score from the evaluation - handle more cases to ensure we get a value
      const finalScoreValue = 
        evaluation.results.final_score || 
        (evaluation.results.total_score ? evaluation.results.total_score : 0);
      
      setFinalScore(finalScoreValue);
      console.log("Final score set to:", finalScoreValue);
      
      // Extract category scores - improved to handle more data structures
      let categoryScores = evaluation.results.categories_summary || {};
      
      // If we have category data from an alternative structure, use that
      if (Object.keys(categoryScores).length === 0 && evaluation.results.categories) {
        categoryScores = evaluation.results.categories;
      }
      
      // If categories_summary is available, use it directly
      if (Object.keys(categoryScores).length > 0) {
        setScores(categoryScores);
        console.log("Using categories_summary:", categoryScores);
      }
      // Otherwise try to calculate from skill_scores if available
      else if (evaluation.results.skill_scores && evaluation.results.skill_scores.length > 0) {
        console.log("Calculating scores from skill_scores");
        const skillScores = evaluation.results.skill_scores;
        
        // Group skills by category
        const scoresByCategory = {};
        skillScores.forEach(score => {
          const category = getParentClassForSkill(score.skill_id);
          if (!scoresByCategory[category]) {
            scoresByCategory[category] = { 
              score: 0, 
              count: 0, 
              maxPossible: 0,
              rawPoints: 0 
            };
          }
          
          // Get the actual score value
          const scoreValue = score.adjusted_score !== undefined ? score.adjusted_score :
                            score.actual_score !== undefined ? score.actual_score :
                            score.actual_score_ai !== undefined ? score.actual_score_ai : 0;
                            
          const weight = score.weight || 1;
          const maxScore = score.max_score || 10;
          
          scoresByCategory[category].count += 1;
          scoresByCategory[category].rawPoints += (scoreValue * weight);
          scoresByCategory[category].maxPossible += (maxScore * weight);
        });
        
        // Calculate percentage scores for each category
        Object.keys(scoresByCategory).forEach(category => {
          const categoryData = scoresByCategory[category];
          if (categoryData.maxPossible > 0) {
            categoryData.score = (categoryData.rawPoints / categoryData.maxPossible) * 100;
          }
        });
        
        setScores(scoresByCategory);
        console.log("Calculated scores by category:", scoresByCategory);
      } else {
        console.log("No score data found in evaluation results");
      }
    } catch (error) {
      console.error("Error processing evaluation scores:", error);
    }
  }, [evaluation]);

  // Determine score level
  const getScoreLevel = (score: number) => {
    if (score >= 90) return { label: 'Outstanding', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-400', textColor: 'text-green-700' };
    if (score >= 70) return { label: 'Very Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-400', textColor: 'text-blue-700' };
    if (score >= 50) return { label: 'Satisfactory', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (score >= 40) return { label: 'Needs Improvement', color: 'bg-yellow-400', textColor: 'text-yellow-700' };
    return { label: 'Work Required', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  // Get progress bar color based on score
  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get color based on score value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Format the score
  const formattedScore = Math.round(finalScore * 10) / 10;
  const scoreLevel = getScoreLevel(formattedScore);

  // Order categories by score (highest first)
  const orderedCategories = Object.entries(scores)
    .sort(([, a]: [string, any], [, b]: [string, any]) => b.score - a.score);

  // Display only top 3 categories if not showing all
  const displayedCategories = showAllCategories 
    ? orderedCategories 
    : orderedCategories.slice(0, 3);

  if (Object.keys(scores).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Summary</CardTitle>
          <CardDescription>
            Your evaluation score details
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <div className="text-3xl font-bold mb-2">{formattedScore}</div>
          <div className="text-sm text-gray-500 mb-6">Your overall score</div>
          <p className="text-center text-gray-500 max-w-md">
            Detailed score breakdown by category is not available for this evaluation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Performance Score</CardTitle>
        <CardDescription>
          Breakdown of your speech evaluation by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-8">
          <div className="text-5xl font-bold text-primary">{formattedScore}</div>
          <div className="text-lg text-gray-500 mt-1">out of 110</div>
          <Badge className={`mt-3 ${scoreLevel.color}`}>
            {scoreLevel.label}
          </Badge>
        </div>
        
        <div className="space-y-6">
          <h3 className="font-medium text-lg">Category Scores</h3>
          <div className="space-y-4">
            {displayedCategories.map(([category, data]: [string, any]) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{category}</span>
                  <span className={`text-sm ${getScoreColor(data.score)}`}>
                    {Math.round(data.score)}%
                  </span>
                </div>
                <Progress 
                  value={data.score} 
                  className={`h-2 ${getProgressColor(data.score)}`} 
                />
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{data.count} skills evaluated</span>
                  <span>{Math.round(data.rawPoints * 100) / 100} points</span>
                </div>
              </div>
            ))}
          </div>
          
          {orderedCategories.length > 3 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAllCategories(!showAllCategories)} 
              className="w-full mt-2"
            >
              {showAllCategories ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Show All {orderedCategories.length} Categories
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to determine skill category
function getParentClassForSkill(skillId: number): string {
  if (skillId >= 1 && skillId <= 6) return "Nervousness";
  if (skillId >= 7 && skillId <= 32) return "Voice";
  if (skillId >= 33 && skillId <= 75) return "Body Language";
  if (skillId >= 76 && skillId <= 84) return "Expressions";
  if (skillId >= 85 && skillId <= 102) return "Language";
  if (skillId >= 103 && skillId <= 110) return "Ultimate Level";
  return "Other";
}
