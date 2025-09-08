export const SQL_QUERIES = {
  // ============================================================================
  // PROJECT QUERIES
  // ============================================================================

  // Get all projects with columns and tasks
  SELECT_PROJECTS_WITH_COLUMNS_AND_TASKS: `
    SELECT
      p.id,
      p.name,
      p.description,
      p.created_at,
      p.updated_at,
      json_group_array(
        json_object(
          'id', c.id,
          'name', c.name,
          'order_index', c.order_index,
          'tasks', (
            SELECT json_group_array(
              json_object(
                'id', t.id,
                'title', t.title,
                'description', t.description,
                'display_id', t.display_id,
                'order_index', t.order_index
              )
            )
            FROM tasks t
            WHERE t.column_id = c.id
            ORDER BY t.order_index
          )
        )
      ) as columns
    FROM projects p
    LEFT JOIN columns c ON p.id = c.project_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `,

  // Create new project
  INSERT_PROJECT: `
    INSERT INTO projects (name, description, abbreviation)
    VALUES (?, ?, ?)
  `,

  // Update project
  UPDATE_PROJECT: `
    UPDATE projects
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  // Delete project
  DELETE_PROJECT: `
    DELETE FROM projects WHERE id = ?
  `,

  // Search project by name
  SEARCH_PROJECT_BY_NAME: `
    SELECT
      p.id,
      p.name,
      p.description,
      p.created_at,
      p.updated_at,
      json_group_array(
        json_object(
          'id', c.id,
          'name', c.name,
          'order_index', c.order_index,
          'tasks', (
            SELECT json_group_array(
              json_object(
                'id', t.id,
                'title', t.title,
                'description', t.description,
                'order_index', t.order_index
              )
            )
            FROM tasks t
            WHERE t.column_id = c.id
            ORDER BY t.order_index
          )
        )
      ) as columns
    FROM projects p
    LEFT JOIN columns c ON p.id = c.project_id
    WHERE p.name = ?
    GROUP BY p.id
  `,

  // Get single project by ID
  SELECT_PROJECT_BY_ID: `
    SELECT id, name, description, created_at, updated_at
    FROM projects WHERE id = ?
  `,

  // ============================================================================
  // COLUMN QUERIES
  // ============================================================================

  // Get columns for a project with task count
  SELECT_COLUMNS_WITH_TASK_COUNT: `
    SELECT
      c.id,
      c.name,
      c.order_index,
      c.created_at,
      COUNT(t.id) as task_count
    FROM columns c
    LEFT JOIN tasks t ON c.id = t.column_id
    WHERE c.project_id = ?
    GROUP BY c.id
    ORDER BY c.order_index
  `,

  // Get all columns for a project
  SELECT_COLUMNS_BY_PROJECT: `
    SELECT id, project_id, name, order_index, created_at
    FROM columns WHERE project_id = ?
    ORDER BY order_index
  `,

  // Create new column
  INSERT_COLUMN: `
    INSERT INTO columns (project_id, name, order_index)
    VALUES (?, ?, ?)
  `,

  // Update column
  UPDATE_COLUMN: `
    UPDATE columns
    SET name = COALESCE(?, name),
        order_index = COALESCE(?, order_index)
    WHERE id = ?
  `,

  // Delete column
  DELETE_COLUMN: `
    DELETE FROM columns WHERE id = ?
  `,

  // Check if column has tasks
  COUNT_TASKS_IN_COLUMN: `
    SELECT COUNT(*) as count FROM tasks WHERE column_id = ?
  `,

  // Get last column order index
  GET_LAST_COLUMN_ORDER_INDEX: `
    SELECT order_index FROM columns
    WHERE project_id = ?
    ORDER BY order_index DESC
    LIMIT 1
  `,

  // Reorder columns
  UPDATE_COLUMN_ORDER: `
    UPDATE columns SET order_index = ? WHERE id = ?
  `,

  // ============================================================================
  // TASK QUERIES
  // ============================================================================

  // Create new task
  INSERT_TASK: `
    INSERT INTO tasks (project_id, column_id, title, description, display_id, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `,

  // Create new task without display_id (for initial insert)
  INSERT_TASK_WITHOUT_DISPLAY_ID: `
    INSERT INTO tasks (project_id, column_id, title, description, order_index)
    VALUES (?, ?, ?, ?, ?)
  `,

  // Update task display_id
  UPDATE_TASK_DISPLAY_ID: `
    UPDATE tasks SET display_id = ? WHERE id = ?
  `,

  // Update task
  UPDATE_TASK: `
    UPDATE tasks
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        column_id = COALESCE(?, column_id),
        order_index = COALESCE(?, order_index),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  // Delete task
  DELETE_TASK: `
    DELETE FROM tasks WHERE id = ?
  `,

  // Move task
  MOVE_TASK: `
    UPDATE tasks
    SET column_id = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  // Get last task order index in column
  GET_LAST_TASK_ORDER_INDEX: `
    SELECT order_index FROM tasks
    WHERE column_id = ?
    ORDER BY order_index DESC
    LIMIT 1
  `,

  // Verify project exists
  VERIFY_PROJECT_EXISTS: `
    SELECT id FROM projects WHERE id = ?
  `,

  // Get project abbreviation
  GET_PROJECT_ABBREVIATION: `
    SELECT abbreviation FROM projects WHERE id = ?
  `,

  // Verify column exists and belongs to project
  VERIFY_COLUMN_EXISTS: `
    SELECT id FROM columns WHERE id = ? AND project_id = ?
  `,

  // Verify task exists and belongs to project
  VERIFY_TASK_EXISTS: `
    SELECT id FROM tasks WHERE id = ? AND project_id = ?
  `,

  // Verify task exists (without project check)
  VERIFY_TASK_EXISTS_BY_ID: `
    SELECT id FROM tasks WHERE id = ?
  `,


  // Get task by display_id
  GET_TASK_BY_DISPLAY_ID: `
    SELECT * FROM tasks WHERE display_id = ?
  `,

  // Get single task by ID
  SELECT_TASK_BY_ID: `
    SELECT
      id,
      title,
      description,
      display_id,
      column_id,
      order_index,
      project_id,
      created_at,
      updated_at
    FROM tasks
    WHERE id = ?
  `,

  // Get all tasks for a project
  SELECT_TASKS_BY_PROJECT: `
    SELECT id, project_id, column_id, title, description, display_id, order_index, created_at, updated_at
    FROM tasks WHERE project_id = ?
    ORDER BY column_id, order_index
  `,

  // Verify column exists
  VERIFY_COLUMN_EXISTS_BY_ID: `
    SELECT id FROM columns WHERE id = ?
  `,

  // ============================================================================
  // MCP OPTIMIZED QUERIES
  // ============================================================================

  // Get project by name (lightweight)
  GET_PROJECT_BY_NAME: `
    SELECT id, name, description, abbreviation FROM projects WHERE name = ?
  `,

  // Get column by name and project
  GET_COLUMN_BY_NAME_AND_PROJECT: `
    SELECT id FROM columns
    WHERE project_id = ? AND name = ?
  `,

  // Get tasks by column with limit (lightweight)
  GET_TASKS_BY_COLUMN: `
    SELECT title, description, order_index
    FROM tasks
    WHERE column_id = ?
    ORDER BY order_index
    LIMIT ?
  `,

  // Get tasks by name pattern (lightweight)
  GET_TASKS_BY_NAME_PATTERN: `
    SELECT
      t.id,
      t.title,
      t.description,
      p.name as project_name,
      c.name as column_name
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN projects p ON t.project_id = p.id
    WHERE t.title LIKE ?
  `,

  // Get projects with limit (lightweight)
  GET_PROJECTS_WITH_LIMIT: `
    SELECT name, description, created_at
    FROM projects
    ORDER BY created_at DESC
    LIMIT ?
  `,

  // Check if project exists by name
  CHECK_PROJECT_EXISTS_BY_NAME: `
    SELECT id FROM projects WHERE name = ?
  `,

  // Get project columns (lightweight)
  GET_PROJECT_COLUMNS: `
    SELECT id, name, order_index FROM columns
    WHERE project_id = ?
    ORDER BY order_index
  `,

  // Find tasks in project by name pattern
  FIND_TASKS_IN_PROJECT: `
    SELECT t.id, t.title, t.column_id
    FROM tasks t
    WHERE t.project_id = ? AND t.title LIKE ?
  `,

  // Get tasks by column for reordering
  GET_TASKS_BY_COLUMN_FOR_REORDER: `
    SELECT order_index FROM tasks
    WHERE column_id = ?
    ORDER BY order_index
  `,

  // Get project summary (for list projects)
  GET_PROJECTS_SUMMARY: `
    SELECT
      p.id,
      p.name,
      p.description,
      p.created_at,
      COUNT(DISTINCT c.id) as column_count,
      COUNT(t.id) as total_tasks
    FROM projects p
    LEFT JOIN columns c ON p.id = c.project_id
    LEFT JOIN tasks t ON p.id = t.project_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `,

  // Get tasks in column by status (for list tasks by status)
  GET_TASKS_IN_COLUMN_BY_STATUS: `
    SELECT
      t.title,
      t.description,
      t.order_index
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN projects p ON t.project_id = p.id
    WHERE p.name = ? AND c.name = ?
    ORDER BY t.order_index
    LIMIT ?
  `,

  // Find task by name in project
  FIND_TASK_BY_NAME_IN_PROJECT: `
    SELECT
      t.id,
      t.title,
      t.description,
      t.column_id,
      c.name as column_name
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN projects p ON t.project_id = p.id
    WHERE p.name = ? AND t.title LIKE ?
  `,

  // ============================================================================
  // SCHEMA QUERIES
  // ============================================================================

  // Create projects table
  CREATE_PROJECTS_TABLE: `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      abbreviation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Create columns table
  CREATE_COLUMNS_TABLE: `
    CREATE TABLE IF NOT EXISTS columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `,

  // Create tasks table
  CREATE_TASKS_TABLE: `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      column_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      display_id TEXT,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (column_id) REFERENCES columns (id) ON DELETE CASCADE
    )
  `,

  // Create MCP integrations table
  CREATE_MCP_INTEGRATIONS_TABLE: `
    CREATE TABLE IF NOT EXISTS mcp_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL UNIQUE,
      call_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Create subtasks table
  CREATE_SUBTASKS_TABLE: `
    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      order_index INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
    )
  `,

  // Create project history table
  CREATE_PROJECT_HISTORY_TABLE: `
    CREATE TABLE IF NOT EXISTS project_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    )
  `,

  // Create indexes
  CREATE_INDEXES: [
    `CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)`,
    `CREATE INDEX IF NOT EXISTS idx_columns_project_id ON columns(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id)`,
    `CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)`,
    `CREATE INDEX IF NOT EXISTS idx_mcp_integrations_client_name ON mcp_integrations(client_name)`,
    `CREATE INDEX IF NOT EXISTS idx_project_history_project_id ON project_history(project_id)`,
    `CREATE INDEX IF NOT EXISTS idx_project_history_created_at ON project_history(created_at)`
  ],

  // ============================================================================
  // SUBTASK QUERIES
  // ============================================================================

  // Get all subtasks for a task
  SELECT_SUBTASKS_BY_TASK: `
    SELECT
      id,
      task_id,
      title,
      completed,
      order_index,
      created_at,
      updated_at
    FROM subtasks
    WHERE task_id = ?
    ORDER BY order_index
  `,

  // Create new subtask
  INSERT_SUBTASK: `
    INSERT INTO subtasks (task_id, title, completed, order_index)
    VALUES (?, ?, ?, ?)
  `,

  // Update subtask
  UPDATE_SUBTASK: `
    UPDATE subtasks
    SET title = COALESCE(?, title),
        completed = COALESCE(?, completed),
        order_index = COALESCE(?, order_index),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  // Get single subtask by ID
  SELECT_SUBTASK_BY_ID: `
    SELECT
      id,
      task_id,
      title,
      completed,
      order_index,
      created_at,
      updated_at
    FROM subtasks
    WHERE id = ?
  `,

  // Verify subtask exists and belongs to task
  VERIFY_SUBTASK_EXISTS: `
    SELECT id FROM subtasks WHERE id = ? AND task_id = ?
  `,

  // Verify subtask exists (without task check)
  VERIFY_SUBTASK_EXISTS_BY_ID: `
    SELECT id FROM subtasks WHERE id = ?
  `,

  // Delete subtask
  DELETE_SUBTASK: `
    DELETE FROM subtasks WHERE id = ?
  `,

  // Get last subtask order index for a task
  GET_LAST_SUBTASK_ORDER_INDEX: `
    SELECT order_index FROM subtasks
    WHERE task_id = ?
    ORDER BY order_index DESC
    LIMIT 1
  `,

  // Find subtask by title pattern within a task
  FIND_SUBTASK_BY_TITLE_IN_TASK: `
    SELECT
      s.id,
      s.task_id,
      s.title,
      s.completed,
      s.order_index
    FROM subtasks s
    WHERE s.task_id = ? AND s.title LIKE ?
    ORDER BY s.order_index
    LIMIT 1
  `,

  // Get all subtasks for a project
  SELECT_SUBTASKS_BY_PROJECT: `
    SELECT id, task_id, title, completed, order_index, created_at, updated_at
    FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)
    ORDER BY task_id, order_index
  `,

  // ============================================================================
  // PROJECT HISTORY QUERIES
  // ============================================================================

  // Create new project history entry
  INSERT_PROJECT_HISTORY: `
    INSERT INTO project_history (project_id, snapshot, description)
    VALUES (?, ?, ?)
  `,

  // Get project history for a project
  SELECT_PROJECT_HISTORY: `
    SELECT
      id,
      project_id,
      description,
      datetime(created_at, 'localtime') as created_at
    FROM project_history
    WHERE project_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `,

  // Get specific project history entry with snapshot
  SELECT_PROJECT_HISTORY_BY_ID: `
    SELECT
      id,
      project_id,
      snapshot,
      description,
      datetime(created_at, 'localtime') as created_at
    FROM project_history
    WHERE id = ?
  `,

  // Delete old project history entries (keep only latest N)
  DELETE_OLD_PROJECT_HISTORY: `
    DELETE FROM project_history
    WHERE project_id = ?
    AND id NOT IN (
      SELECT id FROM project_history
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    )
  `,

  // ============================================================================
  // MCP INTEGRATION QUERIES
  // ============================================================================

  // Get or create MCP integration
  GET_OR_CREATE_MCP_INTEGRATION: `
    INSERT INTO mcp_integrations (client_name, call_count)
    VALUES (?, 1)
    ON CONFLICT(client_name) DO UPDATE SET
      call_count = call_count + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING
      id,
      client_name,
      call_count,
      datetime(created_at, 'localtime') as created_at,
      datetime(updated_at, 'localtime') as updated_at
  `,

  // Get all MCP integrations
  GET_ALL_MCP_INTEGRATIONS: `
    SELECT
      id,
      client_name,
      call_count,
      datetime(created_at, 'localtime') as created_at,
      datetime(updated_at, 'localtime') as updated_at
    FROM mcp_integrations
    ORDER BY updated_at DESC
  `,


};