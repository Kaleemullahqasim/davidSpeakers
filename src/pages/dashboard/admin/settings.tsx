import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSkills, fetchScoringRules, updateScoringRule, updateSkillWeight } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { PlusIcon, TrashIcon } from 'lucide-react';

export default function AdminSettings() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: fetchSkills,
    enabled: !!user?.id && user?.role === 'admin'
  });
  
  const { data: scoringRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['scoring-rules', selectedSkill],
    queryFn: () => fetchScoringRules(selectedSkill as string),
    enabled: !!selectedSkill
  });
  
  const updateWeightMutation = useMutation({
    mutationFn: ({ skillId, weight }: { skillId: string, weight: number }) => 
      updateSkillWeight(skillId, weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast({
        title: 'Weight updated',
        description: 'Skill weight has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating weight',
        description: error instanceof Error ? error.message : 'Failed to update skill weight',
        variant: 'destructive',
      });
    }
  });
  
  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, updates }: { ruleId: string, updates: any }) => 
      updateScoringRule(ruleId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rules', selectedSkill] });
      toast({
        title: 'Rule updated',
        description: 'Scoring rule has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating rule',
        description: error instanceof Error ? error.message : 'Failed to update scoring rule',
        variant: 'destructive',
      });
    }
  });

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user || user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Scoring System Settings</h1>
          <p className="text-gray-600">
            Adjust how the AI evaluates and scores speech patterns
          </p>
        </div>

        <Tabs defaultValue="skills">
          <TabsList>
            <TabsTrigger value="skills">Language Skills</TabsTrigger>
            <TabsTrigger value="thresholds">Scoring Thresholds</TabsTrigger>
          </TabsList>
          
          <TabsContent value="skills" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill Weightage</CardTitle>
                <CardDescription>
                  Adjust the importance of each language skill in the overall evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skillsLoading ? (
                  <p>Loading skills...</p>
                ) : skills?.length ? (
                  <div className="space-y-8">
                    {Object.entries(groupByCategory(skills)).map(([category, categorySkills]) => (
                      <div key={category} className="space-y-4">
                        <h3 className="font-medium text-lg capitalize">{category.replace('_', ' ')}</h3>
                        <div className="space-y-6">
                          {(categorySkills as any[]).map((skill: any) => (
                            <div key={skill.id} className="space-y-2">
                              <div className="flex justify-between">
                                <Label>{skill.name.replace('_', ' ')}</Label>
                                <span className="text-sm font-medium">
                                  Weight: {skill.weight}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <Slider
                                  value={[skill.weight]}
                                  max={10}
                                  step={1}
                                  className="flex-1"
                                  onValueChange={(values) => {
                                    if (values[0] !== skill.weight) {
                                      updateWeightMutation.mutate({
                                        skillId: skill.id,
                                        weight: values[0],
                                      });
                                    }
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedSkill(skill.id)}
                                >
                                  Configure Thresholds
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No skills configured yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="thresholds" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scoring Thresholds</CardTitle>
                <CardDescription>
                  Configure how many occurrences of a pattern result in a specific score
                </CardDescription>
              </CardHeader>
              <CardContent>
                {skillsLoading ? (
                  <p>Loading skills...</p>
                ) : skills?.length ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {skills.map((skill: any) => (
                        <Button
                          key={skill.id}
                          variant={selectedSkill === skill.id ? 'default' : 'outline'}
                          className="justify-start"
                          onClick={() => setSelectedSkill(skill.id)}
                        >
                          {skill.name.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    {selectedSkill && (
                      <div className="space-y-4">
                        <h3 className="font-medium text-lg">
                          {skills.find((s: any) => s.id === selectedSkill)?.name.replace('_', ' ')} Thresholds
                        </h3>
                        
                        {rulesLoading ? (
                          <p>Loading thresholds...</p>
                        ) : scoringRules?.length ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 font-medium text-sm text-gray-500 px-2">
                              <div className="col-span-5">Occurrences Range</div>
                              <div className="col-span-5">Score</div>
                              <div className="col-span-2">Actions</div>
                            </div>
                            
                            {scoringRules.map((rule: any) => (
                              <div key={rule.id} className="grid grid-cols-12 gap-4 items-center border p-2 rounded-md">
                                <div className="col-span-5 flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={rule.min_occurrences}
                                    min={0}
                                    className="w-20"
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value, 10);
                                      if (!isNaN(value) && value >= 0) {
                                        updateRuleMutation.mutate({
                                          ruleId: rule.id,
                                          updates: { min_occurrences: value }
                                        });
                                      }
                                    }}
                                  />
                                  <span>to</span>
                                  <Input
                                    type="number"
                                    value={rule.max_occurrences === null ? '∞' : rule.max_occurrences}
                                    min={rule.min_occurrences}
                                    className="w-20"
                                    onChange={(e) => {
                                      const value = e.target.value === '∞' ? null : parseInt(e.target.value, 10);
                                      if (value === null || (!isNaN(value) && value >= rule.min_occurrences)) {
                                        updateRuleMutation.mutate({
                                          ruleId: rule.id,
                                          updates: { max_occurrences: value }
                                        });
                                      }
                                    }}
                                  />
                                </div>
                                <div className="col-span-5">
                                  <Input
                                    type="number"
                                    value={rule.score}
                                    min={-10}
                                    max={10}
                                    className="w-20"
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value, 10);
                                      if (!isNaN(value) && value >= -10 && value <= 10) {
                                        updateRuleMutation.mutate({
                                          ruleId: rule.id,
                                          updates: { score: value }
                                        });
                                      }
                                    }}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            <Button
                              variant="outline"
                              className="w-full"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add New Threshold
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-4 space-y-4">
                            <p className="text-gray-500">
                              No thresholds configured for this skill yet.
                            </p>
                            <Button>
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add First Threshold
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!selectedSkill && (
                      <div className="text-center py-12 text-gray-500">
                        Select a skill from above to configure its scoring thresholds
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No skills configured yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Helper function to group skills by category
function groupByCategory(skills: any[]): Record<string, any[]> {
  return skills.reduce((acc: Record<string, any[]>, skill: any) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});
}
