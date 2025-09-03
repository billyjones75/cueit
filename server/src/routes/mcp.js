import express from 'express';
import { mcp } from '../controllers/mcpController.js';

const router = express.Router();

// MCP endpoint - handled by the controller
router.all('*', mcp);

export default router; 