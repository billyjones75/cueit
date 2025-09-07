import express from 'express';
import { getProjectHistory, restoreProjectVersion } from '../controllers/historyController.js';

const router = express.Router();

// GET /api/history/:projectId - Get version history for a project
router.get('/:projectId', getProjectHistory);

// POST /api/history/:projectId/restore/:versionId - Restore project to a specific version
router.post('/:projectId/restore/:versionId', restoreProjectVersion);

export default router;
