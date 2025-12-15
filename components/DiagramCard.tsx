import React from 'react';
import { Diagram, ThemeColors } from '../types';
import MermaidRenderer from './MermaidRenderer';
import { GitPullRequest, MessageSquare, User, GitMerge, CheckCircle, XCircle } from 'lucide-react';

interface DiagramCardProps {
  diagram: Diagram;
  colors: ThemeColors;
  onClick: (diagram: Diagram) => void;
}

const DiagramCard: React.FC<DiagramCardProps> = ({ diagram, colors, onClick }) => {
  const getStatusIcon = () => {
    switch (diagram.prState) {
      case 'merged':
        return <GitMerge className="w-4 h-4 text-purple-500" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'open':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div 
      className="group relative flex flex-col rounded-lg border shadow-sm transition-all duration-300 hover:shadow-lg overflow-hidden"
      style={{ 
        backgroundColor: colors.card, 
        borderColor: colors.border,
        color: colors.text
      }}
      onClick={() => onClick(diagram)}
    >
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-start" style={{ borderColor: colors.border }}>
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono opacity-60">#{diagram.prNumber}</span>
            {getStatusIcon()}
          </div>
          <h3 className="text-sm font-semibold truncate leading-tight" title={diagram.prTitle}>
            {diagram.prTitle}
          </h3>
        </div>
        <div className="flex items-center gap-1 opacity-60 text-xs shrink-0">
            {diagram.sourceType === 'comment' && <MessageSquare className="w-3 h-3" />}
            <span className="capitalize">{diagram.sourceType}</span>
        </div>
      </div>

      {/* Preview Area - Fixed height with overlay to preventing interaction with svg */}
      <div className="relative h-48 w-full bg-black/5 p-2 overflow-hidden flex items-center justify-center">
         <div className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity transform scale-90 origin-center">
            <MermaidRenderer id={`preview-${diagram.id}`} code={diagram.code} />
         </div>
         {/* Click overlay */}
         <div className="absolute inset-0 bg-transparent z-10 cursor-pointer" />
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-xs flex justify-between items-center opacity-80" style={{ borderColor: colors.border }}>
         <div className="flex items-center gap-2">
            <img src={diagram.authorAvatar} alt={diagram.author} className="w-5 h-5 rounded-full" />
            <span className="truncate max-w-[100px]">{diagram.author}</span>
         </div>
         <span className="opacity-60">{new Date(diagram.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default DiagramCard;
