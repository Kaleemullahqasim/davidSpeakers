import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllSkills, getParentClassForSkill } from '@/lib/skillsData';

interface StrengthsImprovementsCardProps {
  criticalSkills: string[];
  expanded?: boolean;
}

export function StrengthsImprovementsCard({ criticalSkills, expanded = false }: StrengthsImprovementsCardProps) {
  if (!criticalSkills || criticalSkills.length === 0) {
    return null;
  }

  // Get all skills
  const allSkills = getAllSkills();
  
  // Get skill details for the critical skills
  const criticalSkillDetails = criticalSkills
    .map((skillId: any) => {
      const skill = allSkills.find((s: any) => s.id.toString() === skillId);
      return skill ? {
        id: skill.id,
        name: skill.name,
        isGoodSkill: skill.isGoodSkill,
        category: getParentClassForSkill(skill.id)
      } : null;
    })
    .filter((skill: any) => skill !== null);

  // Separate good and bad skills
  const strengths = criticalSkillDetails.filter((skill: any) => skill?.isGoodSkill);
  const improvements = criticalSkillDetails.filter((skill: any) => !skill?.isGoodSkill);

  return (
    <Card className="mb-6 bg-white">
      <CardHeader className="bg-white rounded-t-lg">
        <CardTitle>Your Key Strengths & Improvement Areas</CardTitle>
        <CardDescription>
          Based on your coach's evaluation of your presentation skills
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-lg text-green-800">Your Strengths</h3>
            </div>
            
            <ScrollArea className={expanded ? "h-[400px]" : "h-[200px]"}>
              {strengths.length > 0 ? (
                <ul className="space-y-3 pr-4">
                  {strengths.map((skill, index) => (
                    <React.Fragment key={skill?.id}>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{skill?.name}</span>
                          <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                            {skill?.category}
                          </Badge>
                        </div>
                      </li>
                      {index < strengths.length - 1 && (
                        <Separator className="my-1 bg-green-200/50" />
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No specific strengths highlighted</p>
              )}
            </ScrollArea>
          </div>
          
          {/* Areas for Improvement */}
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <ThumbsDown className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="font-semibold text-lg text-amber-800">Areas for Improvement</h3>
            </div>
            
            <ScrollArea className={expanded ? "h-[400px]" : "h-[200px]"}>
              {improvements.length > 0 ? (
                <ul className="space-y-3 pr-4">
                  {improvements.map((skill, index) => (
                    <React.Fragment key={skill?.id}>
                      <li className="flex items-start">
                        <XCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{skill?.name}</span>
                          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                            {skill?.category}
                          </Badge>
                        </div>
                      </li>
                      {index < improvements.length - 1 && (
                        <Separator className="my-1 bg-amber-200/50" />
                      )}
                    </React.Fragment>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No areas for improvement highlighted</p>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
