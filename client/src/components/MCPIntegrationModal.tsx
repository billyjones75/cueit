import React from 'react';
import { X, Activity, Clock } from 'lucide-react';

interface MCPIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: {
    id: number;
    client_name: string;
    call_count: number;
    created_at: string;
    updated_at: string;
  } | null;
}

export function MCPIntegrationModal({ isOpen, onClose, integration }: MCPIntegrationModalProps) {
  if (!isOpen || !integration) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-left">
          MCP Integration Details
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Client Name
            </label>
            <p className="text-gray-900">
              {integration.client_name || 'Unknown Client'}
            </p>
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total Calls
            </label>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-600">
                {integration.call_count}
              </span>
              <span className="text-gray-500 text-sm">
                calls made
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Created:</span> {formatDate(integration.created_at)}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {formatDate(integration.updated_at)}
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 rounded px-4 py-2 text-base hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 