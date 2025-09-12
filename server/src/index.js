#!/usr/bin/env node

import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './utils/database.js';

// Import routes
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';
import columnsRouter from './routes/columns.js';
import subtasksRouter from './routes/subtasks.js';
import mcpRouter from './routes/mcp.js';
import integrationsRouter from './routes/integrations.js';
import historyRouter from './routes/history.js';

// Load environment variables
dotenv.config();

// Initialize database
initDatabase();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// API routes
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/columns', columnsRouter);
app.use('/api/tasks/:task_id/subtasks', subtasksRouter);
app.use('/mcp', mcpRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/history', historyRouter);

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 App running on: http://localhost:${PORT}`);
  console.log('Add the following to ~/.cursor/mcp.json to integrate with Cursor:');
  console.log(JSON.stringify({
    mcpServers: {
      Cueit: {
        url: `http://localhost:${PORT}/mcp`,
        headers: {
          "MCP-Client": "Cursor"
        }
      }
    }
  }, null, 2));
});