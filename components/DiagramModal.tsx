import React from 'react';
import { Diagram, ThemeColors } from '../types';
import MermaidRenderer from './MermaidRenderer';
import { generateDrawioXml } from '../utils/parsers';
import { X, Download, FileJson, FileCode, ExternalLink } from 'lucide-react';

interface DiagramModalProps {
  diagram: Diagram | null;
  colors: ThemeColors;
  onClose: () => void;
}

const DiagramModal: React.FC<DiagramModalProps> = ({ diagram, colors, onClose }) => {
  if (!diagram) return null;

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMD = () => {
    const content = `# Diagram from PR #${diagram.prNumber}: ${diagram.prTitle}\n\n\`\`\`mermaid\n${diagram.code}\n\`\`\``;
    downloadFile(content, `diagram-${diagram.prNumber}.md`, 'text/markdown');
  };

  const handleDownloadDrawio = () => {
    const xml = generateDrawioXml(diagram.code);
    downloadFile(xml, `diagram-${diagram.prNumber}.drawio`, 'application/xml');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-5xl h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: colors.border }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              PR #{diagram.prNumber} 
              <span className="font-normal text-sm opacity-70">
                by {diagram.author}
              </span>
            </h2>
            <a 
              href={diagram.prUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs hover:underline opacity-60 flex items-center gap-1 mt-1"
              style={{ color: colors.accent }}
            >
              View on GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Code View (Hidden on mobile usually, but good for debug) */}
          <div className="hidden md:flex flex-col w-1/3 border-r overflow-hidden" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
            <div className="p-3 border-b text-sm font-semibold opacity-70" style={{ borderColor: colors.border }}>
              Mermaid Source
            </div>
            <pre className="flex-1 p-4 overflow-auto text-xs font-mono whitespace-pre bg-black/10">
              {diagram.code}
            </pre>
          </div>

          {/* Right: Rendered View */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white/5 relative">
            <div className="absolute inset-0 overflow-auto p-4 flex items-center justify-center">
              <MermaidRenderer id={`full-${diagram.id}`} code={diagram.code} className="w-full min-h-[500px]" />
            </div>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="p-4 border-t flex flex-wrap gap-4 items-center justify-end shrink-0" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
           <button 
             onClick={handleDownloadMD}
             className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:brightness-110"
             style={{ backgroundColor: colors.border, color: colors.text }}
           >
             <FileCode className="w-4 h-4" /> Save as .md
           </button>
           <button 
             onClick={handleDownloadDrawio}
             className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors hover:brightness-110"
             style={{ backgroundColor: '#f08705' }} // Draw.io brand colorish
           >
             <FileJson className="w-4 h-4" /> Save as .drawio
           </button>
        </div>
      </div>
    </div>
  );
};

export default DiagramModal;
