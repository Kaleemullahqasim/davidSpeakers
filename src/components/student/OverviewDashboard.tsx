import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, Award, TrendingUp, Star } from 'lucide-react';
import { getParentClassForSkill } from '@/lib/skillsData';  // Import the function

interface OverviewDashboardProps {
  evaluation: any;
  onToggleVideo: () => void;
}

export function OverviewDashboard({ evaluation, onToggleVideo }: OverviewDashboardProps) {
  // Calculate final score - this is displayed to students but not the formula
  const finalScore = evaluation.results?.final_score || 0;
  const formattedScore = Math.round(finalScore * 10) / 10; // Round to 1 decimal place

  // Get the evaluation date
  const evaluationDate = evaluation.completed_at 
    ? new Date(evaluation.completed_at).toLocaleDateString() 
    : 'Not completed';

  // Determine score level
  const getScoreLevel = (score: number) => {
    if (score >= 90) return { label: 'Outstanding', color: 'bg-green-500' };
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-400' };
    if (score >= 70) return { label: 'Very Good', color: 'bg-blue-500' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-400' };
    if (score >= 50) return { label: 'Satisfactory', color: 'bg-yellow-500' };
    if (score >= 40) return { label: 'Needs Improvement', color: 'bg-yellow-400' };
    return { label: 'Work Required', color: 'bg-red-500' };
  };

  const scoreLevel = getScoreLevel(formattedScore);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-white">
          <CardTitle className="flex justify-between items-center">
            <span>Evaluation Summary</span>
                          <Badge variant="outline" className="bg-white">
              Completed on {evaluationDate}
            </Badge>
          </CardTitle>
          <CardDescription>
            Your coach has analyzed your speech and provided the following scores and feedback.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </div>
              </CardContent>
            </Card>
            
            {/* Watch Video */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Speech</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <Button 
                    className="w-full flex items-center justify-center gap-2 h-12"
                    onClick={onToggleVideo}
                  >
                    <PlayCircle className="h-5 w-5" />
                    Watch Your Video
                  </Button>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Watch your speech while reviewing feedback
                  </p>
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
                  {evaluation.results?.critical_skills ? (
                    <ul className="space-y-1">
                      {evaluation.results.critical_skills.slice(0, 3).map((skillId: string) => {
                        const skill = getSkillById(parseInt(skillId));
                        if (skill && skill.isGoodSkill) {
                          return (
                            <li key={skillId} className="flex items-center gap-2 text-green-700">
                              <Star className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{skill.name}</span>
                            </li>
                          );
                        }
                        return null;
                      }).filter(Boolean)}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No strengths highlighted yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Progress Bar by Category */}
          <div className="mt-10 space-y-6">
            <h3 className="font-medium text-lg">Performance by Category</h3>
            <div className="space-y-4">
              <CategoryProgressBar 
                name="Nervousness" 
                score={getCategoryScore(evaluation, 'nervousness')} 
                maxScore={100}
              />
              <CategoryProgressBar 
                name="Voice" 
                score={getCategoryScore(evaluation, 'voice')} 
                maxScore={100}
              />
              <CategoryProgressBar 
                name="Body Language" 
                score={getCategoryScore(evaluation, 'body_language')} 
                maxScore={100}
              />
              <CategoryProgressBar 
                name="Expressions" 
                score={getCategoryScore(evaluation, 'expressions')} 
                maxScore={100}
              />
              <CategoryProgressBar 
                name="Language" 
                score={getCategoryScore(evaluation, 'language')} 
                maxScore={100} 
              />
              <CategoryProgressBar 
                name="Ultimate Level" 
                score={getCategoryScore(evaluation, 'ultimate_level')} 
                maxScore={100}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get a skill by ID
function getSkillById(id: number) {
  const getAllSkills = () => {
    const { 
      nervousnessSkills, 
      voiceSkills, 
      bodyLanguageSkills, 
      expressionsSkills, 
      languageSkills, 
      ultimateLevelSkills 
    } = require('@/lib/skillsData');
    
    return [
      ...nervousnessSkills,
      ...voiceSkills,
      ...bodyLanguageSkills, 
      ...expressionsSkills,
      ...languageSkills,
      ...ultimateLevelSkills
    ];
  };
  
  return getAllSkills().find((skill: any) => skill.id === id);
}

// Helper function to get category score
function getCategoryScore(evaluation: any, category: string) {
  // For debugging
  console.log(`Calculating score for category: ${category}`);
  
  // First try the categories_summary with the exact category name
  if (evaluation.results?.categories_summary && 
      evaluation.results.categories_summary[category]) {
    console.log(`Found direct match in categories_summary: ${category} = ${evaluation.results.categories_summary[category].score}`);
    return evaluation.results.categories_summary[category].score || 0;
  }
  
  // Try different case formats (lower case, underscore, etc)
  const underscoreCategory = category.replace(/ /g, '_').toLowerCase();
  if (evaluation.results?.categories_summary && 
      evaluation.results.categories_summary[underscoreCategory]) {
    console.log(`Found with underscore in categories_summary: ${underscoreCategory} = ${evaluation.results.categories_summary[underscoreCategory].score}`);
    return evaluation.results.categories_summary[underscoreCategory].score || 0;
  }
  
  // Check for manual scores if available
  if (evaluation.results?.manual_scores?.[underscoreCategory]?.score) {
    console.log(`Found in manual_scores: ${underscoreCategory} = ${evaluation.results.manual_scores[underscoreCategory].score * 10}`);
    return evaluation.results.manual_scores[underscoreCategory].score * 10; // Convert to 0-100 scale
  }
  
  // Try to calculate from skill_scores if we have them
  if (evaluation.results?.skill_scores && evaluation.results.skill_scores.length > 0) {
    const categoryScores = evaluation.results.skill_scores.filter((score: any) => {
      const skillCategory = getParentClassForSkill(score.skill_id);
      const matchesCategory = skillCategory.toLowerCase() === category.toLowerCase();
      return matchesCategory;
    });
    
    console.log(`Found ${categoryScores.length} skill scores for category: ${category}`);
    
    if (categoryScores.length > 0) {
      let totalPoints = 0;
      let maxPossible = 0;
      
      categoryScores.forEach((score: any) => {
        const scoreValue = score.adjusted_score !== undefined ? score.adjusted_score :
                          score.actual_score !== undefined ? score.actual_score : 
                          score.actual_score_ai;
                          
        if (scoreValue !== undefined) {
          const weight = score.weight || 1;
          totalPoints += (scoreValue * weight);
          maxPossible += ((score.max_score || 10) * weight);
        }
      });
      
      if (maxPossible > 0) {
        console.log(`Calculated from skill_scores: ${category} = ${(totalPoints / maxPossible) * 100}`);
        return (totalPoints / maxPossible) * 100;
      }
    }
  }
  
  // Also try finding the category directly inside categories array
  if (evaluation.results?.categories) {
    const categoryData = evaluation.results.categories.find(
      (cat: any) => cat.name.toLowerCase() === category.toLowerCase()
    );
    if (categoryData && categoryData.score !== undefined) {
      console.log(`Found in categories array: ${category} = ${categoryData.score}`);
      return categoryData.score;
    }
  }
  
  // If we have raw points and a total point system, attempt to derive score
  if (evaluation.results?.raw_points && evaluation.results?.total_points) {
    const categoryKey = Object.keys(evaluation.results.raw_points)
      .find((key: any) => key.toLowerCase().includes(category.toLowerCase()));
      
    if (categoryKey) {
      const rawPoints = evaluation.results.raw_points[categoryKey];
      if (rawPoints) {
        console.log(`Found raw points for ${category}: ${rawPoints}`);
        // If we have a category max to normalize against
        if (evaluation.results.category_max && evaluation.results.category_max[categoryKey]) {
          return (rawPoints / evaluation.results.category_max[categoryKey]) * 100;
        }
      }
    }
  }
  
  // If we have the final score but no category scores, return a reasonable value
  if (evaluation.results?.final_score) {
    console.log(`Using estimated score from final_score for ${category}: ${Math.max(40, Math.min(80, evaluation.results.final_score * 0.8))}`);
    return Math.max(40, Math.min(80, evaluation.results.final_score * 0.8));
  }
  
  // Last resort - return 0
  console.log(`No score found for ${category} returning 0`);
  return 0;
}

// Component for category progress bars
function CategoryProgressBar({ name, score, maxScore }: { name: string, score: number, maxScore: number }) {
  // Show percentage on 0-100 scale
  const displayScore = Math.min(100, Math.max(0, score));
  
  // Determine color based on percentage
  const getColorClass = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm text-gray-500">{Math.round(displayScore)}%</span>
      </div>
      <Progress value={displayScore} className={`h-2 ${getColorClass(displayScore)}`} />
    </div>
  );
}