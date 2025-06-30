import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Monitor } from 'lucide-react';
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
  // Improved initial positioning - center-right of screen for better visibility
  const getInitialPosition = () => {
    if (initialPosition) return initialPosition;
    
    // Position it in the right side of the screen with some margin
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    return {
      x: Math.max(screenWidth - 500, 20), // Right side with margin
      y: 100 // Top with some margin for header
    };
  };

  const [position, setPosition] = useState(getInitialPosition());
  const [isDragging, setIsDragging] = useState(false);
  const [sizeMode, setSizeMode] = useState<'medium' | 'large' | 'extra-large'>('large'); // Start with large by default
  const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Much improved dimensions - significantly larger for better evaluation
  const getDimensions = () => {
    switch (sizeMode) {
      case 'medium':
        return { width: 520, height: 390 }; // Increased both width and height
      case 'large':
        return { width: 720, height: 540 }; // Much larger for better evaluation
      case 'extra-large':
        return { width: 960, height: 720 }; // Very large for detailed analysis
      default:
        return { width: 720, height: 540 };
    }
  };

  const { width, height } = getDimensions();

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

  // Cycle through size modes
  const cycleSizeMode = () => {
    setSizeMode(current => {
      switch (current) {
        case 'medium': return 'large';
        case 'large': return 'extra-large';
        case 'extra-large': return 'medium';
        default: return 'large';
      }
    });
  };

  // Get size mode icon and label
  const getSizeModeInfo = () => {
    switch (sizeMode) {
      case 'medium':
        return { icon: Minimize2, label: 'Medium' };
      case 'large':
        return { icon: Maximize2, label: 'Large' };
      case 'extra-large':
        return { icon: Monitor, label: 'Extra Large' };
      default:
        return { icon: Maximize2, label: 'Large' };
    }
  };

  const { icon: SizeIcon, label: sizeLabel } = getSizeModeInfo();

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
  }, [position, sizeMode]);

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
      className={`fixed z-50 rounded-lg overflow-hidden shadow-2xl transition-all duration-300 bg-white border-2 border-gray-300 flex flex-col ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: `${height + 90}px`, // Add extra height for header and tip section
      }}
    >
      {/* Enhanced header for dragging with better visibility */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between cursor-grab shadow-md"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold truncate">
            {videoError ? "Video Error" : "Student Video"}
          </h3>
          <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">
            {sizeLabel}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={cycleSizeMode}
            className="h-7 w-7 text-white hover:bg-blue-600"
            title={`Switch to ${sizeMode === 'medium' ? 'Large' : sizeMode === 'large' ? 'Extra Large' : 'Medium'} size`}
          >
            <SizeIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-7 w-7 text-white hover:bg-red-500"
            title="Close video player"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Video content with improved styling - FIXED to fill available space */}
      <div 
        className="bg-black border-t border-gray-200 flex-1"
        style={{ height: `${height}px` }}
      >
        {videoError ? (
          <div 
            className="flex items-center justify-center text-white bg-gray-900 w-full h-full"
          >
            <div className="text-center p-6">
              <p className="mb-3 text-lg">{videoError}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-white border-white hover:bg-gray-800"
                onClick={() => setVideoError(null)}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={handleVideoError}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          ></iframe>
        )}
      </div>
      
      {/* Add a subtle hint for coaches */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 text-xs text-blue-700 border-t border-blue-200">
        <span className="font-medium">💡 Tip:</span> Click the resize button to adjust video size for better evaluation
      </div>
    </div>
  );
}
