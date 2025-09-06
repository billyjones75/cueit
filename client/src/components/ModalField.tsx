import React from 'react';
import { EditableModalField } from './EditableModalField';
import { ChecklistModalField } from './ChecklistModalField';

export type ModalFieldType = 'editable' | 'checklist';

export interface BaseModalField {
  type: ModalFieldType;
  label: string;
}


export type ModalField = EditableModalField | ChecklistModalField;

// Re-export types for convenience
export type { EditableModalField } from './EditableModalField';
export type { ChecklistModalField } from './ChecklistModalField';

export function ModalField({ field }: { field: ModalField }) {
  switch (field.type) {
    case 'editable':
      return <EditableModalField {...field} />;
    
    case 'checklist':
      return <ChecklistModalField {...field} />;
    
    default:
      return null;
  }
}
