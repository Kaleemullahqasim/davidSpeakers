import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ParentClassScore } from '@/lib/scoreCalculator';
import { DividerSettings } from './DividerSettings';
import { Settings2, Calculator } from 'lucide-react';

interface ParentClassSummaryProps {
  parentClasses: ParentClassScore[];
  divider: number;
  finalScore: number;
  maxTotalScore: number;
  evaluationId: string;
  isCoach?: boolean;
}

export function ParentClassSummary({ 
  parentClasses, 
  divider, 
  finalScore, 
  maxTotalScore,
  evaluationId,
  isCoach = false
}: ParentClassSummaryProps) {
  const [showDividerSettings, setShowDividerSettings] = useState(false);
  const [customDivider, setCustomDivider] = useState(divider);
  const [customFinalScore, setCustomFinalScore] = useState(finalScore);

  const handleDividerChange = (newDivider: number) => {
    setCustomDivider(newDivider);
    // Recalculate final score
    const totalPoints = parentClasses.reduce((sum, pc) => sum + pc.totalPoints, 0);
    const newFinalScore = newDivider > 0 ? totalPoints / newDivider : 0;
    setCustomFinalScore(newFinalScore);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Overall Scoring Summary</CardTitle>
              <CardDescription>
                Summary of scores across all skill categories
              </CardDescription>
            </div>
            {isCoach && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDividerSettings(!showDividerSettings)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                {showDividerSettings ? 'Hide Divider Settings' : 'Adjust Divider'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent Class</TableHead>
                <TableHead className="text-right">Skills</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
                <TableHead className="text-right">Maximum Points</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parentClasses.map((parentClass) => (
                <TableRow key={parentClass.name}>
                  <TableCell className="font-medium">{parentClass.name}</TableCell>
                  <TableCell className="text-right">{parentClass.skillCount}</TableCell>
                  <TableCell className="text-right">{parentClass.totalPoints.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{parentClass.maxPoints.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {parentClass.maxPoints > 0 
                      ? `${((parentClass.totalPoints / parentClass.maxPoints) * 100).toFixed(1)}%` 
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">
                  {parentClasses.reduce((sum, pc) => sum + pc.skillCount, 0)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {parentClasses.reduce((sum, pc) => sum + pc.totalPoints, 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {maxTotalScore.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {maxTotalScore > 0 
                    ? `${((parentClasses.reduce((sum, pc) => sum + pc.totalPoints, 0) / maxTotalScore) * 100).toFixed(1)}%` 
                    : 'N/A'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mb-4 flex items-center">
              <Calculator className="h-5 w-5 text-indigo-500 mr-2" />
              <h3 className="text-lg font-medium">Score Calculation</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Current Maximum Total Score:</strong> {maxTotalScore.toFixed(2)} points<br />
                <strong>Divider{customDivider !== divider ? ' (Custom)' : ''}:</strong> {customDivider.toFixed(4)}<br />
                <strong>Formula:</strong> Total Points ÷ Divider = Final Score
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold">Final Score: </span>
                <span className="text-3xl font-bold text-indigo-600">{customFinalScore.toFixed(1)}</span>
                <span className="text-lg text-gray-500"> / 110</span>
              </div>
              <div className="text-sm text-gray-600">
                {parentClasses.reduce((sum, pc) => sum + pc.totalPoints, 0).toFixed(2)} ÷ {customDivider.toFixed(4)} = {customFinalScore.toFixed(1)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isCoach && showDividerSettings && (
        <DividerSettings 
          evaluationId={evaluationId}
          currentDivider={divider}
          maxTotalPoints={maxTotalScore}
          onDividerChange={handleDividerChange}
        />
      )}
    </div>
  );
}
