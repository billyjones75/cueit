import React, { useState, useRef, useEffect } from 'react';

export interface ModalField {
  label: string;
  value: string | undefined;
  onSave: (value: string) => void;
  type?: 'text' | 'textarea';
  rows?: number;
  taskId?: number;
  projectId?: number;
}

export function ModalField({ field }: { field: ModalField }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(field.value || '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (edit && textareaRef.current && field.type === 'textarea') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [edit, draft, field.type]);

  useEffect(() => {
    setDraft(field.value || '');
  }, [field.value]);

  async function handleSave() {
    setSaving(true);
    try {
      await field.onSave(draft);
      setEdit(false);
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          <div className="font-semibold text-lg text-gray-800">{field.label}</div>
          <button className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium" onClick={() => setEdit(true)}>Edit</button>
        </div>
        {!edit ? (
          <div 
            className="text-gray-700 text-base leading-relaxed bg-gray-50 rounded-lg min-h-[60px] cursor-pointer hover:bg-gray-100 transition-colors p-4 whitespace-pre-wrap"
            onDoubleClick={() => setEdit(true)}
            title="Double-click to edit"
          >
            {field.value || <span className="text-gray-400 italic">No {field.label.toLowerCase()}</span>}
          </div>
        ) : (
          <div>
            {field.type === 'textarea' ? (
              <textarea
                className="w-full min-h-[120px] rounded-lg border-2 border-gray-200 p-4 text-base resize-y focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                ref={textareaRef}
                rows={field.rows || 2}
                style={{overflowY: 'hidden'}}
              />
            ) : (
              <input
                type="text"
                className="w-full rounded-lg border-2 border-gray-200 p-4 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                value={draft}
                onChange={e => setDraft(e.target.value)}
              />
            )}
            <div className="flex gap-3 mt-4">
              <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50" onClick={() => setEdit(false)} disabled={saving}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
