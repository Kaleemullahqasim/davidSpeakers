import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, Award, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { 
  nervousnessSkills, 
  voiceSkills, 
  bodyLanguageSkills, 
  expressionsSkills, 
  languageSkills, 
  ultimateLevelSkills,
  getAllSkills,
  getParentClassForSkill
} from '@/lib/skillsData';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScoreSummaryTabProps {
  evaluation: any;
  refreshTrigger?: Date;
}

export function ScoreSummaryTab({ evaluation, refreshTrigger }: ScoreSummaryTabProps) {
  const [categoryScores, setCategoryScores] = useState<{ [key: string]: { score: number; count: number; maxPossible: number; rawPoints: number } }>({});
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore] = useState(110); // Our scale is out of 110
  const [hasData, setHasData] = useState(false);
  const [criticalStrengths, setCriticalStrengths] = useState<any[]>([]);
  const [criticalImprovements, setCriticalImprovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rawScoreData, setRawScoreData] = useState<any[]>([]);
  const { toast } = useToast();
  
  const [currentDivider, setCurrentDivider] = useState<number | null>(null);
  const [isEditingDivider, setIsEditingDivider] = useState(false);
  const [newDivider, setNewDivider] = useState('');
  const [isUpdatingDivider, setIsUpdatingDivider] = useState(false);

  // Function to fetch scores with optional force refresh
  const fetchScores = async (forceRefresh = false) => {
    if (!evaluation?.id) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const cacheBuster = forceRefresh ? `&cb=${Date.now()}` : '';
      const response = await fetchWithAuth(`/api/evaluations/get-scores?evaluationId=${evaluation.id}${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch scores');
      }
      
      const data = await response.json();
      console.log(`🔍 Raw scores from database (${data.scores?.length || 0} total):`, data.scores);
      
      // Group scores by category for better debugging
      const scoresByCategory = data.scores.reduce((acc: Record<string, any[]>, score: any) => {
        const category = getParentClassForSkill(score.skill_id);
        if (!acc[category]) acc[category] = [];
        acc[category].push(score);
        return acc;
      }, {});
      
      console.log('Scores by category:', scoresByCategory);
      
      // Store the raw score data for debug purposes
      setRawScoreData(data.scores || []);
      
      // If we have a final score directly from the API, use it
      if (data.finalScore) {
        setTotalScore(data.finalScore);
        console.log(`Setting total score directly from API: ${data.finalScore}`);
      }
      
      // Store the current divider
      if (data.rawResults?.custom_divider) {
        setCurrentDivider(data.rawResults.custom_divider);
        setNewDivider(data.rawResults.custom_divider.toString());
      }
      
      // Process the scores
      processScores(data.scores || [], {
        ...evaluation,
        results: data.rawResults || evaluation.results
      });
      
    } catch (err) {
      console.error("Error fetching scores:", err);
      setError(err instanceof Error ? err.message : 'Failed to load scores');
      toast({
        title: "Error loading scores",
        description: err instanceof Error ? err.message : 'Failed to load scores',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to update the divider
  const handleUpdateDivider = async () => {
    if (!evaluation?.id || !newDivider || isNaN(parseFloat(newDivider))) {
      toast({
        title: "Invalid Divider",
        description: "Please enter a valid number for the divider",
        variant: "destructive"
      });
      return;
    }
    
    const dividerValue = parseFloat(newDivider);
    if (dividerValue <= 0) {
      toast({
        title: "Invalid Divider",
        description: "Divider must be greater than zero",
        variant: "destructive"
      });
      return;
    }
    
    setIsUpdatingDivider(true);
    
    try {
      const response = await fetchWithAuth('/api/evaluations/update-divider', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId: evaluation.id,
          divider: dividerValue
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update divider');
      }
      
      const data = await response.json();
      
      // Update the current divider and total score
      setCurrentDivider(dividerValue);
      
      // IMPORTANT: Update the total score with the new calculated value
      // This ensures the main score display at the top of the page is updated
      if (data.updatedFinalScore !== undefined) {
        setTotalScore(data.updatedFinalScore);
        console.log(`Updated total score to: ${data.updatedFinalScore.toFixed(2)}`);
      } else if (data.finalScore !== undefined) {
        setTotalScore(data.finalScore);
        console.log(`Updated total score to: ${data.finalScore.toFixed(2)}`);
      }
      
      setIsEditingDivider(false);
      
      toast({
        title: "Divider Updated",
        description: `Divider changed to ${dividerValue}. New final score: ${data.updatedFinalScore ? data.updatedFinalScore.toFixed(2) : data.finalScore.toFixed(2)}`,
      });
      
      // Force a full refresh to ensure all data is up to date
      fetchScores(true);
      
      // Force a reload of the main evaluation data as well
      if (evaluation.refetch) {
        await evaluation.refetch();
      }
      
    } catch (error) {
      console.error('Error updating divider:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update divider",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingDivider(false);
    }
  };

  // Fetch scores when evaluation ID changes or when refreshTrigger changes
  useEffect(() => {
    fetchScores(true); // Always force refresh when triggered
  }, [evaluation?.id, refreshTrigger]);

  // Handler for refresh button
  const handleRefresh = () => {
    fetchScores(true);
  };

  // Process scores and calculate category totals
  function processScores(scores: any[], evaluation: any) {
    if (!scores || scores.length === 0) {
      setHasData(false);
      return;
    }
    
    // Map the skill scores from the database by skill_id
    const skillMap = new Map();
    scores.forEach((score: any) => {
      skillMap.set(score.skill_id.toString(), score);
    });
    
    // Log summary data for debugging
    console.log("====== SCORE DATA SUMMARY ======");
    console.log("Total scores count:", scores.length);
    console.log("Results data available:", !!evaluation.results);
    console.log("Categories summary available:", !!evaluation.results?.categories_summary);
    console.log("Final score in results:", evaluation.results?.final_score);
    
    // Get AI analysis language scores
    const languageAnalysis = evaluation.results?.analysis?.language || {};
    
    // Process critical skills
    const criticalSkillIds = evaluation.results?.critical_skills || [];
    const allSkills = getAllSkills();
    const strengths: any[] = [];
    const improvements: any[] = [];
    
    criticalSkillIds.forEach((skillId: string) => {
      const skill = allSkills.find((s: any) => s.id.toString() === skillId);
      if (skill) {
        if (skill.isGoodSkill) {
          strengths.push({
            id: skill.id,
            name: skill.name,
            category: getParentClassForSkill(skill.id)
          });
        } else {
          improvements.push({
            id: skill.id,
            name: skill.name,
            category: getParentClassForSkill(skill.id)
          });
        }
      }
    });
    
    setCriticalStrengths(strengths);
    setCriticalImprovements(improvements);
    
    // Setup the categories
    const categories = {
      "Nervousness": { 
        skills: nervousnessSkills, 
        score: 0, 
        count: 0, 
        maxPossible: 0,
        rawPoints: 0 
      },
      "Voice": { 
        skills: voiceSkills, 
        score: 0, 
        count: 0, 
        maxPossible: 0,
        rawPoints: 0 
      },
      "Body Language": { 
        skills: bodyLanguageSkills, 
        score: 0, 
        count: 0, 
        maxPossible: 0,
        rawPoints: 0 
      },
      "Expressions": { 
        skills: expressionsSkills, 
        score: 0, 
        count: 0, 
        maxPossible: 0,
        rawPoints: 0 
      },
      "Language": { 
        skills: languageSkills, 
        score: 0, 
        count: 0, 
        maxPossible: 0,
        rawPoints: 0 
      },
      "Ultimate Level": { 
        skills: ultimateLevelSkills, 
        score: 0, 
        count: 0, 
        maxPossible: 0,
        rawPoints: 0 
      }
    };
    
    // Track which categories have data
    const categoriesWithData = new Set();
    
    // Calculate raw points for all skills by category
    let overallRawPointsTotal = 0;
    let overallMaxPossible = 0;
    
    // First process all manual scores from the database
    scores.forEach((score: any) => {
      const skillId = score.skill_id.toString();
      const category = getParentClassForSkill(parseInt(skillId));
      
      if (categories[category as keyof typeof categories]) {
        // Get the score value - use adjusted score if available, otherwise use actual score
        const scoreValue = score.adjusted_score !== null && score.adjusted_score !== undefined
          ? score.adjusted_score
          : score.actual_score;
          
        // If we have a valid score
        if (scoreValue !== null && scoreValue !== undefined) {
          const weight = score.weight || 1;
          const maxScore = score.max_score || 10;
          const points = scoreValue * weight;
          
          categories[category as keyof typeof categories].score += points;
          categories[category as keyof typeof categories].count += 1;
          categories[category as keyof typeof categories].maxPossible += (maxScore * weight);
          categories[category as keyof typeof categories].rawPoints += points;
          
          overallRawPointsTotal += points;
          overallMaxPossible += (maxScore * weight);
          
          categoriesWithData.add(category);
          
          console.log(`Processed skill ${skillId} in category ${category}: score=${scoreValue}, points=${points}`);
        }
      } else {
        console.warn(`Unknown category for skill ${skillId}`);
      }
    });
    
    // Also process AI language scores if they exist but aren't in the database yet
    if (Object.keys(languageAnalysis).length > 0) {
      Object.entries(languageAnalysis).forEach(([skillId, data]: [string, any]) => {
        // Skip if we already have this skill in the database
        if (skillMap.has(skillId)) return;
        
        const category = "Language";
        
        // Get the score value
        const scoreValue = data.score;
        if (scoreValue !== null && scoreValue !== undefined) {
          const weight = 1; // Default weight
          const maxScore = 10; // Default max score
          const points = scoreValue * weight;
          
          categories[category].score += points;
          categories[category].count += 1;
          categories[category].maxPossible += (maxScore * weight);
          categories[category].rawPoints += points;
          
          overallRawPointsTotal += points;
          overallMaxPossible += (maxScore * weight);
          
          categoriesWithData.add(category);
          
          console.log(`Processed AI language skill ${skillId}: score=${scoreValue}, points=${points}`);
        }
      });
    }
    
    // Debug output for each category
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
      console.log(`Category: ${categoryName}`);
      console.log(`Skills count: ${categoryData.skills.length}`);
      console.log(`Scores count: ${categoryData.count}`);
      console.log(`Skills with scores: ${categoryData.count}`);
      console.log(`Total points: ${categoryData.rawPoints.toFixed(2)}`);
      console.log(`Max possible: ${categoryData.maxPossible.toFixed(2)}`);
      console.log(`Percentage: ${categoryData.maxPossible > 0 ? ((categoryData.rawPoints / categoryData.maxPossible) * 100).toFixed(0) : 0}%`);
      console.log(""); // Empty line for readability
    });
    
    // Calculate normalized scores for each category (as percentages)
    const normalizedScores: { [key: string]: { score: number; count: number; maxPossible: number; rawPoints: number } } = {};
    
    Object.entries(categories).forEach(([categoryName, category]) => {
      // Only include categories that have data
      if (category.count > 0) {
        normalizedScores[categoryName] = {
          score: category.maxPossible > 0 ? (category.rawPoints / category.maxPossible) * 100 : 0, // Convert to percentage
          count: category.count,
          maxPossible: category.maxPossible,
          rawPoints: category.rawPoints
        };
      }
    });
    
    // Log overall metrics for debugging
    console.log("⭐ Summary calculations:");
    console.log(`Total raw points: ${overallRawPointsTotal.toFixed(2)}`);
    console.log(`Total max possible: ${overallMaxPossible.toFixed(2)}`);
    
    // Calculate final score based on raw points
    let finalScore = 0;
    
    if (overallMaxPossible > 0) {
      // Use our 110-point scale by applying the divider
      const divider = overallMaxPossible / 110;
      finalScore = overallRawPointsTotal / divider;
      console.log(`Final score (110 scale): ${finalScore.toFixed(2)} (using divider: ${divider.toFixed(2)})`);
      console.log(`Raw points from categories: ${JSON.stringify(Object.entries(categories).map(([name, data]) => ({ name, points: data.rawPoints })))}`);
    }
    
    // Use results.final_score if available (from API response)
    if (evaluation.results?.final_score !== undefined) {
      console.log(`Using final score from evaluation: ${evaluation.results.final_score}`);
      setTotalScore(evaluation.results.final_score);
    } else {
      console.log(`Using calculated final score: ${finalScore}`);
      setTotalScore(finalScore);
    }
    
    setCategoryScores(normalizedScores);
    setHasData(categoriesWithData.size > 0);
    
    console.log(`Processed ${categoriesWithData.size} categories with score data`);
  }

  // Format the total score
  const formattedScore = Math.round(totalScore * 10) / 10; // Round to 1 decimal place
  
  // Determine score level
  const getScoreLevel = (score: number) => {
    if (score >= 90) return { label: 'Outstanding', color: 'bg-green-500', textColor: 'text-green-800' };
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-400', textColor: 'text-green-700' };
    if (score >= 70) return { label: 'Very Good', color: 'bg-blue-500', textColor: 'text-blue-800' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-400', textColor: 'text-blue-700' };
    if (score >= 50) return { label: 'Satisfactory', color: 'bg-yellow-500', textColor: 'text-yellow-800' };
    if (score >= 40) return { label: 'Needs Improvement', color: 'bg-yellow-400', textColor: 'text-yellow-700' };
    return { label: 'Work Required', color: 'bg-red-500', textColor: 'text-red-700' };
  };
  
  const scoreLevel = getScoreLevel(formattedScore);
  
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Summary</CardTitle>
          <CardDescription>
            Loading evaluation scores...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="w-12 h-12 border-4 border-t-primary border-primary/30 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium">Loading Scores</h3>
          <p className="text-gray-500 mt-2">
            Fetching and calculating scores from all categories...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Summary</CardTitle>
          <CardDescription>
            Error loading scores
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Error Loading Scores</h3>
          <p className="text-red-500 mt-2">{error}</p>
          <p className="text-gray-500 mt-2">
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <Button 
            onClick={handleRefresh} 
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry Loading Scores
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If there's no data, show a message
  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Summary</CardTitle>
          <CardDescription>
            Complete skill evaluations to see a summary here
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Score Data Available</h3>
          <p className="text-gray-500 mt-2">
            Please complete scoring on the Nervousness, Voice, Body Language, Expressions,
            Language, and Ultimate Level tabs to see a summary of the scores.
          </p>
          <Button 
            onClick={handleRefresh} 
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Check for Scores
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall Score Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex justify-between items-center">
            <span>Overall Evaluation Score</span>
            <div className="flex items-center gap-2">
              <Badge className={`${scoreLevel.color} hover:${scoreLevel.color}`}>
                {scoreLevel.label}
              </Badge>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={handleRefresh} 
                title="Refresh scores"
                className="h-8 w-8 rounded-full"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Summary of all skill categories and final score
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center mb-8">
            <div className="text-6xl font-bold text-primary mb-2">
              {formattedScore}
            </div>
            <div className="text-lg text-gray-500">
              out of {maxScore}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Category Scores
            </h3>
            
            <div className="space-y-4">
              {Object.entries(categoryScores).length > 0 ? (
                Object.entries(categoryScores).map(([category, data]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category}</span>
                      <span className="text-sm text-gray-500">
                        {Math.round(data.score)}% ({data.count} skills scored)
                      </span>
                    </div>
                    <Progress 
                      value={data.score} 
                      className={`h-2 ${getProgressColorForScore(data.score)}`} 
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-2">No category scores available</p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 border-t text-sm text-gray-500 flex justify-between items-center">
          <div>
            Total skills evaluated: {Object.values(categoryScores).reduce((sum: any, cat: any) => sum + cat.count, 0)}
          </div>
          <div className="flex items-center">
            Last updated: {new Date().toLocaleString()}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-2 h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Critical Skills Card */}
      {(criticalStrengths.length > 0 || criticalImprovements.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-amber-500" />
              Critical Skills 
            </CardTitle>
            <CardDescription>
              Key strengths and areas for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h3 className="font-semibold text-green-700 mb-3">Strengths</h3>
                {criticalStrengths.length > 0 ? (
                  <ul className="space-y-2">
                    {criticalStrengths.map((skill: any) => (
                      <li key={skill.id} className="flex items-center p-2 bg-green-50 rounded-md">
                        <Badge variant="outline" className="mr-2 bg-green-100 text-green-700 border-green-200">
                          {skill.category}
                        </Badge>
                        <span>{skill.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No critical strengths selected</p>
                )}
              </div>
              
              {/* Areas for Improvement */}
              <div>
                <h3 className="font-semibold text-amber-700 mb-3">Areas for Improvement</h3>
                {criticalImprovements.length > 0 ? (
                  <ul className="space-y-2">
                    {criticalImprovements.map((skill: any) => (
                      <li key={skill.id} className="flex items-center p-2 bg-amber-50 rounded-md">
                        <Badge variant="outline" className="mr-2 bg-amber-100 text-amber-700 border-amber-200">
                          {skill.category}
                        </Badge>
                        <span>{skill.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No critical improvement areas selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Calculation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Score Details</CardTitle>
          <CardDescription>
            Detailed breakdown of score calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="points">
            <TabsList className="mb-4">
              <TabsTrigger value="points">Points by Category</TabsTrigger>
              <TabsTrigger value="formula">Calculation Method</TabsTrigger>
              <TabsTrigger value="debug">Debug Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="points">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left border-b pb-2">Category</th>
                      <th className="text-right border-b pb-2">Points</th>
                      <th className="text-right border-b pb-2">Max Possible</th>
                      <th className="text-right border-b pb-2">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categoryScores).map(([category, data]) => (
                      <tr key={category} className="border-b">
                        <td className="py-2">{category}</td>
                        <td className="text-right py-2">
                          {data.rawPoints.toFixed(2)}
                        </td>
                        <td className="text-right py-2">
                          {data.maxPossible.toFixed(2)}
                        </td>
                        <td className="text-right py-2">
                          {Math.round(data.score)}%
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-2">Total</td>
                      <td className="text-right py-2">
                        {formattedScore}
                      </td>
                      <td className="text-right py-2">
                        {maxScore}
                      </td>
                      <td className="text-right py-2">
                        {Math.round((formattedScore / maxScore) * 100)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="formula">
              <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-700">
                <h4 className="font-medium mb-2">Final Score Calculation:</h4>
                <p>{evaluation.results?.score_calculation || 'Score calculation not available'}</p>
                
                <div className="mt-4 border-t pt-4 border-gray-200">
                  <h4 className="font-medium mb-2 flex items-center">
                    <span>Custom Divider</span>
                    <Info className="h-4 w-4 ml-1 text-gray-400" />
                  </h4>
                  
                  {isEditingDivider ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={newDivider}
                        onChange={(e) => setNewDivider(e.target.value)}
                        step="0.1"
                        min="0.1"
                        className="w-32"
                        placeholder="New divider"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleUpdateDivider}
                        disabled={isUpdatingDivider}
                      >
                        {isUpdatingDivider ? 'Updating...' : 'Update'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingDivider(false);
                          setNewDivider(currentDivider?.toString() || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-bold">Current divider: {currentDivider?.toFixed(4) || 'Not set'}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsEditingDivider(true)}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    The divider normalizes all skill points to our 110-point scale. 
                    Changing the divider will recalculate the final score, but won't affect individual skill scores.
                  </p>
                </div>
                
                <h4 className="font-medium mt-4 mb-2">Explanation:</h4>
                <p>
                  The final score is calculated by adding points from all skill categories and
                  normalizing to a 110-point scale. Points for each skill are calculated as:
                </p>
                <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
                  Points = Skill Score × Weight
                </pre>
                <p className="mt-2">
                  For good skills, scores range from 0 to 10 (higher is better).
                  For bad skills, scores range from -10 to 0 (closer to 0 is better).
                </p>
                <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
                  Final Score = Total Points ÷ Custom Divider
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="debug">
              <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Info className="h-5 w-5 mr-2 text-blue-500" />
                    <h4 className="font-medium">Diagnostic Information</h4>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRefresh} 
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Refresh Scores
                  </Button>
                </div>
                
                <div className="mt-4 mb-2 bg-amber-50 p-3 rounded border border-amber-200">
                  <h5 className="font-medium text-amber-800 mb-1">If Some Categories Are Missing:</h5>
                  <p className="text-xs text-amber-700">
                    1. Make sure you've saved scores for each category tab.
                    2. Click "Refresh Scores" to ensure all saved scores are displayed.
                    3. Check below to see exactly which scores are in the database.
                  </p>
                </div>
                
                <h5 className="font-medium mt-4 mb-2 text-blue-600">Scores by Category:</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {['Nervousness', 'Voice', 'Body Language', 'Expressions', 'Language', 'Ultimate Level'].map((category: any) => {
                    const hasCategory = Object.keys(categoryScores).includes(category);
                    const count = hasCategory ? categoryScores[category].count : 0;
                    return (
                      <div 
                        key={category} 
                        className={`p-2 rounded border ${hasCategory ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="text-sm font-medium">{category}</div>
                        <div className={`text-xs ${hasCategory ? 'text-green-600' : 'text-gray-500'}`}>
                          {hasCategory 
                            ? `${count} skills scored (${Math.round(categoryScores[category].score)}%)` 
                            : 'Not evaluated yet'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <h5 className="font-medium mt-4 mb-2 text-blue-600">Raw Score Data ({rawScoreData.length} total):</h5>
                <div className="bg-gray-100 p-2 rounded overflow-auto max-h-[300px]">
                  <pre className="text-xs">
                    {JSON.stringify(rawScoreData, null, 2)}
                  </pre>
                </div>
                
                <h5 className="font-medium mt-4 mb-2 text-blue-600">Raw Results from API:</h5>
                <div className="bg-gray-100 p-2 rounded overflow-auto max-h-[300px]">
                  <pre className="text-xs">
                    {JSON.stringify(evaluation.results, null, 2)}
                  </pre>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h5 className="font-medium text-blue-800 mb-1">Manual Refresh Required:</h5>
                  <p className="text-xs text-blue-700">
                    If you're not seeing the latest scores, click the "Refresh Scores" button above.
                    The page doesn't automatically detect changes from other tabs.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function getProgressColorForScore(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}