import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// Import the Badge component from the UI library
import { Badge } from '@/components/ui/badge';

export interface Skill {
  id: number;
  name: string;
  maxScore: number;
  weight: number;
  actualScore?: number;
  actualScoreAI?: number;
  adjustedScore?: number;
  points: number;
  isGoodSkill: boolean; // true for good skills, false for bad skills
  isAutomated: boolean;
  aiExplanation?: string; // Add explanation from AI
}

// Update the props interface
export interface ScoringTableProps {
  skills: Skill[];
  isAutomated: boolean;
  parentClass: string;
  onSave: (skills: Skill[]) => void;
  isSaving: boolean;
  onChange?: (skills: Skill[]) => void;
  hasUnsavedChanges?: boolean;
}

export function ScoringTable({ 
  skills: initialSkills, 
  isAutomated, 
  parentClass,
  onSave,
  isSaving,
  onChange,
  hasUnsavedChanges = false
}: ScoringTableProps) {
  const [localSkills, setLocalSkills] = useState<Skill[]>(initialSkills);
  const [isEdited, setIsEdited] = useState(false);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  // Update the skills when the props change
  useEffect(() => {
    setLocalSkills(initialSkills);
  }, [initialSkills]);

  // Update the updateSkill function to notify parent component
  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    setIsEdited(true);
    const updatedSkills = [...localSkills];
    
    // Handle special conversion cases
    if (field === 'maxScore' || field === 'actualScore' || field === 'adjustedScore') {
      // Allow negative values by correctly parsing them
      value = parseFloat(value);
      // Use 0 only if input is NaN, not if it's a valid negative number
      if (isNaN(value)) value = 0;
    } else if (field === 'weight') {
      value = parseFloat(value) || 0;
    }
    
    // Update the field
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value
    };
    
    // Recalculate points
    const skill = updatedSkills[index];
    const scoreToUse = field === 'adjustedScore' ? value : 
                      skill.adjustedScore !== undefined ? skill.adjustedScore : 
                      skill.actualScore !== undefined ? skill.actualScore : 
                      skill.actualScoreAI !== undefined ? skill.actualScoreAI : 0;
                      
    updatedSkills[index].points = scoreToUse * skill.weight;
    
    // Validate inputs
    validateSkills(updatedSkills);
    
    setLocalSkills(updatedSkills);

    // Notify parent component if provided
    if (onChange) {
      onChange(updatedSkills);
    }
  };

  const validateSkills = (skills: Skill[]) => {
    const hasErrors = skills.some(skill => {
      // Check for valid maxScore (1-10)
      if (skill.maxScore < 1 || skill.maxScore > 10) return true;
      
      // Check for valid weight (0-1)
      if (skill.weight < 0 || skill.weight > 1) return true;
      
      // Check for valid score ranges
      const scoreToCheck = skill.adjustedScore !== undefined ? skill.adjustedScore : 
                           skill.actualScore !== undefined ? skill.actualScore :
                           skill.actualScoreAI;
                           
      if (scoreToCheck === undefined) return true;
      
      // Good skills: 0 to maxScore
      // Bad skills: -maxScore to 0
      if (skill.isGoodSkill && (scoreToCheck < 0 || scoreToCheck > skill.maxScore)) return true;
      if (!skill.isGoodSkill && (scoreToCheck < -skill.maxScore || scoreToCheck > 0)) return true;
      
      return false;
    });
    
    setHasValidationErrors(hasErrors);
  };

  const handleSave = () => {
    if (hasValidationErrors) {
      return; // Don't save if there are validation errors
    }
    
    onSave(localSkills);
    setIsEdited(false);
  };

  // Calculate the total points and display info about the scoring
  const totalPoints = localSkills.reduce((sum, skill) => sum + skill.points, 0);
  const maxPoints = localSkills.reduce((sum, skill) => sum + (skill.maxScore * skill.weight), 0);
  const percentage = maxPoints ? (totalPoints / maxPoints) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            {parentClass} Skills Scoring
          </CardTitle>
          {(isEdited || hasUnsavedChanges) && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {isSaving ? 'Saving...' : 'Unsaved Changes'}
            </Badge>
          )}
        </div>
        <CardDescription>
          {isAutomated 
            ? "Review and adjust the AI-generated scores for language skills" 
            : "Score the student's performance on each skill"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {hasValidationErrors && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Error</AlertTitle>
            <AlertDescription>
              Please check your inputs:
              <ul className="list-disc pl-5 mt-2">
                <li>Maximum Score must be between 1 and 10</li>
                <li>Weight must be between 0 and 1</li>
                <li>Good skills must score between 0 and max</li>
                <li>Bad skills must score between -max and 0</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill #</TableHead>
                <TableHead>Skill Name</TableHead>
                <TableHead>Max Score</TableHead>
                <TableHead>Weight</TableHead>
                {isAutomated && <TableHead>AI Score</TableHead>}
                <TableHead>{isAutomated ? 'Adjusted Score' : 'Actual Score'}</TableHead>
                <TableHead>Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localSkills.map((skill, index) => (
                <TableRow key={skill.id}>
                  <TableCell>{skill.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {skill.name}
                              {isAutomated && skill.aiExplanation && showExplanations && (
                                <Info className="inline-block ml-1 h-3 w-3 text-gray-400" />
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            {isAutomated && skill.aiExplanation 
                              ? skill.aiExplanation 
                              : `Skill ID: ${skill.id}, ${skill.isGoodSkill ? 'Good Skill' : 'Bad Skill'}`}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        skill.isGoodSkill ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {skill.isGoodSkill ? 'Good' : 'Bad'}
                      </span>
                    </div>
                    {isAutomated && skill.aiExplanation && showExplanations && (
                      <div className="mt-1 text-xs text-gray-500 italic">{skill.aiExplanation}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={skill.maxScore}
                      min={1}
                      max={10}
                      className="w-16"
                      onChange={(e) => updateSkill(index, 'maxScore', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={skill.weight}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-16"
                      onChange={(e) => updateSkill(index, 'weight', e.target.value)}
                    />
                  </TableCell>
                  {isAutomated && (
                    <TableCell className="text-center">
                      {skill.actualScoreAI !== undefined ? skill.actualScoreAI : 'N/A'}
                    </TableCell>
                  )}
                  <TableCell>
                    <Input
                      type="number"
                      value={isAutomated ? 
                        (skill.adjustedScore !== undefined ? skill.adjustedScore : skill.actualScoreAI) : 
                        skill.actualScore
                      }
                      min={skill.isGoodSkill ? 0 : -skill.maxScore}
                      max={skill.isGoodSkill ? skill.maxScore : 0}
                      step={0.5}
                      className="w-16"
                      onChange={(e) => updateSkill(
                        index, 
                        isAutomated ? 'adjustedScore' : 'actualScore', 
                        e.target.value
                      )}
                      onBlur={(e) => {
                        // Ensure value is within bounds on blur
                        const value = parseFloat(e.target.value);
                        if (isNaN(value)) return;
                        
                        // For good skills, clamp between 0 and maxScore
                        // For bad skills, clamp between -maxScore and 0
                        const min = skill.isGoodSkill ? 0 : -skill.maxScore;
                        const max = skill.isGoodSkill ? skill.maxScore : 0;
                        
                        if (value < min || value > max) {
                          const clampedValue = Math.max(min, Math.min(max, value));
                          updateSkill(
                            index,
                            isAutomated ? 'adjustedScore' : 'actualScore',
                            clampedValue
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className={`font-semibold ${
                    skill.points > 0 ? 'text-green-600' : 
                    skill.points < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {skill.points.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            Total Points: <span className="font-bold">{totalPoints.toFixed(2)}</span>
            <br />
            Maximum Points: <span className="font-bold">
              {maxPoints.toFixed(2)}
            </span>
            <br />
            Percentage: <span className="font-bold">{percentage.toFixed(1)}%</span>
          </p>
          <p className="text-xs text-gray-400">
            Note: Final score will be calculated as (Total Points ÷ Divider) to scale to 110 max.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || hasValidationErrors || (!isEdited && !hasUnsavedChanges)}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}
