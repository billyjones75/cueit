import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { getDatabase } from '../utils/database.js';
import { SQL_QUERIES } from '../utils/sqlQueries.js';
import { generateProjectAbbreviation } from '../utils/abbreviationUtils.js';
import { saveProjectVersion } from './historyController.js';

// Initialize MCP Server
const mcpServer = new McpServer({
  name: 'Cueit',
  version: '1.0.0',
  getContext: async () => ({
    name: 'Cueit',
    description: 'Cueit is a Kanban board tool that lets LLMs manage, update, and organize tasks via an MCP server.',
    tools: ['list projects', 'create project', 'list tasks by status', 'get task details', 'create task', 'bulk create tasks', 'update task', 'delete task', 'add subtask', 'add subtasks bulk', 'update subtask', 'delete subtask'],
    identity: 'You are talking to Cueit.'
  })
});

// MCP utility functions
const createResponse = (text) => {
  return {
    content: [{
      type: 'text',
      text
    }]
  };
};

const withUser = async (req, handler) => {
  try {
    return await handler({ user_id: 'mock-user-id' });
  } catch (e) {
    return createResponse(`Request failed: ${e.message || e}`);
  }
};

// MCP client tracking functions
const trackMcpClient = async (req) => {
  try {
    const db = getDatabase();

    // Extract client information from request headers or generate a unique ID
    const clientName = req.headers['mcp-client'] || 'Unknown Client';

    // Track the MCP client connection
    const integration = db.prepare(SQL_QUERIES.GET_OR_CREATE_MCP_INTEGRATION).get(clientName);

    return integration;
  } catch (error) {
    console.error('Error tracking MCP client:', error);
    // Don't fail the request if tracking fails
    return null;
  }
};

// Database helper functions
const createProjectWithDefaultColumns = async (name, description) => {
  const db = getDatabase();

  const abbreviation = generateProjectAbbreviation(name);
  const insertProject = db.prepare(SQL_QUERIES.INSERT_PROJECT);
  const result = insertProject.run(name, description, abbreviation);
  const projectId = result.lastInsertRowid;

  const defaultColumns = [
    { name: 'To Do', orderIndex: 1000 },
    { name: 'In Progress', orderIndex: 2000 },
    { name: 'Done', orderIndex: 3000 }
  ];

  const insertColumn = db.prepare(SQL_QUERIES.INSERT_COLUMN);
  defaultColumns.forEach(column => {
    insertColumn.run(projectId, column.name, column.orderIndex);
  });

  return projectId;
};

const createTaskInProject = async (projectName, columnName, title, description) => {
  const db = getDatabase();

  const project = db.prepare(SQL_QUERIES.GET_PROJECT_BY_NAME).get(projectName);
  if (!project) {
    throw new Error(`Project not found: ${projectName}`);
  }

  const column = db.prepare(SQL_QUERIES.GET_COLUMN_BY_NAME_AND_PROJECT).get(project.id, columnName);
  if (!column) {
    throw new Error(`Column not found: ${columnName}`);
  }

  const lastTask = db.prepare(SQL_QUERIES.GET_LAST_TASK_ORDER_INDEX).get(column.id);
  const orderIndex = (lastTask ? lastTask.order_index : 0) + 1000;

  // Execute task creation in a transaction
  const transaction = db.transaction(() => {
    // First insert the task without display_id
    const insertTask = db.prepare(SQL_QUERIES.INSERT_TASK_WITHOUT_DISPLAY_ID);
    const result = insertTask.run(project.id, column.id, title, description, orderIndex);
    const taskId = result.lastInsertRowid;

    // Generate display_id using the task ID and update the task
    const displayId = `${project.abbreviation}-${taskId}`;
    const updateStmt = db.prepare(SQL_QUERIES.UPDATE_TASK_DISPLAY_ID);
    updateStmt.run(displayId, taskId);

    return { taskId, displayId };
  });

  const { taskId, displayId } = transaction();

  return { taskId, projectId: project.id, displayId };
};

