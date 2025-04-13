import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingUp, PieChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScoreDetailsCardProps {
  categoryScores: Record<string, any>;
  finalScore: number;
}

export function ScoreDetailsCard({ categoryScores, finalScore }: ScoreDetailsCardProps) {
  // Debug logging to identify data structure issues
  useEffect(() => {
    console.log('ScoreDetailsCard - Raw categoryScores:', categoryScores);
    console.log('ScoreDetailsCard - finalScore:', finalScore);
  }, [categoryScores, finalScore]);

  // Safely process categories with better error handling
  const processedCategories = Object.entries(categoryScores || {}).map(([name, data]) => {
    console.log(`Processing category ${name}:`, data);
    
    // Default values
    let score = 0;
    let count = 0;
    let rawPoints = 0;
    let maxPossible = 0;
    
    // Handle different data structure possibilities
    if (typeof data === 'object' && data !== null) {
      // Handle case where data has direct score property
      if (data.score !== undefined) {
        score = Math.round(data.score || 0);
      }
      
      // Get count of skills
      count = data.count || 0;
      
      // Get raw points - check various property names
      rawPoints = data.rawPoints || data.raw_points || data.points || 0;
      
      // Get max possible points - check various property names
      maxPossible = data.maxPossible || data.max_possible || data.max || 0;
    } else if (typeof data === 'number') {
      // Handle case where data is just a number (the score)
      score = Math.round(data || 0);
    }
    
    console.log(`Processed values for ${name}: score=${score}, count=${count}, rawPoints=${rawPoints}, maxPossible=${maxPossible}`);
    
    return {
      name,
      score,
      count,
      rawPoints,
      maxPossible
    };
  });
  
  // Sort categories by score (highest first)
  const sortedCategories = [...processedCategories].sort((a, b) => b.score - a.score);
  
  // Calculate total skills
  const totalSkills = sortedCategories.reduce((sum, cat) => sum + cat.count, 0);
  
  // Calculate total points
  const totalPoints = sortedCategories.reduce((sum, cat) => sum + cat.rawPoints, 0);
  const maxTotalPoints = sortedCategories.reduce((sum, cat) => sum + cat.maxPossible, 0);
  
  // Format the final score
  const formattedFinalScore = Math.round(finalScore * 10) / 10;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Score Breakdown</CardTitle>
        <CardDescription>
          Analysis of your performance across different skill categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories">
          <TabsList className="mb-4">
            <TabsTrigger value="categories" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>Categories</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              <span>Details</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories">
            <div className="space-y-4">
              {sortedCategories.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Your performance is scored across {sortedCategories.length} categories consisting of {totalSkills} individual skills. 
                    Here's how you scored in each category:
                  </p>
                  
                  {sortedCategories.map(category => (
                    <div key={category.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.name}</span>
                        <span className={`text-sm ${getProgressColorForScore(category.score)}`}>
                          {category.score}%
                        </span>
                      </div>
                      <Progress 
                        value={category.score} 
                        className={`h-2 ${getProgressColorClass(category.score)}`} 
                      />
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>{category.count} skills</span>
                        <span>Score: {category.score}%</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">
                    No detailed category scores available. Your overall score is {formattedFinalScore}/110.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Final Score</div>
                    <div className="text-2xl font-bold text-primary">{formattedFinalScore}</div>
                    <div className="text-xs text-gray-400">out of 110</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Skills Evaluated</div>
                    <div className="text-2xl font-bold">{totalSkills}</div>
                    <div className="text-xs text-gray-400">across {sortedCategories.length} categories</div>
                  </div>
                </div>
              </div>
              
              {sortedCategories.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Category</th>
                        <th className="text-right py-2">Score</th>
                        <th className="text-right py-2">Skills</th>
                        <th className="text-right py-2">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCategories.map(category => (
                        <tr key={category.name} className="border-b last:border-0">
                          <td className="py-2">{category.name}</td>
                          <td className="text-right py-2 font-medium">
                            <Badge className={getBadgeColorClass(category.score)}>
                              {category.score}%
                            </Badge>
                          </td>
                          <td className="text-right py-2 text-gray-500">
                            {category.count}
                          </td>
                          <td className="text-right py-2 text-gray-500">
                            {category.rawPoints.toFixed(1)} / {category.maxPossible.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t font-bold bg-gray-50">
                        <td className="py-2">Overall</td>
                        <td className="text-right py-2" colSpan={1}>{formattedFinalScore}/110</td>
                        <td className="text-right py-2">{totalSkills}</td>
                        <td className="text-right py-2">{totalPoints.toFixed(1)} / {maxTotalPoints.toFixed(1)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No detailed score data available</p>
                  <p className="text-gray-400 text-sm mt-2">Overall score: {formattedFinalScore}/110</p>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-4">
                <p>Score Calculation:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Each skill is scored on a scale of 0-10 (higher is better) or -10-0 (lower is better)</li>
                  <li>Skills are weighted and combined into category scores shown as percentages</li>
                  <li>The final score is calculated on a scale of 0-110</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper functions for colors
function getProgressColorForScore(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getProgressColorClass(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getBadgeColorClass(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 hover:bg-green-100';
  if (score >= 60) return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
  return 'bg-red-100 text-red-800 hover:bg-red-100';
}
