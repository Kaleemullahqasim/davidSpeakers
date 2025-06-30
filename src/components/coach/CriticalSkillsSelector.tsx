import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface CriticalSkillsSelectorProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  isCompleted: boolean;
}

// Skill categories and their options
const skillCategories = {
  language: [
    { id: 'adapted_language', label: 'Adapted Language' },
    { id: 'flow', label: 'Flow & Transitions' },
    { id: 'filler_language', label: 'Reduce Filler Words' },
    { id: 'repetitive_words', label: 'Avoid Repetition' },
    { id: 'strong_rhetoric', label: 'Strong Rhetoric' }
  ],
  delivery: [
    { id: 'nervousness_management', label: 'Nervousness Management' },
    { id: 'vocal_variety', label: 'Vocal Variety' },
    { id: 'vocal_projection', label: 'Vocal Projection' },
    { id: 'pacing', label: 'Pacing & Timing' }
  ],
  nonverbal: [
    { id: 'posture', label: 'Posture' },
    { id: 'gestures', label: 'Effective Gestures' },
    { id: 'eye_contact', label: 'Eye Contact' },
    { id: 'facial_expressions', label: 'Facial Expressions' },
    { id: 'stage_presence', label: 'Stage Presence' }
  ],
  structure: [
    { id: 'clear_introduction', label: 'Clear Introduction' },
    { id: 'compelling_conclusion', label: 'Compelling Conclusion' },
    { id: 'logical_structure', label: 'Logical Structure' },
    { id: 'storytelling', label: 'Storytelling' },
    { id: 'audience_engagement', label: 'Audience Engagement' }
  ]
};

export function CriticalSkillsSelector({ 
  selectedSkills, 
  onChange, 
  isCompleted 
}: CriticalSkillsSelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('language');

  const handleToggleSkill = (skillId: string) => {
    if (isCompleted) return;
    
    if (selectedSkills.includes(skillId)) {
      onChange(selectedSkills.filter((id: any) => id !== skillId));
    } else {
      onChange([...selectedSkills, skillId]);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Format category name for display
  const formatCategoryName = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Critical Skills to Focus On</CardTitle>
        <CardDescription>
          Select key skills the student should prioritize for improvement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-700">
              Select 3-5 most important skills the student should focus on. These will be highlighted prominently in the student's feedback.
            </p>
          </div>
        </div>

        {Object.entries(skillCategories).map(([category, skills]) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              className="w-full p-4 text-left font-medium text-lg flex justify-between items-center hover:bg-gray-50 transition-colors"
              onClick={() => toggleCategory(category)}
            >
              {formatCategoryName(category)}
              <Badge variant="outline" className="bg-gray-100">
                {selectedSkills.filter((id: any) => 
                  skills.some(skill => skill.id === id)
                ).length} selected
              </Badge>
            </button>
            
            {expandedCategory === category && (
              <div className="p-4 border-t bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skills.map((skill: any) => (
                    <div key={skill.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={skill.id}
                        checked={selectedSkills.includes(skill.id)}
                        onCheckedChange={() => handleToggleSkill(skill.id)}
                        disabled={isCompleted}
                      />
                      <Label 
                        htmlFor={skill.id}
                        className={`${selectedSkills.includes(skill.id) ? 'font-medium' : ''} cursor-pointer`}
                      >
                        {skill.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="w-full">
          <p className="text-sm text-gray-600 mb-2">Selected focus areas ({selectedSkills.length}):</p>
          {selectedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((id: any) => {
                const skill = Object.values(skillCategories)
                  .flat()
                  .find((s: any) => s.id === id);
                return (
                  <Badge key={id} variant="secondary" className="bg-amber-100 text-amber-800">
                    {skill?.label || id}
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No skills selected yet</p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
