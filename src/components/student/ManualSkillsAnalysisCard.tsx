import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { getSkillById, getParentClassForSkill } from '@/lib/skillsData';

interface ManualSkillsAnalysisCardProps {
  evaluationId: string;
  expanded?: boolean;
}

interface SkillScore {
  skill_id: number;
  actual_score: number;
  max_score: number;
  weight: number;
  points: number;
}

export function ManualSkillsAnalysisCard({ evaluationId, expanded = false }: ManualSkillsAnalysisCardProps) {
  const [skillScores, setSkillScores] = useState<SkillScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('nervousness');

  // Fetch manual skill scores from the database
  useEffect(() => {
    const fetchManualScores = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth(`/api/evaluations/${evaluationId}/scores`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch skill scores');
        }
        
        const data = await response.json();
        
        // Filter for manual scores only (is_automated = false)
        const manualScores = data.scores?.filter((score: any) => !score.is_automated) || [];
        setSkillScores(manualScores);
      } catch (err) {
        console.error('Error fetching manual scores:', err);
        setError(err instanceof Error ? err.message : 'Failed to load manual scores');
      } finally {
        setLoading(false);
      }
    };

    if (evaluationId) {
      fetchManualScores();
    }
  }, [evaluationId]);

  // Group skills by category
  const groupedSkills = React.useMemo(() => {
    const groups: Record<string, SkillScore[]> = {
      nervousness: [],
      voice: [],
      'body language': [],
      expressions: [],
      'ultimate level': []
    };

    skillScores.forEach(score => {
      const category = getParentClassForSkill(score.skill_id).toLowerCase();
      if (groups[category]) {
        groups[category].push(score);
      }
    });

    return groups;
  }, [skillScores]);

  // Calculate category averages
  const categoryAverages = React.useMemo(() => {
    const averages: Record<string, { score: number; count: number }> = {};
    
    Object.entries(groupedSkills).forEach(([category, skills]) => {
      if (skills.length > 0) {
        const totalScore = skills.reduce((sum, skill) => sum + skill.actual_score, 0);
        averages[category] = {
          score: totalScore / skills.length,
          count: skills.length
        };
      }
    });
    
    return averages;
  }, [groupedSkills]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || skillScores.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 text-blue-500 mr-2" />
            Coach Manual Skill Analysis
          </CardTitle>
          <CardDescription>
            Detailed breakdown of manually scored skills by your coach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>{error || 'No manual skill scores available'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCategoryName = (category: string) => {
    return category.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 text-blue-500 mr-2" />
          Coach Manual Skill Analysis
          <Badge variant="outline" className="ml-2">
            {skillScores.length} Skills Evaluated
          </Badge>
        </CardTitle>
        <CardDescription>
          Detailed breakdown of manually scored skills by your coach across all categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            {Object.entries(categoryAverages).map(([category, data]) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="text-xs"
              >
                <div className="flex flex-col items-center">
                  <span>{formatCategoryName(category)}</span>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {data.count} skills
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedSkills).map(([category, skills]) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-4">
              {skills.length > 0 ? (
                <>
                  {/* Category Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">
                        {formatCategoryName(category)} Skills
                      </h3>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(categoryAverages[category]?.score || 0, 10)}`}>
                          {(categoryAverages[category]?.score || 0).toFixed(1)}/10
                        </div>
                        <div className="text-sm text-gray-600">
                          Average Score
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={(categoryAverages[category]?.score || 0) * 10} 
                      className="h-2"
                    />
                  </div>

                  {/* Individual Skills */}
                  <div className="space-y-3">
                    {skills.map((skill, index) => {
                      const skillInfo = getSkillById(skill.skill_id);
                      const percentage = (skill.actual_score / skill.max_score) * 100;
                      
                      return (
                        <div key={skill.skill_id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                {skillInfo?.name || `Skill ${skill.skill_id}`}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={skillInfo?.isGoodSkill ? "secondary" : "destructive"}
                                  className="text-xs"
                                >
                                  {skillInfo?.isGoodSkill ? "Strength" : "Improvement Area"}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Weight: {skill.weight}x
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getScoreColor(skill.actual_score, skill.max_score)}`}>
                                {skill.actual_score.toFixed(1)}/{skill.max_score}
                              </div>
                              <div className="text-xs text-gray-600">
                                {skill.points.toFixed(1)} pts
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(skill.actual_score, skill.max_score)}`}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {percentage.toFixed(0)}% of maximum score
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p>No manual scores available for {formatCategoryName(category)} skills</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
} 