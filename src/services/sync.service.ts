import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  stargazers_count: number;
  description: string;
  html_url: string;
  language: string;
}

export class SyncService {
  private prisma: PrismaClient;
  private syncInterval: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(syncIntervalMinutes: number = 60) {
    this.prisma = new PrismaClient();
    this.syncInterval = syncIntervalMinutes * 60 * 1000; // Convert minutes to milliseconds
  }

  private async saveRepositoriesToDb(repos: Repository[]) {
    for (const repo of repos) {
      await this.prisma.repository.upsert({
        where: { id: repo.id },
        update: {
          name: repo.name,
          full_name: repo.full_name,
          stars: repo.stargazers_count,
          description: repo.description,
          url: repo.html_url,
          language: repo.language
        },
        create: {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          stars: repo.stargazers_count,
          description: repo.description,
          url: repo.html_url,
          language: repo.language
        }
      });
    }
  }

  async syncWithGitHub() {
    try {
      console.log('Starting GitHub sync...');
      const response = await fetch(
        `${process.env.GITHUB_API_URL}/search/repositories?q=stars:>0&sort=stars&order=desc&per_page=100`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API responded with status: ${response.status}`);
      }

      const data = await response.json();
      await this.saveRepositoriesToDb(data.items);
      console.log('GitHub sync completed successfully');
    } catch (error) {
      console.error('Error during GitHub sync:', error);
      throw error;
    }
  }

  startSync() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    // Initial sync
    this.syncWithGitHub().catch(console.error);
    
    // Set up periodic sync
    this.timer = setInterval(() => {
      this.syncWithGitHub().catch(console.error);
    }, this.syncInterval);

    console.log(`Sync started with interval of ${this.syncInterval / 60000} minutes`);
  }

  stopSync() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('Sync stopped');
    }
  }
} 