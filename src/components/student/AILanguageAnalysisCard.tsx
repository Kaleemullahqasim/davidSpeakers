import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown,
  Info,
  Lightbulb,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AILanguageAnalysisCardProps {
  evaluation: any;
  expanded?: boolean;
}

export function AILanguageAnalysisCard({ evaluation, expanded = false }: AILanguageAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [activeTab, setActiveTab] = useState<string>("strengths");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  // Check if analysis data exists
  const hasLanguageAnalysis = evaluation?.results?.analysis?.language || {};
  
  // If no analysis data is available
  if (!hasLanguageAnalysis || Object.keys(hasLanguageAnalysis).length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader className="bg-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Language Analysis
          </CardTitle>
          <CardDescription>
            No language analysis is available for this evaluation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Group skills into strengths and areas for improvement
  const strengths: any[] = [];
  const improvements: any[] = [];
  
  Object.entries(hasLanguageAnalysis).forEach(([skillId, skillData]: [string, any]) => {
    const score = skillData.score || 0;
    const isGoodSkill = skillData.isGoodSkill !== undefined ? skillData.isGoodSkill : true;
    
    // For good skills, positive scores are strengths
    // For negative skills, negative scores close to 0 are strengths
    if ((isGoodSkill && score >= 5) || (!isGoodSkill && score >= -3)) {
      strengths.push({
        id: skillId,
        ...skillData,
        score: score
      });
    } else if ((isGoodSkill && score < 5) || (!isGoodSkill && score < -3)) {
      improvements.push({
        id: skillId,
        ...skillData,
        score: score
      });
    }
  });
  
  // Sort by score (descending for strengths, ascending for improvements)
  strengths.sort((a, b) => b.score - a.score);
  improvements.sort((a, b) => a.score - b.score);
  
  // Get selected skill details if any
  const selectedSkillDetails = selectedSkill ? 
    hasLanguageAnalysis[selectedSkill] : null;
  
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-green-600" />
            AI Language Analysis
          </div>
          {!expanded && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Google Gemini AI analysis of language patterns and rhetorical devices in your speech
        </CardDescription>
      </CardHeader>
      
      {!hasLanguageAnalysis || Object.keys(hasLanguageAnalysis).length === 0 ? (
        <CardContent>
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-center text-gray-600">No AI Analysis Available</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6">
              <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                This evaluation doesn't have AI language analysis yet. 
                This feature analyzes rhetorical devices and language patterns in your speech.
              </p>
              <Badge variant="outline" className="bg-gray-50">
                Manual evaluation only
              </Badge>
            </CardContent>
          </Card>
        </CardContent>
      ) : (
        <>
      <CardContent className="pt-4">
            <div className="mb-4 p-4 bg-white border border-gray-200 rounded-md">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium">How to read this analysis</h4>
              <p className="text-sm text-gray-600">
                This AI analysis evaluates your language skills on a scale from -10 to +10. 
                For positive skills (marked in blue), higher is better. 
                For negative skills (marked in orange), scores closer to 0 are better.
                Click on any skill to see detailed feedback.
              </p>
            </div>
          </div>
        </div>
        
        <div className={!isExpanded ? 'max-h-[450px] overflow-hidden' : ''}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left column: Skill list */}
            <div className="space-y-4">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="strengths" className="flex-1">
                    <ThumbsUp className="h-4 w-4 mr-2" /> Strengths ({strengths.length})
                  </TabsTrigger>
                  <TabsTrigger value="improvements" className="flex-1">
                    <ThumbsDown className="h-4 w-4 mr-2" /> To Improve ({improvements.length})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex-1">
                    All Skills
                  </TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[350px]">
                  <TabsContent value="strengths" className="space-y-2 mt-0 pr-2">
                    {strengths.length > 0 ? (
                      strengths.map((skill: any) => (
                        <SkillListItem 
                          key={skill.id} 
                          skill={skill} 
                          isSelected={selectedSkill === skill.id}
                          onClick={() => setSelectedSkill(selectedSkill === skill.id ? null : skill.id)}
                        />
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No strengths were identified.</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="improvements" className="space-y-2 mt-0 pr-2">
                    {improvements.length > 0 ? (
                      improvements.map((skill: any) => (
                        <SkillListItem 
                          key={skill.id} 
                          skill={skill}
                          isSelected={selectedSkill === skill.id}
                          onClick={() => setSelectedSkill(selectedSkill === skill.id ? null : skill.id)}
                        />
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No areas for improvement were identified.</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="all" className="space-y-2 mt-0 pr-2">
                    {Object.entries(hasLanguageAnalysis).map(([skillId, skillData]: [string, any]) => (
                      <SkillListItem 
                        key={skillId} 
                        skill={{ id: skillId, ...skillData }}
                        isSelected={selectedSkill === skillId}
                        onClick={() => setSelectedSkill(selectedSkill === skillId ? null : skillId)}
                      />
                    ))}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
            
            {/* Right column: Skill explanation */}
            <div className="border rounded-lg bg-gray-50/50">
              {selectedSkillDetails ? (
                <div className="p-4 h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Badge 
                        variant="outline" 
                        className={`mb-2 ${selectedSkillDetails.isGoodSkill ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}
                      >
                        {selectedSkillDetails.isGoodSkill ? 'Positive Skill' : 'Negative Skill'}
                      </Badge>
                      <h3 className="text-lg font-medium">{selectedSkillDetails.name}</h3>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getScoreTextColor(selectedSkillDetails.score, selectedSkillDetails.isGoodSkill)}`}>
                        {selectedSkillDetails.score.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedSkillDetails.isGoodSkill ? 'Target: 10' : 'Target: 0'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className={`${getScoreColor(selectedSkillDetails.score, selectedSkillDetails.isGoodSkill)} h-2 rounded-full`} 
                      style={{ width: `${getScorePercentage(selectedSkillDetails.score, selectedSkillDetails.isGoodSkill)}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium mb-2">Coach Feedback:</h4>
                    <div className="bg-white p-3 rounded-md border text-sm">
                      {selectedSkillDetails.explanation}
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">How to improve:</h4>
                      <div className="bg-white p-3 rounded-md border text-sm">
                        {getImprovementTips(selectedSkillDetails.name, selectedSkillDetails.isGoodSkill, selectedSkillDetails.score)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 h-full flex flex-col items-center justify-center text-center text-gray-500">
                  <Info className="h-12 w-12 mb-3 text-gray-400" />
                  <h3 className="font-medium">Select a skill</h3>
                  <p className="text-sm max-w-xs mt-2">
                    Click on any skill from the list to see detailed feedback and improvement tips.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
          </CardContent>
            </>
          )}
    </Card>
  );
}

// Component for simple skill list item
function SkillListItem({ skill, isSelected, onClick }: { skill: any, isSelected: boolean, onClick: () => void }) {
  // Determine the score color and percentage based on whether it's a good or bad skill
  const { color, displayScore } = getScoreDetails(skill);
  
  return (
    <div 
      className={`border rounded-lg p-3 cursor-pointer transition-all
      ${isSelected ? 'border-blue-500 bg-white' : 'hover:bg-gray-50'}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${skill.isGoodSkill ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}
          >
            {skill.isGoodSkill ? '+' : '-'}
          </Badge>
          <span className="font-medium truncate">{skill.name}</span>
        </div>
        
        <div className={`font-medium ${getScoreTextColor(skill.score, skill.isGoodSkill)}`}>
          {displayScore}
        </div>
      </div>
      
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className={`${color} h-1.5 rounded-full`} 
            style={{ width: `${getScorePercentage(skill.score, skill.isGoodSkill)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get score details
function getScoreDetails(skill: any) {
  const isGoodSkill = skill.isGoodSkill !== undefined ? skill.isGoodSkill : true;
  const score = skill.score || 0;
  
  const color = getScoreColor(score, isGoodSkill);
  const displayScore = score.toFixed(1);
  
  return { color, displayScore };
}

// Helper function to get score percentage for progress bar
function getScorePercentage(score: number, isGoodSkill: boolean): number {
  if (isGoodSkill) {
    // For good skills, 0-10 scale
    return Math.min(100, Math.max(0, score * 10));
  } else {
    // For bad skills, -10 to 0 scale (closer to 0 is better)
    const adjustedScore = Math.min(0, Math.max(-10, score));
    return Math.min(100, Math.max(0, (10 + adjustedScore) * 10));
  }
}

// Helper function to get score color for progress bar
function getScoreColor(score: number, isGoodSkill: boolean): string {
  if (isGoodSkill) {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-green-400';
    if (score >= 4) return 'bg-yellow-500';
    if (score >= 2) return 'bg-yellow-400';
    return 'bg-red-500';
  } else {
    const adjustedScore = Math.min(0, Math.max(-10, score));
    if (adjustedScore >= -2) return 'bg-green-500';
    if (adjustedScore >= -4) return 'bg-yellow-500';
    if (adjustedScore >= -6) return 'bg-yellow-400';
    if (adjustedScore >= -8) return 'bg-orange-500';
    return 'bg-red-500';
  }
}

// Helper function to get text color for score display
function getScoreTextColor(score: number, isGoodSkill: boolean): string {
  if (isGoodSkill) {
    if (score >= 8) return 'text-green-700';
    if (score >= 6) return 'text-green-600';
    if (score >= 4) return 'text-yellow-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  } else {
    const adjustedScore = Math.min(0, Math.max(-10, score));
    if (adjustedScore >= -2) return 'text-green-700';
    if (adjustedScore >= -4) return 'text-yellow-600';
    if (adjustedScore >= -6) return 'text-orange-600';
    return 'text-red-600';
  }
}

// Helper function to generate improvement tips based on skill name and score
function getImprovementTips(skillName: string, isGoodSkill: boolean, score: number): string {
  // For demonstration, we're generating generic tips based on skill categories
  // In a production environment, these could be more tailored or come from an API
  
  const skillNameLower = skillName.toLowerCase();
  
  // Negative skills
  if (!isGoodSkill) {
    if (skillNameLower.includes('filler')) {
      return "Practice pausing instead of using filler words. Record yourself speaking and note when you use fillers like 'um' or 'uh'. Replace these with confident pauses that give you time to think.";
    }
    
    if (skillNameLower.includes('negation')) {
      return "Try to rephrase negative statements in a positive way. Instead of saying 'don't forget', say 'remember'. This creates a more confident and assertive speaking style.";
    }
    
    if (skillNameLower.includes('repetitive')) {
      return "Expand your vocabulary by reading widely and learning synonyms. Use a thesaurus to find alternative ways to express the same idea when preparing your speeches.";
    }
    
    if (skillNameLower.includes('absolute')) {
      return "Avoid words like 'always', 'never', and 'all' unless they are truly accurate. Use more nuanced language like 'frequently', 'rarely', or 'most' to maintain credibility.";
    }
    
    return "Work on being more conscious of this habit and practice alternative phrasing. Recording yourself and getting feedback from others can help identify patterns.";
  }
  
  // Positive skills with low scores
  if (score < 5) {
    if (skillNameLower.includes('adapt')) {
      return "Research your audience more thoroughly before speaking. Consider their knowledge level, interests, and expectations, then tailor your vocabulary, examples, and style accordingly.";
    }
    
    if (skillNameLower.includes('flow')) {
      return "Improve transitions between ideas by using linking phrases like 'Furthermore', 'However', or 'As a result'. Practice your speech multiple times to ensure smooth delivery and logical progression.";
    }
    
    if (skillNameLower.includes('rhetoric')) {
      return "Study famous speeches and note the rhetorical devices they use. Incorporate techniques like metaphors, rule of three, or contrast to make your points more memorable and persuasive.";
    }
    
    if (skillNameLower.match(/tricolon|anaphora|epiphora|alliteration|climax|anadiplosis/)) {
      return "This is a specific rhetorical device that can enhance your speaking. Study examples and incorporate them intentionally in your speeches. Start by using them in key moments rather than throughout.";
    }
    
    if (skillNameLower.includes('strategic')) {
      return "Plan your speech with clearer objectives. What do you want your audience to think, feel, or do? Structure your content to build toward these goals with supporting evidence and emotional appeals.";
    }
    
    return "This is an area with room for growth. Study examples of speakers who excel at this skill and incorporate specific techniques into your practice sessions.";
  }
  
  // Positive skills with good scores
  return "You're already performing well in this area. To further excel, consider watching videos of expert speakers who are masters of this skill, and incorporate more advanced techniques into your speaking style.";
}