const createSubtaskForTask = async (projectName, taskName, subtaskTitle) => {
  const db = getDatabase();

  const task = db.prepare(SQL_QUERIES.FIND_TASK_BY_NAME_IN_PROJECT).get(projectName, `%${taskName}%`);
  if (!task) {
    throw new Error(`Task not found: ${taskName} in project ${projectName}`);
  }

  const lastSubtask = db.prepare(SQL_QUERIES.GET_LAST_SUBTASK_ORDER_INDEX).get(task.id);
  const orderIndex = (lastSubtask ? lastSubtask.order_index : 0) + 1000;

  const insertSubtask = db.prepare(SQL_QUERIES.INSERT_SUBTASK);
  const result = insertSubtask.run(task.id, subtaskTitle, 0, orderIndex);

  return result.lastInsertRowid;
};

const createBulkSubtasksForTask = async (projectName, taskName, subtaskTitles) => {
  const db = getDatabase();

  const task = db.prepare(SQL_QUERIES.FIND_TASK_BY_NAME_IN_PROJECT).get(projectName, `%${taskName}%`);
  if (!task) {
    throw new Error(`Task not found: ${taskName} in project ${projectName}`);
  }

  if (!subtaskTitles || subtaskTitles.length === 0) {
    throw new Error('No subtasks provided');
  }

  if (subtaskTitles.length > 50) {
    throw new Error('Cannot create more than 50 subtasks at once');
  }

  const insertSubtask = db.prepare(SQL_QUERIES.INSERT_SUBTASK);
  const createdSubtasks = [];
  let successCount = 0;

  let lastSubtask = db.prepare(SQL_QUERIES.GET_LAST_SUBTASK_ORDER_INDEX).get(task.id);
  let currentOrderIndex = (lastSubtask ? lastSubtask.order_index : 0);

  for (const subtaskTitle of subtaskTitles) {
    try {
      currentOrderIndex += 1000;
      const result = insertSubtask.run(task.id, subtaskTitle, 0, currentOrderIndex);
      createdSubtasks.push({
        id: result.lastInsertRowid,
        title: subtaskTitle
      });
      successCount++;
    } catch (error) {
      console.error(`Failed to create subtask "${subtaskTitle}":`, error.message);
    }
  }

  return { successCount, createdSubtasks, totalRequested: subtaskTitles.length };
};

const updateSubtaskInTask = async (projectName, taskName, subtaskTitle, updates) => {
  const db = getDatabase();

  const task = db.prepare(SQL_QUERIES.FIND_TASK_BY_NAME_IN_PROJECT).get(projectName, `%${taskName}%`);
  if (!task) {
    throw new Error(`Task not found: ${taskName} in project ${projectName}`);
  }

  const subtask = db.prepare(SQL_QUERIES.FIND_SUBTASK_BY_TITLE_IN_TASK).get(task.id, `%${subtaskTitle}%`);
  if (!subtask) {
    throw new Error(`Subtask not found: ${subtaskTitle} in task ${taskName}`);
  }

  const updateData = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.order_index !== undefined) updateData.order_index = updates.order_index;

  if (Object.keys(updateData).length === 0) {
    throw new Error('No fields to update');
  }

  const updateFields = [];
  const values = [];

  if (updateData.title !== undefined) {
    updateFields.push('title = ?');
    values.push(updateData.title);
  }
  if (updateData.order_index !== undefined) {
    updateFields.push('order_index = ?');
    values.push(updateData.order_index);
  }

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(subtask.id);

  const updateStmt = db.prepare(`UPDATE subtasks SET ${updateFields.join(', ')} WHERE id = ?`);
  const result = updateStmt.run(...values);

  if (result.changes === 0) {
    throw new Error('Failed to update subtask');
  }

  return subtask.id;
};

