import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import repoRoutes from './routes/repo.route.js';
import syncRoutes from './routes/sync.route.js';
import { SyncService } from './services/sync.service.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/repos', repoRoutes);
app.use('/api/sync', syncRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the GitHub Trending Repos API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`GitHub API URL: ${process.env.GITHUB_API_URL}`);

  // Start the sync service
  const syncService = new SyncService(60); // 60 minutes interval
  syncService.startSync();
}); 