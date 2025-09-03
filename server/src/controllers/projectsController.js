import { getDatabase } from '../utils/database.js';
import { SQL_QUERIES } from '../utils/sqlQueries.js';

// GET /api/projects - Get all projects
export const getProjects = async (req, res) => {
  try {
    const db = getDatabase();
    
    const projects = db.prepare(SQL_QUERIES.SELECT_PROJECTS_WITH_COLUMNS_AND_TASKS).all();

    // Parse the JSON columns for each project
    const formattedProjects = projects.map(project => ({
      ...project,
      columns: JSON.parse(project.columns || '[]')
    }));

    res.json({ projects: formattedProjects });
  } catch (error) {
    console.error('getProjects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// POST /api/projects - Create new project
export const createProject = async (req, res) => {
  try {
    const { name, description, columns = [], tasks = [] } = req.body;
    
    if (!name) {
      console.error('createProject error: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDatabase();
    
    // Start transaction
    const transaction = db.transaction(() => {
      // 1. Insert project
      const projectStmt = db.prepare(SQL_QUERIES.INSERT_PROJECT);
      const projectResult = projectStmt.run(name, description);
      const projectId = projectResult.lastInsertRowid;

      // 2. Insert columns (use provided columns or default empty columns)
      let columnsToInsert = [];
      
      if (columns && columns.length > 0) {
        columnsToInsert = columns.map((col, idx) => ({
          project_id: projectId,
          name: col.name,
          order_index: idx,
        }));
      } else {
        columnsToInsert = [
          { project_id: projectId, name: 'To Do', order_index: 0 },
          { project_id: projectId, name: 'In Progress', order_index: 1 },
          { project_id: projectId, name: 'Done', order_index: 2 }
        ];
      }

      const columnStmt = db.prepare(SQL_QUERIES.INSERT_COLUMN);
      
      columnsToInsert.forEach(col => {
        columnStmt.run(col.project_id, col.name, col.order_index);
      });

      // 3. Insert tasks (only if tasks are provided)
      if (tasks && tasks.length > 0) {
        const taskStmt = db.prepare(SQL_QUERIES.INSERT_TASK);

        tasks.forEach((task, idx) => {
          const col = columnsToInsert.find((c) => c.name === task.columnName);
          if (col) {
            taskStmt.run(projectId, col.id, task.title, task.description, idx);
          }
        });
      }

      return projectId;
    });

    const projectId = transaction();
    res.json({ project_id: projectId });
  } catch (error) {
    console.error('createProject error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// PATCH /api/projects/:id - Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!id) {
      console.error('updateProject error: Missing project ID');
      return res.status(400).json({ error: 'Missing project ID' });
    }

    const db = getDatabase();
    
    const updateStmt = db.prepare(SQL_QUERIES.UPDATE_PROJECT);
    const result = updateStmt.run(name, description, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('updateProject error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// DELETE /api/projects/:id - Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      console.error('deleteProject error: Missing project ID');
      return res.status(400).json({ error: 'Missing project ID' });
    }

    const db = getDatabase();
    
    // Delete project (cascading will handle columns and tasks)
    const deleteStmt = db.prepare(SQL_QUERIES.DELETE_PROJECT);
    const result = deleteStmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('deleteProject error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// GET /api/projects/search?name=project_name - Search projects by name
export const searchProjects = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      console.error('searchProjects error: Missing project name query parameter');
      return res.status(400).json({ error: 'Missing project name query parameter' });
    }

    const db = getDatabase();

    const project = db.prepare(SQL_QUERIES.SEARCH_PROJECT_BY_NAME).get(name);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const formattedProject = {
      ...project,
      columns: JSON.parse(project.columns || '[]')
    };

    res.json({ project: formattedProject });
  } catch (error) {
    console.error('searchProjects error:', error);
    res.status(500).json({ error: 'Failed to search projects' });
  }
};