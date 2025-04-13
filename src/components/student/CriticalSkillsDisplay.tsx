import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react';
import { 
  nervousnessSkills, 
  voiceSkills, 
  bodyLanguageSkills, 
  expressionsSkills, 
  languageSkills, 
  ultimateLevelSkills 
} from '@/lib/skillsData';

interface CriticalSkillsDisplayProps {
  criticalSkills: string[];
}

export function CriticalSkillsDisplay({ criticalSkills }: CriticalSkillsDisplayProps) {
  if (!criticalSkills || criticalSkills.length === 0) {
    return null;
  }

  // Combine all skills
  const allSkills = [
    ...nervousnessSkills,
    ...voiceSkills,
    ...bodyLanguageSkills,
    ...expressionsSkills,
    ...languageSkills,
    ...ultimateLevelSkills
  ];

  // Get skill details for the critical skills
  const criticalSkillDetails = criticalSkills
    .map((skillId: any) => {
      const skill = allSkills.find((s: any) => s.id.toString() === skillId);
      return skill ? {
        id: skill.id,
        name: skill.name,
        isGoodSkill: skill.isGoodSkill,
        category: getSkillCategory(skill.id)
      } : null;
    })
    .filter((skill: any) => skill !== null);

  // Separate good and bad skills
  const goodSkills = criticalSkillDetails.filter((skill: any) => skill?.isGoodSkill);
  const badSkills = criticalSkillDetails.filter((skill: any) => !skill?.isGoodSkill);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Critical Skills Assessment</CardTitle>
        <CardDescription>
          Key areas of strength and opportunities for improvement identified by your coach
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center mb-3">
              <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-lg text-green-800">Your Strengths</h3>
            </div>
            {goodSkills.length === 0 ? (
              <p className="text-gray-500 italic">No strengths highlighted</p>
            ) : (
              <ul className="space-y-2">
                {goodSkills.map((skill: any) => (
                  <li key={skill?.id} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{skill?.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({skill?.category})</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <div className="flex items-center mb-3">
              <ThumbsDown className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="font-semibold text-lg text-amber-800">Areas for Improvement</h3>
            </div>
            {badSkills.length === 0 ? (
              <p className="text-gray-500 italic">No areas for improvement highlighted</p>
            ) : (
              <ul className="space-y-2">
                {badSkills.map((skill: any) => (
                  <li key={skill?.id} className="flex items-start">
                    <XCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{skill?.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({skill?.category})</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get the category of a skill
function getSkillCategory(skillId: number): string {
  if (skillId >= 1 && skillId <= 6) return "Nervousness";
  if (skillId >= 7 && skillId <= 24) return "Voice";
  if (skillId >= 25 && skillId <= 59) return "Body Language";
  if (skillId >= 60 && skillId <= 84) return "Expressions";
  if (skillId >= 85 && skillId <= 102) return "Language";
  if (skillId >= 103 && skillId <= 110) return "Ultimate Level";
  return "Other";
}
