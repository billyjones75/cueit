// Project-related API calls
export const projectApi = {
  async fetchProjects() {
    const res = await fetch(`${window.location.origin}/api/projects`);

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const data = await res.json();
    return data.projects || [];
  },

  async createProject(name: string, description: string, columns: any[] = [], tasks: any[] = []) {
    const res = await fetch(`${window.location.origin}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        columns,
        tasks
      })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return await res.json();
  },

  async updateProject(projectId: number, name: string, description: string) {
    const res = await fetch(`${window.location.origin}/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return await res.json();
  },

  async deleteProject(projectId: number) {
    const res = await fetch(`${window.location.origin}/api/projects/${projectId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    return await res.json();
  }
};

// Task-related API calls
export const taskApi = {
  async createTask(projectId: number, columnId: number, title: string, description: string = '', orderIndex: number = 0) {
    const res = await fetch(`${window.location.origin}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: projectId,
        column_id: columnId,
        title,
        description,
        order_index: orderIndex
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const responseData = await res.json();
    const newTask = responseData.task || responseData;

    if (!newTask || !newTask.id) {
      throw new Error('Invalid task response from server');
    }

    return newTask;
  },

  async updateTask(projectId: number, taskId: number, updates: { title?: string; description?: string }) {
    const res = await fetch(`${window.location.origin}/api/tasks`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: taskId,
        project_id: projectId,
        ...updates
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    return await res.json();
  },

  async deleteTask(projectId: number, taskId: number) {
    const res = await fetch(`${window.location.origin}/api/tasks`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: taskId,
        project_id: projectId,
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    return await res.json();
  },

  async moveTask(taskId: number, newColumnId: number, newOrderIndex: number) {
    const res = await fetch(`${window.location.origin}/api/tasks/${taskId}/move`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_column_id: newColumnId,
        new_order_index: newOrderIndex
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    return await res.json();
  }
};

// Subtasks-related API calls
export const subtaskApi = {
  async fetchSubtasks(taskId: number) {
    const res = await fetch(`${window.location.origin}/api/tasks/${taskId}/subtasks`);

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const data = await res.json();
    return data.subtasks || [];
  },

  async createSubtask(taskId: number, text: string, completed: boolean = false, orderIndex?: number) {
    const res = await fetch(`${window.location.origin}/api/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        completed,
        order_index: orderIndex
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const responseData = await res.json();
    return responseData.subtask || responseData;
  },

  async updateSubtask(taskId: number, subtaskId: number, updates: { text?: string; completed?: boolean; order_index?: number }) {
    const res = await fetch(`${window.location.origin}/api/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    return await res.json();
  },

  async deleteSubtask(taskId: number, subtaskId: number) {
    const res = await fetch(`${window.location.origin}/api/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    return await res.json();
  }
};

// Integrations-related API calls
export const integrationsApi = {
  async fetchIntegrations() {
    const res = await fetch(`${window.location.origin}/api/integrations`);

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const data = await res.json();
    return data.integrations || [];
  }
};



