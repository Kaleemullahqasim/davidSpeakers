import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserEvaluations } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface SkillsProgressChartProps {
  currentEvaluationId: string;
}

export function SkillsProgressChart({ currentEvaluationId }: SkillsProgressChartProps) {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const data = await fetchUserEvaluations(user.id);
        
        console.log('SkillsProgressChart: Raw evaluations data:', data);
        
        // Filter only completed evaluations with actual data
        const completedEvaluations = data
          .filter(evaluation => {
            const hasCompletedStatus = ['completed', 'reviewed', 'published'].includes(evaluation.status);
            const hasResults = evaluation.results && 
              (evaluation.results.categories_summary || evaluation.results.manual_scores || evaluation.results.skill_scores);
            
            console.log(`Evaluation ${evaluation.id.slice(0, 8)}:`, {
              status: evaluation.status,
              hasCompletedStatus,
              hasResults,
              hasCategorySummary: !!evaluation.results?.categories_summary,
              hasManualScores: !!evaluation.results?.manual_scores,
              hasSkillScores: !!evaluation.results?.skill_scores
            });
            
            return hasCompletedStatus && hasResults;
          })
          .sort((a, b) => new Date(a.completed_at || a.created_at).getTime() - 
                          new Date(b.completed_at || b.created_at).getTime());
        
        console.log('SkillsProgressChart: Filtered completed evaluations:', completedEvaluations.length);
        setEvaluations(completedEvaluations);
      } catch (err) {
        console.error('Error fetching evaluations:', err);
        setError('Failed to load evaluation data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [user?.id]);

  // Enhanced data extraction function - only return scores for categories with actual data
  const extractCategoryScore = (evaluation: any, categoryKey: string): number | null => {
    const results = evaluation.results;
    if (!results) return null;

    // Try categories_summary first
    if (results.categories_summary) {
      const summary = results.categories_summary;
      
      // Try different variations of the category name
      const variations = [
        categoryKey,
        categoryKey.toLowerCase(),
        categoryKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
        categoryKey.replace(/([A-Z])/g, ' $1').trim(),
        categoryKey.replace(/_/g, ' '),
        categoryKey.replace(/_/g, ''),
        // Add specific mappings
        categoryKey === 'bodyLanguage' ? 'Body Language' : categoryKey,
        categoryKey === 'ultimateLevel' ? 'Ultimate Level' : categoryKey,
        categoryKey === 'nervousness' ? 'Nervousness' : categoryKey,
        categoryKey === 'voice' ? 'Voice' : categoryKey,
        categoryKey === 'expressions' ? 'Expressions' : categoryKey,
        categoryKey === 'language' ? 'Language' : categoryKey
      ];
      
      for (const variation of variations) {
        if (summary[variation] !== undefined) {
          const scoreData = summary[variation];
          
          // Only return a score if there's actual data (count > 0)
          if (scoreData.count && scoreData.count > 0) {
            const rawScore = scoreData.score || 0;
            
            // Convert score to percentage based on maxPossible
            if (scoreData.maxPossible && scoreData.maxPossible > 0) {
              // Calculate percentage: (rawPoints / maxPossible) * 100
              const percentage = (scoreData.rawPoints / scoreData.maxPossible) * 100;
              
              // Handle negative scores (like nervousness) by converting to 0-100 scale
              // For negative skills, lower negative values are better, so we need to invert
              if (percentage < 0) {
                // Convert negative percentage to positive scale: -100% becomes 0%, 0% becomes 50%
                return Math.max(0, Math.min(100, 50 + (percentage / 2)));
              } else {
                // For positive scores, ensure they're in 0-100 range
                return Math.max(0, Math.min(100, percentage));
              }
            } else {
              // Fallback: convert raw score to percentage assuming it's on a -10 to 10 scale
              const percentage = ((rawScore + 10) / 20) * 100;
              return Math.max(0, Math.min(100, percentage));
            }
          }
        }
      }
    }

    // Try manual_scores as fallback
    if (results.manual_scores) {
      const manualScores = results.manual_scores;
      const variations = [categoryKey, categoryKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')];
      
      for (const variation of variations) {
        if (manualScores[variation]?.score !== undefined) {
          const score = manualScores[variation].score;
          return score <= 10 ? score * 10 : score; // Convert 0-10 to 0-100 if needed
        }
      }
    }

    // Return null if no real data found (don't show fake data)
    return null;
  };

  // Transform evaluations data for the chart
  const chartData = evaluations.map((evaluation, index) => {
    console.log(`Processing evaluation ${index + 1} (${evaluation.id.slice(0, 8)}):`, evaluation.results);
    
    const dataPoint = {
      name: `Evaluation ${index + 1}`,
      evaluationId: evaluation.id,
      date: new Date(evaluation.completed_at || evaluation.created_at).toLocaleDateString(),
      nervousness: extractCategoryScore(evaluation, 'nervousness'),
      voice: extractCategoryScore(evaluation, 'voice'),
      bodyLanguage: extractCategoryScore(evaluation, 'bodyLanguage'),
      expressions: extractCategoryScore(evaluation, 'expressions'),
      language: extractCategoryScore(evaluation, 'language'),
      ultimateLevel: extractCategoryScore(evaluation, 'ultimateLevel')
    };
    
    console.log(`Chart data point ${index + 1}:`, dataPoint);
    return dataPoint;
  });

  // Determine which categories have data across evaluations
  const categoriesWithData = {
    nervousness: chartData.some(d => d.nervousness !== null),
    voice: chartData.some(d => d.voice !== null),
    bodyLanguage: chartData.some(d => d.bodyLanguage !== null),
    expressions: chartData.some(d => d.expressions !== null),
    language: chartData.some(d => d.language !== null),
    ultimateLevel: chartData.some(d => d.ultimateLevel !== null)
  };

  console.log('Categories with actual data:', categoriesWithData);

  // Colors for each line - using more distinct colors
  const lineColors = {
    nervousness: '#ef4444',    // Red
    voice: '#3b82f6',          // Blue  
    bodyLanguage: '#10b981',   // Green
    expressions: '#f59e0b',    // Amber
    language: '#8b5cf6',       // Purple
    ultimateLevel: '#06b6d4'   // Cyan
  };

  // Enhanced tooltip formatter
  const formatTooltipValue = (value: number, name: string) => {
    if (value === null || value === undefined) return ['No data', name];
    
    const formattedName = name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str: string) => str.toUpperCase())
      .replace('Body Language', 'Body Language')
      .replace('Ultimate Level', 'Ultimate Level');
    
    return [`${value.toFixed(1)}%`, formattedName];
  };

  const formatTooltipLabel = (label: string) => {
    const dataPoint = chartData.find(d => d.name === label);
    return dataPoint ? `${label} (${dataPoint.date})` : label;
  };

  if (isLoading) {
    return (
      <Card className="h-full bg-white">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
            Skills Progress Over Time
          </CardTitle>
          <CardDescription>Loading your progress data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full bg-white">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            Skills Progress Over Time
          </CardTitle>
          <CardDescription>Error loading progress data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have enough data points
  if (chartData.length < 2) {
    return (
      <Card className="h-full bg-white">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
            Skills Progress Over Time
          </CardTitle>
          <CardDescription>Track your improvement across evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="text-center p-6 max-w-sm">
              <TrendingUp className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Not enough data yet</h3>
              <p className="text-sm text-gray-600">
                This chart will show your progress when you have completed two or more evaluations with scored results.
              </p>
              {chartData.length === 1 && (
                <p className="text-xs text-gray-500 mt-2">
                  You have 1 completed evaluation. Submit another video to see your progress!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Count how many categories actually have data
  const categoriesWithDataCount = Object.values(categoriesWithData).filter(Boolean).length;

  return (
    <Card className="h-full bg-white">
      <CardHeader className="bg-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
          Skills Progress Over Time
        </CardTitle>
        <CardDescription>
          Your improvement across {chartData.length} completed evaluations ({categoriesWithDataCount} categories with data)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
                label={{ 
                  value: 'Score (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#64748b' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  padding: '12px'
                }}
                formatter={formatTooltipValue}
                labelFormatter={formatTooltipLabel}
                cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: '12px',
                  paddingTop: '10px'
                }}
                formatter={(value) => (
                  <span style={{ color: '#64748b' }}>
                    {value.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </span>
                )}
              />
              
              {/* Only render lines for categories that have data */}
              {categoriesWithData.nervousness && (
                <Line 
                  type="monotone" 
                  dataKey="nervousness" 
                  stroke={lineColors.nervousness}
                  strokeWidth={3}
                  dot={{ fill: lineColors.nervousness, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: lineColors.nervousness, strokeWidth: 2, fill: 'white' }}
                  connectNulls={false}
                />
              )}
              {categoriesWithData.voice && (
                <Line 
                  type="monotone" 
                  dataKey="voice" 
                  stroke={lineColors.voice}
                  strokeWidth={3}
                  dot={{ fill: lineColors.voice, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: lineColors.voice, strokeWidth: 2, fill: 'white' }}
                  connectNulls={false}
                />
              )}
              {categoriesWithData.bodyLanguage && (
                <Line 
                  type="monotone" 
                  dataKey="bodyLanguage" 
                  stroke={lineColors.bodyLanguage}
                  strokeWidth={3}
                  dot={{ fill: lineColors.bodyLanguage, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: lineColors.bodyLanguage, strokeWidth: 2, fill: 'white' }}
                  connectNulls={false}
                />
              )}
              {categoriesWithData.expressions && (
                <Line 
                  type="monotone" 
                  dataKey="expressions" 
                  stroke={lineColors.expressions}
                  strokeWidth={3}
                  dot={{ fill: lineColors.expressions, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: lineColors.expressions, strokeWidth: 2, fill: 'white' }}
                  connectNulls={false}
                />
              )}
              {categoriesWithData.language && (
                <Line 
                  type="monotone" 
                  dataKey="language" 
                  stroke={lineColors.language}
                  strokeWidth={3}
                  dot={{ fill: lineColors.language, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: lineColors.language, strokeWidth: 2, fill: 'white' }}
                  connectNulls={false}
                />
              )}
              {categoriesWithData.ultimateLevel && (
                <Line 
                  type="monotone" 
                  dataKey="ultimateLevel" 
                  stroke={lineColors.ultimateLevel}
                  strokeWidth={3}
                  dot={{ fill: lineColors.ultimateLevel, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: lineColors.ultimateLevel, strokeWidth: 2, fill: 'white' }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Show information about which categories have data */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">
            <strong>Categories with evaluation data:</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoriesWithData).map(([category, hasData]) => 
              hasData && (
                <span 
                  key={category}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ 
                    backgroundColor: lineColors[category as keyof typeof lineColors] + '20',
                    color: lineColors[category as keyof typeof lineColors],
                    border: `1px solid ${lineColors[category as keyof typeof lineColors]}40`
                  }}
                >
                  {category.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                </span>
              )
            )}
          </div>
          {categoriesWithDataCount < 6 && (
            <p className="text-xs text-gray-500 mt-2">
              Other categories will appear as you complete more evaluations with those skill assessments.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 