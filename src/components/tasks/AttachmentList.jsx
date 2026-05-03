import React, { useState, useEffect } from 'react';
import {
  Download,
  Trash2,
  Edit2,
  FileText,
  Image,
  Video,
  Archive,
  File,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AttachmentList = ({ taskId, onAttachmentsChange }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Fetch attachments
  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/attachments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAttachments(data.attachments);
        if (onAttachmentsChange) {
          onAttachmentsChange(data.attachments);
        }
      } else {
        setError(data.message || 'Failed to load attachments');
      }
    } catch (err) {
      console.error('Error fetching attachments:', err);
      setError('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchAttachments();
    }
  }, [taskId]);

  // Download attachment
  const handleDownload = async (attachmentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/attachments/${attachmentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download file');
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };

  // Delete attachment
  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchAttachments();
      } else {
        setError(data.message || 'Failed to delete attachment');
      }
    } catch (err) {
      console.error('Error deleting attachment:', err);
      setError('Failed to delete attachment');
    }
  };

  // Start editing
  const startEdit = (attachment) => {
    setEditingId(attachment.id);
    setEditDescription(attachment.description || '');
    setEditCategory(attachment.fileCategory || '');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription('');
    setEditCategory('');
  };

  // Save edit
  const saveEdit = async (attachmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/attachments/${attachmentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: editDescription,
            fileCategory: editCategory
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchAttachments();
        cancelEdit();
      } else {
        setError(data.message || 'Failed to update attachment');
      }
    } catch (err) {
      console.error('Error updating attachment:', err);
      setError('Failed to update attachment');
    }
  };

  // Get file icon
  const getFileIcon = (category, mimeType) => {
    if (category === 'image' || mimeType?.startsWith('image/')) {
      return <Image size={20} className="text-blue-600" />;
    }
    if (category === 'video' || mimeType?.startsWith('video/')) {
      return <Video size={20} className="text-purple-600" />;
    }
    if (category === 'document' || mimeType?.includes('pdf') || mimeType?.includes('word')) {
      return <FileText size={20} className="text-red-600" />;
    }
    if (category === 'archive' || mimeType?.includes('zip') || mimeType?.includes('rar')) {
      return <Archive size={20} className="text-orange-600" />;
    }
    return <File size={20} className="text-ink-600" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-ink-200 p-4">
      <h3 className="text-lg font-semibold text-ink-900 mb-4">
        Attachments ({attachments.length})
      </h3>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-center py-8 text-ink-500">
          <File size={48} className="mx-auto mb-2 text-ink-300" />
          <p>No attachments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-start gap-3 p-3 border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors"
            >
              {/* File Icon */}
              <div className="flex-shrink-0 mt-1">
                {getFileIcon(attachment.fileCategory, attachment.mimeType)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                {editingId === attachment.id ? (
                  // Edit Mode
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-ink-700 mb-1">
                        Category
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-ink-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="document">Document</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="evidence">Evidence</option>
                        <option value="archive">Archive</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-ink-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(attachment.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Save size={14} />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-ink-200 text-ink-700 rounded hover:bg-ink-300"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900 truncate">
                          {attachment.originalName}
                        </p>
                        <p className="text-xs text-ink-500">
                          {formatFileSize(attachment.fileSize)} •
                          Uploaded by {attachment.uploader?.fullName || 'Unknown'} •
                          {formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}
                        </p>
                        {attachment.description && (
                          <p className="text-sm text-ink-600 mt-1">
                            {attachment.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              {editingId !== attachment.id && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(attachment.id, attachment.originalName)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => startEdit(attachment)}
                    className="p-2 text-ink-600 hover:bg-ink-100 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentList;
