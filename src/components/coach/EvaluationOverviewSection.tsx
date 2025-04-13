import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertCircle, BookMarked, Calculator, Settings2, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { DividerSettings } from './DividerSettings';
import { calculateDivider, calculateFinalScore } from '@/lib/scoreCalculator';
import { useToast } from '@/components/ui/use-toast';

interface EvaluationOverviewSectionProps {
  evaluation: any;
  chartData: any[];
  hasTranscript: boolean;
  onTranscribe: () => void;
  isTranscribing: boolean;
  onGoToTranscript: () => void;
}

export function EvaluationOverviewSection({
  evaluation,
  chartData,
  hasTranscript,
  onTranscribe,
  isTranscribing,
  onGoToTranscript
}: EvaluationOverviewSectionProps) {
  const [showDividerSettings, setShowDividerSettings] = useState(false);
  const [localDivider, setLocalDivider] = useState<number | null>(null);
  const [localFinalScore, setLocalFinalScore] = useState<number | null>(null);
  const { toast } = useToast();

  // Get total points and calculate scores
  const maxTotalPoints = evaluation?.results?.skill_scores?.reduce((total: number, skill) => 
    total + (skill.max_score * skill.weight), 0) || 0;
  
  // Get divider from evaluation data, local state, or calculate it
  const divider = localDivider !== null ? localDivider : 
    evaluation?.results?.custom_divider || 
    calculateDivider(maxTotalPoints);
  
  const finalScore = localFinalScore !== null ? localFinalScore : 
    evaluation?.final_score || 0;

  // Handle divider changes from the DividerSettings component
  const handleDividerChange = (newDivider: number) => {
    console.log(`Divider changed to: ${newDivider.toFixed(4)}`);
    setLocalDivider(newDivider);
    
    // Calculate new final score based on total points
    const totalPoints = evaluation?.results?.skill_scores?.reduce((total: number, skill) => {
      const scoreToUse = skill.is_automated 
        ? (skill.adjusted_score !== null ? skill.adjusted_score : skill.actual_score_ai) 
        : skill.actual_score;
      return total + ((scoreToUse || 0) * skill.weight);
    }, 0) || 0;
    
    const newFinalScore = calculateFinalScore(totalPoints, newDivider);
    setLocalFinalScore(newFinalScore);
    
    toast({
      title: "Divider Applied",
      description: `Final score recalculated to ${newFinalScore.toFixed(1)} out of 110`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Summary</CardTitle>
            <CardDescription>Overview of current evaluation status</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Basic info about the evaluation */}
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Student</span>
                <p className="font-medium">{evaluation.users?.name || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{evaluation.status.replace(/_/g, ' ')}</Badge>
                  {!hasTranscript && (
                    <Badge variant="destructive">No Transcript</Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Video</span>
                <p className="font-medium truncate">{evaluation.video_id}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Submission Date</span>
                <p className="font-medium">{new Date(evaluation.created_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {!hasTranscript ? (
              <Button 
                onClick={onTranscribe} 
                disabled={isTranscribing}
                className="w-full"
              >
                {isTranscribing ? 'Generating Transcript...' : 'Generate Transcript'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={onGoToTranscript}
                className="w-full"
              >
                View Transcript
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* NEW SCORING & DIVIDER CARD */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-500" />
                Final Score Calculation
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDividerSettings(!showDividerSettings)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                {showDividerSettings ? 'Hide Settings' : 'Adjust Divider'}
              </Button>
            </div>
            <CardDescription>
              View and adjust how the final score is calculated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Divider Value</h3>
                <Badge variant="outline" className="bg-white">
                  {divider.toFixed(4)}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Total Points:</span>
                  <span className="font-medium">{maxTotalPoints.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Formula:</span>
                  <span className="font-medium">Total Points ÷ Divider = Final Score</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Calculation:</span>
                  <span className="font-medium">{maxTotalPoints.toFixed(2)} ÷ {divider.toFixed(4)} = {finalScore.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">Final Score:</div>
                <div className="text-3xl font-bold text-indigo-600">{finalScore.toFixed(1)}<span className="text-gray-400 text-lg">/110</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Show divider settings if enabled */}
      {showDividerSettings && (
        <DividerSettings 
          evaluationId={evaluation.id}
          currentDivider={divider}
          maxTotalPoints={maxTotalPoints}
          onDividerChange={handleDividerChange}
        />
      )}

      {/* Skills analysis chart */}
      {chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Skills Analysis</CardTitle>
            <CardDescription>
              Overview of skills identified and scored for this evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number" 
                    domain={[-10, 10]} 
                    tickCount={11} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="skill" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value > 0 ? '+' : ''}${value}`, 'Score']}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar 
                    dataKey="score" 
                    radius={[0, 4, 4, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.score > 0 ? '#10b981' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : hasTranscript ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 text-amber-500 mr-2" />
              Skills Analysis Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Skills Analysis Yet</AlertTitle>
              <AlertDescription>
                This evaluation has a transcript but no skills analysis. Go to the Language tab
                to run AI analysis, or manually score the other skill categories.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Skills Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Transcript Needed</AlertTitle>
              <AlertDescription>
                Generate a transcript first to enable skills analysis.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
