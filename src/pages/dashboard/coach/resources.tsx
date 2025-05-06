import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function CoachResources() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user || user.role !== 'coach') {
    router.push('/login');
    return null;
  }

  // Example resources - these would be replaced with actual content from a database
  const resources = [
    {
      id: 'evaluation-guidelines',
      title: 'Evaluation Guidelines',
      content: 'Detailed information about how to evaluate students consistently and fairly. This includes standardized rubrics, scoring guidelines, and best practices for providing constructive feedback.'
    },
    {
      id: 'skills-reference',
      title: 'Skills Reference Guide',
      content: 'Comprehensive definitions and examples of each skill being evaluated. This guide helps ensure all coaches have the same understanding of what constitutes proficiency in each skill area.'
    },
    {
      id: 'feedback-templates',
      title: 'Feedback Templates',
      content: 'Sample templates for providing effective feedback to students. These templates provide structure while allowing for personalization based on individual student needs and performance.'
    },
    {
      id: 'coaching-best-practices',
      title: 'Coaching Best Practices',
      content: 'Tips and strategies for effective coaching, including how to establish rapport, motivate students, and tailor your approach to different learning styles and levels of experience.'
    },
    {
      id: 'technical-guidelines',
      title: 'Technical Guidelines',
      content: 'Instructions for using the platform effectively, including how to review videos, provide feedback, and track student progress over time.'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-gray-600">
            Reference materials and guidelines for coaching and evaluation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coaching Resources</CardTitle>
            <CardDescription>
              Access materials to help you provide consistent and effective evaluations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {resources.map((resource: any) => (
                <AccordionItem key={resource.id} value={resource.id}>
                  <AccordionTrigger className="font-medium">{resource.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">{resource.content}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Assessment Rubrics</CardTitle>
            <CardDescription>
              Detailed rubrics for evaluating each skill
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-medium text-blue-800">Coming Soon</h3>
                <p className="text-sm text-blue-600">
                  Detailed assessment rubrics will be available here soon to help standardize the evaluation process.
                </p>
              </div>
              
              {/* Example of what a resource might look like */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Example: Public Speaking Clarity Rubric</h3>
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Score</th>
                      <th className="border p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 text-center">5</td>
                      <td className="border p-2">Exceptional clarity. Speech is perfectly articulated with appropriate pacing.</td>
                    </tr>
                    <tr>
                      <td className="border p-2 text-center">4</td>
                      <td className="border p-2">Very clear speech with minor areas for improvement in articulation or pacing.</td>
                    </tr>
                    <tr>
                      <td className="border p-2 text-center">3</td>
                      <td className="border p-2">Adequate clarity. Speech is understandable but has noticeable issues with articulation or pacing.</td>
                    </tr>
                    <tr>
                      <td className="border p-2 text-center">2</td>
                      <td className="border p-2">Below average clarity. Speech has significant issues that impact understanding.</td>
                    </tr>
                    <tr>
                      <td className="border p-2 text-center">1</td>
                      <td className="border p-2">Poor clarity. Speech is difficult to understand due to major issues with articulation or pacing.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}