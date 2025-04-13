import { useState, useEffect } from 'react';
import { 
  nervousnessSkills, 
  voiceSkills, 
  bodyLanguageSkills,
  expressionsSkills,
  ultimateLevelSkills
} from '@/lib/skillsData';
import { ScoringTable, Skill } from '@/components/coach/ScoringTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { useToast } from '@/components/ui/use-toast';

interface ManualScoringTableProps {
  evaluationId: string;
  skillType: 'nervousness' | 'voice' | 'bodyLanguage' | 'expressions' | 'ultimateLevel';
  onScoresSaved?: () => void;
}

export function ManualScoringTable({ 
  evaluationId, 
  skillType,
  onScoresSaved 
}: ManualScoringTableProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Add a new state to track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeoutId, setAutoSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Map skillType to the actual skill arrays and friendly name
  const getSkillsForType = () => {
    switch (skillType) {
      case 'nervousness':
        return { skills: nervousnessSkills, name: 'Nervousness' };
      case 'voice':
        return { skills: voiceSkills, name: 'Voice' };
      case 'bodyLanguage':
        return { skills: bodyLanguageSkills, name: 'Body Language' };
      case 'expressions':
        return { skills: expressionsSkills, name: 'Expressions' };
      case 'ultimateLevel':
        return { skills: ultimateLevelSkills, name: 'Ultimate Level' };
      default:
        return { skills: [], name: '' };
    }
  };

  // Initialize skills on component mount
  useEffect(() => {
    const { skills, name } = getSkillsForType();
    
    // First check if we have existing scores from the database
    const fetchExistingScores = async () => {
      try {
        const response = await fetchWithAuth(`/api/evaluations/${evaluationId}/scores?type=${skillType}`, {
          method: 'GET'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.scores && data.scores.length > 0) {
            // Use existing scores if available
            const mappedSkills: Skill[] = skills.map(skill => {
              const existingScore = data.scores.find(s => s.skill_id === skill.id);
              return {
                id: skill.id,
                name: skill.name,
                maxScore: existingScore?.max_score || skill.maxScore,
                weight: existingScore?.weight || skill.weight,
                actualScore: existingScore?.actual_score || 0,
                points: (existingScore?.actual_score || 0) * (existingScore?.weight || skill.weight),
                isGoodSkill: skill.isGoodSkill,
                isAutomated: false
              };
            });
            setSkills(mappedSkills);
          } else {
            // Use defaults if no scores found
            const mappedSkills: Skill[] = skills.map(skill => ({
              id: skill.id,
              name: skill.name,
              maxScore: skill.maxScore,
              weight: skill.weight,
              actualScore: 0, // Default score
              points: 0, // Will be calculated
              isGoodSkill: skill.isGoodSkill,
              isAutomated: false // These are all manual
            }));
            setSkills(mappedSkills);
          }
        } else {
          throw new Error('Failed to fetch existing scores');
        }
      } catch (error) {
        console.error('Error fetching existing scores:', error);
        // Fallback to default scores
        const mappedSkills: Skill[] = skills.map(skill => ({
          id: skill.id,
          name: skill.name,
          maxScore: skill.maxScore,
          weight: skill.weight,
          actualScore: 0, // Default score
          points: 0, // Will be calculated
          isGoodSkill: skill.isGoodSkill,
          isAutomated: false // These are all manual
        }));
        setSkills(mappedSkills);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExistingScores();
    
    return () => {
      // Clean up the timeout on unmount
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId);
        
        // If there are unsaved changes, save them on unmount
        if (hasUnsavedChanges && skills.length > 0) {
          handleSave(skills);
        }
      }
    };
  }, [skillType, evaluationId]);

  // Handle saving the scores
  const handleSave = async (updatedSkills: Skill[]) => {
    setSaving(true);
    try {
      console.log(`Saving ${skillType} scores:`, updatedSkills);

      const response = await fetchWithAuth('/api/evaluations/save-scores', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId,
          skills: updatedSkills.map(skill => ({
            skill_id: skill.id,
            max_score: skill.maxScore,
            weight: skill.weight,
            actual_score: skill.actualScore,
            is_automated: false,
            // Calculate points explicitly
            points: (skill.actualScore || 0) * skill.weight
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save scores');
      }

      // Mark that changes have been saved
      setHasUnsavedChanges(false);
      
      toast({
        title: "Scores saved",
        description: `${getSkillsForType().name} skills have been scored successfully.`,
      });

      // Notify parent component if callback provided
      if (onScoresSaved) {
        onScoresSaved();
      }
    } catch (error) {
      console.error('Error saving scores:', error);
      toast({
        title: "Error saving scores",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Add auto-save functionality
  const handleSkillsChange = (updatedSkills: Skill[]) => {
    setSkills(updatedSkills);
    setHasUnsavedChanges(true);
    
    // Cancel any existing timeout
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
    }
    
    // Set a new timeout for auto-save
    const timeoutId = setTimeout(() => {
      if (hasUnsavedChanges) {
        handleSave(updatedSkills);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    setAutoSaveTimeoutId(timeoutId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Skills...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <p>Loading scoring interface...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScoringTable
      skills={skills}
      isAutomated={false}
      parentClass={getSkillsForType().name}
      onSave={handleSave}
      isSaving={saving}
      onChange={handleSkillsChange}
      hasUnsavedChanges={hasUnsavedChanges}
    />
  );
}
