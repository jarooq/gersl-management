import React, { useState } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';

const AttachmentUpload = ({ taskId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [fileCategory, setFileCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  // Handle upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (description) formData.append('description', description);
      if (fileCategory) formData.append('fileCategory', fileCategory);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setSelectedFile(null);
        setDescription('');
        setFileCategory('');

        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess(data.attachment);
        }
      } else {
        setError(data.message || 'Failed to upload file');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg border border-ink-200 p-4">
      <h3 className="text-lg font-semibold text-ink-900 mb-4">Upload Attachment</h3>

      <form onSubmit={handleUpload}>
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-ink-300 hover:border-ink-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <File size={24} className="text-green-600" />
                <span className="font-medium text-ink-900">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-ink-500">{formatFileSize(selectedFile.size)}</p>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 mx-auto"
              >
                <X size={16} />
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload size={32} className="mx-auto text-ink-400" />
              <p className="text-ink-600">
                Drag and drop a file here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                  browse
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.mpeg,.mov,.avi,.zip,.rar,.7z,.json"
                  />
                </label>
              </p>
              <p className="text-xs text-ink-500">
                Max file size: 10MB
              </p>
            </div>
          )}
        </div>

        {/* File Category */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-ink-700 mb-1">
            Category (Optional)
          </label>
          <select
            value={fileCategory}
            onChange={(e) => setFileCategory(e.target.value)}
            className="w-full px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Auto-detect</option>
            <option value="document">Document</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="evidence">Evidence</option>
            <option value="archive">Archive</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-ink-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Add a description for this file..."
            className="w-full px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-4">
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              !selectedFile || uploading
                ? 'bg-ink-300 text-ink-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload File
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttachmentUpload;
