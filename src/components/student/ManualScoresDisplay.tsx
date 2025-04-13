import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoIcon } from 'lucide-react';

interface CategoryScore {
  score: number;
  notes?: string;
}

interface ManualScoresDisplayProps {
  scores: {
    nervousness: CategoryScore;
    voice: CategoryScore;
    body_language: CategoryScore;
    expressions: CategoryScore;
    ultimate_level: CategoryScore;
  };
  criticalSkills?: string[];
}

// Category descriptions for students to understand what was evaluated
const categoryDescriptions = {
  nervousness: "How well you manage anxiety and appear confident during your speech",
  voice: "Your vocal quality, including tone, pitch, volume, pace, and clarity",
  body_language: "Your physical presence, including posture, gestures, movement, and eye contact",
  expressions: "Your facial expressions and emotional connection with the audience",
  ultimate_level: "Your overall speaking ability and professional impression"
};

export function ManualScoresDisplay({ scores, criticalSkills = [] }: ManualScoresDisplayProps) {
  // Format category name from snake_case to Title Case
  const formatCategoryName = (category: string): string => {
    return category
      .split('_')
      .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Evaluation</CardTitle>
        <CardDescription>
          Coach's assessment of your speaking skills beyond language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Critical skills highlight box */}
        {criticalSkills.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
            <InfoIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800 mb-1">Focus Areas for Improvement</h4>
              <p className="text-sm text-amber-700 mb-2">
                Your coach suggests focusing on improving these specific aspects of your speaking:
              </p>
              <div className="flex flex-wrap gap-2">
                {criticalSkills.map((skill, index) => (
                  <Badge key={index} className="bg-amber-100 text-amber-800 border-amber-200">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scores display */}
        {Object.entries(scores).map(([category, data]) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{formatCategoryName(category)}</h3>
                  <Badge className={getScoreBadgeColor(data.score)}>
                    {data.score}/10
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                </p>
              </div>

              {/* Score visualization */}
              <div className="w-full md:w-64">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getScoreBarColor(data.score)}`}
                    style={{ width: `${(data.score/10)*100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Needs Work</span>
                  <span>Average</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>

            {/* Coach notes */}
            {data.notes && (
              <div className="bg-gray-50 p-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Coach Notes:</h4>
                <p className="text-sm text-gray-600">{data.notes}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Helper function to get score badge color
function getScoreBadgeColor(score: number): string {
  if (score >= 9) return "bg-purple-100 text-purple-800 border-purple-200";
  if (score >= 7) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 5) return "bg-blue-100 text-blue-800 border-blue-200";
  if (score >= 3) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

// Helper function to get score bar color
function getScoreBarColor(score: number): string {
  if (score >= 9) return "bg-purple-600";
  if (score >= 7) return "bg-green-600";
  if (score >= 5) return "bg-blue-600";
  if (score >= 3) return "bg-amber-500";
  return "bg-red-600";
}
