import { getDatabase } from '../utils/database.js';
import { SQL_QUERIES } from '../utils/sqlQueries.js';

// POST /api/tasks - Create task
export const createTask = async (req, res) => {
  try {
    const { project_id, column_id, title, description, order_index } = req.body;

    if (!column_id || !title) {
      return res.status(400).json({ error: 'Missing column_id or title' });
    }

    const db = getDatabase();

    // Verify project and column exist
    const projectExists = db.prepare(SQL_QUERIES.VERIFY_PROJECT_EXISTS).get(project_id);
    if (!projectExists) {
      return res.status(400).json({ error: 'Project not found' });
    }

    const columnExists = db.prepare(SQL_QUERIES.VERIFY_COLUMN_EXISTS).get(column_id, project_id);
    if (!columnExists) {
      return res.status(400).json({ error: 'Column not found or does not belong to project' });
    }

    // If no order_index provided, get the next available one
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const lastTask = db.prepare(SQL_QUERIES.GET_LAST_TASK_ORDER_INDEX).get(column_id);
      finalOrderIndex = (lastTask ? lastTask.order_index : 0) + 1000;
    }

    const insertStmt = db.prepare(SQL_QUERIES.INSERT_TASK);

    const result = insertStmt.run(project_id, column_id, title, description, finalOrderIndex);

    const task = {
      id: result.lastInsertRowid,
      project_id,
      column_id,
      title,
      description,
      order_index: finalOrderIndex
    };

    res.json({ success: true, task });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
};

// PATCH /api/tasks - Update task
export const updateTask = async (req, res) => {
  try {
    const { project_id, task_id, ...fields } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'Missing task_id' });
    }

    const db = getDatabase();

    // Verify task exists and belongs to project
    const task = db.prepare(SQL_QUERIES.VERIFY_TASK_EXISTS).get(task_id, project_id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found or does not belong to project' });
    }

    // Get current task values to use as defaults
    const currentTask = db.prepare(SQL_QUERIES.SELECT_TASK_BY_ID).get(task_id);
    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Build values array in the exact order expected by UPDATE_TASK query:
    // title, description, column_id, order_index, id
    const values = [
      fields.title !== undefined ? fields.title : currentTask.title,
      fields.description !== undefined ? fields.description : currentTask.description,
      fields.column_id !== undefined ? fields.column_id : currentTask.column_id,
      fields.order_index !== undefined ? fields.order_index : currentTask.order_index,
      task_id
    ];

    const updateStmt = db.prepare(SQL_QUERIES.UPDATE_TASK);

    const result = updateStmt.run(...values);

    if (result.changes === 0) {
      return res.status(500).json({ success: false, error: 'Failed to update task' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
};

// DELETE /api/tasks - Delete task
export const deleteTask = async (req, res) => {
  try {
    const { project_id, task_id } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'Missing task_id' });
    }

    const db = getDatabase();

    // Verify task exists and belongs to project
    const task = db.prepare(SQL_QUERIES.VERIFY_TASK_EXISTS).get(task_id, project_id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found or does not belong to project' });
    }

    const deleteStmt = db.prepare(SQL_QUERIES.DELETE_TASK);
    const result = deleteStmt.run(task_id);

    if (result.changes === 0) {
      return res.status(500).json({ success: false, error: 'Failed to delete task' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
};

// PATCH /api/tasks/:id/move - Move task to new column
export const moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_column_id, new_order_index } = req.body;

    if (!id || !new_column_id || typeof new_order_index !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDatabase();

    // Verify task exists
    const task = db.prepare(SQL_QUERIES.VERIFY_TASK_EXISTS_BY_ID).get(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify new column exists
    const column = db.prepare(SQL_QUERIES.VERIFY_COLUMN_EXISTS_BY_ID).get(new_column_id);
    if (!column) {
      return res.status(400).json({ error: 'Column not found' });
    }

    const updateStmt = db.prepare(SQL_QUERIES.MOVE_TASK);

    const result = updateStmt.run(new_column_id, new_order_index, id);

    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to move task' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('moveTask error:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
};