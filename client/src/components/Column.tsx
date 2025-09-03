import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Card, CardType } from './Card';

export type ColumnType = {
  id: number;
  title: string;
  cards: CardType[];
};

interface ColumnProps {
  column: ColumnType;
  addingTaskToColumn: number | null;
  newTaskTitle: string;
  onNewTaskTitleChange: (title: string) => void;
  onStartAddingTask: (columnId: number) => void;
  onSaveNewTask: (columnId: number) => void;
  onCancelAddingTask: () => void;
  onCardClick: (card: CardType) => void;
}

export function Column({
  column,
  addingTaskToColumn,
  newTaskTitle,
  onNewTaskTitleChange,
  onStartAddingTask,
  onSaveNewTask,
  onCancelAddingTask,
  onCardClick
}: ColumnProps) {
  const isAddingTask = addingTaskToColumn === column.id;

  return (
    <Droppable droppableId={column.id.toString()}>
      {(provided, snapshot) => (
        <div
          className="bg-white/90 rounded-2xl shadow-lg flex flex-col max-h-[80vh] min-w-[280px] w-80 border border-[#e5e7eb] transition-all duration-150"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className="p-4 border-b font-bold flex items-center justify-between text-base text-[#205C44] tracking-wide">
            {column.title}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {column.cards.map((card, idx) => (
              <Card
                key={card.id}
                card={card}
                index={idx}
                onClick={onCardClick}
              />
            ))}
            {isAddingTask && (
              <div className="bg-white rounded-xl p-3 border border-[#178366] shadow">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => onNewTaskTitleChange(e.target.value)}
                  placeholder="Enter task title... (Enter to save, Escape to cancel)"
                  className="w-full outline-none text-[#205C44] font-medium"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSaveNewTask(column.id);
                    } else if (e.key === 'Escape') {
                      onCancelAddingTask();
                    }
                  }}
                />
              </div>
            )}
            {provided.placeholder}
          </div>
          <div 
            className="p-4 border-t text-sm text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={() => onStartAddingTask(column.id)}
          >
            + Add a task
          </div>
        </div>
      )}
    </Droppable>
  );
} 