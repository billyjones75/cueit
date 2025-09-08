import express from 'express';
import { getProjectHistory, restoreProjectVersion, saveCurrentProjectVersion } from '../controllers/historyController.js';

const router = express.Router();

// GET /api/history/:projectId - Get version history for a project
router.get('/:projectId', getProjectHistory);

// POST /api/history/:projectId/restore/:versionId - Restore project to a specific version
router.post('/:projectId/restore/:versionId', restoreProjectVersion);

// POST /api/history/:projectId/save - Manually save current project state
router.post('/:projectId/save', saveCurrentProjectVersion);

export default router;
