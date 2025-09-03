import { getDatabase } from '../utils/database.js';
import { SQL_QUERIES } from '../utils/sqlQueries.js';

// GET /api/columns/:project_id - Get all columns for a project
export const getColumns = async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({ error: 'Missing project_id' });
    }

    const db = getDatabase();
    
    // Verify project exists
    const project = db.prepare(SQL_QUERIES.VERIFY_PROJECT_EXISTS).get(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const columns = db.prepare(SQL_QUERIES.SELECT_COLUMNS_WITH_TASK_COUNT).all(project_id);

    res.json({ columns });
  } catch (error) {
    console.error('getColumns error:', error);
    res.status(500).json({ error: 'Failed to fetch columns' });
  }
};

// POST /api/columns - Create new column
export const createColumn = async (req, res) => {
  try {
    const { project_id, name, order_index } = req.body;

    if (!project_id || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDatabase();
    
    // Verify project exists
    const project = db.prepare(SQL_QUERIES.VERIFY_PROJECT_EXISTS).get(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // If no order_index provided, get the next available one
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const lastColumn = db.prepare(SQL_QUERIES.GET_LAST_COLUMN_ORDER_INDEX).get(project_id);
      finalOrderIndex = (lastColumn ? lastColumn.order_index : 0) + 1000;
    }

    const insertStmt = db.prepare(SQL_QUERIES.INSERT_COLUMN);
    
    const result = insertStmt.run(project_id, name, finalOrderIndex);
    
    const column = {
      id: result.lastInsertRowid,
      project_id,
      name,
      order_index: finalOrderIndex
    };

    res.json({ success: true, column });
  } catch (error) {
    console.error('createColumn error:', error);
    res.status(500).json({ error: 'Failed to create column' });
  }
};

// PATCH /api/columns/:id - Update column
export const updateColumn = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, order_index } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing column ID' });
    }

    const db = getDatabase();
    
    // Verify column exists
    const column = db.prepare('SELECT id FROM columns WHERE id = ?').get(id);
    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    // Get current column values to use as defaults
    const currentColumn = db.prepare('SELECT name, order_index FROM columns WHERE id = ?').get(id);
    if (!currentColumn) {
      return res.status(404).json({ error: 'Column not found' });
    }

    // Build values array in the exact order expected by UPDATE_COLUMN query:
    // name, order_index, id
    const values = [
      name !== undefined ? name : currentColumn.name,
      order_index !== undefined ? order_index : currentColumn.order_index,
      id
    ];

    const updateStmt = db.prepare(SQL_QUERIES.UPDATE_COLUMN);
    
    const result = updateStmt.run(...values);
    
    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to update column' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('updateColumn error:', error);
    res.status(500).json({ error: 'Failed to update column' });
  }
};

// DELETE /api/columns/:id - Delete column
export const deleteColumn = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Missing column ID' });
    }

    const db = getDatabase();
    
    // Verify column exists
    const column = db.prepare('SELECT id FROM columns WHERE id = ?').get(id);
    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    // Check if column has tasks
    const taskCount = db.prepare(SQL_QUERIES.COUNT_TASKS_IN_COLUMN).get(id);
    if (taskCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete column with tasks. Move or delete tasks first.' });
    }

    const deleteStmt = db.prepare(SQL_QUERIES.DELETE_COLUMN);
    const result = deleteStmt.run(id);
    
    if (result.changes === 0) {
      return res.status(500).json({ error: 'Failed to delete column' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('deleteColumn error:', error);
    res.status(500).json({ error: 'Failed to delete column' });
  }
};

// PATCH /api/columns/reorder - Reorder columns
export const reorderColumns = async (req, res) => {
  try {
    const { columns } = req.body;

    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({ error: 'Missing or invalid columns array' });
    }

    const db = getDatabase();
    
    // Start transaction
    const transaction = db.transaction(() => {
      const updateStmt = db.prepare(SQL_QUERIES.UPDATE_COLUMN_ORDER);
      
      columns.forEach((column, index) => {
        updateStmt.run(index * 1000, column.id);
      });
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error('reorderColumns error:', error);
    res.status(500).json({ error: 'Failed to reorder columns' });
  }
}; 