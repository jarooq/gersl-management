import React, { useState, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Search,
  Filter,
  Plus,
  X,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react';

const JobPostingsPage = () => {
  const {
    jobPostings,
    addJobPosting,
    updateJobPosting,
    closeJobPosting
  } = useCampaign();

  // State Management
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    location: '',
    type: 'Full-time',
    salary: '',
    experience: '',
    description: '',
    requirements: '',
    responsibilities: '',
    deadline: '',
    contactEmail: '',
    contactPhone: ''
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const openJobs = jobPostings.filter(j => j.status === 'Open').length;
    const closedJobs = jobPostings.filter(j => j.status === 'Closed').length;
    const totalApplicants = jobPostings.reduce((sum, j) => sum + (j.applicants || 0), 0);

    return {
      totalJobs: jobPostings.length,
      openJobs,
      closedJobs,
      totalApplicants
    };
  }, [jobPostings]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobPostings.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
      const matchesType = typeFilter === 'All' || job.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [jobPostings, searchTerm, statusFilter, typeFilter]);

  // Handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.department || !jobForm.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingJob) {
      updateJobPosting(editingJob.id, jobForm);
    } else {
      addJobPosting(jobForm);
    }

    resetForm();
  };

  const resetForm = () => {
    setJobForm({
      title: '',
      department: '',
      location: '',
      type: 'Full-time',
      salary: '',
      experience: '',
      description: '',
      requirements: '',
      responsibilities: '',
      deadline: '',
      contactEmail: '',
      contactPhone: ''
    });
    setEditingJob(null);
    setShowModal(false);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      salary: job.salary || '',
      experience: job.experience || '',
      description: job.description || '',
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || '',
      deadline: job.deadline || '',
      contactEmail: job.contactEmail || '',
      contactPhone: job.contactPhone || ''
    });
    setShowModal(true);
  };

  const handleView = (job) => {
    setSelectedJob(job);
    setShowViewModal(true);
  };

  const handleClose = (id) => {
    if (confirm('Are you sure you want to close this job posting?')) {
      closeJobPosting(id);
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Department', 'Location', 'Type', 'Posted Date', 'Deadline', 'Applicants', 'Status'];
    const rows = filteredJobs.map(job => [
      job.title,
      job.department,
      job.location,
      job.type,
      job.postedDate,
      job.deadline || 'N/A',
      job.applicants || 0,
      job.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-postings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Open': 'bg-green-100 text-green-800',
      'Closed': 'bg-ink-100 text-gray-800'
    };
    return badges[status] || 'bg-ink-100 text-gray-800';
  };

  const getTypeBadge = (type) => {
    const badges = {
      'Full-time': 'bg-blue-100 text-blue-800',
      'Part-time': 'bg-purple-100 text-purple-800',
      'Contract': 'bg-orange-100 text-orange-800',
      'Internship': 'bg-pink-100 text-pink-800'
    };
    return badges[type] || 'bg-ink-100 text-gray-800';
  };

  return (
    <div className="p-8 bg-ink-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Call for Vacancy</h1>
                <p className="text-blue-100 text-sm">Manage job postings and recruitment</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white/20 backdrop-blur-lg text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 flex items-center gap-2 border border-white/30"
            >
              <Plus size={20} />
              Post Job
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Briefcase className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Total Jobs</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalJobs}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Open Positions</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.openJobs}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Total Applicants</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.totalApplicants}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-gray-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-ink-100 p-3 rounded-xl">
                <XCircle className="text-ink-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Closed Jobs</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.closedJobs}</p>
          </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by title, department, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>

            <button
              onClick={exportToCSV}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

      {/* Job Postings Grid */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-ink-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Briefcase size={24} className="text-indigo-600" />
              Job Postings ({filteredJobs.length})
            </h2>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="bg-ink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={40} className="text-ink-400" />
              </div>
              <h3 className="text-xl font-semibold text-ink-700 mb-2">No Job Postings Yet</h3>
              <p className="text-ink-500 mb-6">Create your first job posting to start recruiting</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Post First Job
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-ink-100 hover:shadow-xl transition-all duration-200 cursor-pointer"
                    onClick={() => handleView(job)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{job.title}</h3>
                        <p className="text-sm text-ink-600 mb-1">{job.department}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(job.status)}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-ink-600">
                        <MapPin size={16} className="text-indigo-600" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-600">
                        <Clock size={16} className="text-purple-600" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(job.type)}`}>
                          {job.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-600">
                        <Calendar size={16} className="text-blue-600" />
                        <span>Posted: {job.postedDate}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2 text-sm text-ink-600">
                          <DollarSign size={16} className="text-green-600" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-ink-100">
                      <div className="flex items-center gap-2 text-sm text-ink-600">
                        <Users size={16} className="text-ink-400" />
                        <span className="font-semibold">{job.applicants || 0} applicants</span>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(job)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {job.status === 'Open' && (
                          <button
                            onClick={() => handleClose(job.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Close Job"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Create/Edit Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingJob ? <Edit size={24} /> : <Plus size={24} />}
                {editingJob ? 'Edit Job Posting' : 'Post New Job'}
              </h2>
              <button
                onClick={resetForm}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Program Manager"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={jobForm.department}
                    onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Operations"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Nairobi, Kenya"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Employment Type</label>
                  <select
                    value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Salary Range</label>
                  <input
                    type="text"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. $50,000 - $70,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Experience Required</label>
                  <input
                    type="text"
                    value={jobForm.experience}
                    onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. 3-5 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Application Deadline</label>
                  <input
                    type="date"
                    value={jobForm.deadline}
                    onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={jobForm.contactEmail}
                    onChange={(e) => setJobForm({ ...jobForm, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="hr@organization.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={jobForm.contactPhone}
                    onChange={(e) => setJobForm({ ...jobForm, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="+254 123 456 789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Job Description</label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="4"
                  placeholder="Provide a detailed description of the role..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Requirements</label>
                <textarea
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="4"
                  placeholder="List the key requirements and qualifications..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Responsibilities</label>
                <textarea
                  value={jobForm.responsibilities}
                  onChange={(e) => setJobForm({ ...jobForm, responsibilities: e.target.value })}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="4"
                  placeholder="Describe the main responsibilities..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border-2 border-ink-200 text-ink-700 rounded-xl font-semibold hover:bg-ink-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {editingJob ? 'Update Job' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Job Modal */}
      {showViewModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Eye size={24} />
                Job Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">{selectedJob.title}</h3>
                    <p className="text-lg text-ink-600">{selectedJob.department}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-ink-700">
                    <MapPin size={18} className="text-indigo-600" />
                    <span className="text-sm">{selectedJob.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-700">
                    <Clock size={18} className="text-purple-600" />
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadge(selectedJob.type)}`}>
                      {selectedJob.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-700">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="text-sm">{selectedJob.postedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-700">
                    <Users size={18} className="text-green-600" />
                    <span className="text-sm font-semibold">{selectedJob.applicants || 0} applicants</span>
                  </div>
                </div>

                {selectedJob.salary && (
                  <div className="mt-4 flex items-center gap-2 text-ink-700">
                    <DollarSign size={18} className="text-green-600" />
                    <span className="text-sm font-semibold">{selectedJob.salary}</span>
                  </div>
                )}
              </div>

              {selectedJob.description && (
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Job Description</h4>
                  <p className="text-ink-600 whitespace-pre-line">{selectedJob.description}</p>
                </div>
              )}

              {selectedJob.requirements && (
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Requirements</h4>
                  <p className="text-ink-600 whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              )}

              {selectedJob.responsibilities && (
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Responsibilities</h4>
                  <p className="text-ink-600 whitespace-pre-line">{selectedJob.responsibilities}</p>
                </div>
              )}

              {(selectedJob.contactEmail || selectedJob.contactPhone) && (
                <div className="bg-ink-50 rounded-xl p-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedJob.contactEmail && (
                      <p className="text-ink-600">
                        <span className="font-semibold">Email:</span> {selectedJob.contactEmail}
                      </p>
                    )}
                    {selectedJob.contactPhone && (
                      <p className="text-ink-600">
                        <span className="font-semibold">Phone:</span> {selectedJob.contactPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedJob.deadline && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 font-semibold">
                    Application Deadline: {selectedJob.deadline}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostingsPage;
