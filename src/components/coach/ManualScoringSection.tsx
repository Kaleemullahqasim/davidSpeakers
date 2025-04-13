import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface CategoryScore {
  score: number;
  notes?: string;
}

export interface ManualScores {
  nervousness: CategoryScore;
  voice: CategoryScore;
  body_language: CategoryScore;
  expressions: CategoryScore;
  ultimate_level: CategoryScore;
}

interface ManualScoringSectionProps {
  scores: ManualScores;
  onChange: (scores: ManualScores) => void;
  hasTranscript: boolean;
  isCompleted: boolean;
}

// Category descriptions to help coaches understand what to look for
const categoryDescriptions = {
  nervousness: "Evaluate how well the speaker manages their nervousness. Look for signs like trembling, excessive pauses, stuttering, or nervous gestures.",
  voice: "Assess voice modulation, pace, clarity, projection, and vocal variety. Consider if the speaker's voice engages the audience.",
  body_language: "Evaluate posture, gestures, movement, eye contact, and overall stage presence.",
  expressions: "Assess facial expressions, emotional conveyance, and how well the speaker connects emotionally with the audience.",
  ultimate_level: "Overall speaking ability and potential. How polished and professional is this speaker?"
}

// Labels for the scoring ranges to make scoring more intuitive
const scoreLabels = [
  { value: 1, label: "Poor" },
  { value: 3, label: "Below Average" },
  { value: 5, label: "Average" },
  { value: 7, label: "Good" },
  { value: 9, label: "Excellent" },
  { value: 10, label: "Outstanding" }
];

export function ManualScoringSection({ 
  scores, 
  onChange, 
  hasTranscript,
  isCompleted
}: ManualScoringSectionProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Update score for a specific category
  const handleScoreChange = (category: keyof ManualScores, score: number) => {
    if (isCompleted) return;
    onChange({
      ...scores,
      [category]: {
        ...scores[category],
        score
      }
    });
  };

  // Update notes for a specific category
  const handleNoteChange = (category: keyof ManualScores, notes: string) => {
    if (isCompleted) return;
    onChange({
      ...scores,
      [category]: {
        ...scores[category],
        notes
      }
    });
  };

  // Toggle expanded state for notes
  const toggleExpanded = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Convert category key to display name
  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!hasTranscript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Additional Scoring Categories</CardTitle>
          <CardDescription>
            Manual evaluation of non-language aspects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Transcription Required</h4>
            <p className="text-sm text-yellow-700">
              You need to transcribe the video before you can complete your review.
              Please go to the Transcript tab to generate a transcript.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Scoring Categories</CardTitle>
        <CardDescription>
          Manually evaluate non-language aspects of the speech
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-700">
              Score each category from 1-10, with 10 being the highest. Click on any category name for additional notes.
            </p>
          </div>
        </div>

        {Object.entries(scores).map(([category, data]) => (
          <div key={category} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="ghost" 
                className="p-0 h-auto text-lg font-semibold hover:bg-transparent hover:underline"
                onClick={() => toggleExpanded(category)}
              >
                {formatCategoryName(category)}
              </Button>
              <Badge 
                className={`text-lg px-3 py-1 ${getScoreBadgeColor(data.score)}`}
              >
                {data.score}
              </Badge>
            </div>
            
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-3">
                {categoryDescriptions[category as keyof typeof categoryDescriptions]}
              </p>
            </div>

            <div className="space-y-4">
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  {scoreLabels.map(label => (
                    <div key={label.value} className="text-center">
                      <div>{label.value}</div>
                      <div>{label.label}</div>
                    </div>
                  ))}
                </div>
                <Slider 
                  value={[data.score]}
                  min={1}
                  max={10}
                  step={1}
                  disabled={isCompleted}
                  onValueChange={(values) => handleScoreChange(category as keyof ManualScores, values[0])}
                  className="my-4"
                />
              </div>
              
              {expandedCategory === category && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Notes (optional)</p>
                  <Textarea 
                    placeholder={`Add specific observations about the speaker's ${formatCategoryName(category).toLowerCase()}...`}
                    value={data.notes || ''}
                    onChange={(e) => handleNoteChange(category as keyof ManualScores, e.target.value)}
                    disabled={isCompleted}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Helper function to get appropriate badge color based on score
function getScoreBadgeColor(score: number): string {
  if (score >= 9) return "bg-purple-100 text-purple-800";
  if (score >= 7) return "bg-green-100 text-green-800";
  if (score >= 5) return "bg-blue-100 text-blue-800";
  if (score >= 3) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}
