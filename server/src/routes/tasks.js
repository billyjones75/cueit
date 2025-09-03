import express from 'express';
import { createTask, updateTask, deleteTask, moveTask } from '../controllers/tasksController.js';

const router = express.Router();

// POST /api/tasks - Create task
router.post('/', createTask);

// PATCH /api/tasks - Update task
router.patch('/', updateTask);

// DELETE /api/tasks - Delete task
router.delete('/', deleteTask);

// PATCH /api/tasks/:id/move - Move task to new column
router.patch('/:id/move', moveTask);

export default router; 