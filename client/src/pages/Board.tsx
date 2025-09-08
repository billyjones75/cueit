import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  DropResult,
} from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { projectApi, taskApi, integrationsApi } from '../api/api';
import { TaskModal } from '../components/TaskModal';
import { getNewCardIndex, getInsertIndex } from '../utils/fractionalIndexing';
import { ProjectPropertiesModal } from '../components/ProjectPropertiesModal';
import { NewProjectModal } from '../components/NewProjectModal';
import { MCPIntegrationModal } from '../components/MCPIntegrationModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { CardType } from '../components/Card';
import { Column, ColumnType } from '../components/Column';
import { ChevronDown, ChevronRight, Plus, History, Edit } from 'lucide-react';

type BoardType = {
  projectId: number;
  projectName: string;
  projectDescription?: string;
  columns: ColumnType[];
};

function Board() {
  const [projects, setProjects] = useState<any[]>([]);
  const [board, setBoard] = useState<BoardType | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showProjectPropertiesModal, setShowProjectPropertiesModal] = useState(false);
  const [addingTaskToColumn, setAddingTaskToColumn] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false);
  const [mcpIntegrations, setMcpIntegrations] = useState<any[]>([]);
  const [isMcpIntegrationsCollapsed, setIsMcpIntegrationsCollapsed] = useState(false);
  const [showMcpIntegrationModal, setShowMcpIntegrationModal] = useState(false);
  const [selectedMcpIntegration, setSelectedMcpIntegration] = useState<any>(null);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
  const navigate = useNavigate();

  const handleTaskUpdate = async (updates: any) => {
    if (!selectedCard) return;
    
    setSelectedCard(card => card ? { ...card, ...updates } : card);
    
    // Update in board
    setBoard(prevBoard => {
      if (!prevBoard) return prevBoard;
      return {
        ...prevBoard,
        columns: prevBoard.columns.map(col => ({
          ...col,
          cards: col.cards.map(card =>
            card.id === selectedCard.id ? { ...card, ...updates } : card
          )
        }))
      };
    });
  };

  const handleTaskDelete = async () => {
    if (!selectedCard) return;
    
    // Update board state
    setBoard(prevBoard => {
      if (!prevBoard) return prevBoard;
      return {
        ...prevBoard,
        columns: prevBoard.columns.map(col => ({
          ...col,
          cards: col.cards.filter(card => card.id !== selectedCard.id)
        }))
      };
    });
    
    setShowOverlay(false);
  };

  const handleSaveNewTask = async (columnId: number) => {
    if (!newTaskTitle.trim() || !board) return;
    
    try {
      // Get the current column's cards to calculate fractional index
      const targetColumn = board?.columns.find((col) => col.id === columnId);
      const lastCard = targetColumn?.cards[targetColumn.cards.length - 1];
      const newOrderIndex = getNewCardIndex(lastCard?.orderIndex || 0);

      const newTask = await taskApi.createTask(board.projectId, columnId, newTaskTitle.trim(), '', newOrderIndex);

      // Update board
      setBoard(prevBoard => {
        if (!prevBoard) return prevBoard;
        return {
          ...prevBoard,
          columns: prevBoard.columns.map(col => 
            col.id === columnId 
              ? { ...col, cards: [...col.cards, { id: newTask.id, title: newTask.title, description: newTask.description, orderIndex: newOrderIndex }] }
              : col
          )
        };
      });

      setAddingTaskToColumn(null);
      setNewTaskTitle('');
    } catch (err: any) {
      console.error('Error creating task:', err);
      alert('Failed to create task: ' + (err?.message || 'Unknown error'));
    }
  };

  const convertProjectToBoard = (project: any): BoardType => ({
    projectId: project.id,
    projectName: project.name,
    projectDescription: project.description,
    columns: (project.columns || []).map((col: any) => ({
      id: col.id,
      title: col.name,
      cards: (col.tasks || [])
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          orderIndex: task.order_index || 0
        }))
    }))
  });

  const fetchProjects = async () => {
    try {
      const projectsData = await projectApi.fetchProjects();
      setProjects(projectsData);
      const storedId = localStorage.getItem('currentProjectId');
      if (projectsData.length) {
        let selectedProject;
        if (storedId) {
          const found = projectsData.find((p: any) => p.id.toString() === storedId || p.id === Number(storedId));
          selectedProject = found || projectsData[0];
        } else {
          selectedProject = projectsData[0];
        }
        
        // Convert selected project to BoardType and set board directly
        const boardData = convertProjectToBoard(selectedProject);
        setBoard(boardData);
      } else {
        setShowNewProjectModal(true);
      }
      return projectsData;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  };

  const fetchMcpIntegrations = async () => {
    try {
      const integrationsData = await integrationsApi.fetchIntegrations();
      setMcpIntegrations(integrationsData);
    } catch (error) {
      console.error('Error fetching MCP integrations:', error);
    }
  };

  const handleProjectUpdate = async (updates: any) => {
    if (!board) return;
    
    // Update board with new project data
    setBoard(prevBoard => {
      if (!prevBoard) return prevBoard;
      return {
        ...prevBoard,
        projectName: updates.name || prevBoard.projectName,
        projectDescription: updates.description || prevBoard.projectDescription
      };
    });
    
    // Update projects list
    const updatedProjects = projects.map(proj => 
      proj.id === board.projectId ? { ...proj, ...updates } : proj
    );
    setProjects(updatedProjects);
  };

  const handleProjectDelete = async () => {
    if (!board) return;
    
    // Remove the project from local state
    const updatedProjects = projects.filter(proj => proj.id !== board.projectId);
    setProjects(updatedProjects);
    
    // Close the modal
    setShowProjectPropertiesModal(false);
    
    // Clear board and navigate to landing if no projects left
    if (updatedProjects.length === 0) {
      setBoard(null);
      navigate('/');
    } else {
      // Set to first available project
      const firstProject = updatedProjects[0];
      const boardData = convertProjectToBoard(firstProject);
      setBoard(boardData);
      localStorage.setItem('currentProjectId', firstProject.id.toString());
    }
  };

  const handleRestore = async () => {
    if (!board) return;
    try {
      await fetchProjects();
    } catch (error) {
      console.error('Error refreshing after restore:', error);
      window.location.reload();
    }
  };

  // First thing that happens when the page loads
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchProjects(),
      fetchMcpIntegrations()
    ]).finally(() => {
      setIsLoading(false);
    });
  }, []);



  async function moveTaskOnServer(taskId: number, newColumnId: number, newOrderIndex: number) {
    try {
      await taskApi.moveTask(taskId, newColumnId, newOrderIndex);
    } catch (error) {
      console.error('Error moving task:', error);
    }
  }

  function onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination || !board) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColIdx = board.columns.findIndex((col) => col.id.toString() === source.droppableId);
    const destColIdx = board.columns.findIndex((col) => col.id.toString() === destination.droppableId);
    const sourceCol = board.columns[sourceColIdx];
    const destCol = board.columns[destColIdx];

    if (!sourceCol || !destCol) return;

    const sourceCards = Array.from(sourceCol.cards);
    const [movedCard] = sourceCards.splice(source.index, 1) as [CardType];

    // Calculate new orderIndex for the moved card using fractional indexing
    const destCards = sourceColIdx === destColIdx ? sourceCards : Array.from(destCol.cards);
    const beforeCard = destCards[destination.index - 1] || null;
    const afterCard = destCards[destination.index] || null;
    const newOrderIndex = getInsertIndex(beforeCard, afterCard);

    // Update the moved card's orderIndex
    const updatedMovedCard = { ...movedCard, orderIndex: newOrderIndex };

    if (sourceColIdx === destColIdx) {
      sourceCards.splice(destination.index, 0, updatedMovedCard);
      const newColumns = [...board.columns];
      newColumns[sourceColIdx] = { ...sourceCol, cards: sourceCards };
      setBoard({ ...board, columns: newColumns });
    } else {
      const destCards = Array.from(destCol.cards);
      destCards.splice(destination.index, 0, updatedMovedCard);
      const newColumns = [...board.columns];
      newColumns[sourceColIdx] = { ...sourceCol, cards: sourceCards };
      newColumns[destColIdx] = { ...destCol, cards: destCards };
      setBoard({ ...board, columns: newColumns });
    }

    moveTaskOnServer(movedCard.id, destCol.id, newOrderIndex);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex flex-col w-56 bg-gray-200 shadow-[2px_0_10px_rgba(0,0,0,0.1)] z-50">
        {/* Top section - Logo */}
        <div className="bg-emerald-600 h-14 py-3 flex items-center px-6">
          <span className="text-green-300 font-extrabold text-3xl tracking-tight">Cueit</span>
        </div>
        {/* Bottom section - Projects */}
        <div className="flex-1 flex flex-col gap-1 py-6 px-0">
          <button
            onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
            className="flex items-center justify-between px-6 pb-2 hover:bg-gray-300 transition-colors"
          >
            <div className="font-extrabold text-lg text-gray-800 tracking-wide">Projects</div>
            {isProjectsCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
          {!isProjectsCollapsed && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <svg className="w-5 h-5 animate-spin text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                </div>
              ) : (
                <>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => { 
                        localStorage.setItem('currentProjectId', proj.id.toString()); 
                        const boardData = convertProjectToBoard(proj);
                        setBoard(boardData);
                      }}
                      className={
                        'text-left py-2 px-6 font-medium text-sm transition-all duration-150 ' +
                        (proj.id === board?.projectId
                          ? 'bg-white text-gray-800 shadow font-bold'
                          : 'text-gray-700 hover:bg-gray-300 hover:text-gray-800')
                      }
                    >
                      {proj.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowNewProjectModal(true)}
                    className="text-left py-2 px-6 font-medium text-sm text-gray-700 hover:bg-gray-300 hover:text-gray-800 transition-all duration-150 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Project
                  </button>
                </>
              )}
            </>
          )}
          
          {/* MCP Integrations section */}
          <button
            onClick={() => setIsMcpIntegrationsCollapsed(!isMcpIntegrationsCollapsed)}
            className="flex items-center justify-between px-6 pb-2 hover:bg-gray-300 transition-colors mt-4"
          >
            <div className="font-extrabold text-lg text-gray-800 tracking-wide">MCP integrations</div>
            {isMcpIntegrationsCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
          {!isMcpIntegrationsCollapsed && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <svg className="w-5 h-5 animate-spin text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                </div>
              ) : (
                <>
                  {mcpIntegrations.length === 0 ? (
                    <div className="px-6 py-2 text-sm text-gray-500">
                      No integrations yet
                    </div>
                  ) : (
                    mcpIntegrations.map((integration) => (
                      <button
                        key={integration.id}
                        onClick={() => {
                          setSelectedMcpIntegration(integration);
                          setShowMcpIntegrationModal(true);
                        }}
                        className="text-left py-2 px-6 font-medium text-sm text-gray-700 hover:bg-gray-300 hover:text-gray-800 transition-all duration-150 w-full"
                      >
                        {integration.client_name || integration.client_id}
                      </button>
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top nav */}
        <div className="flex items-center h-14 py-3 px-8 bg-emerald-600">
          <div className="flex items-center gap-3">
            {board?.projectName && (
              <span className="font-semibold text-[22px] text-white tracking-tight drop-shadow-sm">{board.projectName}</span>
            )}
            <div className="flex items-center">
              <button
                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => {
                  if (!board) return;
                  setShowProjectPropertiesModal(true);
                }}
                title="Edit project properties"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => {
                  if (!board) return;
                  setShowVersionHistoryModal(true);
                }}
                title="View version history"
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        {/* Board content */}
        <div className="flex-1 flex bg-gray-50 p-4">
          <div className="flex flex-col w-full">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 items-start justify-start mt-2 ml-2">
                {board?.columns.map((col) => (
                  <Column
                    key={col.id}
                    column={col}
                    addingTaskToColumn={addingTaskToColumn}
                    newTaskTitle={newTaskTitle}
                    onNewTaskTitleChange={setNewTaskTitle}
                    onStartAddingTask={(columnId) => { setAddingTaskToColumn(columnId); setNewTaskTitle(''); }}
                    onSaveNewTask={handleSaveNewTask}
                    onCancelAddingTask={() => { setAddingTaskToColumn(null); setNewTaskTitle(''); }}
                    onCardClick={(card) => { setSelectedCard(card); setShowOverlay(true); }}
                  />
                ))}
              </div>
            </DragDropContext>
          </div>
        </div>
      </div>
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={() => { setShowNewProjectModal(false); fetchProjects(); }}
      />
      {showOverlay && selectedCard && board && (
        <TaskModal
          isOpen={showOverlay}
          onClose={() => setShowOverlay(false)}
          task={{
            id: selectedCard.id,
            title: selectedCard.title,
            description: selectedCard.description,
            projectId: board.projectId
          }}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
        />
      )}
      {showProjectPropertiesModal && board && (
        <ProjectPropertiesModal
          isOpen={showProjectPropertiesModal}
          onClose={() => setShowProjectPropertiesModal(false)}
          project={{
            id: board.projectId,
            name: board.projectName,
            description: board.projectDescription
          }}
          onProjectUpdate={handleProjectUpdate}
          onProjectDelete={handleProjectDelete}
        />
      )}
      {showVersionHistoryModal && board && (
        <VersionHistoryModal
          isOpen={showVersionHistoryModal}
          onClose={() => setShowVersionHistoryModal(false)}
          projectId={board.projectId}
          projectName={board.projectName}
          onRestore={handleRestore}
        />
      )}
      
      <MCPIntegrationModal
        isOpen={showMcpIntegrationModal}
        onClose={() => {
          setShowMcpIntegrationModal(false);
          setSelectedMcpIntegration(null);
        }}
        integration={selectedMcpIntegration}
      />
    </div>
  );
}

export default Board;