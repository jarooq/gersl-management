import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Mail, Phone, Calendar, DollarSign, Briefcase, MapPin,
  User, Shield, Clock, FileText, Award, Activity, Edit, Trash2,
  CheckCircle, AlertCircle, Download, Eye, XCircle, Upload, Plus
} from 'lucide-react';
import API from '../../services/api';
import { DOCUMENT_TYPE_OPTIONS, EXPIRABLE_DOCUMENT_TYPES } from '../../constants/documentTypes';

const StaffProfileModal = ({ staff, onClose, onEdit, onDelete }) => {
  const [activeSection, setActiveSection] = useState('personal');
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    documentType: '',
    documentName: '',
    description: '',
    expiryDate: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [performance, setPerformance] = useState({
    attendanceRate: 0,
    tasksCompleted: 0,
    lastCheckIn: null,
    lastLeaveRequest: null,
    lastAppraisal: null,
    appraisalScore: null
  });
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!staff?.id) return;
    try {
      setLoadingDocuments(true);
      const response = await API.get(`/hr/documents/user/${staff.id}`);
      if (response.data.success) {
        setDocuments(response.data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  }, [staff?.id]);

  const fetchPerformanceData = useCallback(async () => {
    if (!staff?.id) return;
    try {
      setLoadingPerformance(true);

      // Fetch attendance stats, tasks, leave requests, and appraisals in parallel
      const [attendanceRes, tasksRes, leaveRes, appraisalRes] = await Promise.all([
        API.get(`/attendance/stats?userId=${staff.id}`).catch(() => ({ data: {} })),
        API.get(`/tasks?assignedTo=${staff.id}&status=Completed`).catch(() => ({ data: { data: [] } })),
        API.get(`/attendance/leave/requests?userId=${staff.id}`).catch(() => ({ data: { data: [] } })),
        API.get(`/hr/appraisal/staff/${staff.id}`).catch(() => ({ data: { data: [] } }))
      ]);

      // Process attendance rate
      const attendanceRate = attendanceRes.data?.attendanceRate || attendanceRes.data?.stats?.attendanceRate || 0;

      // Count completed tasks
      const tasksCompleted = tasksRes.data?.data?.length || tasksRes.data?.total || 0;

      // Get latest attendance record (last check-in)
      const lastCheckIn = attendanceRes.data?.lastCheckIn || attendanceRes.data?.stats?.lastCheckIn || null;

      // Get latest leave request
      const leaveRequests = leaveRes.data?.data || [];
      const lastLeaveRequest = leaveRequests.length > 0 ? leaveRequests[0].createdAt : null;

      // Get latest appraisal
      const appraisals = appraisalRes.data?.data || [];
      const latestAppraisal = appraisals.length > 0 ? appraisals[0] : null;
      const lastAppraisal = latestAppraisal?.appraisalDate || latestAppraisal?.createdAt || null;
      const appraisalScore = latestAppraisal?.overallRating || latestAppraisal?.totalScore || null;

      setPerformance({
        attendanceRate,
        tasksCompleted,
        lastCheckIn,
        lastLeaveRequest,
        lastAppraisal,
        appraisalScore
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoadingPerformance(false);
    }
  }, [staff?.id]);

  // Fetch documents and performance data when modal opens.
  // Declared before any early return so the hook count stays stable.
  useEffect(() => {
    if (staff?.id) {
      fetchDocuments();
      fetchPerformanceData();
    }
  }, [staff?.id, fetchDocuments, fetchPerformanceData]);

  const handleUploadDocument = async () => {
    try {
      if (!uploadForm.file || !uploadForm.documentType) {
        alert('Please select a file and document type');
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('documentType', uploadForm.documentType);
      formData.append('documentName', uploadForm.documentName || uploadForm.file.name);
      if (uploadForm.description) formData.append('description', uploadForm.description);
      if (uploadForm.expiryDate) formData.append('expiryDate', uploadForm.expiryDate);

      // Content-Type is intentionally omitted — the request helper detects
      // FormData and lets the browser set the multipart boundary itself.
      const response = await API.post(`/hr/documents/user/${staff.id}`, formData);

      if (response.data.success) {
        alert('✅ Document uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({
          documentType: '',
          documentName: '',
          description: '',
          expiryDate: '',
          file: null
        });
        fetchDocuments(); // Refresh documents list
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`❌ Failed to upload document: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `LKR ${parseFloat(amount).toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'performance', label: 'Performance', icon: Award }
  ];

  // Early return placed after all hook calls to keep hook order stable.
  if (!staff) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-pop max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-navy-900 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold">
                {staff.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{staff.fullName || 'Unknown'}</h2>
                <p className="text-blue-100 mb-2">{staff.position || 'No Position'}</p>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    staff.status === 'Active'
                      ? 'bg-green-500 bg-opacity-20 text-green-100 border border-green-300'
                      : 'bg-ink-500 bg-opacity-20 text-ink-100 border border-ink-300'
                  }`}>
                    {staff.status || 'Unknown'}
                  </span>
                  <span className="text-sm text-blue-100">ID: {staff.employeeId || 'N/A'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-ink-200 bg-ink-50">
          <div className="flex overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
                  }`}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Personal Info Section */}
          {activeSection === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard icon={Mail} label="Email" value={staff.email || 'N/A'} />
                <InfoCard icon={Phone} label="Phone" value={staff.phone || 'N/A'} />
                <InfoCard icon={MapPin} label="Address" value={staff.address || 'N/A'} />
                <InfoCard icon={Calendar} label="Date of Birth" value={formatDate(staff.dateOfBirth)} />
                <InfoCard icon={User} label="Gender" value={staff.gender || 'N/A'} />
                <InfoCard icon={Shield} label="Emergency Contact" value={staff.emergencyContact || 'N/A'} />
              </div>

              {staff.bio && (
                <div className="bg-ink-50 rounded-lg p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">Biography</h3>
                  <p className="text-ink-600 text-sm">{staff.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* Employment Section */}
          {activeSection === 'employment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard icon={Briefcase} label="Department" value={staff.department || 'N/A'} />
                <InfoCard icon={Briefcase} label="Position" value={staff.position || 'N/A'} />
                <InfoCard icon={Calendar} label="Joining Date" value={formatDate(staff.joiningDate)} />
                <InfoCard icon={DollarSign} label="Salary" value={formatCurrency(staff.salary)} />
                <InfoCard icon={FileText} label="Contract Type" value={staff.contractType || 'N/A'} />
                <InfoCard icon={Clock} label="Work Hours" value={staff.workHours || '9:00 AM - 5:00 PM'} />
                <InfoCard icon={Activity} label="Leave Balance" value={`${staff.leaveBalance || 0} days`} />
                <InfoCard icon={Shield} label="Reporting To" value={staff.reportingTo || 'N/A'} />
              </div>

              {/* Employment Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {staff.status === 'Active' ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  ) : (
                    <AlertCircle className="text-ink-600 flex-shrink-0" size={20} />
                  )}
                  <div>
                    <h4 className="font-semibold text-ink-900 mb-1">Employment Status</h4>
                    <p className="text-sm text-ink-600">
                      {staff.status === 'Active'
                        ? 'This employee is currently active and working.'
                        : 'This employee is not currently active.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Section */}
          {activeSection === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-ink-900">Employee Documents</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-600">
                    {documents.length} document{documents.length !== 1 ? 's' : ''} on file
                  </span>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    <Plus size={16} />
                    Upload Document
                  </button>
                </div>
              </div>

              {loadingDocuments ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-ink-400 mb-3" size={48} />
                  <p className="text-ink-600 mb-2">No documents uploaded yet</p>
                  <p className="text-sm text-ink-500">Documents will appear here once uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-ink-200 rounded-lg p-4 hover:bg-ink-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-ink-900">{doc.documentName}</h4>
                            <p className="text-sm text-ink-500 mb-2">
                              Type: {doc.documentType}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-ink-600">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Uploaded: {formatDate(doc.createdAt)}
                              </span>
                              {doc.uploader && (
                                <span className="flex items-center gap-1">
                                  <User size={12} />
                                  By: {doc.uploader.fullName}
                                </span>
                              )}
                              {doc.expiryDate && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  Expires: {formatDate(doc.expiryDate)}
                                </span>
                              )}
                            </div>
                            {doc.verificationDate && doc.verifier && (
                              <div className="mt-2 text-xs text-ink-600 bg-ink-50 rounded px-2 py-1 inline-flex items-center gap-1">
                                <CheckCircle size={12} className="text-green-600" />
                                Verified by {doc.verifier.fullName} on {formatDate(doc.verificationDate)}
                              </div>
                            )}
                            {doc.notes && (
                              <div className="mt-2 text-xs text-ink-600 bg-blue-50 rounded px-2 py-1">
                                <strong>Note:</strong> {doc.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            doc.status === 'Verified'
                              ? 'bg-green-100 text-green-700'
                              : doc.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : doc.status === 'Expired'
                              ? 'bg-ink-100 text-ink-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Performance Section */}
          {activeSection === 'performance' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-ink-900 mb-4">Performance Overview</h3>

              {loadingPerformance ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      label="Attendance Rate"
                      value={`${Math.round(performance.attendanceRate)}%`}
                      color="green"
                      icon={Activity}
                    />
                    <StatCard
                      label="Tasks Completed"
                      value={performance.tasksCompleted.toString()}
                      color="blue"
                      icon={CheckCircle}
                    />
                    <StatCard
                      label="Performance Score"
                      value={performance.appraisalScore ? `${performance.appraisalScore}/5` : 'N/A'}
                      color="purple"
                      icon={Award}
                    />
                  </div>

                  {/* Recent Activities */}
                  <div className="bg-ink-50 rounded-lg p-4">
                    <h4 className="font-semibold text-ink-900 mb-3">Recent Activities</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-ink-200">
                        <span className="text-ink-600">Last Check-in</span>
                        <span className="font-medium text-ink-900">
                          {formatRelativeTime(performance.lastCheckIn)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-ink-200">
                        <span className="text-ink-600">Last Leave Request</span>
                        <span className="font-medium text-ink-900">
                          {formatRelativeTime(performance.lastLeaveRequest)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-ink-600">Last Appraisal</span>
                        <span className="font-medium text-ink-900">
                          {formatRelativeTime(performance.lastAppraisal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-ink-200 p-4 bg-ink-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-ink-600">
              Employee ID: {staff.employeeId || 'N/A'}
            </div>
            <div className="flex gap-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(staff)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(staff)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-pop max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-navy-900 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Upload Document</h2>
                  <p className="text-blue-100 text-sm">For {staff.fullName}</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadForm.documentType}
                  onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select document type...</option>
                  {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Document Name (optional)
                </label>
                <input
                  type="text"
                  value={uploadForm.documentName}
                  onChange={(e) => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                  placeholder="Leave blank to use filename"
                  className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Select File <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-ink-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <Upload className="mx-auto text-ink-400 mb-2" size={32} />
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    className="block w-full text-sm text-ink-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadForm.file && (
                    <p className="mt-2 text-sm text-ink-600">
                      Selected: <strong>{uploadForm.file.name}</strong> ({(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="text-xs text-ink-500 mt-2">
                    Supported: PDF, Word, Excel, Images (Max 20MB)
                  </p>
                </div>
              </div>

              {/* Expiry Date (only for certain document types) */}
              {uploadForm.documentType && EXPIRABLE_DOCUMENT_TYPES.includes(uploadForm.documentType) && (
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                    className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows="3"
                  placeholder="Add any notes about this document..."
                  className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                ></textarea>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-ink-200 p-4 bg-ink-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition font-medium"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadDocument}
                  disabled={uploading || !uploadForm.file || !uploadForm.documentType}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white border border-ink-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="text-blue-600" size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink-600 mb-1">{label}</p>
        <p className="font-semibold text-ink-900 truncate">{value}</p>
      </div>
    </div>
  </div>
);

const StatCard = ({ label, value, color, icon: Icon }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon size={20} />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default StaffProfileModal;
