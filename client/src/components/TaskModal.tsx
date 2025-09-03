import React from 'react';
import { Modal } from './Modal';
import { taskApi } from '../api/api';

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: number;
    title: string;
    description?: string;
    projectId: number;
  } | null;
  onTaskUpdate: (updates: { title?: string; description?: string }) => void;
  onTaskDelete: () => void;
};

export function TaskModal({ isOpen, onClose, task, onTaskUpdate, onTaskDelete }: TaskModalProps) {
  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
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
          type: 'textarea',
          rows: 2
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