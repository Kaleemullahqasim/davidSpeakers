import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Search, ThumbsUp, ThumbsDown, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchWithAuth } from '@/lib/auth-helpers';
import { useToast } from '@/components/ui/use-toast';
import { 
  nervousnessSkills, 
  voiceSkills, 
  bodyLanguageSkills, 
  expressionsSkills, 
  languageSkills, 
  ultimateLevelSkills,
  getParentClassForSkill
} from '@/lib/skillsData';

interface CriticalSkillsTabProps {
  evaluationId: string;
  existingCriticalSkills: string[];
}

export function CriticalSkillsTab({ evaluationId, existingCriticalSkills = [] }: CriticalSkillsTabProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(existingCriticalSkills || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSkillType, setSelectedSkillType] = useState<string>('all');
  const { toast } = useToast();

  // Combine all skills
  const allSkills = useMemo(() => [
    ...nervousnessSkills,
    ...voiceSkills,
    ...bodyLanguageSkills,
    ...expressionsSkills,
    ...languageSkills,
    ...ultimateLevelSkills
  ], []);

  // Get unique categories for dropdown
  const categories = useMemo(() => {
    const uniqueCategoriesSet = new Set(allSkills.map(skill => getParentClassForSkill(skill.id)));
    const uniqueCategories = Array.from(uniqueCategoriesSet);
  }, [allSkills]);

  // Filter skills based on search, category, and skill type
  const filteredSkills = useMemo(() => {
    return allSkills.filter(skill => {
      const skillName = skill.name.toLowerCase();
      const searchMatch = !searchTerm || skillName.includes(searchTerm.toLowerCase());
      
      const categoryMatch = selectedCategory === 'all' || 
        getParentClassForSkill(skill.id).toLowerCase() === selectedCategory.toLowerCase();
      
      const typeMatch = selectedSkillType === 'all' || 
        (selectedSkillType === 'good' && skill.isGoodSkill) || 
        (selectedSkillType === 'bad' && !skill.isGoodSkill);
      
      return searchMatch && categoryMatch && typeMatch;
    });
  }, [allSkills, searchTerm, selectedCategory, selectedSkillType]);

  // Separate selected skills into strengths and areas for improvement
  const selectedSkillDetails = useMemo(() => {
    return selectedSkills.map(skillId => {
      const skill = allSkills.find(s => s.id.toString() === skillId);
      return skill ? {
        id: skill.id.toString(),
        name: skill.name,
        isGoodSkill: skill.isGoodSkill,
        category: getParentClassForSkill(skill.id)
      } : null;
    }).filter(Boolean);
  }, [selectedSkills, allSkills]);

  const strengths = useMemo(() => 
    selectedSkillDetails.filter(skill => skill?.isGoodSkill)
  , [selectedSkillDetails]);
  
  const areasForImprovement = useMemo(() => 
    selectedSkillDetails.filter(skill => !skill?.isGoodSkill)
  , [selectedSkillDetails]);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      } else {
        return [...prev, skillId];
      }
    });
  };

  const handleSaveCriticalSkills = async () => {
    setIsSaving(true);
    try {
      const response = await fetchWithAuth('/api/evaluations/update-critical-skills', {
        method: 'POST',
        body: JSON.stringify({
          evaluationId,
          criticalSkills: selectedSkills
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save critical skills');
      }
      
      toast({
        title: 'Critical Skills Saved',
        description: `${selectedSkills.length} skills selected as critical`,
      });
      
    } catch (error) {
      console.error('Error saving critical skills:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save critical skills',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Critical Skills Selection</CardTitle>
          <CardDescription>
            Select key strengths and improvement areas to highlight for the student
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Skill Selection */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => 
                        category !== 'All Categories' && (
                          <SelectItem key={category} value={category.toLowerCase()}>
                            {category}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Skill Type</label>
                  <Select
                    value={selectedSkillType}
                    onValueChange={(value) => setSelectedSkillType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="good">Strengths</SelectItem>
                      <SelectItem value="bad">Areas for Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search skills..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="h-[400px] border rounded-md p-2 overflow-y-auto">
                <div className="space-y-1">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map(skill => (
                      <div 
                        key={skill.id}
                        className={`
                          flex items-center justify-between p-2 rounded-md text-sm 
                          ${selectedSkills.includes(skill.id.toString()) ? 'bg-primary/10' : 'hover:bg-gray-100'}
                          cursor-pointer
                        `}
                        onClick={() => toggleSkill(skill.id.toString())}
                      >
                        <div className="flex items-center">
                          <Badge variant={skill.isGoodSkill ? "success" : "destructive"} className="mr-2 w-6 h-6 flex items-center justify-center p-1">
                            {skill.isGoodSkill ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
                          </Badge>
                          <div>
                            <span>{skill.name}</span>
                            <div className="text-xs text-gray-500">{getParentClassForSkill(skill.id)}</div>
                          </div>
                        </div>
                        <div>
                          {selectedSkills.includes(skill.id.toString()) ? (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <PlusCircle className="h-4 w-4 text-gray-400" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No skills match your search criteria
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right side: Selected Skills */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Selected Skills ({selectedSkills.length})</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-2">
                    <ThumbsUp className="h-4 w-4 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-800">Strengths ({strengths.length})</h4>
                  </div>
                  <div className="border rounded-md p-2 min-h-[100px]">
                    {strengths.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500 italic">
                        No strengths selected
                      </div>
                    ) : (
                      <div className="h-[150px] overflow-y-auto">
                        <div className="space-y-1">
                          {strengths.map(skill => (
                            <div key={skill?.id} className="flex justify-between items-center p-2 text-sm hover:bg-gray-100 rounded-md">
                              <div>
                                <span>{skill?.name}</span>
                                <div className="text-xs text-gray-500">{skill?.category}</div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                onClick={() => toggleSkill(skill?.id as string)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <ThumbsDown className="h-4 w-4 text-amber-600 mr-2" />
                    <h4 className="font-semibold text-amber-800">Areas for Improvement ({areasForImprovement.length})</h4>
                  </div>
                  <div className="border rounded-md p-2 min-h-[100px]">
                    {areasForImprovement.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-sm text-gray-500 italic">
                        No areas for improvement selected
                      </div>
                    ) : (
                      <div className="h-[150px] overflow-y-auto">
                        <div className="space-y-1">
                          {areasForImprovement.map(skill => (
                            <div key={skill?.id} className="flex justify-between items-center p-2 text-sm hover:bg-gray-100 rounded-md">
                              <div>
                                <span>{skill?.name}</span>
                                <div className="text-xs text-gray-500">{skill?.category}</div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                                onClick={() => toggleSkill(skill?.id as string)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleSaveCriticalSkills}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Critical Skills...' : 'Save Critical Skills'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
