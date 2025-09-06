import express from 'express';
import {
  getSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask
} from '../controllers/subtasksController.js';

const router = express.Router({ mergeParams: true });

// GET /api/tasks/:task_id/subtasks - Get all subtasks for a task
router.get('/', getSubtasks);

// POST /api/tasks/:task_id/subtasks - Create new subtask
router.post('/', createSubtask);

// PATCH /api/tasks/:task_id/subtasks/:id - Update subtask (including order_index)
router.patch('/:id', updateSubtask);

// DELETE /api/tasks/:task_id/subtasks/:id - Delete subtask
router.delete('/:id', deleteSubtask);

export default router;
