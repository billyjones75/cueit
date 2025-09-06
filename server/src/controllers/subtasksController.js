import { getDatabase } from '../utils/database.js';
import { SQL_QUERIES } from '../utils/sqlQueries.js';

// GET /api/tasks/:task_id/subtasks - Get all subtasks for a task
export const getSubtasks = async (req, res) => {
  try {
    const { task_id } = req.params;

    if (!task_id) {
      return res.status(400).json({ error: 'Missing task_id' });
    }

    const db = getDatabase();
    const subtasks = db.prepare(SQL_QUERIES.SELECT_SUBTASKS_BY_TASK).all(task_id);

    res.json({ success: true, subtasks });
  } catch (error) {
    console.error('getSubtasks error:', error);
    res.status(500).json({ success: false, error: 'Failed to get subtasks' });
  }
};

// POST /api/tasks/:task_id/subtasks - Create subtask
export const createSubtask = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { text, completed = false, order_index } = req.body;

    if (!task_id || !text) {
      return res.status(400).json({ error: 'Missing task_id or text' });
    }

    if (order_index === undefined) {
      return res.status(400).json({ error: 'Missing order_index' });
    }

    const db = getDatabase();

    // Verify task exists
    const task = db.prepare(SQL_QUERIES.VERIFY_TASK_EXISTS_BY_ID).get(task_id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const insertStmt = db.prepare(SQL_QUERIES.INSERT_SUBTASK);
    const result = insertStmt.run(task_id, text, completed ? 1 : 0, order_index);

    const subtask = {
      id: result.lastInsertRowid,
      task_id,
      text,
      completed: completed ? 1 : 0,
      order_index: order_index
    };

    res.json({ success: true, subtask });
  } catch (error) {
    console.error('createSubtask error:', error);
    res.status(500).json({ success: false, error: 'Failed to create subtask' });
  }
};

// PATCH /api/tasks/:task_id/subtasks/:id - Update subtask
export const updateSubtask = async (req, res) => {
  try {
    const { task_id, id } = req.params;
    const fields = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing subtask id' });
    }

    const db = getDatabase();

    // Verify subtask exists and belongs to task
    const subtask = db.prepare(SQL_QUERIES.VERIFY_SUBTASK_EXISTS).get(id, task_id);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found or does not belong to task' });
    }

    // Get current subtask values to use as defaults
    const currentSubtask = db.prepare(SQL_QUERIES.SELECT_SUBTASK_BY_ID).get(id);
    if (!currentSubtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    // Build values array in the exact order expected by UPDATE_SUBTASK query:
    // text, completed, order_index, id
    const values = [
      fields.text !== undefined ? fields.text : currentSubtask.text,
      fields.completed !== undefined ? (fields.completed ? 1 : 0) : currentSubtask.completed,
      fields.order_index !== undefined ? fields.order_index : currentSubtask.order_index,
      id
    ];

    const updateStmt = db.prepare(SQL_QUERIES.UPDATE_SUBTASK);
    const result = updateStmt.run(...values);

    if (result.changes === 0) {
      return res.status(500).json({ success: false, error: 'Failed to update subtask' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('updateSubtask error:', error);
    res.status(500).json({ success: false, error: 'Failed to update subtask' });
  }
};

// DELETE /api/tasks/:task_id/subtasks/:id - Delete subtask
export const deleteSubtask = async (req, res) => {
  try {
    const { task_id, id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Missing subtask id' });
    }

    const db = getDatabase();

    // Verify subtask exists and belongs to task
    const subtask = db.prepare(SQL_QUERIES.VERIFY_SUBTASK_EXISTS).get(id, task_id);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found or does not belong to task' });
    }

    const deleteStmt = db.prepare(SQL_QUERIES.DELETE_SUBTASK);
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return res.status(500).json({ success: false, error: 'Failed to delete subtask' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('deleteSubtask error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete subtask' });
  }
};

