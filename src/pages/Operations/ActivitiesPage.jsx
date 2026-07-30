import React, { useState } from 'react';
import {
  Target, Calendar, Users, MapPin, CheckCircle, Clock, AlertCircle,
  Plus, Eye, Edit2, Trash2, UserCheck, Camera, FileText, Package,
  DollarSign, Briefcase, TrendingUp, Download, X
} from 'lucide-react';

const ActivitiesPage = () => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [showResourcePlanning, setShowResourcePlanning] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  // Form state for new activity
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    project: '',
    status: 'Planning',
    startDate: '',
    endDate: '',
    location: '',
    participants: '',
    budget: '',
    completion: ''
  });

  const [activities, setActivities] = useState([]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetActivityForm = () => {
    setNewActivity({
      name: '',
      description: '',
      project: '',
      status: 'Planning',
      startDate: '',
      endDate: '',
      location: '',
      participants: '',
      budget: '',
      completion: ''
    });
  };

  // Create new activity
  const handleCreateActivity = () => {
    // Validation
    if (!newActivity.name.trim() || !newActivity.description.trim() || !newActivity.project ||
        !newActivity.startDate || !newActivity.endDate || !newActivity.location) {
      alert('Please fill in all required fields (Activity Name, Description, Project, Dates, Location)');
      return;
    }

    // Determine color based on status
    const getColorForStatus = (status) => {
      switch (status) {
        case 'In Progress': return 'blue';
        case 'Completed': return 'green';
        case 'Scheduled': return 'purple';
        default: return 'gray';
      }
    };

    // Create new activity object
    const activityToAdd = {
      id: activities.length + 1,
      name: newActivity.name,
      description: newActivity.description,
      project: newActivity.project,
      status: newActivity.status,
      startDate: newActivity.startDate,
      endDate: newActivity.endDate,
      location: newActivity.location,
      participants: parseInt(newActivity.participants) || 0,
      completion: parseInt(newActivity.completion) || 0,
      budget: parseInt(newActivity.budget) || 0,
      resources: [],
      attendance: [],
      photos: [],
      color: getColorForStatus(newActivity.status)
    };

    // Add activity to list
    setActivities(prev => [activityToAdd, ...prev]);

    // Reset form and close modal
    resetActivityForm();
    setShowAddActivity(false);

    // Show success message
    alert('Activity created successfully!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'In Progress':
        return <Clock size={16} className="text-blue-600" />;
      case 'Scheduled':
        return <AlertCircle size={16} className="text-purple-600" />;
      default:
        return <Clock size={16} className="text-ink-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Scheduled':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  const openActivityDetail = (activity) => {
    setSelectedActivity(activity);
    setShowActivityDetail(true);
  };

  const openResourcePlanning = (activity) => {
    setSelectedActivity(activity);
    setShowResourcePlanning(true);
  };

  const openAttendance = (activity) => {
    setSelectedActivity(activity);
    setShowAttendance(true);
  };

  const openPhotos = (activity) => {
    setSelectedActivity(activity);
    setShowPhotos(true);
  };

  const openReport = (activity) => {
    setSelectedActivity(activity);
    setShowReport(true);
  };

  const stats = {
    total: activities.length,
    inProgress: activities.filter(a => a.status === 'In Progress').length,
    completed: activities.filter(a => a.status === 'Completed').length,
    participants: activities.reduce((sum, a) => sum + a.participants, 0)
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Operations · Activities</p>
                  <h1 className="text-h2 font-bold leading-tight">Activities Management</h1>
                  <p className="text-ink-200 text-sm mt-0.5">Full lifecycle management with resources, attendance, and reporting.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0"><button
          onClick={() => setShowAddActivity(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-navy-900 hover:bg-navy-800 rounded-md shadow-card transition shrink-0"
        >
          <Plus size={16} />
          New Activity
        </button></div>
              </div>
            </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">Total Activities</p>
              <h3 className="text-h1 text-ink-900">{stats.total}</h3>
              <p className="text-xs text-ink-500 mt-1">Across all projects</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <Target className="text-white" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">In Progress</p>
              <h3 className="text-h1 text-ink-900">{stats.inProgress}</h3>
              <p className="text-xs text-ink-500 mt-1">Currently active</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <Clock className="text-white" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">Completed</p>
              <h3 className="text-h1 text-ink-900">{stats.completed}</h3>
              <p className="text-xs text-ink-500 mt-1">This quarter</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <CheckCircle className="text-white" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">Participants</p>
              <h3 className="text-h1 text-ink-900">{stats.participants}</h3>
              <p className="text-xs text-ink-500 mt-1">Total reached</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <Users className="text-white" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-ink-900">Activities</h2>
        </div>

        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white border border-ink-100 rounded-lg2 shadow-card p-5"
              
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-ink-900">{activity.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(activity.status)}`}>
                      {getStatusIcon(activity.status)}
                      {activity.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink-600 font-medium">{activity.project}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Start Date</p>
                    <p className="text-sm font-semibold text-ink-900">{activity.startDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Calendar size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">End Date</p>
                    <p className="text-sm font-semibold text-ink-900">{activity.endDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <MapPin size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Location</p>
                    <p className="text-sm font-semibold text-ink-900">{activity.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Participants</p>
                    <p className="text-sm font-semibold text-ink-900">{activity.participants}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
                    <DollarSign size={16} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Budget</p>
                    <p className="text-sm font-semibold text-ink-900">LKR {activity.budget.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-ink-700">Progress</span>
                  <span className="text-sm font-bold text-purple-600">{activity.completion}%</span>
                </div>
                <div className="w-full bg-ink-200 rounded-full h-1.5">
                  <div
                    className="bg-navy-900 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${activity.completion}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <button
                  onClick={() => openActivityDetail(activity)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all text-xs font-semibold"
                >
                  <Eye size={14} />
                  Details
                </button>
                <button
                  onClick={() => openResourcePlanning(activity)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-xs font-semibold"
                >
                  <Package size={14} />
                  Resources
                </button>
                <button
                  onClick={() => openAttendance(activity)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all text-xs font-semibold"
                >
                  <UserCheck size={14} />
                  Attendance
                </button>
                <button
                  onClick={() => openPhotos(activity)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all text-xs font-semibold"
                >
                  <Camera size={14} />
                  Photos
                </button>
                <button
                  onClick={() => openReport(activity)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-all text-xs font-semibold"
                >
                  <FileText size={14} />
                  Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Detail Modal */}
      {showActivityDetail && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedActivity.name}</h2>
                  <p className="text-purple-100">{selectedActivity.project}</p>
                </div>
                <button
                  onClick={() => setShowActivityDetail(false)}
                  className="p-2 hover:bg-purple-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-2">Description</h3>
                <p className="text-ink-700">{selectedActivity.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Location</p>
                  <p className="font-semibold text-ink-900">{selectedActivity.location}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border inline-flex items-center gap-1 ${getStatusColor(selectedActivity.status)}`}>
                    {getStatusIcon(selectedActivity.status)}
                    {selectedActivity.status}
                  </span>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Duration</p>
                  <p className="font-semibold text-ink-900">{selectedActivity.startDate} - {selectedActivity.endDate}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Expected Participants</p>
                  <p className="font-semibold text-ink-900">{selectedActivity.participants}</p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl flex justify-between">
              <button
                onClick={() => setShowActivityDetail(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Planning Modal */}
      {showResourcePlanning && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Resource Planning</h2>
                  <p className="text-blue-100">{selectedActivity.name}</p>
                </div>
                <button
                  onClick={() => setShowResourcePlanning(false)}
                  className="p-2 hover:bg-blue-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink-600">Total Budget</p>
                    <p className="text-h1 text-ink-900">LKR {selectedActivity.budget.toLocaleString()}</p>
                  </div>
                  <DollarSign size={18} className="text-blue-600" />
                </div>
              </div>

              <h3 className="text-sm font-bold text-ink-900 mb-4">Resource Allocation</h3>
              <div className="space-y-3">
                {selectedActivity.resources.map((resource, idx) => (
                  <div key={idx} className="p-4 border border-ink-100 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">{resource.item}</p>
                            <p className="text-sm text-ink-600">{resource.type}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-ink-600">Quantity</p>
                          <p className="font-bold text-ink-900">{resource.quantity}</p>
                        </div>
                        <div>
                          {resource.allocated ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                              <CheckCircle size={12} />
                              Allocated
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
                              <Clock size={12} />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl flex justify-between">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Add Resource
              </button>
              <button
                onClick={() => setShowResourcePlanning(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tracking Modal */}
      {showAttendance && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Attendance Tracking</h2>
                  <p className="text-purple-100">{selectedActivity.name}</p>
                </div>
                <button
                  onClick={() => setShowAttendance(false)}
                  className="p-2 hover:bg-purple-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Total Expected</p>
                  <p className="text-h1 text-ink-900">{selectedActivity.participants}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Present</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedActivity.attendance.filter(a => a.status === 'Present').length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Absent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {selectedActivity.attendance.filter(a => a.status === 'Absent').length}
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-bold text-ink-900 mb-4">Attendance Records</h3>
              {selectedActivity.attendance.length > 0 ? (
                <div className="space-y-2">
                  {selectedActivity.attendance.map((record) => (
                    <div key={record.id} className="p-4 border border-ink-100 rounded-lg hover:border-purple-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users size={18} className="text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">{record.name}</p>
                            <p className="text-sm text-ink-600">{record.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm text-ink-600">{record.date}</p>
                          {record.status === 'Present' ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                              <CheckCircle size={12} />
                              Present
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                              <X size={12} />
                              Absent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ink-500">
                  <UserCheck size={48} className="mx-auto mb-2 text-ink-400" />
                  <p>No attendance records yet</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl flex justify-between">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Mark Attendance
              </button>
              <button
                onClick={() => setShowAttendance(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Documentation Modal */}
      {showPhotos && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Photo Documentation</h2>
                  <p className="text-green-100">{selectedActivity.name}</p>
                </div>
                <button
                  onClick={() => setShowPhotos(false)}
                  className="p-2 hover:bg-green-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-ink-900">Gallery ({selectedActivity.photos.length} photos)</h3>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2">
                    <Camera size={18} />
                    Upload Photos
                  </button>
                </div>
              </div>

              {selectedActivity.photos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedActivity.photos.map((photo) => (
                    <div key={photo.id} className="border border-ink-100 rounded-lg overflow-hidden hover:border-green-400 transition-colors">
                      <div className="aspect-video bg-ink-50 flex items-center justify-center">
                        <Camera size={48} className="text-green-600" />
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-ink-900 mb-1">{photo.title}</p>
                        <p className="text-sm text-ink-600">{photo.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-ink-500">
                  <Camera size={64} className="mx-auto mb-3 text-ink-400" />
                  <p className="text-lg font-semibold mb-1">No photos yet</p>
                  <p className="text-sm">Upload photos to document this activity</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl">
              <button
                onClick={() => setShowPhotos(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Report Modal */}
      {showReport && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Activity Report</h2>
                  <p className="text-orange-100">{selectedActivity.name}</p>
                </div>
                <button
                  onClick={() => setShowReport(false)}
                  className="p-2 hover:bg-orange-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Report Summary */}
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-4">Report Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-ink-600 mb-1">Activity Status</p>
                    <p className="font-bold text-ink-900">{selectedActivity.status}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-ink-600 mb-1">Completion Rate</p>
                    <p className="font-bold text-ink-900">{selectedActivity.completion}%</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-ink-600 mb-1">Resources Allocated</p>
                    <p className="font-bold text-ink-900">
                      {selectedActivity.resources.filter(r => r.allocated).length} / {selectedActivity.resources.length}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-ink-600 mb-1">Attendance Rate</p>
                    <p className="font-bold text-ink-900">
                      {selectedActivity.attendance.length > 0
                        ? Math.round((selectedActivity.attendance.filter(a => a.status === 'Present').length / selectedActivity.attendance.length) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-ink-700">Overall Progress</span>
                      <span className="text-sm font-bold text-purple-600">{selectedActivity.completion}%</span>
                    </div>
                    <div className="w-full bg-ink-200 rounded-full h-1.5">
                      <div
                        className="bg-navy-900 h-1.5 rounded-full"
                        style={{ width: `${selectedActivity.completion}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-ink-700">Resource Allocation</span>
                      <span className="text-sm font-bold text-green-600">
                        {Math.round((selectedActivity.resources.filter(r => r.allocated).length / selectedActivity.resources.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-ink-200 rounded-full h-1.5">
                      <div
                        className="bg-navy-900 h-1.5 rounded-full"
                        style={{ width: `${(selectedActivity.resources.filter(r => r.allocated).length / selectedActivity.resources.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Highlights */}
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-3">Key Highlights</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-ink-700">
                      {selectedActivity.participants} participants expected for this activity
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-ink-700">
                      {selectedActivity.resources.length} resources allocated across {[...new Set(selectedActivity.resources.map(r => r.type))].length} categories
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-ink-700">
                      {selectedActivity.photos.length} photos documenting the activity
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-ink-700">
                      Budget: LKR {selectedActivity.budget.toLocaleString()}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl flex justify-between">
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-2">
                <Download size={18} />
                Download Report
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Create New Activity</h2>
                  <p className="text-purple-100">Add a new activity to your project</p>
                </div>
                <button
                  onClick={() => setShowAddActivity(false)}
                  className="p-2 hover:bg-purple-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <form className="space-y-4">
                {/* Activity Details */}
                <div>
                  <h3 className="text-sm font-bold text-ink-900 mb-4">Activity Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Activity Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={newActivity.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter activity name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Description *</label>
                      <textarea
                        name="description"
                        value={newActivity.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows="3"
                        placeholder="Enter activity description"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Project *</label>
                      <select
                        name="project"
                        value={newActivity.project}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select project</option>
                        <option value="Child Protection Initiative">Child Protection Initiative</option>
                        <option value="Youth Skills Development">Youth Skills Development</option>
                        <option value="Orphan Care Program">Orphan Care Program</option>
                        <option value="Disaster Preparedness">Disaster Preparedness</option>
                        <option value="Education Program">Education Program</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Status *</label>
                      <select
                        name="status"
                        value={newActivity.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="Planning">Planning</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Start Date *</label>
                      <input
                        type="date"
                        name="startDate"
                        value={newActivity.startDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">End Date *</label>
                      <input
                        type="date"
                        name="endDate"
                        value={newActivity.endDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Location *</label>
                      <input
                        type="text"
                        name="location"
                        value={newActivity.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Enter location"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Expected Participants</label>
                      <input
                        type="number"
                        name="participants"
                        value={newActivity.participants}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Budget (LKR)</label>
                      <input
                        type="number"
                        name="budget"
                        value={newActivity.budget}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Completion %</label>
                      <input
                        type="number"
                        name="completion"
                        value={newActivity.completion}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> After creating the activity, you can add resources, track attendance, upload photos, and generate reports from the activity's detail view.
                  </p>
                </div>
              </form>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl flex justify-between">
              <button
                onClick={() => {
                  resetActivityForm();
                  setShowAddActivity(false);
                }}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateActivity}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold"
              >
                Create Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
