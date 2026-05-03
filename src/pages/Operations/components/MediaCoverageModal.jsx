// ============================================
// MEDIA COVERAGE MANAGEMENT MODAL
// ============================================
// Component for assigning media teams and tracking coverage for tasks
// Used for tasks with mediaCoverageRequired = true

import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Video,
  Users,
  CheckCircle,
  Clock,
  Play,
  Check,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Calendar,
  User,
  Plus,
  Trash2
} from 'lucide-react';
import { useHR } from '../../../contexts/HRContext';
import {
  assignMediaTeam,
  updateMediaCoverageStatus
} from '../../../services/taskService';

/**
 * Media Coverage Modal Component
 *
 * Features:
 * - Assign media team members
 * - Select coverage types (Photo, Video, Social Media, Live Stream)
 * - Track coverage status
 * - Upload media evidence URLs
 * - View coverage history
 */
const MediaCoverageModal = ({ isOpen, onClose, task, onUpdate }) => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const { staff } = useHR();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'assign', 'status'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Assignment form state
  const [assignFormData, setAssignFormData] = useState({
    mediaTeamAssigned: [],
    mediaCoverageType: [],
    mediaCoverageRequired: true
  });

  // Status update form state
  const [statusFormData, setStatusFormData] = useState({
    mediaCoverageStatus: '',
    distributionEvidence: {
      photos: [],
      videos: [],
      socialMediaPosts: [],
      liveStreamUrls: [],
      notes: ''
    }
  });

  // Temporary input states
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newSocialMediaUrl, setNewSocialMediaUrl] = useState('');
  const [newLiveStreamUrl, setNewLiveStreamUrl] = useState('');

  // Coverage type options
  const coverageTypes = [
    { value: 'Photo', icon: Camera, label: 'Photography' },
    { value: 'Video', icon: Video, label: 'Videography' },
    { value: 'Social Media', icon: FileText, label: 'Social Media Posts' },
    { value: 'Live Stream', icon: Play, label: 'Live Streaming' }
  ];

  // Status options
  const statusOptions = [
    { value: 'Not Required', label: 'Not Required', color: 'gray' },
    { value: 'Pending', label: 'Pending', color: 'yellow' },
    { value: 'In Progress', label: 'In Progress', color: 'blue' },
    { value: 'Completed', label: 'Completed', color: 'green' }
  ];

  // ============================================
  // INITIALIZE
  // ============================================
  useEffect(() => {
    if (isOpen && task) {
      setError(null);
      setSuccess(null);

      // Initialize assignment form
      setAssignFormData({
        mediaTeamAssigned: task.mediaTeamAssigned || [],
        mediaCoverageType: task.mediaCoverageType || [],
        mediaCoverageRequired: task.mediaCoverageRequired !== false
      });

      // Initialize status form
      setStatusFormData({
        mediaCoverageStatus: task.mediaCoverageStatus || 'Pending',
        distributionEvidence: task.distributionEvidence || {
          photos: [],
          videos: [],
          socialMediaPosts: [],
          liveStreamUrls: [],
          notes: ''
        }
      });

      // Set initial tab
      if (!task.mediaTeamAssigned || task.mediaTeamAssigned.length === 0) {
        setActiveTab('assign');
      } else {
        setActiveTab('overview');
      }
    }
  }, [isOpen, task]);

  // ============================================
  // ASSIGN MEDIA TEAM
  // ============================================
  const handleAssignTeam = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (assignFormData.mediaTeamAssigned.length === 0) {
        setError('Please select at least one team member');
        setLoading(false);
        return;
      }

      if (assignFormData.mediaCoverageType.length === 0) {
        setError('Please select at least one coverage type');
        setLoading(false);
        return;
      }

      const response = await assignMediaTeam(
        task.id,
        assignFormData.mediaTeamAssigned,
        assignFormData.mediaCoverageType,
        assignFormData.mediaCoverageRequired
      );

      if (response.success) {
        setSuccess('Media team assigned successfully');
        onUpdate?.();

        setTimeout(() => {
          setActiveTab('overview');
          setSuccess(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Error assigning media team:', err);
      setError(err.message || 'Failed to assign media team');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UPDATE COVERAGE STATUS
  // ============================================
  const handleUpdateStatus = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateMediaCoverageStatus(
        task.id,
        statusFormData.mediaCoverageStatus,
        statusFormData.distributionEvidence
      );

      if (response.success) {
        setSuccess('Coverage status updated successfully');
        onUpdate?.();

        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Error updating coverage status:', err);
      setError(err.message || 'Failed to update coverage status');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TOGGLE TEAM MEMBER
  // ============================================
  const toggleTeamMember = (staffId) => {
    setAssignFormData(prev => ({
      ...prev,
      mediaTeamAssigned: prev.mediaTeamAssigned.includes(staffId)
        ? prev.mediaTeamAssigned.filter(id => id !== staffId)
        : [...prev.mediaTeamAssigned, staffId]
    }));
  };

  // ============================================
  // TOGGLE COVERAGE TYPE
  // ============================================
  const toggleCoverageType = (type) => {
    setAssignFormData(prev => ({
      ...prev,
      mediaCoverageType: prev.mediaCoverageType.includes(type)
        ? prev.mediaCoverageType.filter(t => t !== type)
        : [...prev.mediaCoverageType, type]
    }));
  };

  // ============================================
  // ADD MEDIA URL
  // ============================================
  const addPhotoUrl = () => {
    if (newPhotoUrl.trim()) {
      setStatusFormData(prev => ({
        ...prev,
        distributionEvidence: {
          ...prev.distributionEvidence,
          photos: [...(prev.distributionEvidence.photos || []), newPhotoUrl.trim()]
        }
      }));
      setNewPhotoUrl('');
    }
  };

  const addVideoUrl = () => {
    if (newVideoUrl.trim()) {
      setStatusFormData(prev => ({
        ...prev,
        distributionEvidence: {
          ...prev.distributionEvidence,
          videos: [...(prev.distributionEvidence.videos || []), newVideoUrl.trim()]
        }
      }));
      setNewVideoUrl('');
    }
  };

  const addSocialMediaUrl = () => {
    if (newSocialMediaUrl.trim()) {
      setStatusFormData(prev => ({
        ...prev,
        distributionEvidence: {
          ...prev.distributionEvidence,
          socialMediaPosts: [...(prev.distributionEvidence.socialMediaPosts || []), newSocialMediaUrl.trim()]
        }
      }));
      setNewSocialMediaUrl('');
    }
  };

  const addLiveStreamUrl = () => {
    if (newLiveStreamUrl.trim()) {
      setStatusFormData(prev => ({
        ...prev,
        distributionEvidence: {
          ...prev.distributionEvidence,
          liveStreamUrls: [...(prev.distributionEvidence.liveStreamUrls || []), newLiveStreamUrl.trim()]
        }
      }));
      setNewLiveStreamUrl('');
    }
  };

  // ============================================
  // REMOVE MEDIA URL
  // ============================================
  const removeUrl = (type, index) => {
    setStatusFormData(prev => ({
      ...prev,
      distributionEvidence: {
        ...prev.distributionEvidence,
        [type]: prev.distributionEvidence[type].filter((_, i) => i !== index)
      }
    }));
  };

  // ============================================
  // GET STATUS BADGE
  // ============================================
  const getStatusBadge = (status) => {
    const badges = {
      'Not Required': { bg: 'bg-ink-100', text: 'text-gray-800', icon: X },
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'In Progress': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Play },
      'Completed': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }
    };

    const badge = badges[status] || { bg: 'bg-ink-100', text: 'text-gray-800', icon: AlertCircle };
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-4 w-4 mr-1" />
        {status || 'Unknown'}
      </span>
    );
  };

  // ============================================
  // GET STAFF NAME
  // ============================================
  const getStaffName = (staffId) => {
    const staffMember = staff?.find(s => s.id === staffId);
    return staffMember?.fullName || `Staff #${staffId}`;
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ink-100 bg-gradient-to-r from-purple-600 to-pink-600">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">Media Coverage Management</h2>
              <p className="text-purple-100 text-sm mt-1">{task?.title}</p>
              <div className="mt-2">
                {getStatusBadge(task?.mediaCoverageStatus)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-ink-100">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-purple-600 border-t border-x border-ink-100'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('assign')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'assign'
                  ? 'bg-white text-purple-600 border-t border-x border-ink-100'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Assign Team
            </button>

            {task?.mediaTeamAssigned && task.mediaTeamAssigned.length > 0 && (
              <button
                onClick={() => setActiveTab('status')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'status'
                    ? 'bg-white text-purple-600 border-t border-x border-ink-100'
                    : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
                }`}
              >
                <Check className="h-4 w-4 inline mr-2" />
                Update Status
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ============================================ */}
          {/* OVERVIEW TAB */}
          {/* ============================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Team Assignment Info */}
              {task?.mediaTeamAssigned && task.mediaTeamAssigned.length > 0 ? (
                <>
                  <div className="bg-white border border-ink-100 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-600" />
                      Assigned Media Team
                    </h3>

                    <div className="space-y-2">
                      {task.mediaTeamAssigned.map((staffId, index) => (
                        <div key={index} className="flex items-center bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <User className="h-5 w-5 text-purple-600 mr-3" />
                          <span className="font-medium text-ink-900">{getStaffName(staffId)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coverage Types */}
                  <div className="bg-white border border-ink-100 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center">
                      <Camera className="h-5 w-5 mr-2 text-purple-600" />
                      Coverage Types
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      {task.mediaCoverageType?.map((type, index) => {
                        const coverageType = coverageTypes.find(t => t.value === type);
                        const Icon = coverageType?.icon || FileText;

                        return (
                          <div key={index} className="flex items-center bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
                            <Icon className="h-5 w-5 text-purple-600 mr-3" />
                            <span className="font-medium text-ink-900">{type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Media Evidence */}
                  {task?.distributionEvidence && (
                    <div className="bg-white border border-ink-100 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center">
                        <ImageIcon className="h-5 w-5 mr-2 text-purple-600" />
                        Media Evidence
                      </h3>

                      <div className="space-y-4">
                        {/* Photos */}
                        {task.distributionEvidence.photos?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-ink-700 mb-2">Photos ({task.distributionEvidence.photos.length})</h4>
                            <div className="space-y-1">
                              {task.distributionEvidence.photos.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-blue-600 hover:text-blue-800 truncate"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Videos */}
                        {task.distributionEvidence.videos?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-ink-700 mb-2">Videos ({task.distributionEvidence.videos.length})</h4>
                            <div className="space-y-1">
                              {task.distributionEvidence.videos.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-blue-600 hover:text-blue-800 truncate"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Social Media Posts */}
                        {task.distributionEvidence.socialMediaPosts?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-ink-700 mb-2">Social Media Posts ({task.distributionEvidence.socialMediaPosts.length})</h4>
                            <div className="space-y-1">
                              {task.distributionEvidence.socialMediaPosts.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-blue-600 hover:text-blue-800 truncate"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Live Stream URLs */}
                        {task.distributionEvidence.liveStreamUrls?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-ink-700 mb-2">Live Streams ({task.distributionEvidence.liveStreamUrls.length})</h4>
                            <div className="space-y-1">
                              {task.distributionEvidence.liveStreamUrls.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-sm text-blue-600 hover:text-blue-800 truncate"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {task.distributionEvidence.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-ink-700 mb-2">Notes</h4>
                            <p className="text-sm text-ink-600 bg-ink-50 p-3 rounded border border-ink-100">
                              {task.distributionEvidence.notes}
                            </p>
                          </div>
                        )}

                        {/* No Evidence */}
                        {!task.distributionEvidence.photos?.length &&
                         !task.distributionEvidence.videos?.length &&
                         !task.distributionEvidence.socialMediaPosts?.length &&
                         !task.distributionEvidence.liveStreamUrls?.length && (
                          <p className="text-ink-500 text-center py-4">No media evidence uploaded yet</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Completion Info */}
                  {task?.mediaCoverageCompletedAt && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center text-green-800">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <div>
                          <p className="font-medium">Coverage Completed</p>
                          <p className="text-sm text-green-700">
                            {new Date(task.mediaCoverageCompletedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Camera className="h-16 w-16 text-ink-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-ink-900 mb-2">No Media Team Assigned</h3>
                  <p className="text-ink-600 mb-4">
                    Assign a media team to start tracking coverage for this task.
                  </p>
                  <button
                    onClick={() => setActiveTab('assign')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Assign Media Team
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* ASSIGN TEAM TAB */}
          {/* ============================================ */}
          {activeTab === 'assign' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Assign Media Coverage Team</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Select team members and coverage types for this task.
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Member Selection */}
              <div>
                <h3 className="text-lg font-semibold text-ink-900 mb-3">Select Team Members</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {staff && staff.length > 0 ? (
                    staff.map((member) => (
                      <label
                        key={member.id}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          assignFormData.mediaTeamAssigned.includes(member.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-ink-100 hover:border-purple-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={assignFormData.mediaTeamAssigned.includes(member.id)}
                          onChange={() => toggleTeamMember(member.id)}
                          className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-ink-200 rounded"
                        />
                        <User className="h-5 w-5 text-ink-400 mr-2" />
                        <div>
                          <p className="font-medium text-ink-900">{member.fullName}</p>
                          <p className="text-xs text-ink-500">{member.email}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-ink-500 text-center py-4">No staff members available</p>
                  )}
                </div>
              </div>

              {/* Coverage Types */}
              <div>
                <h3 className="text-lg font-semibold text-ink-900 mb-3">Coverage Types</h3>
                <div className="grid grid-cols-2 gap-3">
                  {coverageTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <label
                        key={type.value}
                        className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          assignFormData.mediaCoverageType.includes(type.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-ink-100 hover:border-purple-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={assignFormData.mediaCoverageType.includes(type.value)}
                          onChange={() => toggleCoverageType(type.value)}
                          className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-ink-200 rounded"
                        />
                        <Icon className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium text-ink-900">{type.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAssignTeam}
                disabled={loading || assignFormData.mediaTeamAssigned.length === 0 || assignFormData.mediaCoverageType.length === 0}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5 mr-2" />
                    Assign Media Team
                  </>
                )}
              </button>
            </div>
          )}

          {/* ============================================ */}
          {/* UPDATE STATUS TAB */}
          {/* ============================================ */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Update Coverage Status</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Track the progress of media coverage and upload evidence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Coverage Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={statusFormData.mediaCoverageStatus}
                  onChange={(e) => setStatusFormData(prev => ({ ...prev, mediaCoverageStatus: e.target.value }))}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo URLs */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Photo URLs
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPhotoUrl()}
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={addPhotoUrl}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {statusFormData.distributionEvidence?.photos?.map((url, index) => (
                    <div key={index} className="flex items-center justify-between bg-ink-50 p-2 rounded border border-ink-100">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1">
                        {url}
                      </a>
                      <button
                        onClick={() => removeUrl('photos', index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video URLs */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Video URLs
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addVideoUrl()}
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={addVideoUrl}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {statusFormData.distributionEvidence?.videos?.map((url, index) => (
                    <div key={index} className="flex items-center justify-between bg-ink-50 p-2 rounded border border-ink-100">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1">
                        {url}
                      </a>
                      <button
                        onClick={() => removeUrl('videos', index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Media URLs */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Social Media Post URLs
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://facebook.com/posts/..."
                    value={newSocialMediaUrl}
                    onChange={(e) => setNewSocialMediaUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSocialMediaUrl()}
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={addSocialMediaUrl}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {statusFormData.distributionEvidence?.socialMediaPosts?.map((url, index) => (
                    <div key={index} className="flex items-center justify-between bg-ink-50 p-2 rounded border border-ink-100">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1">
                        {url}
                      </a>
                      <button
                        onClick={() => removeUrl('socialMediaPosts', index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Stream URLs */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Live Stream URLs
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://youtube.com/live/..."
                    value={newLiveStreamUrl}
                    onChange={(e) => setNewLiveStreamUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLiveStreamUrl()}
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={addLiveStreamUrl}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {statusFormData.distributionEvidence?.liveStreamUrls?.map((url, index) => (
                    <div key={index} className="flex items-center justify-between bg-ink-50 p-2 rounded border border-ink-100">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1">
                        {url}
                      </a>
                      <button
                        onClick={() => removeUrl('liveStreamUrls', index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Additional notes about the media coverage..."
                  value={statusFormData.distributionEvidence?.notes || ''}
                  onChange={(e) => setStatusFormData(prev => ({
                    ...prev,
                    distributionEvidence: {
                      ...prev.distributionEvidence,
                      notes: e.target.value
                    }
                  }))}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleUpdateStatus}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Update Coverage Status
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-ink-200 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaCoverageModal;