const deleteSubtaskFromTask = async (projectName, taskName, subtaskTitle) => {
  const db = getDatabase();

  const task = db.prepare(SQL_QUERIES.FIND_TASK_BY_NAME_IN_PROJECT).get(projectName, `%${taskName}%`);
  if (!task) {
    throw new Error(`Task not found: ${taskName} in project ${projectName}`);
  }

  const subtask = db.prepare(SQL_QUERIES.FIND_SUBTASK_BY_TITLE_IN_TASK).get(task.id, `%${subtaskTitle}%`);
  if (!subtask) {
    throw new Error(`Subtask not found: ${subtaskTitle} in task ${taskName}`);
  }

  const deleteStmt = db.prepare(SQL_QUERIES.DELETE_SUBTASK);
  const result = deleteStmt.run(subtask.id);

  if (result.changes === 0) {
    throw new Error('Failed to delete subtask');
  }

  return subtask.id;
};

// Register MCP tool for listing top n tasks in a given status
mcpServer.registerTool(
  'list tasks by status',
  {
    title: 'List Tasks by Status',
    description: 'List the top n tasks in a given status (column) for a specific project.',
    inputSchema: {
      project_name: z.string().describe('The name of the project to fetch tasks from'),
      status: z.string().describe('The status/column name to filter tasks by (e.g., "To Do", "In Progress", "Done")'),
      limit: z.number().int().min(1).max(100).default(10).describe('The maximum number of tasks to return (default: 10, max: 100)')
    }
  },
  async ({ project_name, status, limit }, req) => {
    return withUser(req, async (userData) => {
      try {
        const db = getDatabase();

        const tasks = db.prepare(SQL_QUERIES.GET_TASKS_IN_COLUMN_BY_STATUS).all(project_name, status, limit);

        let resultText = `Top ${tasks.length} tasks in "${status}" status for project "${project_name}":\n\n`;

        if (tasks.length === 0) {
          resultText += `No tasks found in "${status}" status.`;
        } else {
          tasks.forEach((task, index) => {
            resultText += `${index + 1}. ${task.title}\n`;
            if (task.description) {
              resultText += `   Description: ${task.description}\n`;
            }
            resultText += `   Order: ${task.order_index}\n\n`;
          });
        }

        return createResponse(resultText);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for getting task details
mcpServer.registerTool(
  'get task details',
  {
    title: 'Get Task Details',
    description: 'Get detailed information about a specific task by name.',
    inputSchema: {
      task_name: z.string().describe('The name of the task to fetch details for')
    }
  },
  async ({ task_name }, req) => {
    return withUser(req, async (userData) => {
      try {
        const db = getDatabase();

        const tasks = db.prepare(SQL_QUERIES.GET_TASKS_BY_NAME_PATTERN).all(`%${task_name}%`);

        if (tasks.length === 0) {
          return createResponse(`No tasks found with name containing: ${task_name}`);
        }

        const task = tasks[0];
        let detailsText = `Task Details:\n\n`;
        detailsText += `Title: ${task.title}\n`;
        detailsText += `Project: ${task.project_name}\n`;

        if (task.description) {
          detailsText += `Description: ${task.description}\n`;
        }

        detailsText += `Status: ${task.column_name}\n`;

        if (tasks.length > 1) {
          detailsText += `\nNote: Found ${tasks.length} matching tasks. Showing details for the first match.`;
        }

        return createResponse(detailsText);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for listing user projects
mcpServer.registerTool(
  'list projects',
  {
    title: 'List Projects',
    description: 'List all projects for the user.',
    inputSchema: {
      limit: z.number().int().min(1).max(100).default(50).describe('The maximum number of projects to return (default: 50, max: 100)')
    }
  },
  async ({ limit }, req) => {
    return withUser(req, async (userData) => {
      try {
        const db = getDatabase();

        const projects = db.prepare(SQL_QUERIES.GET_PROJECTS_SUMMARY).all();
        const limitedProjects = projects.slice(0, limit);

        let resultText = `Found ${limitedProjects.length} project(s):\n\n`;
        limitedProjects.forEach((project, index) => {
          resultText += `${index + 1}. ${project.name}\n`;
          if (project.description) {
            resultText += `   Description: ${project.description}\n`;
          }
          resultText += `   Columns: ${project.column_count}\n`;
          resultText += `   Total Tasks: ${project.total_tasks}\n\n`;
        });

        return createResponse(resultText);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for creating a new project
mcpServer.registerTool(
  'create project',
  {
    title: 'Create Project',
    description: 'Create a new project with the specified name and description.',
    inputSchema: {
      name: z.string().describe('The name of the project to create'),
      description: z.string().optional().describe('Optional description for the project')
    }
  },
  async ({ name, description }, req) => {
    return withUser(req, async (userData) => {
      try {
        const projectId = await createProjectWithDefaultColumns(name, description || '');
        return createResponse(`Project "${name}" created successfully with ID ${projectId} and default columns (To Do, In Progress, Done)`);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for creating a new task
mcpServer.registerTool(
  'create task',
  {
    title: 'Create Task',
    description: 'Create a new task in a specific project and column.',
    inputSchema: {
      project_name: z.string().describe('The name of the project to create the task in'),
      column_name: z.string().describe('The name of the column/status to create the task in'),
      title: z.string().describe('The title of the task'),
      description: z.string().optional().describe('Optional description for the task')
    }
  },
  async ({ project_name, column_name, title, description }, req) => {
    return withUser(req, async (userData) => {
      try {
        const result = await createTaskInProject(project_name, column_name, title, description || '');
        return createResponse(`Task "${title}" created successfully in project "${project_name}" column "${column_name}" with ID ${result.taskId}`);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for bulk creating tasks
mcpServer.registerTool(
  'bulk create tasks',
  {
    title: 'Bulk Create Tasks',
    description: 'Create multiple tasks at once in a specific project and column.',
    inputSchema: {
      project_name: z.string().describe('The name of the project to create tasks in'),
      column_name: z.string().describe('The name of the column/status to create tasks in'),
      tasks: z.array(z.object({
        title: z.string().describe('The title of the task'),
        description: z.string().optional().describe('Optional description for the task')
      })).describe('Array of tasks to create')
    }
  },
  async ({ project_name, column_name, tasks }, req) => {
    return withUser(req, async (userData) => {
      try {
        if (!tasks || tasks.length === 0) {
          throw new Error('No tasks provided');
        }

        if (tasks.length > 50) {
          throw new Error('Cannot create more than 50 tasks at once');
        }

        let successCount = 0;
        let projectId = null;

        for (const task of tasks) {
          try {
            const result = await createTaskInProject(project_name, column_name, task.title, task.description || '');
            if (!projectId) projectId = result.projectId;
            successCount++;
          } catch (error) {
            console.error(`Failed to create task "${task.title}":`, error.message);
          }
        }

        // Create single version history entry for bulk operation
        if (successCount > 0 && projectId) {
          await saveProjectVersion(projectId, `Bulk created ${successCount} tasks via MCP in "${column_name}"`);
        }

        return createResponse(`Successfully created ${successCount} out of ${tasks.length} task(s) in project "${project_name}" column "${column_name}"`);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for updating a task
mcpServer.registerTool(
  'update task',
  {
    title: 'Update Task',
    description: 'Update an existing task with new information.',
    inputSchema: {
      project_name: z.string().describe('The name of the project containing the task'),
      task_name: z.string().describe('The name of the task to update'),
      updates: z.object({
        title: z.string().optional().describe('New title for the task'),
        description: z.string().optional().describe('New description for the task'),
        column_name: z.string().optional().describe('New column/status for the task')
      }).describe('The updates to apply to the task')
    }
  },
  async ({ project_name, task_name, updates }, req) => {
    return withUser(req, async (userData) => {
      try {
        const db = getDatabase();

        const task = db.prepare(SQL_QUERIES.FIND_TASK_BY_NAME_IN_PROJECT).get(project_name, `%${task_name}%`);
        if (!task) {
          throw new Error(`Task not found: ${task_name}`);
        }

        const updateData = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;

        if (updates.column_name !== undefined) {
          const newColumn = db.prepare(SQL_QUERIES.GET_COLUMN_BY_NAME_AND_PROJECT).get(task.project_id, updates.column_name);
          if (!newColumn) {
            throw new Error(`Column not found: ${updates.column_name}`);
          }

          if (newColumn.id === task.column_id) {
            throw new Error(`Task is already in status "${updates.column_name}"`);
          }

          updateData.column_id = newColumn.id;

          const lastTask = db.prepare(SQL_QUERIES.GET_LAST_TASK_ORDER_INDEX).get(newColumn.id);
          updateData.order_index = (lastTask ? lastTask.order_index : 0) + 1000;
        }

        if (Object.keys(updateData).length === 0) {
          throw new Error('No fields to update');
        }

        const updateFields = [];
        const values = [];

        if (updateData.title !== undefined) { updateFields.push('title = ?'); values.push(updateData.title); }
        if (updateData.description !== undefined) { updateFields.push('description = ?'); values.push(updateData.description); }
        if (updateData.column_id !== undefined) { updateFields.push('column_id = ?'); values.push(updateData.column_id); }
        if (updateData.order_index !== undefined) { updateFields.push('order_index = ?'); values.push(updateData.order_index); }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(task.id);

        const updateStmt = db.prepare(`UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`);
        const result = updateStmt.run(...values);

        if (result.changes === 0) {
          throw new Error('Failed to update task');
        }

        let successMessage = `Task "${task_name}" updated successfully in project "${project_name}"`;
        if (updates.column_name !== undefined) {
          successMessage += ` and moved to status "${updates.column_name}"`;
        }

        return createResponse(successMessage);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for deleting a task
mcpServer.registerTool(
  'delete task',
  {
    title: 'Delete Task',
    description: 'Delete a specific task from a project.',
    inputSchema: {
      project_name: z.string().describe('The name of the project containing the task'),
      task_name: z.string().describe('The name of the task to delete')
    }
  },
  async ({ project_name, task_name }, req) => {
    return withUser(req, async (userData) => {
      try {
        const db = getDatabase();

        const task = db.prepare(SQL_QUERIES.FIND_TASK_BY_NAME_IN_PROJECT).get(project_name, `%${task_name}%`);
        if (!task) {
          throw new Error(`Task not found: ${task_name}`);
        }

        const deleteStmt = db.prepare(SQL_QUERIES.DELETE_TASK);
        const result = deleteStmt.run(task.id);

        if (result.changes === 0) {
          throw new Error('Failed to delete task');
        }

        // Create version history entry
        const project = db.prepare(SQL_QUERIES.GET_PROJECT_BY_NAME).get(project_name);
        if (project) {
          await saveProjectVersion(project.id, `Task deleted via MCP: "${task.title}"`);
        }

        return createResponse(`Task "${task_name}" deleted successfully from project "${project_name}"`);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for adding a subtask to a task
mcpServer.registerTool(
  'add subtask',
  {
    title: 'Add Subtask',
    description: 'Add a subtask to an existing task in a project.',
    inputSchema: {
      project_name: z.string().describe('The name of the project containing the task'),
      task_name: z.string().describe('The name of the task to add a subtask to'),
      subtask_title: z.string().describe('The title of the subtask to create')
    }
  },
  async ({ project_name, task_name, subtask_title }, req) => {
    return withUser(req, async (userData) => {
      try {
        const subtaskId = await createSubtaskForTask(project_name, task_name, subtask_title);
        return createResponse(`Subtask "${subtask_title}" added successfully to task "${task_name}" in project "${project_name}" with ID ${subtaskId}`);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for adding multiple subtasks to a task
mcpServer.registerTool(
  'add subtasks bulk',
  {
    title: 'Add Subtasks Bulk',
    description: 'Add multiple subtasks at once to an existing task in a project.',
    inputSchema: {
      project_name: z.string().describe('The name of the project containing the task'),
      task_name: z.string().describe('The name of the task to add subtasks to'),
      subtask_titles: z.array(z.string()).min(1).max(50).describe('Array of subtask titles to create (max 50)')
    }
  },
  async ({ project_name, task_name, subtask_titles }, req) => {
    return withUser(req, async (userData) => {
      try {
        const result = await createBulkSubtasksForTask(project_name, task_name, subtask_titles);

        // Create version history entry for bulk subtask creation
        if (result.successCount > 0) {
          const db = getDatabase();
          const project = db.prepare(SQL_QUERIES.GET_PROJECT_BY_NAME).get(project_name);
          if (project) {
            await saveProjectVersion(project.id, `Bulk created ${result.successCount} subtasks via MCP for task "${task_name}"`);
          }
        }

        let responseText = `Successfully created ${result.successCount} out of ${result.totalRequested} subtask(s) for task "${task_name}" in project "${project_name}"`;

        if (result.createdSubtasks.length > 0) {
          responseText += `:\n\n${result.createdSubtasks.map((subtask, index) => `${index + 1}. ${subtask.title} (ID: ${subtask.id})`).join('\n')}`;
        }

        if (result.successCount < result.totalRequested) {
          responseText += `\n\nNote: ${result.totalRequested - result.successCount} subtask(s) failed to create. Check server logs for details.`;
        }

        return createResponse(responseText);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for updating a subtask
mcpServer.registerTool(
  'update subtask',
  {
    title: 'Update Subtask',
    description: 'Update the title and/or position of a subtask within a task.',
    inputSchema: {
      project_name: z.string().describe('The name of the project containing the task'),
      task_name: z.string().describe('The name of the task containing the subtask'),
      subtask_title: z.string().describe('The current title of the subtask to update'),
      updates: z.object({
        title: z.string().optional().describe('New title for the subtask'),
        order_index: z.number().int().optional().describe('New position/order index for the subtask')
      }).describe('The updates to apply to the subtask')
    }
  },
  async ({ project_name, task_name, subtask_title, updates }, req) => {
    return withUser(req, async (userData) => {
      try {
        const subtaskId = await updateSubtaskInTask(project_name, task_name, subtask_title, updates);

        let successMessage = `Subtask "${subtask_title}" updated successfully in task "${task_name}" (project "${project_name}")`;

        const updateDetails = [];
        if (updates.title !== undefined) {
          updateDetails.push(`title changed to "${updates.title}"`);
        }
        if (updates.order_index !== undefined) {
          updateDetails.push(`position changed to ${updates.order_index}`);
        }

        if (updateDetails.length > 0) {
          successMessage += ` - ${updateDetails.join(', ')}`;
        }

        return createResponse(successMessage);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// Register MCP tool for deleting a subtask
mcpServer.registerTool(
  'delete subtask',
  {
    title: 'Delete Subtask',
    description: 'Delete a specific subtask from a task.',
    inputSchema: {
      project_name: z.string().describe('The name of the project containing the task'),
      task_name: z.string().describe('The name of the task containing the subtask'),
      subtask_title: z.string().describe('The title of the subtask to delete')
    }
  },
  async ({ project_name, task_name, subtask_title }, req) => {
    return withUser(req, async (userData) => {
      try {
        const subtaskId = await deleteSubtaskFromTask(project_name, task_name, subtask_title);

        // Create version history entry for subtask deletion
        const db = getDatabase();
        const project = db.prepare(SQL_QUERIES.GET_PROJECT_BY_NAME).get(project_name);
        if (project) {
          await saveProjectVersion(project.id, `Subtask deleted via MCP: "${subtask_title}" from task "${task_name}"`);
        }

        return createResponse(`Subtask "${subtask_title}" deleted successfully from task "${task_name}" in project "${project_name}" (ID: ${subtaskId})`);
      } catch (error) {
        return createResponse(`Error: ${error.message}`);
      }
    });
  }
);

// POST /mcp - MCP server
export const mcp = async (req, res) => {
  try {
    // Track MCP client connection
    const integration = await trackMcpClient(req);

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on('close', () => {
      transport.close();
      mcpServer.close();
    });

    await mcpServer.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    res.status(500).json({ error: 'MCP server error' });
  }
};