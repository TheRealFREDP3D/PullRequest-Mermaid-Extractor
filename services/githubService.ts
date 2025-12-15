import { GitHubPR, GitHubComment } from '../types';

export class GitHubService {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    this.token = token;
  }

  private async fetchWithAuth(url: string) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 403) throw new Error('API Rate limit exceeded or Invalid Token');
      if (response.status === 404) throw new Error('Repository not found');
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getPullRequests(owner: string, repo: string, limit = 30): Promise<GitHubPR[]> {
    // Fetch recently updated PRs
    const data = await this.fetchWithAuth(
      `${this.baseUrl}/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=${limit}`
    );
    return data;
  }

  async getPRComments(owner: string, repo: string, prNumber: number): Promise<GitHubComment[]> {
    const data = await this.fetchWithAuth(
      `${this.baseUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`
    );
    return data;
  }

  async getPRReviews(owner: string, repo: string, prNumber: number): Promise<GitHubComment[]> {
    // Review comments are technically different endpoint but similar structure for our needs
    const data = await this.fetchWithAuth(
      `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/comments`
    );
    return data;
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.fetchWithAuth(`${this.baseUrl}/user`);
      return true;
    } catch {
      return false;
    }
  }
}
