import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  ExternalLink,
  Users,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '@/lib/auth-helpers';

interface StudentSearchResult {
  id: string;
  name: string;
  email: string;
  created_at: string;
  evaluations: {
    total: number;
    myEvaluations: number;
    otherEvaluations: number;
    pending: number;
    inProgress: number;
    completed: number;
    allEvaluations: any[];
    myEvaluationsList: any[];
  };
}

interface StudentSearchSectionProps {
  coachId: string;
}

export function StudentSearchSection({ coachId }: StudentSearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetchWithAuth(
        `/api/coach/search-students?searchQuery=${encodeURIComponent(query)}&coachId=${coachId}`
      );

      if (!response.ok) {
        throw new Error('Failed to search students');
      }

      const data = await response.json();
      setSearchResults(data.students || []);

      if (data.students?.length === 0) {
        toast({
          title: "No Results",
          description: `No students found matching "${query}"`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search students. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [coachId, toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Auto-search after a delay when user stops typing
    if (value.length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else if (value.length === 0) {
      setSearchResults([]);
      setHasSearched(false);
    }
  };

  const handleViewEvaluation = (evaluationId: string) => {
    router.push(`/dashboard/coach/evaluations/${evaluationId}`);
  };

  const handleViewAllEvaluations = (studentId: string) => {
    router.push(`/dashboard/coach/evaluations?student=${studentId}`);
  };

  return (
    <Card className="border-indigo-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 text-indigo-500 mr-2" />
          Student Search
        </CardTitle>
        <CardDescription>
          Search for students by name or email to view their evaluations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={handleInputChange}
              className="pl-10"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSearching || !searchQuery.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {/* Loading State */}
        {isSearching && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {/* Search Results */}
        {!isSearching && hasSearched && (
          <div className="space-y-4">
            {searchResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
                  </h3>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {searchResults.reduce((sum, student) => sum + student.evaluations.myEvaluations, 0)} evaluations assigned to you
                  </Badge>
                </div>

                <div className="space-y-3">
                  {searchResults.map((student) => (
                    <div
                      key={student.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-100 rounded-full">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-500">{student.email}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Joined: {new Date(student.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {student.evaluations.total} total evaluations
                          </Badge>
                        </div>
                      </div>

                      {/* Evaluation Stats */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded-md">
                          <div className="text-lg font-bold text-blue-600">
                            {student.evaluations.pending}
                          </div>
                          <div className="text-xs text-blue-600">Pending</div>
                        </div>
                        <div className="text-center p-2 bg-amber-50 rounded-md">
                          <div className="text-lg font-bold text-amber-600">
                            {student.evaluations.inProgress}
                          </div>
                          <div className="text-xs text-amber-600">In Progress</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-md">
                          <div className="text-lg font-bold text-green-600">
                            {student.evaluations.completed}
                          </div>
                          <div className="text-xs text-green-600">Completed</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-md">
                          <div className="text-lg font-bold text-gray-600">
                            {student.evaluations.otherEvaluations}
                          </div>
                          <div className="text-xs text-gray-600">Other Coach</div>
                        </div>
                      </div>

                      {/* Recent Evaluations */}
                      {student.evaluations.myEvaluationsList.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Your Recent Evaluations:
                          </h5>
                          <div className="space-y-2">
                            {student.evaluations.myEvaluationsList.slice(0, 3).map((evaluation) => (
                              <div
                                key={evaluation.id}
                                className="flex items-center justify-between p-2 bg-white border rounded text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">
                                    {evaluation.title || `Speech #${evaluation.id.slice(0, 8)}`}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      evaluation.status === 'review_requested' 
                                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                                        : evaluation.status === 'coach_reviewing'
                                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                                          : 'bg-green-100 text-green-800 border-green-200'
                                    }`}
                                  >
                                    {evaluation.status === 'review_requested' ? 'Pending' :
                                     evaluation.status === 'coach_reviewing' ? 'In Progress' : 'Completed'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(evaluation.created_at).toLocaleDateString()}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleViewEvaluation(evaluation.id)}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {student.evaluations.myEvaluationsList.length > 3 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => handleViewAllEvaluations(student.id)}
                              >
                                View All {student.evaluations.myEvaluations} Evaluations
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2">
                        {student.evaluations.pending > 0 && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => router.push(`/dashboard/coach/evaluations?student=${student.id}&status=pending`)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Review Pending ({student.evaluations.pending})
                          </Button>
                        )}
                        
                        {student.evaluations.myEvaluations > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAllEvaluations(student.id)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            View All Evaluations
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">No Students Found</h3>
                <p className="text-sm text-gray-600">
                  No students match your search for "{searchQuery}". Try a different name or email.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && !isSearching && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Search for Students</h3>
            <p className="text-sm text-gray-600">
              Enter a student's name or email address to find their evaluations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 