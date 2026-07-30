import React, { useState, useMemo } from 'react';
import { useHR } from '../../contexts/HRContext';
import { TrendingUp, Star, Clock, CheckCircle, X, Calendar, User, Briefcase, Award, AlertCircle, Search, Download, Edit, Trash2, Target } from 'lucide-react';

const AppraisalPage = () => {
  const {
    staff,
    appraisalRecords,
    addAppraisal,
    updateAppraisal,
    deleteAppraisal
  } = useHR();

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [appraisalForm, setAppraisalForm] = useState({
    employeeId: '',
    period: '',
    overallScore: '',
    strengths: '',
    improvements: '',
    goals: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  const [filterPeriod, setFilterPeriod] = useState('all');

  // Get score rating
  const getScoreRating = (score) => {
    const numScore = parseFloat(score);
    if (numScore >= 4.5) return { label: 'Outstanding', color: 'text-green-700', bgColor: 'bg-green-100' };
    if (numScore >= 3.5) return { label: 'Exceeds Expectations', color: 'text-blue-700', bgColor: 'bg-blue-100' };
    if (numScore >= 2.5) return { label: 'Meets Expectations', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    if (numScore >= 1.5) return { label: 'Needs Improvement', color: 'text-orange-700', bgColor: 'bg-orange-100' };
    return { label: 'Unsatisfactory', color: 'text-red-700', bgColor: 'bg-red-100' };
  };

  // Handle Add/Edit Appraisal
  const handleSaveAppraisal = () => {
    if (!appraisalForm.employeeId || !appraisalForm.period) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingRecord) {
      updateAppraisal(editingRecord.id, appraisalForm);
      alert('Appraisal updated successfully!');
    } else {
      addAppraisal(appraisalForm);
      alert('Appraisal created successfully!');
    }

    setAppraisalForm({
      employeeId: '',
      period: '',
      overallScore: '',
      strengths: '',
      improvements: '',
      goals: ''
    });
    setEditingRecord(null);
    setShowModal(false);
  };

  // Handle Edit
  const handleEdit = (record) => {
    setEditingRecord(record);
    setAppraisalForm({
      employeeId: record.employeeId,
      period: record.period,
      overallScore: record.overallScore || '',
      strengths: record.strengths || '',
      improvements: record.improvements || '',
      goals: record.goals || ''
    });
    setShowModal(true);
  };

  // Handle Delete
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this appraisal?')) {
      deleteAppraisal(id);
      alert('Appraisal deleted successfully!');
    }
  };

  // Get unique periods
  const uniquePeriods = useMemo(() => {
    const periods = [...new Set(appraisalRecords.map(a => a.period))];
    return periods.sort().reverse();
  }, [appraisalRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let filtered = appraisalRecords;

    // Filter by status
    if (filterStatus !== 'all') {
      const statusMap = {
        'pending': 'Pending',
        'completed': 'Completed'
      };
      filtered = filtered.filter(r => r.status === statusMap[filterStatus]);
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      filtered = filtered.filter(r => r.period === filterPeriod);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [appraisalRecords, filterStatus, filterPeriod, searchTerm]);

  // Stats calculations
  const stats = {
    total: appraisalRecords.length,
    pending: appraisalRecords.filter(a => a.status === 'Pending').length,
    completed: appraisalRecords.filter(a => a.status === 'Completed').length,
    avgScore: appraisalRecords.length > 0
      ? (appraisalRecords.reduce((sum, a) => sum + (parseFloat(a.overallScore) || 0), 0) / appraisalRecords.length).toFixed(1)
      : 0
  };

  // Export appraisal data
  const handleExport = () => {
    const csvContent = [
      ['Employee Name', 'Employee ID', 'Department', 'Position', 'Period', 'Overall Score', 'Status', 'Strengths', 'Improvements', 'Goals', 'Created Date'],
      ...filteredRecords.map(record => [
        record.employeeName,
        record.employeeId,
        record.department,
        record.position,
        record.period,
        record.overallScore || '',
        record.status,
        record.strengths || '',
        record.improvements || '',
        record.goals || '',
        record.createdDate
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appraisal_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-mission-300" />
          </div>
          <div className="min-w-0">
            <h1 className="text-h2 font-bold leading-tight">Performance Appraisal</h1>
            <p className="text-ink-200 text-sm mt-0.5">Track and manage employee performance evaluations</p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-violet-50 border border-violet-200 text-violet-700 rounded-md flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.total}</h3>
          <p className="text-sm text-ink-600">Total Appraisals</p>
        </div>

        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-mission-100 border border-mission-200 text-mission-700 rounded-md flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.pending}</h3>
          <p className="text-sm text-ink-600">Pending</p>
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
            <div className="w-12 h-12 bg-yellow-50 border border-yellow-200 text-white rounded-xl flex items-center justify-center">
              <Star size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.avgScore}</h3>
          <p className="text-sm text-ink-600">Avg Score</p>
        </div>
      </div>

      {/* Action Buttons and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingRecord(null);
              setAppraisalForm({
                employeeId: '',
                period: '',
                overallScore: '',
                strengths: '',
                improvements: '',
                goals: ''
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-md font-medium shadow-card transition"
          >
            <TrendingUp size={20} />
            New Appraisal
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-md font-medium shadow-card transition"
          >
            <Download size={20} />
            Export
          </button>
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, dept, position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
            />
          </div>

          {/* Period Filter */}
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Periods</option>
            {uniquePeriods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Appraisal Records */}
      <div className="bg-white rounded-lg2 shadow-sm border border-ink-100">
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Appraisal Records ({filteredRecords.length})</h2>
          <p className="text-sm text-ink-600">Performance evaluation records</p>
        </div>

        <div className="p-6 space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-ink-400" />
              </div>
              <p className="text-ink-500 mb-4">No appraisal records found</p>
              <button
                onClick={() => {
                  setEditingRecord(null);
                  setAppraisalForm({
                    employeeId: '',
                    period: '',
                    overallScore: '',
                    strengths: '',
                    improvements: '',
                    goals: ''
                  });
                  setShowModal(true);
                }}
                className="text-orange-600 hover:text-orange-700 font-semibold"
              >
                Create your first appraisal
              </button>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const scoreRating = record.overallScore ? getScoreRating(record.overallScore) : null;
              return (
              <div key={record.id} className="border border-ink-100 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-violet-50 border border-violet-200 text-violet-700 rounded-md flex items-center justify-center">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-900 text-lg">{record.employeeName}</h3>
                      <p className="text-sm text-ink-600">{record.department} • {record.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      record.status === 'Completed'
                        ? 'bg-green-100 text-green-700'
                        : record.status === 'Pending'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-ink-100 text-ink-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-ink-400" />
                    <span className="text-ink-600">Period: {record.period}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award size={16} className="text-ink-400" />
                    <span className="text-ink-600">Score: {record.overallScore || 'N/A'}</span>
                  </div>
                  {scoreRating && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star size={16} className="text-ink-400" />
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${scoreRating.bgColor} ${scoreRating.color}`}>
                        {scoreRating.label}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock size={16} className="text-ink-400" />
                    <span className="text-ink-600">Created: {record.createdDate}</span>
                  </div>
                </div>

                {record.strengths && (
                  <div className="bg-green-50 rounded-lg p-3 mb-2">
                    <p className="text-xs font-semibold text-green-700 mb-1">Strengths</p>
                    <p className="text-sm text-ink-700">{record.strengths}</p>
                  </div>
                )}

                {record.improvements && (
                  <div className="bg-orange-50 rounded-lg p-3 mb-2">
                    <p className="text-xs font-semibold text-orange-700 mb-1">Areas for Improvement</p>
                    <p className="text-sm text-ink-700">{record.improvements}</p>
                  </div>
                )}

                {record.goals && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Goals</p>
                    <p className="text-sm text-ink-700">{record.goals}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      updateAppraisal(record.id, {
                        status: record.status === 'Pending' ? 'Completed' : 'Pending'
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                  >
                    <CheckCircle size={16} />
                    {record.status === 'Pending' ? 'Mark Complete' : 'Mark Pending'}
                  </button>
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all text-sm font-semibold"
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
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{editingRecord ? 'Edit Appraisal' : 'New Appraisal'}</h2>
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
                    value={appraisalForm.employeeId}
                    onChange={(e) => setAppraisalForm({ ...appraisalForm, employeeId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={editingRecord !== null}
                  >
                    <option value="">Select Employee</option>
                    {staff.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.employeeId}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Period *</label>
                    <input
                      type="text"
                      value={appraisalForm.period}
                      onChange={(e) => setAppraisalForm({ ...appraisalForm, period: e.target.value })}
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., Q1 2025, Jan-Mar 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Overall Score (0-5)
                    </label>
                    <input
                      type="number"
                      value={appraisalForm.overallScore}
                      onChange={(e) => setAppraisalForm({ ...appraisalForm, overallScore: e.target.value })}
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., 4.5"
                      step="0.1"
                      min="0"
                      max="5"
                    />
                  </div>
                </div>

                {/* Rating Scale Info */}
                <div className="bg-ink-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-ink-700 mb-2">Rating Scale:</p>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-green-700">4.5-5.0</div>
                      <div className="text-ink-600">Outstanding</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-700">3.5-4.4</div>
                      <div className="text-ink-600">Exceeds</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-yellow-700">2.5-3.4</div>
                      <div className="text-ink-600">Meets</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-700">1.5-2.4</div>
                      <div className="text-ink-600">Needs Imp.</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-700">0-1.4</div>
                      <div className="text-ink-600">Unsatisfactory</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Strengths</label>
                  <textarea
                    value={appraisalForm.strengths}
                    onChange={(e) => setAppraisalForm({ ...appraisalForm, strengths: e.target.value })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                    placeholder="List employee strengths..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Areas for Improvement</label>
                  <textarea
                    value={appraisalForm.improvements}
                    onChange={(e) => setAppraisalForm({ ...appraisalForm, improvements: e.target.value })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                    placeholder="List areas for improvement..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Goals</label>
                  <textarea
                    value={appraisalForm.goals}
                    onChange={(e) => setAppraisalForm({ ...appraisalForm, goals: e.target.value })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                    placeholder="Set goals for next period..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveAppraisal}
                  className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-card active:scale-95"
                >
                  {editingRecord ? 'Update Appraisal' : 'Create Appraisal'}
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

export default AppraisalPage;
