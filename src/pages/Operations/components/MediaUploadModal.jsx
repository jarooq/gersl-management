import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, CheckCircle, AlertCircle, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL as API_BASE } from '../../../config/apiBase';

const MediaUploadModal = ({ isOpen, onClose, task, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Media links state - separate arrays for each type
  const [photoLinks, setPhotoLinks] = useState([]);
  const [videoLinks, setVideoLinks] = useState([]);
  const [testimonialLinks, setTestimonialLinks] = useState([]);
  const [notes, setNotes] = useState('');

  // Input states for new links
  const [newPhotoLink, setNewPhotoLink] = useState('');
  const [newVideoLink, setNewVideoLink] = useState('');
  const [newTestimonialLink, setNewTestimonialLink] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      // Load existing media links from task.distributionEvidence
      const evidence = task.distributionEvidence || {};
      const existingMediaLinks = evidence.mediaLinks || {};

      setPhotoLinks(existingMediaLinks.photos || []);
      setVideoLinks(existingMediaLinks.videos || []);
      setTestimonialLinks(existingMediaLinks.testimonials || []);
      setNotes(task.mediaCoverageNotes || '');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, task]);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const addLink = (type) => {
    let link = '';
    let setLink = null;
    let links = [];
    let setLinks = null;

    if (type === 'photo') {
      link = newPhotoLink.trim();
      setLink = setNewPhotoLink;
      links = photoLinks;
      setLinks = setPhotoLinks;
    } else if (type === 'video') {
      link = newVideoLink.trim();
      setLink = setNewVideoLink;
      links = videoLinks;
      setLinks = setVideoLinks;
    } else if (type === 'testimonial') {
      link = newTestimonialLink.trim();
      setLink = setNewTestimonialLink;
      links = testimonialLinks;
      setLinks = setTestimonialLinks;
    }

    if (!link) {
      setError('Please enter a link');
      return;
    }

    if (!isValidUrl(link)) {
      setError('Please enter a valid URL (e.g., https://drive.google.com/...)');
      return;
    }

    setLinks([...links, link]);
    setLink('');
    setError(null);
  };

  const removeLink = (type, index) => {
    if (type === 'photo') {
      setPhotoLinks(photoLinks.filter((_, i) => i !== index));
    } else if (type === 'video') {
      setVideoLinks(videoLinks.filter((_, i) => i !== index));
    } else if (type === 'testimonial') {
      setTestimonialLinks(testimonialLinks.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    const totalLinks = photoLinks.length + videoLinks.length + testimonialLinks.length;

    if (totalLinks === 0) {
      setError('Please add at least one media link');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      // Prepare media links data
      const mediaLinks = {
        photos: photoLinks,
        videos: videoLinks,
        testimonials: testimonialLinks
      };

      // Update task with media links and set status to "In Progress" or "Completed"
      const response = await axios.put(
        `${API_BASE}/tasks/${task.id}/media-status`,
        {
          mediaLinks,
          mediaCoverageNotes: notes,
          mediaCoverageStatus: 'In Progress' // Change to "Completed" if media officer wants to mark as done
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Media links uploaded successfully!');
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Error uploading media links:', err);
      setError(err.response?.data?.message || 'Failed to upload media links');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    const totalLinks = photoLinks.length + videoLinks.length + testimonialLinks.length;

    if (totalLinks === 0) {
      setError('Please add at least one media link before marking as complete');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const mediaLinks = {
        photos: photoLinks,
        videos: videoLinks,
        testimonials: testimonialLinks
      };

      const response = await axios.put(
        `${API_BASE}/tasks/${task.id}/media-status`,
        {
          mediaLinks,
          mediaCoverageNotes: notes,
          mediaCoverageStatus: 'Completed'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess('Media coverage marked as completed!');
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Error completing media coverage:', err);
      setError(err.response?.data?.message || 'Failed to complete media coverage');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Determine which media types are required for this task
  const requiredTypes = task?.mediaCoverageType || [];
  const needsPhotos = requiredTypes.includes('Photos');
  const needsVideos = requiredTypes.includes('Videos');
  const needsTestimonials = requiredTypes.includes('Testimonials');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Upload Media Coverage</h2>
              <p className="text-purple-100">{task?.title}</p>
              <div className="mt-3 flex gap-2 flex-wrap">
                {needsPhotos && (
                  <span className="px-3 py-1 bg-purple-500 bg-opacity-40 rounded-full text-sm font-semibold">
                    Photos Required
                  </span>
                )}
                {needsVideos && (
                  <span className="px-3 py-1 bg-purple-500 bg-opacity-40 rounded-full text-sm font-semibold">
                    Videos Required
                  </span>
                )}
                {needsTestimonials && (
                  <span className="px-3 py-1 bg-purple-500 bg-opacity-40 rounded-full text-sm font-semibold">
                    Testimonials Required
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-purple-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-green-900">Success</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900 font-semibold mb-1">Instructions:</p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Upload your files to Google Drive or another cloud storage</li>
              <li>Set the sharing permissions to "Anyone with the link can view"</li>
              <li>Copy and paste the share links below</li>
              <li>Click "Save Progress" to save your work, or "Mark as Complete" when done</li>
            </ul>
          </div>

          {/* Photos Section */}
          {needsPhotos && (
            <div className="space-y-3">
              <h3 className="font-bold text-ink-900 flex items-center gap-2">
                <LinkIcon size={18} className="text-purple-600" />
                Photo Links ({photoLinks.length})
              </h3>

              {/* Existing links */}
              {photoLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-ink-50 border border-ink-100 rounded-lg">
                  <LinkIcon size={16} className="text-ink-400 flex-shrink-0" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-navy-700 hover:underline truncate"
                  >
                    {link}
                  </a>
                  <button
                    onClick={() => removeLink('photo', index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Add new link */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newPhotoLink}
                  onChange={(e) => setNewPhotoLink(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLink('photo')}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={() => addLink('photo')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Videos Section */}
          {needsVideos && (
            <div className="space-y-3">
              <h3 className="font-bold text-ink-900 flex items-center gap-2">
                <LinkIcon size={18} className="text-purple-600" />
                Video Links ({videoLinks.length})
              </h3>

              {videoLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-ink-50 border border-ink-100 rounded-lg">
                  <LinkIcon size={16} className="text-ink-400 flex-shrink-0" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-navy-700 hover:underline truncate"
                  >
                    {link}
                  </a>
                  <button
                    onClick={() => removeLink('video', index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="url"
                  value={newVideoLink}
                  onChange={(e) => setNewVideoLink(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLink('video')}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={() => addLink('video')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Testimonials Section */}
          {needsTestimonials && (
            <div className="space-y-3">
              <h3 className="font-bold text-ink-900 flex items-center gap-2">
                <LinkIcon size={18} className="text-purple-600" />
                Testimonial Links ({testimonialLinks.length})
              </h3>

              {testimonialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-ink-50 border border-ink-100 rounded-lg">
                  <LinkIcon size={16} className="text-ink-400 flex-shrink-0" />
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-navy-700 hover:underline truncate"
                  >
                    {link}
                  </a>
                  <button
                    onClick={() => removeLink('testimonial', index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="url"
                  value={newTestimonialLink}
                  onChange={(e) => setNewTestimonialLink(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addLink('testimonial')}
                  placeholder="https://drive.google.com/..."
                  className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={() => addLink('testimonial')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="block font-bold text-ink-900">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the media coverage..."
              rows={4}
              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-ink-50 border-t border-ink-100 p-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
          >
            Cancel
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Upload className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Save Progress
                </>
              )}
            </button>

            <button
              onClick={handleMarkComplete}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <CheckCircle className="animate-spin" size={18} />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Mark as Complete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUploadModal;
