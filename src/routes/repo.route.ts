import { Router, Request, Response } from 'express';
import { RepoController } from '../controllers/repo.controller.js';

const router = Router();
const repoController = new RepoController();

router.get('/', async (req: Request, res: Response) => {
  await repoController.getAllRepos(req, res);
});

// Use wildcard parameter to capture the full repository name
router.get('/:owner/:repo', async (req: Request, res: Response) => {
  const { owner, repo } = req.params;
  req.params.idOrName = `${owner}/${repo}`;
  await repoController.getRepoByIdOrName(req, res);
});

// Keep the ID route separate
router.get('/:id(\\d+)', async (req: Request, res: Response) => {
  await repoController.getRepoByIdOrName(req, res);
});

export default router; 