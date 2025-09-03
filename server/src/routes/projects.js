import express from 'express';
import { getProjects, createProject, updateProject, deleteProject, searchProjects } from '../controllers/projectsController.js';

const router = express.Router();

// GET /api/projects - Get all projects for user
router.get('/', getProjects);

// POST /api/projects - Create new project
router.post('/', createProject);

// GET /api/projects/search?name=project_name - Search projects by name
router.get('/search', searchProjects);

// PATCH /api/projects/:id - Update project
router.patch('/:id', updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', deleteProject);

export default router; 