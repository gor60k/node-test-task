#!/usr/bin/env node
import fetch from 'node-fetch';
import { Command } from 'commander';

const program = new Command();
const API_URL = process.env.API_URL || `http://localhost:3000/api`;

program
  .name('github-trending-cli')
  .description('CLI for GitHub Trending Repositories API')
  .version('1.0.0');

program
  .command('list')
  .description('List all repositories')
  .option('-p, --page <number>', 'Page number', '1')
  .option('-l, --limit <number>', 'Items per page', '30')
  .action(async (options) => {
    try {
      const response = await fetch(
        `${API_URL}/repos?page=${options.page}&per_page=${options.limit}`
      );
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
    }
  });

program
  .command('get <idOrName>')
  .description('Get repository by ID or name (owner/repo)')
  .action(async (idOrName) => {
    try {
      const response = await fetch(`${API_URL}/repos/${idOrName}`);
      const data = await response.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error:', error);
    }
  });

program
  .command('sync')
  .description('Start sync with GitHub')
  .action(async () => {
    try {
      const response = await fetch(`${API_URL}/sync/start`, {
        method: 'POST'
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Error:', error);
    }
  });

program
  .command('force-sync')
  .description('Force sync with GitHub')
  .action(async () => {
    try {
      const response = await fetch(`${API_URL}/sync/force`, {
        method: 'POST'
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Error:', error);
    }
  });

program.parse(); 