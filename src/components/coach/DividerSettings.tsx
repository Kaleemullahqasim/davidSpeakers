import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertCircle, Calculator } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { useToast } from '@/components/ui/use-toast';

interface DividerSettingsProps {
  evaluationId: string;
  currentDivider: number;
  maxTotalPoints: number;
  onDividerChange: (divider: number) => void;
}

export function DividerSettings({ 
  evaluationId, 
  currentDivider, 
  maxTotalPoints,
  onDividerChange 
}: DividerSettingsProps) {
  const [dividerValue, setDividerValue] = useState(currentDivider || maxTotalPoints / 110);
  const [calculatedMaxScore, setCalculatedMaxScore] = useState(110);
  const [isEdited, setIsEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Calculate what the max score would be with the current divider
  useEffect(() => {
    if (maxTotalPoints > 0 && dividerValue > 0) {
      setCalculatedMaxScore(maxTotalPoints / dividerValue);
    }
  }, [dividerValue, maxTotalPoints]);

  // Handle divider manual input
  const handleDividerInput = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setDividerValue(numValue);
      setIsEdited(true);
    }
  };

  // Handle slider input
  const handleSliderChange = (values: number[]) => {
    if (values.length > 0) {
      setDividerValue(values[0]);
      setIsEdited(true);
    }
  };

  // Set divider to make max score exactly 110
  const handleSetTo110 = () => {
    if (maxTotalPoints <= 0) {
      toast({
        title: "Cannot Calculate Divider",
        description: "No skill points available to calculate divider.",
        variant: "warning"
      });
      return;
    }
    
    const calculatedDivider = maxTotalPoints / 110;
    console.log(`Setting divider to ${calculatedDivider.toFixed(4)} to achieve max score of 110`);
    setDividerValue(calculatedDivider);
    setIsEdited(true);
  };

  // Save the new divider value
  const handleSave = async () => {
    if (dividerValue <= 0) {
      toast({
        title: "Invalid Divider",
        description: "Divider must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log(`Saving divider value: ${dividerValue.toFixed(4)}`);
      const response = await fetchWithAuth('/api/evaluations/update-divider', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId,
          divider: dividerValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save divider value');
      }
      
      const data = await response.json();
      console.log(`Divider updated. New final score: ${data.finalScore.toFixed(1)}`);

      onDividerChange(dividerValue);
      setIsEdited(false);
      
      toast({
        title: "Divider Updated",
        description: `The scoring divider has been updated to ${dividerValue.toFixed(4)}, resulting in a max score of ${calculatedMaxScore.toFixed(1)}`,
      });
    } catch (error) {
      console.error("Error saving divider:", error);
      toast({
        title: "Error Saving Divider",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 text-indigo-500 mr-2" />
          Scoring Divider Settings
        </CardTitle>
        <CardDescription>
          Customize how the final score is calculated from skill points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>About the Divider</AlertTitle>
          <AlertDescription>
            <p>The divider controls how skill points are converted to the final score out of 110.</p>
            <div className="bg-indigo-50 p-3 rounded mt-2 text-sm">
              <strong>How it works:</strong>
              <ol className="list-decimal ml-5 mt-1 space-y-1">
                <li>Sum the maximum potential points from all skills: <strong>{maxTotalPoints.toFixed(2)}</strong></li>
                <li>Divide by 110 to get the ideal divider: <strong>{(maxTotalPoints / 110).toFixed(4)}</strong></li>
                <li>This ensures the maximum possible score is exactly 110</li>
                <li>The final score is calculated as: <strong>Total Points ÷ Divider</strong></li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div>
            <Label htmlFor="divider-input">Divider Value</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="divider-input"
                type="number"
                min="0.01"
                step="0.01"
                value={dividerValue}
                onChange={(e) => handleDividerInput(e.target.value)}
                className="w-24"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSetTo110}
              >
                Set for Max 110
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="mb-2 block">Adjust Divider</Label>
            <Slider
              defaultValue={[dividerValue]}
              value={[dividerValue]}
              min={maxTotalPoints / 200}
              max={maxTotalPoints / 50}
              step={0.01}
              onValueChange={handleSliderChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Lower (Higher Max Score)</span>
              <span>Higher (Lower Max Score)</span>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Current Settings:</span>
              {isEdited && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Total Points:</span>
              </div>
              <div className="text-right font-medium">
                {maxTotalPoints.toFixed(2)}
              </div>
              <div>
                <span className="text-gray-600">Divider:</span>
              </div>
              <div className="text-right font-medium">
                {dividerValue.toFixed(4)}
              </div>
              <div>
                <span className="text-gray-600">Max Score:</span>
              </div>
              <div className="text-right font-medium">
                {calculatedMaxScore.toFixed(1)} / 110
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!isEdited || isSaving || dividerValue <= 0}
        >
          {isSaving ? 'Saving...' : 'Save Divider'}
        </Button>
      </CardFooter>
    </Card>
  );
}