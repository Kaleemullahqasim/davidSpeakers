import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSkillName, formatCategoryName, groupSkillsByCategory } from '@/lib/speechUtils';

interface ScoreAdjustmentSectionProps {
  analysis: any;
  adjustedScores: {[key: string]: number};
  onScoreChange: (skill: string, value: number) => void;
  onGoToAnalysis: () => void;
}

export function ScoreAdjustmentSection({ 
  analysis, 
  adjustedScores, 
  onScoreChange,
  onGoToAnalysis
}: ScoreAdjustmentSectionProps) {
  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">
            No analysis data available. Run the AI analysis first to adjust scores.
          </p>
          <Button 
            onClick={onGoToAnalysis}
            className="mt-4"
          >
            Go to AI Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupSkillsByCategory(analysis)).map(([category, skills]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{formatCategoryName(category)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(skills).map(([skill, data]: [string, any]) => {
                const currentScore = adjustedScores[skill] !== undefined 
                  ? adjustedScores[skill] 
                  : data.score;
                return (
                  <div key={skill} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{formatSkillName(skill)}</h3>
                      <span className={`font-semibold ${
                        currentScore > 0 
                          ? 'text-green-600' 
                          : currentScore < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                      }`}>
                        Score: {currentScore > 0 ? '+' : ''}{currentScore}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{data.explanation}</p>
                    
                    {data.words && data.words.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-medium text-gray-500 mb-2">DETECTED PHRASES</h5>
                        <div className="flex flex-wrap gap-2">
                          {data.words.slice(0, 5).map((word: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {word} ({data.frequency[word]})
                            </Badge>
                          ))}
                          {data.words.length > 5 && (
                            <Badge variant="outline">+{data.words.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>-10</span>
                        <span>0</span>
                        <span>+10</span>
                      </div>
                      <Slider 
                        className="mt-6"
                        value={[currentScore]}
                        min={-10}
                        max={10}
                        step={1}
                        onValueChange={(values) => {
                          onScoreChange(skill, values[0]);
                        }}
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Original AI score: {data.score > 0 ? '+' : ''}{data.score}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
