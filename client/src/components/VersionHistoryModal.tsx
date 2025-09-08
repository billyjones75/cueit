import React, { useState, useEffect } from 'react';
import { X, Clock, FileText, RotateCcw, Save } from 'lucide-react';
import { historyApi } from '../api/api';

interface VersionHistoryItem {
  id: number;
  project_id: number;
  description: string;
  created_at: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onRestore?: () => void;
}

export function VersionHistoryModal({ isOpen, onClose, projectId, projectName, onRestore }: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<VersionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchVersionHistory();
    }
  }, [isOpen, projectId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await historyApi.fetchProjectHistory(projectId);
      setVersions(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch version history');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const description = window.prompt('Enter a description for this version:');
    if (!description || !description.trim()) {
      return;
    }

    setSaving(true);
    try {
      await historyApi.saveCurrentProjectVersion(projectId, description.trim());
      await fetchVersionHistory(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save version');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (versionId: number, description: string) => {
    if (!window.confirm(`Are you sure you want to restore to "${description}"?\n\nThis will replace the current project state.`)) {
      return;
    }

    setRestoringId(versionId);
    try {
      await historyApi.restoreProjectVersion(projectId, versionId);
      onClose();
      if (onRestore) {
        onRestore();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version');
      console.error('Restore error:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Save current version"
            >
              {saving ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Save Version</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading version history...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Failed to load version history</p>
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={fetchVersionHistory}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No version history available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Version history will appear here after you make changes to your project
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          v{versions.length - index}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {version.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDate(version.created_at)}
                          </span>
                          <button
                            onClick={() => handleRestore(version.id, version.description)}
                            disabled={restoringId === version.id}
                            className="p-2 text-blue-600 bg-blue-50 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            title="Restore to this version"
                          >
                            {restoringId === version.id ? (
                              <div className="w-6 h-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                            ) : (
                              <RotateCcw className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
