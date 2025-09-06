import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Check, Plus, Trash2, Edit3 } from 'lucide-react';
import { BaseModalField } from './ModalField';
import { getInsertIndex } from '../utils/fractionalIndexing';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  orderIndex: number;
}

export interface ChecklistModalField extends BaseModalField {
  type: 'checklist';
  items: ChecklistItem[];
  onAddItem?: (text: string) => void;
  onUpdateItem?: (id: string, updates: Partial<ChecklistItem>) => void;
  onDeleteItem?: (id: string) => void;
  onMoveItem?: (itemId: string, newOrderIndex: number) => void;
  className?: string;
  placeholder?: string;
  addButtonText?: string;
}

export function ChecklistModalField({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onMoveItem,
  className = '',
  placeholder = 'Add new item...',
  addButtonText = 'Add Item',
  type,
  label
}: ChecklistModalField) {
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddItem = () => {
    if (newItemText.trim() && onAddItem) {
      onAddItem(newItemText.trim());
      setNewItemText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editingText.trim() && onUpdateItem) {
      onUpdateItem(editingId, { text: editingText.trim() });
      setEditingId(null);
      setEditingText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleToggleComplete = (item: ChecklistItem) => {
    if (onUpdateItem) {
      onUpdateItem(item.id, { completed: !item.completed });
    }
  };

  const handleDeleteItem = (id: string) => {
    if (onDeleteItem) {
      onDeleteItem(id);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !onMoveItem) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

    const movedItem = sortedItems[source.index];
    const itemsWithoutMoved = Array.from(sortedItems);
    itemsWithoutMoved.splice(source.index, 1);

    // Calculate new orderIndex using fractional indexing
    const beforeItem = itemsWithoutMoved[destination.index - 1] || null;
    const afterItem = itemsWithoutMoved[destination.index] || null;
    const newOrderIndex = getInsertIndex(beforeItem, afterItem);

    onMoveItem(movedItem.id, newOrderIndex);
  };

  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="mb-8">
      <div className="font-semibold text-lg text-gray-800 mb-4">{label}</div>
      <div className={`checklist ${className}`}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="checklist">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {sortedItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-150 ${
                        snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                      }`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                      >
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="w-1 h-4 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleComplete(item)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                          item.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {item.completed && <Check size={12} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={handleEditKeyPress}
                            onBlur={handleSaveEdit}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        ) : (
                          <span
                            className={`block cursor-pointer select-none ${
                              item.completed
                                ? 'line-through text-gray-500'
                                : 'text-gray-900'
                            }`}
                            onDoubleClick={() => handleStartEdit(item)}
                          >
                            {item.text}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-150"
                          title="Edit item"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-150"
                          title="Delete item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleAddItem}
          disabled={!newItemText.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
        >
          <Plus size={16} />
          {addButtonText}
        </button>
      </div>
      </div>
    </div>
  );
}
