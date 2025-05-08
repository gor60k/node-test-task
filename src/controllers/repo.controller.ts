import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  stargazers_count: number;
  description: string;
  html_url: string;
  language: string;
}

export class RepoController {
  private prisma: PrismaClient;
  private cacheTimeout: number = 3600000; // 1 hour in milliseconds

  constructor() {
    this.prisma = new PrismaClient();
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

  private async getRepositoriesFromDb(page: number, perPage: number) {
    const skip = (page - 1) * perPage;
    const [repos, totalCount] = await Promise.all([
      this.prisma.repository.findMany({
        orderBy: { stars: 'desc' },
        skip,
        take: perPage
      }),
      this.prisma.repository.count()
    ]);

    return { repos, totalCount };
  }

  async getAllRepos(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = Math.min(parseInt(req.query.per_page as string) || 30, 100);

      // Try to get from database first
      const dbData = await this.getRepositoriesFromDb(page, perPage);
      
      // If we have data in DB and it's not empty, return it
      if (dbData.repos.length > 0) {
        return res.json({
          pagination: {
            page,
            per_page: perPage,
            total_count: dbData.totalCount,
            next_page: page * perPage < dbData.totalCount ? page + 1 : null,
            prev_page: page > 1 ? page - 1 : null
          },
          data: dbData.repos
        });
      }

      // If no data in DB, fetch from GitHub API
      const queryParams = new URLSearchParams({
        q: 'stars:>0',
        sort: 'stars',
        order: 'desc',
        per_page: perPage.toString(),
        page: page.toString()
      });

      const response = await fetch(
        `${process.env.GITHUB_API_URL}/search/repositories?${queryParams.toString()}`,
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
      const repos = data.items;
      const totalCount = data.total_count;

      // Save to database
      await this.saveRepositoriesToDb(repos);

      const formattedRepos = (repos as Repository[]).map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        stars: repo.stargazers_count,
        description: repo.description,
        url: repo.html_url,
        language: repo.language
      }));

      res.json({
        pagination: {
          page,
          per_page: perPage,
          total_count: totalCount,
          next_page: page * perPage < totalCount ? page + 1 : null,
          prev_page: page > 1 ? page - 1 : null
        },
        data: formattedRepos
      });
    } catch (error) {
      console.error('Error fetching repositories:', error);
      res.status(500).json({ 
        error: 'Failed to fetch repositories',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getRepoByIdOrName(req: Request, res: Response) {
    try {
      const { idOrName } = req.params;
      
      // Try to get from database first
      const repo = await this.prisma.repository.findFirst({
        where: {
          OR: [
            { id: parseInt(idOrName) || 0 },
            { full_name: idOrName }
          ]
        }
      });

      if (repo) {
        return res.json(repo);
      }

      // If not in database, try to fetch from GitHub API
      let apiUrl: string;
      if (isNaN(parseInt(idOrName))) {
        // If it's a name, it should be in format "owner/repo"
        if (!idOrName.includes('/')) {
          return res.status(400).json({ 
            error: 'Invalid repository name format. Please use format: owner/repo' 
          });
        }
        apiUrl = `${process.env.GITHUB_API_URL}/repos/${idOrName}`;
      } else {
        apiUrl = `${process.env.GITHUB_API_URL}/repositories/${idOrName}`;
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.GITHUB_TOKEN}`
        }
      });

      if (!response.ok) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      const repoData = await response.json();
      
      // Save to database
      const savedRepo = await this.prisma.repository.upsert({
        where: { id: repoData.id },
        update: {
          name: repoData.name,
          full_name: repoData.full_name,
          stars: repoData.stargazers_count,
          description: repoData.description,
          url: repoData.html_url,
          language: repoData.language
        },
        create: {
          id: repoData.id,
          name: repoData.name,
          full_name: repoData.full_name,
          stars: repoData.stargazers_count,
          description: repoData.description,
          url: repoData.html_url,
          language: repoData.language
        }
      });

      res.json(savedRepo);
    } catch (error) {
      console.error('Error fetching repository:', error);
      res.status(500).json({ 
        error: 'Failed to fetch repository',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
