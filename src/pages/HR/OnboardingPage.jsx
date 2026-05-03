import React, { useState, useMemo } from 'react';
import { useHR } from '../../contexts/HRContext';
import { UserPlus, Clock, CheckCircle, X, Calendar, User, Briefcase, TrendingUp, AlertCircle, Search, Filter, Download, Edit, Trash2, Plus } from 'lucide-react';

const OnboardingPage = () => {
  const {
    staff,
    onboardingRecords,
    addOnboarding,
    updateOnboarding,
    deleteOnboarding
  } = useHR();

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [onboardingForm, setOnboardingForm] = useState({
    employeeId: '',
    mentor: '',
    checklist: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, in_progress, completed

  // Predefined onboarding templates
  const templates = {
    standard: [
      'Complete HR documentation and contracts',
      'Set up email and system access',
      'IT equipment allocation and setup',
      'Introduction to team members',
      'Review organization policies and procedures',
      'Safety and security briefing',
      'Project orientation and assignment',
      'First week check-in with manager'
    ],
    field_staff: [
      'Complete HR documentation and contracts',
      'Safety and security training',
      'Field equipment and vehicle assignment',
      'GPS device and communication tools setup',
      'Field protocols and procedures training',
      'Introduction to local partners and communities',
      'Emergency response procedures',
      'First field visit with mentor'
    ],
    manager: [
      'Complete HR documentation and contracts',
      'Set up email and system access',
      'Leadership and management training',
      'Review team structure and responsibilities',
      'Budget and financial management orientation',
      'Stakeholder introduction meetings',
      'Strategic planning session',
      'First month performance review'
    ]
  };

  // Apply template to form
  const applyTemplate = (templateType) => {
    const checklist = templates[templateType].map((item, index) => `${index + 1}. ${item}`).join('\n');
    setOnboardingForm({ ...onboardingForm, checklist });
  };

  // Handle Add/Edit Onboarding
  const handleSaveOnboarding = () => {
    if (!onboardingForm.employeeId) {
      alert('Please select an employee');
      return;
    }

    if (editingRecord) {
      updateOnboarding(editingRecord.id, onboardingForm);
      alert('Onboarding record updated successfully!');
    } else {
      addOnboarding(onboardingForm);
      alert('Onboarding record created successfully!');
    }

    setOnboardingForm({
      employeeId: '',
      mentor: '',
      checklist: ''
    });
    setEditingRecord(null);
    setShowModal(false);
  };

  // Handle Edit
  const handleEdit = (record) => {
    setEditingRecord(record);
    setOnboardingForm({
      employeeId: record.employeeId,
      mentor: record.mentor || '',
      checklist: record.checklist || ''
    });
    setShowModal(true);
  };

  // Handle Delete
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this onboarding record?')) {
      deleteOnboarding(id);
      alert('Onboarding record deleted successfully!');
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    let filtered = onboardingRecords;

    // Filter by status
    if (filterStatus !== 'all') {
      const statusMap = {
        'in_progress': 'In Progress',
        'completed': 'Completed'
      };
      filtered = filtered.filter(r => r.status === statusMap[filterStatus]);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.mentor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [onboardingRecords, filterStatus, searchTerm]);

  // Stats calculations
  const stats = {
    total: onboardingRecords.length,
    inProgress: onboardingRecords.filter(o => o.status === 'In Progress').length,
    completed: onboardingRecords.filter(o => o.status === 'Completed').length,
    avgProgress: onboardingRecords.length > 0
      ? Math.round(onboardingRecords.reduce((sum, o) => sum + (o.progress || 0), 0) / onboardingRecords.length)
      : 0
  };

  // Export onboarding data
  const handleExport = () => {
    const csvContent = [
      ['Employee Name', 'Employee ID', 'Department', 'Start Date', 'Mentor', 'Status', 'Progress', 'Checklist'],
      ...filteredRecords.map(record => [
        record.employeeName,
        record.employeeId,
        record.department,
        record.startDate,
        record.mentor || '',
        record.status,
        `${record.progress || 0}%`,
        record.checklist || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onboarding_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-mission-300" />
          </div>
          <div className="min-w-0">
            <h1 className="text-h2 font-bold leading-tight">Employee Onboarding</h1>
            <p className="text-ink-200 text-sm mt-0.5">Track and manage new employee onboarding process</p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-50 border border-primary-200 text-primary-700 rounded-md flex items-center justify-center">
              <UserPlus size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.total}</h3>
          <p className="text-sm text-ink-600">Total Onboarding</p>
        </div>

        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-mission-100 border border-mission-200 text-mission-700 rounded-md flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.inProgress}</h3>
          <p className="text-sm text-ink-600">In Progress</p>
        </div>

        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-50 border border-success-600/20 text-success-700 rounded-md flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.completed}</h3>
          <p className="text-sm text-ink-600">Completed</p>
        </div>

        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-violet-50 border border-violet-200 text-violet-700 rounded-md flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.avgProgress}%</h3>
          <p className="text-sm text-ink-600">Avg Progress</p>
        </div>
      </div>

      {/* Action Buttons and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingRecord(null);
              setOnboardingForm({ employeeId: '', mentor: '', checklist: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-md font-medium shadow-card transition"
          >
            <UserPlus size={20} />
            New Onboarding
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-md font-medium shadow-card transition"
          >
            <Download size={20} />
            Export
          </button>
        </div>

        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, dept, mentor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Onboarding Records */}
      <div className="bg-white rounded-lg2 shadow-sm border border-ink-100">
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Onboarding Records ({filteredRecords.length})</h2>
          <p className="text-sm text-ink-600">Manage employee onboarding process</p>
        </div>

        <div className="p-6 space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-ink-400" />
              </div>
              <p className="text-ink-500 mb-4">No onboarding records found</p>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setOnboardingForm({ employeeId: '', mentor: '', checklist: '' });
                  setShowModal(true);
                }}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Create your first onboarding record
              </button>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="border border-ink-100 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-orange-50 border border-orange-200 text-white rounded-xl flex items-center justify-center">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-900 text-lg">{record.employeeName}</h3>
                      <p className="text-sm text-ink-600">{record.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      record.status === 'Completed'
                        ? 'bg-green-100 text-green-700'
                        : record.status === 'In Progress'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-ink-100 text-ink-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-ink-400" />
                    <span className="text-ink-600">Start: {record.startDate}</span>
                  </div>
                  {record.mentor && (
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-ink-400" />
                      <span className="text-ink-600">Mentor: {record.mentor}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-ink-400" />
                    <span className="text-ink-600">Progress: {record.progress || 0}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-ink-200 rounded-full h-2">
                    <div
                      className="bg-navy-900 h-2 rounded-full transition-all"
                      style={{ width: `${record.progress || 0}%` }}
                    />
                  </div>
                </div>

                {record.checklist && (
                  <div className="bg-ink-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-ink-700">{record.checklist}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const newProgress = Math.min((record.progress || 0) + 10, 100);
                      updateOnboarding(record.id, {
                        progress: newProgress,
                        status: newProgress === 100 ? 'Completed' : 'In Progress'
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                  >
                    <Plus size={16} />
                    +10% Progress
                  </button>
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all text-sm font-semibold"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-semibold"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{editingRecord ? 'Edit Onboarding' : 'New Onboarding'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecord(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Employee *</label>
                  <select
                    value={onboardingForm.employeeId}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, employeeId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={editingRecord !== null}
                  >
                    <option value="">Select Employee</option>
                    {staff.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.employeeId}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Mentor</label>
                  <input
                    type="text"
                    value={onboardingForm.mentor}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, mentor: e.target.value })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Mentor name"
                  />
                </div>

                {!editingRecord && (
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Use Template (Optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => applyTemplate('standard')}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-semibold"
                      >
                        Standard
                      </button>
                      <button
                        onClick={() => applyTemplate('field_staff')}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all text-sm font-semibold"
                      >
                        Field Staff
                      </button>
                      <button
                        onClick={() => applyTemplate('manager')}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm font-semibold"
                      >
                        Manager
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Checklist / Notes</label>
                  <textarea
                    value={onboardingForm.checklist}
                    onChange={(e) => setOnboardingForm({ ...onboardingForm, checklist: e.target.value })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="8"
                    placeholder="Enter onboarding checklist items or notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveOnboarding}
                  className="flex-1 bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-card active:scale-95"
                >
                  {editingRecord ? 'Update Onboarding' : 'Create Onboarding'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecord(null);
                  }}
                  className="flex-1 bg-ink-100 text-ink-700 px-6 py-3 rounded-lg font-semibold hover:bg-ink-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
