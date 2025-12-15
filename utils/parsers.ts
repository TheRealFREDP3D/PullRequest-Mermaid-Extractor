import { Theme, ThemeColors, Diagram, GitHubPR, GitHubComment } from '../types';

export const MERMAID_REGEX = /```mermaid\s*([\s\S]*?)\s*```/g;

const cleanMermaidCode = (code: string): string => {
  let cleaned = code
    // Normalize newlines
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Decode HTML entities often found in API responses
  cleaned = cleaned
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Fix common syntax issues with special chars in node labels
  // 1. Pipe | inside [] or () without quotes (causes "Expecting ... got 'PIPE'")
  // We use a regex that looks for brackets containing | but not starting with "
  cleaned = cleaned.replace(/\[(?!")([^\]\n]*?\|[^\]\n]*?)\]/g, '["$1"]');
  cleaned = cleaned.replace(/\((?!")([^\)\n]*?\|[^\)\n]*?)\)/g, '("$1")');
  
  // 2. Trailing garbage fixes could be added here if needed, but trim() handles whitespace
  return cleaned;
};

export const extractDiagrams = (
  text: string | null,
  pr: GitHubPR,
  sourceType: 'description' | 'comment',
  comment?: GitHubComment
): Diagram[] => {
  if (!text) return [];
  
  const diagrams: Diagram[] = [];
  let match;
  
  // Reset regex state
  MERMAID_REGEX.lastIndex = 0;

  while ((match = MERMAID_REGEX.exec(text)) !== null) {
    if (match[1] && match[1].trim()) {
      const isMerged = pr.state === 'closed' && !!pr.merged_at;
      const state = isMerged ? 'merged' : pr.state === 'closed' ? 'closed' : 'open';
      
      const rawCode = match[1].trim();
      const cleanCode = cleanMermaidCode(rawCode);

      diagrams.push({
        id: `${pr.number}-${sourceType}-${comment?.id || 'desc'}-${match.index}`,
        prNumber: pr.number,
        prTitle: pr.title,
        prState: state,
        prUrl: pr.html_url,
        author: comment ? comment.user.login : pr.user.login,
        authorAvatar: comment ? comment.user.avatar_url : pr.user.avatar_url,
        sourceType,
        code: cleanCode,
        createdAt: comment ? comment.created_at : pr.created_at,
      });
    }
  }

  return diagrams;
};

export const getThemeColors = (theme: Theme): ThemeColors => {
  switch (theme) {
    case Theme.GITHUB_LIGHT:
      return { bg: '#ffffff', card: '#f6f8fa', text: '#24292f', border: '#d0d7de', accent: '#0969da' };
    case Theme.MONOKAI:
      return { bg: '#272822', card: '#3e3d32', text: '#f8f8f2', border: '#75715e', accent: '#a6e22e' };
    case Theme.DRACULA:
      return { bg: '#282a36', card: '#44475a', text: '#f8f8f2', border: '#6272a4', accent: '#bd93f9' };
    case Theme.GITHUB_DARK:
    default:
      return { bg: '#0d1117', card: '#161b22', text: '#c9d1d9', border: '#30363d', accent: '#58a6ff' };
  }
};

export const generateDrawioXml = (mermaidCode: string): string => {
  // A basic wrapper to allow Draw.io to potentially recognize it or simply import the text.
  // Real conversion is complex; we embed the code in a shape value so the user can copy/paste or use specialized plugins.
  const escapedCode = mermaidCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="MermaidPRExtractor" version="21.0.0" type="device">
  <diagram name="Page-1" id="mermaid-diagram">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="2" value="&lt;pre&gt;${escapedCode}&lt;/pre&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="400" height="400" as="geometry" />
        </mxCell>
        <mxCell id="3" value="Copy the Mermaid code above and use 'Arrange > Insert > Advanced > Mermaid' in Draw.io" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=2;fontColor=#808080;" vertex="1" parent="1">
          <mxGeometry x="40" y="10" width="400" height="30" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
};