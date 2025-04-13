import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingVideoPlayerProps {
  videoId: string;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

export function FloatingVideoPlayer({ 
  videoId, 
  onClose,
  initialPosition
}: FloatingVideoPlayerProps) {
  const [position, setPosition] = useState(initialPosition || { x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Calculate dimensions based on expanded state
  const width = expanded ? 560 : 320;
  const height = expanded ? 315 : 180;

  // Start dragging the video player
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left mouse button
    setIsDragging(true);
    setStartDragPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  // Update position while dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - startDragPos.x,
      y: e.clientY - startDragPos.y
    });
    
    e.preventDefault();
  };

  // Stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Toggle expanded/minimized state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Set up and clean up event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Ensure the player stays within the viewport
  useEffect(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    if (position.x < 0) setPosition(prev => ({ ...prev, x: 0 }));
    if (position.y < 0) setPosition(prev => ({ ...prev, y: 0 }));
    if (position.x > maxX) setPosition(prev => ({ ...prev, x: maxX }));
    if (position.y > maxY) setPosition(prev => ({ ...prev, y: maxY }));
  }, [position, expanded]);

  // Handle video errors
  const handleVideoError = () => {
    setVideoError("Failed to load video. Please check the video ID.");
    console.error("Video loading error for ID:", videoId);
  };

  // Reset error state when video ID changes
  useEffect(() => {
    setVideoError(null);
  }, [videoId]);

  if (!videoId) return null;

  // Construct proper YouTube embed URL with all necessary parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&origin=${encodeURIComponent(window.location.origin)}&enablejsapi=1&widgetid=1&modestbranding=1&rel=0`;

  return (
    <div 
      ref={containerRef}
      className={`fixed z-50 rounded-lg overflow-hidden shadow-xl transition-all duration-200 bg-white border border-gray-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
      }}
    >
      {/* Header for dragging */}
      <div 
        className="bg-gray-800 text-white px-3 py-2 flex items-center justify-between cursor-grab"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-sm font-medium truncate">
          {videoError ? "Video Error" : "Student Video"}
        </h3>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleExpanded}
            className="h-6 w-6 text-white hover:bg-gray-700"
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-6 w-6 text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="bg-black">
        {videoError ? (
          <div 
            className="flex items-center justify-center text-white bg-gray-900"
            style={{ width, height }}
          >
            <div className="text-center p-4">
              <p className="mb-2">{videoError}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs text-white border-white hover:bg-gray-800"
                onClick={() => setVideoError(null)}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            width={width}
            height={height}
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={handleVideoError}
            className="w-full h-full"
          ></iframe>
        )}
      </div>
    </div>
  );
}
