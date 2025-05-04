import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { useToast } from '@/components/ui/use-toast';
import { ScoringTable, Skill } from './ScoringTable';
import { languageSkills } from '@/lib/skillsData'; // Import language skills

interface AIScoreTableProps {
  evaluationId: string;
  aiAnalysis?: any;
}

export function AIScoreTable({ evaluationId, aiAnalysis }: AIScoreTableProps) {
  const [adjustedScores, setAdjustedScores] = useState<{[key: string]: number}>({});
  const [aiScores, setAiScores] = useState<{[key: string]: Skill}>({});
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  // Load the AI analysis and format it for display
  useEffect(() => {
    if (aiAnalysis) {
      console.log("Loading AI analysis:", aiAnalysis);
      const formattedScores: {[key: string]: Skill} = {};
      
      // Format language analysis
      if (aiAnalysis.language) {
        Object.entries(aiAnalysis.language).forEach(([skillId, data]: [string, any]) => {
          formattedScores[skillId] = {
            id: parseInt(skillId),
            name: data.name,
            maxScore: 10,
            weight: 1,
            actualScoreAI: data.score,
            adjustedScore: adjustedScores[skillId] !== undefined ? adjustedScores[skillId] : data.score,
            points: (adjustedScores[skillId] !== undefined ? adjustedScores[skillId] : data.score) * 1,
            isGoodSkill: data.isGoodSkill,
            isAutomated: true,
            aiExplanation: data.explanation
          };
        });
      }
      
      setAiScores(formattedScores);
    }
  }, [aiAnalysis, adjustedScores]);

  // Function to save the adjusted scores
  const handleSaveScores = async (skills: Skill[]) => {
    setIsSaving(true);
    
    try {
      // Format the skills data for the API
      const formattedSkills = skills.map((skill: any) => ({
        skill_id: skill.id,
        max_score: skill.maxScore,
        weight: skill.weight,
        actual_score_ai: skill.actualScoreAI,
        adjusted_score: skill.adjustedScore,
        is_automated: true
      }));
      
      console.log("Saving skills:", formattedSkills);
      
      const response = await fetchWithAuth('/api/evaluations/save-scores', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId,
          skills: formattedSkills
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save scores');
      }
      
      toast({
        title: 'Scores saved',
        description: 'The adjusted scores have been saved successfully',
      });
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving scores:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save scores',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleScoreChange = (skills: Skill[]) => {
    // Track changes to notify parent component
    const newAdjustedScores = { ...adjustedScores };
    
    skills.forEach((skill: any) => {
      if (skill.adjustedScore !== undefined) {
        newAdjustedScores[skill.id] = skill.adjustedScore;
      }
    });
    
    setAdjustedScores(newAdjustedScores);
    setHasUnsavedChanges(true);
  };

  // Get all skills that were analyzed by AI
  const analyzedSkills = Object.values(aiScores);
  
  // Get all language skills defined in the system
  const allLanguageSkills = languageSkills.map((skill: any) => {
    // If we have AI analysis for this skill, use those values
    const aiData = aiScores[skill.id];
    
    return {
      id: skill.id,
      name: skill.name,
      maxScore: 10,
      weight: 1,
      actualScoreAI: aiData?.actualScoreAI,
      adjustedScore: aiData?.adjustedScore,
      points: aiData?.points || 0,
      isGoodSkill: skill.isGoodSkill,
      isAutomated: true,
      aiExplanation: aiData?.aiExplanation
    };
  });

  // Sort skills by ID to ensure correct order
  const sortedAnalyzedSkills = [...analyzedSkills].sort((a, b) => a.id - b.id);
  const sortedAllSkills = [...allLanguageSkills].sort((a, b) => a.id - b.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Google Gemini AI Language Analysis</span>
          <Badge variant="secondary" className="ml-2">
            AI Generated
          </Badge>
        </CardTitle>
        <CardDescription>
          Review and adjust the AI-generated scores for language patterns and rhetorical devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="detected">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="detected">
                With Detected Scores
                <Badge variant="outline" className="ml-2 bg-blue-50">
                  {sortedAnalyzedSkills.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="all">
                All Language Skills
                <Badge variant="outline" className="ml-2 bg-blue-50">
                  {sortedAllSkills.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="detected">
            {sortedAnalyzedSkills.length > 0 ? (
              <ScoringTable
                skills={sortedAnalyzedSkills}
                isAutomated={true}
                parentClass="Language"
                onSave={handleSaveScores}
                isSaving={isSaving}
                onChange={handleScoreChange}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No AI analysis available yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            <ScoringTable
              skills={sortedAllSkills}
              isAutomated={true}
              parentClass="Language"
              onSave={handleSaveScores}
              isSaving={isSaving}
              onChange={handleScoreChange}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
