import React, { useState } from 'react';
import { Modal } from './Modal';
import { projectApi } from '../api/api';

type ProjectPropertiesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onProjectUpdate: (updates: { name: string; description: string }) => void;
  onProjectDelete: () => void;
};

export function ProjectPropertiesModal({ 
  isOpen, 
  onClose, 
  project, 
  onProjectUpdate, 
  onProjectDelete 
}: ProjectPropertiesModalProps) {
  const [projectName, setProjectName] = useState(project?.name || '');
  const [projectDescription, setProjectDescription] = useState(project?.description || '');
  const [projectContextCopied, setProjectContextCopied] = useState(false);

  const copyProjectContext = () => {
    const context = project?.description || '';
    navigator.clipboard.writeText(context);
    setProjectContextCopied(true);
    setTimeout(() => setProjectContextCopied(false), 1200);
  };

  const handleSave = async (title?: string, description?: string) => {
    const projectTitle = title ?? projectName;
    const projectDesc = description ?? projectDescription;
    
    if (!projectTitle.trim()) {
      alert('Project name is required');
      setProjectName(project.name || '');
      return;
    }
    if (!projectDesc.trim()) {
      alert('Project description is required');
      setProjectDescription(project.description || '');
      return;
    }
    
    try {
      await projectApi.updateProject(project.id, projectTitle, projectDesc);
      onProjectUpdate({ name: projectTitle, description: projectDesc });
    } catch (err: any) {
      console.error('Error updating project properties:', err);
      alert('Failed to update project properties: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone and will delete all tasks and columns.`)) {
      return;
    }

    try {
      await projectApi.deleteProject(project.id);
      onProjectDelete();
    } catch (err: any) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectName}
      onTitleChange={async (newTitle) => {
        setProjectName(newTitle);
        await handleSave(newTitle, projectDescription);
      }}
      fields={[
        {
          label: "Description",
          value: projectDescription,
          onSave: async (value) => {
            setProjectDescription(value);
            await handleSave(projectName, value);
          },
          type: 'textarea',
          rows: 4
        }
      ]}
      actions={
        <div className="flex justify-between items-center w-full">
          <button
            className="bg-green-700 text-white rounded px-3 py-1.5 text-base hover:bg-green-800 transition-colors"
            onClick={copyProjectContext}
          >
            {projectContextCopied ? 'Copied!' : 'Copy Context'}
          </button>
          <button
            className="bg-red-600 text-white rounded px-3 py-1.5 text-base hover:bg-red-700 transition-colors flex items-center gap-2"
            onClick={handleDelete}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Project
          </button>
        </div>
      }
    />
  );
} 