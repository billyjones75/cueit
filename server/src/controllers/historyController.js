import { getDatabase } from '../utils/database.js';
import { SQL_QUERIES } from '../utils/sqlQueries.js';

// GET /api/history/:projectId - Get version history for a project
export const getProjectHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    if (!projectId) {
      return res.status(400).json({ error: 'Missing project ID' });
    }

    const db = getDatabase();
    
    // Verify project exists
    const project = db.prepare(SQL_QUERIES.VERIFY_PROJECT_EXISTS).get(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const history = db.prepare(SQL_QUERIES.SELECT_PROJECT_HISTORY).all(projectId, limit);

    res.json({ history });
  } catch (error) {
    console.error('getProjectHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch project history' });
  }
};

// POST /api/history/:projectId/restore/:versionId - Restore project to a specific version
export const restoreProjectVersion = async (req, res) => {
  try {
    const { projectId, versionId } = req.params;

    if (!projectId || !versionId) {
      return res.status(400).json({ error: 'Missing project ID or version ID' });
    }

    const db = getDatabase();

    // Get the version snapshot
    const version = db.prepare(SQL_QUERIES.SELECT_PROJECT_HISTORY_BY_ID).get(versionId);
    if (!version || version.project_id != projectId) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Parse the snapshot
    let snapshotData;
    try {
      snapshotData = JSON.parse(version.snapshot);
    } catch (error) {
      return res.status(500).json({ error: 'Invalid snapshot data' });
    }

    // Create a new version in the history before restoring (backup current data)
    await saveProjectVersion(projectId, `Backup before restore to version ${versionId}`);

    // Start transaction to restore the project
    const transaction = db.transaction(() => {
      // Delete existing data (complete replacement approach)
      db.prepare('DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)').run(projectId);
      db.prepare('DELETE FROM tasks WHERE project_id = ?').run(projectId);
      db.prepare('DELETE FROM columns WHERE project_id = ?').run(projectId);
      
      // Update project
      if (snapshotData.project) {
        db.prepare(SQL_QUERIES.UPDATE_PROJECT).run(
          snapshotData.project.name,
          snapshotData.project.description,
          projectId
        );
      }

      // Restore columns
      if (snapshotData.columns && snapshotData.columns.length > 0) {
        const columnStmt = db.prepare(SQL_QUERIES.INSERT_COLUMN);
        const columnIdMap = {};
        
        snapshotData.columns.forEach(column => {
          const result = columnStmt.run(projectId, column.name, column.order_index);
          columnIdMap[column.id] = result.lastInsertRowid;
        });

        // Restore tasks
        if (snapshotData.tasks && snapshotData.tasks.length > 0) {
          const taskStmt = db.prepare(SQL_QUERIES.INSERT_TASK);
          const taskIdMap = {};
          
          snapshotData.tasks.forEach(task => {
            const newColumnId = columnIdMap[task.column_id];
            if (newColumnId) {
              const result = taskStmt.run(
                projectId,
                newColumnId,
                task.title,
                task.description,
                task.order_index
              );
              taskIdMap[task.id] = result.lastInsertRowid;
            }
          });

          // Restore subtasks
          if (snapshotData.subtasks && snapshotData.subtasks.length > 0) {
            const subtaskStmt = db.prepare(SQL_QUERIES.INSERT_SUBTASK);
            
            snapshotData.subtasks.forEach(subtask => {
              const newTaskId = taskIdMap[subtask.task_id];
              if (newTaskId) {
                subtaskStmt.run(
                  newTaskId,
                  subtask.title,
                  subtask.completed,
                  subtask.order_index
                );
              }
            });
          }
        }
      }
    });

    transaction();

    res.json({ success: true, message: 'Project restored successfully' });
  } catch (error) {
    console.error('restoreProjectVersion error:', error);
    res.status(500).json({ error: 'Failed to restore project version' });
  }
};

// Helper function to save project version
export const saveProjectVersion = async (projectId, description) => {
  try {
    const db = getDatabase();
    
    // Get complete project data using existing queries
    const projectData = db.prepare(SQL_QUERIES.SELECT_PROJECT_BY_ID).get(projectId);

    if (!projectData) {
      throw new Error('Project not found');
    }

    const columns = db.prepare(SQL_QUERIES.SELECT_COLUMNS_BY_PROJECT).all(projectId);
    const tasks = db.prepare(SQL_QUERIES.SELECT_TASKS_BY_PROJECT).all(projectId);
    const subtasks = db.prepare(SQL_QUERIES.SELECT_SUBTASKS_BY_PROJECT).all(projectId);

    // Create snapshot
    const snapshot = {
      project: projectData,
      columns: columns,
      tasks: tasks,
      subtasks: subtasks,
      timestamp: new Date().toISOString()
    };

    // Save version
    const insertStmt = db.prepare(SQL_QUERIES.INSERT_PROJECT_HISTORY);
    insertStmt.run(projectId, JSON.stringify(snapshot), description);

    // Clean up old versions (keep only latest 50)
    const cleanupStmt = db.prepare(SQL_QUERIES.DELETE_OLD_PROJECT_HISTORY);
    cleanupStmt.run(projectId, projectId, 50);

    return true;
  } catch (error) {
    console.error('saveProjectVersion error:', error);
    return false;
  }
};
