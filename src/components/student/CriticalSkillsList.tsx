import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CriticalSkillsListProps {
  criticalSkills: string[];
}

export function CriticalSkillsList({ criticalSkills }: CriticalSkillsListProps) {
  if (!criticalSkills || criticalSkills.length === 0) {
    return null;
  }
  
  // Get all skills
  const allSkills = getAllSkills();
  
  // Separate into strengths and improvement areas
  const strengths: any[] = [];
  const improvementAreas: any[] = [];
  
  criticalSkills.forEach(skillId => {
    const skill = allSkills.find(s => s.id.toString() === skillId);
    if (skill) {
      if (skill.isGoodSkill) {
        strengths.push(skill);
      } else {
        improvementAreas.push(skill);
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Focus Areas</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="text-green-600 h-5 w-5" />
              <h3 className="font-semibold text-green-700">Your Strengths</h3>
            </div>
            
            {strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map(skill => (
                  <li key={skill.id} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 bg-green-50 text-green-700 border-green-200">
                      {getParentClassForSkill(skill.id)}
                    </Badge>
                    <span className="text-gray-700">{skill.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No specific strengths highlighted.</p>
            )}
          </div>
          
          {/* Areas for Improvement */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ThumbsDown className="text-amber-600 h-5 w-5" />
              <h3 className="font-semibold text-amber-700">Areas to Improve</h3>
            </div>
            
            {improvementAreas.length > 0 ? (
              <ul className="space-y-2">
                {improvementAreas.map(skill => (
                  <li key={skill.id} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 bg-amber-50 text-amber-700 border-amber-200">
                      {getParentClassForSkill(skill.id)}
                    </Badge>
                    <span className="text-gray-700">{skill.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No specific areas for improvement highlighted.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getAllSkills() {
  const { 
    nervousnessSkills, 
    voiceSkills, 
    bodyLanguageSkills, 
    expressionsSkills, 
    languageSkills, 
    ultimateLevelSkills 
  } = require('@/lib/skillsData');
  
  return [
    ...nervousnessSkills,
    ...voiceSkills,
    ...bodyLanguageSkills, 
    ...expressionsSkills,
    ...languageSkills,
    ...ultimateLevelSkills
  ];
}

function getParentClassForSkill(skillId: number): string {
  const { getParentClassForSkill } = require('@/lib/skillsData');
  return getParentClassForSkill(skillId);
}
