import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { taskApi, subtaskApi } from '../api/api';
import { ChecklistItem } from './ChecklistModalField';
import { getNewCardIndex, getInsertIndex } from '../utils/fractionalIndexing';

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: number;
    title: string;
    description?: string;
    display_id?: string;
    projectId: number;
  } | null;
  onTaskUpdate: (updates: { title?: string; description?: string }) => void;
  onTaskDelete: () => void;
};

export function TaskModal({ isOpen, onClose, task, onTaskUpdate, onTaskDelete }: TaskModalProps) {
  const [subtasks, setSubtasks] = useState<ChecklistItem[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);

  // Load subtasks when task changes or modal opens
  useEffect(() => {
    if (!task || !isOpen) return;
    loadSubtasks(task.id, setSubtasks, setLoadingSubtasks);
  }, [task, isOpen]);

  // Create wrapper functions that bind the external helpers to current task and state
  const addItem = (text: string) => {
    if (!task) return;
    createSubtask(task.id, text, subtasks, setSubtasks);
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    if (!task) return;
    updateSubtask(task.id, id, updates, setSubtasks);
  };

  const deleteItem = (id: string) => {
    if (!task) return;
    deleteSubtask(task.id, id, setSubtasks);
  };

  const moveItem = (itemId: string, newOrderIndex: number) => {
    if (!task) return;
    moveSubtask(task.id, itemId, newOrderIndex, setSubtasks);
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      displayId={task.display_id}
      onTitleChange={async (newTitle) => {
        try {
          await taskApi.updateTask(task.projectId, task.id, { title: newTitle });
          onTaskUpdate({ title: newTitle });
        } catch (error) {
          console.error('Error updating task title:', error);
          alert('Failed to update task title');
        }
      }}
      fields={[
        {
          type: 'editable',
          label: "Description",
          value: task.description,
          onSave: async (value) => {
            try {
              await taskApi.updateTask(task.projectId, task.id, { description: value });
              onTaskUpdate({ description: value });
            } catch (error) {
              console.error('Error updating task description:', error);
              alert('Failed to update task description');
            }
          },
          fieldType: 'textarea',
          rows: 2
        },
        {
          type: 'checklist',
          label: "Subtasks",
          items: subtasks,
          onAddItem: addItem,
          onUpdateItem: updateItem,
          onDeleteItem: deleteItem,
          onMoveItem: moveItem,
          placeholder: "Add new subtask...",
          addButtonText: "Add Subtask"
        }
      ]}
      actions={
        <button
          className="ml-auto bg-red-600 text-white rounded px-4 py-2 text-base font-semibold shadow hover:bg-red-700 transition-colors"
          onClick={async () => {
            if (!window.confirm('Are you sure you want to delete this task?')) return;
            try {
              await taskApi.deleteTask(task.projectId, task.id);
              onTaskDelete();
            } catch (error) {
              console.error('Error deleting task:', error);
              alert('Failed to delete task');
            }
          }}
        >
          Delete
        </button>
      }
    />
  );
}

// Helper functions
const loadSubtasks = async (
  taskId: number,
  setSubtasks: React.Dispatch<React.SetStateAction<ChecklistItem[]>>,
  setLoadingSubtasks: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoadingSubtasks(true);
  try {
    const fetchedSubtasks = await subtaskApi.fetchSubtasks(taskId);
    // Convert API subtasks to ChecklistItem format
    const checklistItems: ChecklistItem[] = fetchedSubtasks.map((subtask: any) => ({
      id: subtask.id.toString(),
      text: subtask.title,
      completed: Boolean(subtask.completed),
      orderIndex: subtask.order_index
    }));
    setSubtasks(checklistItems);
  } catch (error) {
    console.error('Error loading subtasks:', error);
  } finally {
    setLoadingSubtasks(false);
  }
};

const createSubtask = async (
  taskId: number,
  text: string,
  subtasks: ChecklistItem[],
  setSubtasks: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
) => {
  try {
    // Use fractional indexing for new subtasks - add at the end
    const lastSubtask = subtasks.length > 0
      ? subtasks.reduce((max, subtask) => subtask.orderIndex > max.orderIndex ? subtask : max)
      : null;
    const newOrderIndex = getNewCardIndex(lastSubtask?.orderIndex || 0);
    const newSubtask = await subtaskApi.createSubtask(taskId, text, false, newOrderIndex);

    const checklistItem: ChecklistItem = {
      id: newSubtask.id.toString(),
      text: newSubtask.title,
      completed: Boolean(newSubtask.completed),
      orderIndex: newSubtask.order_index
    };

    setSubtasks(prev => [...prev, checklistItem]);
  } catch (error) {
    console.error('Error creating subtask:', error);
    alert('Failed to create subtask');
  }
};

const updateSubtask = async (
  taskId: number,
  id: string,
  updates: Partial<ChecklistItem>,
  setSubtasks: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
) => {
  try {
    const subtaskUpdates: any = {};
    if (updates.text !== undefined) subtaskUpdates.text = updates.text;
    if (updates.completed !== undefined) subtaskUpdates.completed = updates.completed;
    if (updates.orderIndex !== undefined) subtaskUpdates.order_index = updates.orderIndex;

    await subtaskApi.updateSubtask(taskId, parseInt(id), subtaskUpdates);

    setSubtasks(prev => prev.map(subtask =>
      subtask.id === id ? { ...subtask, ...updates } : subtask
    ));
  } catch (error) {
    console.error('Error updating subtask:', error);
    alert('Failed to update subtask');
  }
};

const deleteSubtask = async (
  taskId: number,
  id: string,
  setSubtasks: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
) => {
  try {
    await subtaskApi.deleteSubtask(taskId, parseInt(id));
    setSubtasks(prev => prev.filter(subtask => subtask.id !== id));
  } catch (error) {
    console.error('Error deleting subtask:', error);
    alert('Failed to delete subtask');
  }
};

const moveSubtask = async (
  taskId: number,
  itemId: string,
  newOrderIndex: number,
  setSubtasks: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
) => {
  try {
    // Update local state immediately for better UX
    setSubtasks(prev => prev.map(item =>
      item.id === itemId ? { ...item, orderIndex: newOrderIndex } : item
    ));

    // Update the subtask's order_index on the server
    await subtaskApi.updateSubtask(taskId, parseInt(itemId), { order_index: newOrderIndex });
  } catch (error) {
    console.error('Error moving subtask:', error);
    alert('Failed to move subtask');
    // Reload subtasks on error
    const fetchedSubtasks = await subtaskApi.fetchSubtasks(taskId);
    const checklistItems: ChecklistItem[] = fetchedSubtasks.map((subtask: any) => ({
      id: subtask.id.toString(),
      text: subtask.title,
      completed: Boolean(subtask.completed),
      orderIndex: subtask.order_index
    }));
    setSubtasks(checklistItems);
  }
};