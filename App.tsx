import React, { useState, useEffect } from 'react';
import { Github, Search, Loader2, Moon, Sun, Monitor, AlertCircle, LogOut } from 'lucide-react';
import { GitHubService } from './services/githubService';
import { extractDiagrams, getThemeColors } from './utils/parsers';
import { Diagram, Theme, GitHubPR } from './types';
import DiagramCard from './components/DiagramCard';
import DiagramModal from './components/DiagramModal';

const App: React.FC = () => {
  // State
  const [token, setToken] = useState<string>(localStorage.getItem('gh_token') || '');
  const [repoInput, setRepoInput] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [theme, setTheme] = useState<Theme>(Theme.GITHUB_DARK);
  
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);

  // Derived Values
  const colors = getThemeColors(theme);

  // Handlers
  const handleLogin = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const service = new GitHubService(token);
      const isValid = await service.validateToken();
      if (isValid) {
        setIsAuthenticated(true);
        localStorage.setItem('gh_token', token);
      } else {
        setError('Invalid Token');
      }
    } catch (e) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('gh_token');
    setIsAuthenticated(false);
    setDiagrams([]);
  };

  const fetchDiagrams = async () => {
    if (!repoInput.includes('/')) {
      setError('Please use "owner/repo" format');
      return;
    }
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('Authentication required to scan repositories. Please enter your GitHub token.');
      return;
    }
    
    const [owner, repo] = repoInput.split('/');
    
    setLoading(true);
    setError(null);
    setDiagrams([]);
    setProgress('Fetching Pull Requests...');

    try {
      const service = new GitHubService(token);
      
      // 1. Fetch PRs
      const prs = await service.getPullRequests(owner, repo, 30); // Fetch last 30 PRs
      
      let allDiagrams: Diagram[] = [];
      let processedCount = 0;

      // 2. Process each PR
      for (const pr of prs) {
        setProgress(`Scanning PR #${pr.number}: ${pr.title.substring(0, 20)}...`);
        
        // Scan Description
        const descDiagrams = extractDiagrams(pr.body, pr, 'description');
        allDiagrams = [...allDiagrams, ...descDiagrams];

        // 3. Deep Scan (Comments) - Optional but requested
        // To avoid rate limits, let's only do it if the PR is "active" or just do it.
        // We will fetch comments and reviews.
        try {
          const comments = await service.getPRComments(owner, repo, pr.number);
          comments.forEach(comment => {
             const commentDiagrams = extractDiagrams(comment.body, pr, 'comment', comment);
             allDiagrams = [...allDiagrams, ...commentDiagrams];
          });
        } catch (e) {
           console.warn(`Failed to fetch comments for PR ${pr.number}`, e);
        }

        processedCount++;
        // Small delay to be nice to API? Not strictly needed with await but good for UI updates
        await new Promise(r => setTimeout(r, 10)); 
      }
      
      setDiagrams(allDiagrams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      
      if (allDiagrams.length === 0) {
        setError('No Mermaid diagrams found in the last 30 PRs.');
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // Apply Body Styles based on theme
  useEffect(() => {
    document.body.style.backgroundColor = colors.bg;
    document.body.style.color = colors.text;
  }, [theme, colors]);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* Navbar */}
      <header 
        className="h-16 border-b flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-md bg-opacity-90"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${theme === Theme.GITHUB_LIGHT ? 'bg-gray-100' : 'bg-gray-800'}`}>
            <Github className="w-6 h-6" style={{ color: colors.text }} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Mermaid PR Extractor</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Auth Status */}
          <div className="flex items-center gap-2 text-sm">
            {isAuthenticated ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="opacity-70">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="opacity-70">Demo Mode</span>
              </>
            )}
          </div>

          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            className="text-sm border rounded px-2 py-1 bg-transparent focus:outline-none focus:ring-1"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            {Object.values(Theme).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="p-2 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        
        {/* Authentication Banner */}
        {!isAuthenticated && (
          <div className="max-w-4xl mx-auto mb-8 p-6 rounded-xl border shadow-lg" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <div className="flex items-start gap-4">
              <Github className="w-8 h-8 mt-1 opacity-50 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Welcome to Mermaid PR Extractor</h2>
                <p className="text-sm opacity-80 mb-4">
                  Discover and visualize Mermaid diagrams from GitHub pull requests. Enter a GitHub token to scan any repository, or try our demo mode.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 opacity-80">GitHub Token (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_..."
                        className="flex-1 px-3 py-2 rounded border bg-transparent focus:ring-2 focus:outline-none transition-all text-sm"
                        style={{ borderColor: colors.border, color: colors.text }}
                      />
                      <button
                        onClick={handleLogin}
                        disabled={loading || !token}
                        className="px-4 py-2 rounded font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        style={{ backgroundColor: colors.accent, color: '#fff' }}
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                      </button>
                    </div>
                    <p className="text-xs opacity-40 mt-2">Tokens are stored locally in your browser.</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => {
                        // Load demo data
                        setRepoInput('microsoft/vscode');
                        // Add some sample demo diagrams
                        const demoDiagrams: Diagram[] = [
                          {
                            id: 'demo-1',
                            prNumber: 12345,
                            prTitle: 'Feature: Add new diagram support',
                            prState: 'open',
                            prUrl: 'https://github.com/microsoft/vscode/pull/12345',
                            author: 'demo-user',
                            authorAvatar: 'https://github.com/github.png',
                            sourceType: 'description',
                            code: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`,
                            createdAt: new Date().toISOString()
                          },
                          {
                            id: 'demo-2',
                            prNumber: 12346,
                            prTitle: 'Update architecture diagram',
                            prState: 'merged',
                            prUrl: 'https://github.com/microsoft/vscode/pull/12346',
                            author: 'demo-user-2',
                            authorAvatar: 'https://github.com/github.png',
                            sourceType: 'comment',
                            code: `sequenceDiagram
    participant Client
    participant Server
    participant Database
    
    Client->>Server: Request data
    Server->>Database: Query
    Database-->>Server: Results
    Server-->>Client: Response`,
                            createdAt: new Date().toISOString()
                          }
                        ];
                        setDiagrams(demoDiagrams);
                        setError('Demo mode: Showing sample diagrams. Connect with a GitHub token to scan real repositories.');
                      }}
                      className="w-full px-4 py-2 rounded border font-medium transition-all hover:opacity-80 text-sm"
                      style={{ borderColor: colors.border, color: colors.text }}
                    >
                      🎯 Try Demo Mode
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/10 p-3 rounded mt-4">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard - Show for both authenticated and demo mode */}
        <div className="space-y-8">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-2xl mx-auto">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="owner/repository (e.g. facebook/react)"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border shadow-sm bg-transparent focus:ring-2 focus:outline-none transition-all"
                  style={{ borderColor: colors.border, backgroundColor: colors.card }}
                  onKeyDown={(e) => e.key === 'Enter' && fetchDiagrams()}
                />
              </div>
              <button
                onClick={fetchDiagrams}
                disabled={loading || !repoInput}
                className="w-full md:w-auto px-8 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: colors.accent, color: '#fff' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan Repository'}
              </button>
            </div>

            {/* Status Messages */}
            {loading && (
              <div className="text-center py-10 animate-pulse">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
                <p className="text-lg opacity-70">{progress}</p>
              </div>
            )}
            
            {error && !loading && (
               <div className="max-w-xl mx-auto flex items-center gap-3 text-red-400 border border-red-500/20 bg-red-900/10 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
               </div>
            )}

            {/* Results Grid */}
            {!loading && diagrams.length > 0 && (
              <>
                <div className="flex items-center justify-between border-b pb-4 mb-6 opacity-60" style={{ borderColor: colors.border }}>
                  <span>Found {diagrams.length} diagrams</span>
                  <span className="text-xs">Sorted by newest</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {diagrams.map((diagram) => (
                    <DiagramCard 
                      key={diagram.id} 
                      diagram={diagram} 
                      colors={colors}
                      onClick={setSelectedDiagram}
                    />
                  ))}
                </div>
              </>
            )}
            
            {!loading && !error && diagrams.length === 0 && repoInput && !progress && (
               <div className="text-center py-20 opacity-30">
                  <Monitor className="w-16 h-16 mx-auto mb-4" />
                  <p>Enter a repository to scan for diagrams</p>
               </div>
            )}
        </div>
      </main>

      {/* Modal */}
      {selectedDiagram && (
        <DiagramModal 
          diagram={selectedDiagram} 
          colors={colors} 
          onClose={() => setSelectedDiagram(null)} 
        />
      )}
    </div>
  );
};

export default App;
