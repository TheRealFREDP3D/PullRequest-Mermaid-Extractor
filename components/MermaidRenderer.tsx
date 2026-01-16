import React, { useEffect, useRef, useState } from 'react';

interface MermaidRendererProps {
  code: string;
  id: string;
  className?: string;
  onClick?: () => void;
}

// Declare mermaid global with proper typing
declare global {
  interface Window {
    mermaid: any;
  }
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, id, className, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!code) return;

      // Wait for mermaid to be available
      if (typeof window.mermaid === 'undefined') {
        const MAX_POLL_ATTEMPTS = 50; // ~5 seconds timeout
        let pollAttempts = 0;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const checkMermaid = async () => {
          if (!isMounted) return;
          
          if (typeof window.mermaid !== 'undefined') {
            setIsLoading(false);
            // Directly proceed with mermaid rendering instead of recursive call
            try {
              window.mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
              });
              
              const uniqueId = `mermaid-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
              const { svg } = await window.mermaid.render(uniqueId, code);
              
              if (isMounted) {
                setSvgContent(svg);
                setError(null);
              }
            } catch (err: any) {
              console.error("Mermaid Render Error:", err);
              if (isMounted) {
                setError('Failed to render diagram. Syntax might be invalid.');
              }
            }
          } else if (pollAttempts < MAX_POLL_ATTEMPTS) {
            pollAttempts++;
            timeoutId = setTimeout(checkMermaid, 100);
          } else if (isMounted) {
            setIsLoading(false);
            setError('Failed to load diagram renderer. Please check your connection and try again.');
          }
        };
        
        checkMermaid();
        
        // Cleanup function to clear pending timeout
        return () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        };
      }

      setIsLoading(false);

      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'dark', // We force dark theme for consistency with our default UI, or could be dynamic
          securityLevel: 'loose',
        });
        
        // Generate a unique ID for mermaid to use internally
        const uniqueId = `mermaid-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
        
        // Try to parse/render
        // Note: mermaid.render returns an object { svg } in v10+
        const { svg } = await window.mermaid.render(uniqueId, code);
        
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        console.error("Mermaid Render Error:", err);
        if (isMounted) {
          setError('Failed to render diagram. Syntax might be invalid.');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code, id]);

  return (
    <div 
      ref={containerRef} 
      className={`mermaid-container ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full min-h-[150px] bg-gray-900/20 border border-gray-500/30 rounded p-4 text-gray-400 text-sm text-center">
          <div className="animate-pulse">Loading diagram renderer...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full min-h-[150px] bg-red-900/20 border border-red-500/30 rounded p-4 text-red-400 text-sm text-center">
          <p>{error}</p>
        </div>
      ) : (
        <div 
          dangerouslySetInnerHTML={{ __html: svgContent }} 
          className="w-full h-full flex items-center justify-center overflow-hidden"
        />
      )}
    </div>
  );
};

export default MermaidRenderer;
