import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MessageSquare, CopyIcon, CheckIcon } from 'lucide-react';

interface CoachFeedbackCardProps {
  feedback: string;
  coachName: string;
  coachAvatar?: string;
  expanded?: boolean;
}

export function CoachFeedbackCard({ 
  feedback, 
  coachName, 
  coachAvatar, 
  expanded = false 
}: CoachFeedbackCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [copied, setCopied] = useState(false);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!feedback) {
    return null;
  }

  // Get coach initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part: any) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Generate a color based on the coach's name
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };
  
  // Generate avatar data URL
  const getAvatarDataUrl = () => {
    if (coachAvatar) return coachAvatar;
    
    // Create a simple SVG with the coach's initials
    const initials = getInitials(coachName);
    const bgColor = stringToColor(coachName);
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="${bgColor}" />
        <text x="20" y="24" font-family="Arial" font-size="16" fill="white" text-anchor="middle">${initials}</text>
      </svg>
    `;
    
    // Convert SVG to data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={getAvatarDataUrl()} alt={coachName} />
              <AvatarFallback>{getInitials(coachName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                Coach Feedback
              </CardTitle>
              <CardDescription>
                Personalized feedback from {coachName}
              </CardDescription>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex gap-1 items-center h-8"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={`overflow-hidden ${!isExpanded ? 'max-h-[250px]' : ''}`}>
          <ScrollArea className={isExpanded ? "h-[500px]" : "h-auto"}>
            <div className="whitespace-pre-wrap">{feedback}</div>
          </ScrollArea>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
        
        <Button variant="ghost" size="sm" onClick={toggleExpanded}>
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show More
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
