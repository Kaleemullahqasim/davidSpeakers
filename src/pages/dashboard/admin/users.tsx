import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCoachUsers, fetchStudentUsers, updateUserApproval, promoteCoachToAdmin } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Cross2Icon, CheckIcon } from '@radix-ui/react-icons';
import { ShieldCheck } from 'lucide-react';

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userToPromote, setUserToPromote] = useState<string | null>(null);
  
  const { data: coaches, isLoading: coachesLoading } = useQuery({
    queryKey: ['coaches'],
    queryFn: fetchCoachUsers,
    enabled: !!user?.id && user?.role === 'admin'
  });
  
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: fetchStudentUsers,
    enabled: !!user?.id && user?.role === 'admin'
  });
  
  const approveCoachMutation = useMutation({
    mutationFn: (coachId: string) => updateUserApproval(coachId, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      toast({
        title: 'Coach approved',
        description: 'The coach can now access the platform.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error approving coach',
        description: error instanceof Error ? error.message : 'Failed to approve coach',
        variant: 'destructive',
      });
    }
  });
  
  const promoteToAdminMutation = useMutation({
    mutationFn: (coachId: string) => promoteCoachToAdmin(coachId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      toast({
        title: 'Coach promoted to admin',
        description: 'The coach now has administrative privileges.',
      });
      setUserToPromote(null);
    },
    onError: (error) => {
      toast({
        title: 'Error promoting coach',
        description: error instanceof Error ? error.message : 'Failed to promote coach to admin',
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">
            Approve coaches, manage users, and promote coaches to admin
          </p>
        </div>

        <Tabs defaultValue="coaches">
          <TabsList>
            <TabsTrigger value="coaches">
              Coaches
              {!coachesLoading && coaches?.some(coach => !coach.approved) && (
                <Badge variant="destructive" className="ml-2">
                  {coaches.filter((coach: any) => !coach.approved).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="coaches" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Coaches Pending Approval</CardTitle>
                <CardDescription>
                  Review and approve coach account requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coachesLoading ? (
                  <p>Loading coaches...</p>
                ) : coaches?.filter((coach: any) => !coach.approved).length ? (
                  <div className="space-y-4">
                    {coaches.filter((coach: any) => !coach.approved).map((coach) => (
                      <div key={coach.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <h3 className="font-medium">{coach.name}</h3>
                          <p className="text-sm text-gray-500">{coach.email}</p>
                          <p className="text-xs text-gray-400">
                            Registered on {new Date(coach.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => approveCoachMutation.mutate(coach.id)}
                          disabled={approveCoachMutation.isPending}
                        >
                          {approveCoachMutation.isPending ? 'Approving...' : 'Approve'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No coaches pending approval at this time.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approved Coaches</CardTitle>
                <CardDescription>
                  Manage active coach accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coachesLoading ? (
                  <p>Loading coaches...</p>
                ) : coaches?.filter((coach: any) => coach.approved).length ? (
                  <div className="space-y-4">
                    {coaches.filter((coach: any) => coach.approved).map((coach) => (
                      <div key={coach.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <h3 className="font-medium">{coach.name}</h3>
                          <p className="text-sm text-gray-500">{coach.email}</p>
                          <p className="text-xs text-gray-400">
                            Registered on {new Date(coach.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Dialog open={userToPromote === coach.id} onOpenChange={(open) => {
                          if (!open) setUserToPromote(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline"
                              onClick={() => setUserToPromote(coach.id)}
                            >
                              Promote to Admin
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Promote Coach to Admin</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to promote {coach.name} to admin? This will give them full administrative privileges.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button 
                                variant="outline" 
                                onClick={() => setUserToPromote(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => promoteToAdminMutation.mutate(coach.id)}
                                disabled={promoteToAdminMutation.isPending}
                              >
                                {promoteToAdminMutation.isPending ? 'Promoting...' : 'Confirm Promotion'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No approved coaches at this time.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Registered Students</CardTitle>
                <CardDescription>
                  View and manage student accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <p>Loading students...</p>
                ) : students?.length ? (
                  <div className="space-y-4">
                    {students.map((student: any) => (
                      <div key={student.id} className="flex items-center justify-between border-b pb-4">
                        <div>
                          <h3 className="font-medium">{student.name}</h3>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          <p className="text-xs text-gray-400">
                            Registered on {new Date(student.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/admin/student/${student.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No students registered yet.
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
