import React, { useState, useRef, useEffect } from 'react';
import { ModalField, type ModalField as ModalFieldType } from './ModalField';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: ModalFieldType[];
  actions?: React.ReactNode;
  onTitleChange?: (newTitle: string) => void;
}

export function Modal({ isOpen, onClose, title, fields, actions, onTitleChange }: ModalProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);

  useEffect(() => {
    setTitleDraft(title);
  }, [title]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
        <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10" onClick={onClose}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-8 overflow-y-auto max-h-[90vh]">
          {/* Editable Title */}
          <div className="mb-8">
            {editingTitle ? (
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => {
                  setEditingTitle(false);
                  if (titleDraft.trim() && titleDraft !== title && onTitleChange) {
                    onTitleChange(titleDraft.trim());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingTitle(false);
                    if (titleDraft.trim() && titleDraft !== title && onTitleChange) {
                      onTitleChange(titleDraft.trim());
                    }
                  } else if (e.key === 'Escape') {
                    setTitleDraft(title);
                    setEditingTitle(false);
                  }
                }}
                className="text-2xl font-bold text-gray-900 bg-transparent border-2 border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors w-full"
                autoFocus
              />
            ) : (
              <div 
                className="text-2xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                onDoubleClick={() => setEditingTitle(true)}
                title="Double-click to edit"
              >
                {title}
              </div>
            )}
          </div>

          {/* Fields */}
          {fields.map((field, index) => (
            <ModalField key={index} field={field} />
          ))}

          {/* Actions */}
          <div className="mt-8">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
