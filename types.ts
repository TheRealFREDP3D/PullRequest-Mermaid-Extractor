export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'all';
  merged_at: string | null;
  body: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  created_at: string;
}

export interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  html_url: string;
}

export interface Diagram {
  id: string;
  prNumber: number;
  prTitle: string;
  prState: 'open' | 'closed' | 'merged';
  prUrl: string;
  author: string;
  authorAvatar: string;
  sourceType: 'description' | 'comment';
  code: string;
  createdAt: string;
}

export enum Theme {
  GITHUB_DARK = 'GitHub Dark',
  GITHUB_LIGHT = 'GitHub Light',
  MONOKAI = 'Monokai',
  DRACULA = 'Dracula',
}

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  border: string;
  accent: string;
}