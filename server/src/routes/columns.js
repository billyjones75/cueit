import express from 'express';
import { getColumns, createColumn, updateColumn, deleteColumn, reorderColumns } from '../controllers/columnsController.js';

const router = express.Router();

// GET /api/columns/:project_id - Get all columns for a project
router.get('/:project_id', getColumns);

// POST /api/columns - Create new column
router.post('/', createColumn);

// PATCH /api/columns/:id - Update column
router.patch('/:id', updateColumn);

// DELETE /api/columns/:id - Delete column
router.delete('/:id', deleteColumn);

// PATCH /api/columns/reorder - Reorder columns
router.patch('/reorder', reorderColumns);

export default router;