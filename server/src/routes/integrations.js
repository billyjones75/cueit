import express from 'express';
import { getIntegrations } from '../controllers/integrationsController.js';

const router = express.Router();

// GET /integrations - Get integrations for current user
router.get('/', getIntegrations);

export default router; 