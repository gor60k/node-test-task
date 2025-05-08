import { Router, Request, Response } from 'express';
import { SyncController } from '../controllers/sync.controller.js';

const router = Router();
const syncController = new SyncController();

router.post('/start', async (req: Request, res: Response) => {
  await syncController.startSync(req, res);
});

router.post('/force', async (req: Request, res: Response) => {
  await syncController.forceSync(req, res);
});

export default router; 