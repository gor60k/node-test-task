import { Request, Response } from 'express';
import { SyncService } from '../services/sync.service.js';

export class SyncController {
  private syncService: SyncService;

  constructor() {
    this.syncService = new SyncService(60); // 60 minutes default interval
  }

  async startSync(req: Request, res: Response) {
    try {
      this.syncService.startSync();
      res.json({ message: 'Sync started successfully' });
    } catch (error) {
      console.error('Error starting sync:', error);
      res.status(500).json({ 
        error: 'Failed to start sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async forceSync(req: Request, res: Response) {
    try {
      await this.syncService.syncWithGitHub();
      this.syncService.startSync(); // Reset the timer
      res.json({ message: 'Force sync completed successfully' });
    } catch (error) {
      console.error('Error during force sync:', error);
      res.status(500).json({ 
        error: 'Failed to force sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 