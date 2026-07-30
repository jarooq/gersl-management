import React, { useState, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import API from '../../services/api';
import {
  Briefcase,
  TrendingUp,
  Users,
  CheckCircle,
  Plus,
  Filter,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Download,
  X,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  Building2,
  GraduationCap,
  AlertCircle,
  Target
} from 'lucide-react';

const JobPostingsPage = () => {
  const { jobPostings } = useCampaign();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    description: '',
    requirements: '',
    responsibilities: '',
    location: '',
    employmentType: 'Full-time',
    salaryRange: '',
    experienceRequired: '',
    educationRequired: '',
    skills: '',
    benefits: '',
    applicationDeadline: '',
    postedDate: new Date().toISOString().split('T')[0],
    status: 'Draft',
    numberOfPositions: 1,
    contactEmail: '',
    contactPhone: ''
  });

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Volunteer'];
  const jobStatuses = ['All', 'Active', 'Draft', 'Closed', 'On Hold'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobForm({ ...jobForm, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = {
        ...jobForm,
        numberOfPositions: parseInt(jobForm.numberOfPositions)
      };

      if (editingJob) {
        await API.JobPosting.update(editingJob.id, formData);
      } else {
        await API.JobPosting.create(formData);
      }

      window.location.reload();
    } catch (error) {
      console.error('Error saving job posting:', error);
      alert('Failed to save job posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setJobForm({
      title: '',
      department: '',
      description: '',
      requirements: '',
      responsibilities: '',
      location: '',
      employmentType: 'Full-time',
      salaryRange: '',
      experienceRequired: '',
      educationRequired: '',
      skills: '',
      benefits: '',
      applicationDeadline: '',
      postedDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      numberOfPositions: 1,
      contactEmail: '',
      contactPhone: ''
    });
    setEditingJob(null);
    setShowModal(false);
  };

  const handleNewJob = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '',
      department: job.department || '',
      description: job.description || '',
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || '',
      location: job.location || '',
      employmentType: job.employmentType || 'Full-time',
      salaryRange: job.salaryRange || '',
      experienceRequired: job.experienceRequired || '',
      educationRequired: job.educationRequired || '',
      skills: job.skills || '',
      benefits: job.benefits || '',
      applicationDeadline: job.applicationDeadline || '',
      postedDate: job.postedDate || new Date().toISOString().split('T')[0],
      status: job.status || 'Draft',
      numberOfPositions: job.numberOfPositions || 1,
      contactEmail: job.contactEmail || '',
      contactPhone: job.contactPhone || ''
    });
    setShowModal(true);
  };

  const handleView = (job) => {
    setViewingJob(job);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await API.JobPosting.delete(id);
        window.location.reload();
      } catch (error) {
        console.error('Error deleting job posting:', error);
        alert('Failed to delete job posting');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Active': { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
      'Draft': { label: 'Draft', color: 'text-ink-700', bgColor: 'bg-ink-100', icon: FileText },
      'Closed': { label: 'Closed', color: 'text-red-700', bgColor: 'bg-red-100', icon: X },
      'On Hold': { label: 'On Hold', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock }
    };
    return badges[status] || badges['Draft'];
  };

  const getTypeBadge = (type) => {
    const badges = {
      'Full-time': { color: 'text-blue-700', bgColor: 'bg-blue-100' },
      'Part-time': { color: 'text-purple-700', bgColor: 'bg-purple-100' },
      'Contract': { color: 'text-orange-700', bgColor: 'bg-orange-100' },
      'Temporary': { color: 'text-pink-700', bgColor: 'bg-pink-100' },
      'Internship': { color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
      'Volunteer': { color: 'text-green-700', bgColor: 'bg-green-100' }
    };
    return badges[type] || badges['Full-time'];
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Job Code', 'Title', 'Department', 'Location', 'Type', 'Status', 'Positions', 'Applications', 'Posted Date', 'Deadline'];
    const rows = filteredJobs.map(job => [
      job.id,
      job.jobCode,
      job.title,
      job.department,
      job.location,
      job.employmentType,
      job.status,
      job.numberOfPositions,
      job.applications?.length || 0,
      job.postedDate,
      job.applicationDeadline || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_postings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredJobs = useMemo(() => {
    return jobPostings.filter(job => {
      const matchesSearch =
        (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.jobCode || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
      const matchesType = typeFilter === 'All' || job.employmentType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [jobPostings, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const total = jobPostings.length;
    const active = jobPostings.filter(j => j.status === 'Active').length;
    const draft = jobPostings.filter(j => j.status === 'Draft').length;
    const totalPositions = jobPostings.reduce((sum, j) => sum + (j.numberOfPositions || 0), 0);
    const totalApplications = jobPostings.reduce((sum, j) => sum + (j.applications?.length || 0), 0);

    return { total, active, draft, totalPositions, totalApplications };
  }, [jobPostings]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h2 font-bold leading-tight">Job Postings Management</h1>
              <p className="text-ink-200 text-sm mt-0.5">Manage career opportunities, track applications, and hire talent</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
              <div className="text-center">
                <p className="text-sm text-fuchsia-100">Active Positions</p>
                <p className="text-3xl font-bold">{stats.active}</p>
          </div>
        </div>
      </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Total Postings</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.total}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">{stats.active} active</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Briefcase className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Open Positions</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.totalPositions}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Available roles</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Target className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Applications</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.totalApplications}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Total received</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Users className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Draft Postings</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.draft}</h3>
              </div>
              <p className="text-xs text-ink-500 mt-1">Pending publish</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <FileText className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-semibold text-yellow-600">Monitor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center flex-1 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search job postings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              {jobStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="All">All Types</option>
              {employmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <button
              onClick={handleNewJob}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              New Job Posting
            </button>
          </div>
        </div>
      </div>

      {/* Job Postings Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Job Title</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Department</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Location</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Positions</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-ink-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-ink-300" />
                    <p className="text-lg font-medium">No job postings found</p>
                    <p className="text-sm">Create your first job posting to start hiring</p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const statusBadge = getStatusBadge(job.status);
                  const typeBadge = getTypeBadge(job.employmentType);
                  return (
                    <tr key={job.id} className="hover:bg-fuchsia-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-ink-800">{job.title}</p>
                          <p className="text-sm text-ink-500">{job.jobCode}</p>
                          {job.applications && job.applications.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {job.applications.length} applications
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-ink-800 flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-ink-500" />
                          {job.department}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeBadge.bgColor} ${typeBadge.color}`}>
                          {job.employmentType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-ink-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-ink-500" />
                          {job.location}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-ink-800">{job.numberOfPositions}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusBadge.bgColor} ${statusBadge.color}`}>
                          <statusBadge.icon className="w-3 h-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(job)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {job.status !== 'Closed' && (
                            <button
                              onClick={() => handleEdit(job)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={jobForm.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g., Program Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={jobForm.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g., Operations"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Employment Type *</label>
                  <select
                    name="employmentType"
                    value={jobForm.employmentType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  >
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={jobForm.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g., Colombo, Sri Lanka"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Number of Positions *</label>
                  <input
                    type="number"
                    name="numberOfPositions"
                    value={jobForm.numberOfPositions}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Salary Range</label>
                  <input
                    type="text"
                    name="salaryRange"
                    value={jobForm.salaryRange}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g., $40,000 - $60,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Experience Required</label>
                  <input
                    type="text"
                    name="experienceRequired"
                    value={jobForm.experienceRequired}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g., 3-5 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Education Required</label>
                  <input
                    type="text"
                    name="educationRequired"
                    value={jobForm.educationRequired}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g., Bachelor's Degree"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Posted Date *</label>
                  <input
                    type="date"
                    name="postedDate"
                    value={jobForm.postedDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Application Deadline</label>
                  <input
                    type="date"
                    name="applicationDeadline"
                    value={jobForm.applicationDeadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={jobForm.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="jobs@organization.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={jobForm.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Status *</label>
                  <select
                    name="status"
                    value={jobForm.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={jobForm.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Job description..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Responsibilities</label>
                  <textarea
                    name="responsibilities"
                    value={jobForm.responsibilities}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Key responsibilities (one per line)..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Requirements</label>
                  <textarea
                    name="requirements"
                    value={jobForm.requirements}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Job requirements (one per line)..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Skills</label>
                  <input
                    type="text"
                    name="skills"
                    value={jobForm.skills}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g., Project Management, Communication, Excel"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Benefits</label>
                  <textarea
                    name="benefits"
                    value={jobForm.benefits}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Benefits and perks (one per line)..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold transition-all shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingJob ? 'Update Job Posting' : 'Create Job Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{viewingJob.title}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-fuchsia-50 p-4 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Job Code</p>
                  <p className="text-lg font-bold text-ink-800">{viewingJob.jobCode}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Department</p>
                  <p className="text-lg font-bold text-ink-800">{viewingJob.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-ink-600 mb-1">Employment Type</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadge(viewingJob.employmentType).bgColor} ${getTypeBadge(viewingJob.employmentType).color}`}>
                    {viewingJob.employmentType}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(viewingJob.status).bgColor} ${getStatusBadge(viewingJob.status).color}`}>
                    {viewingJob.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </p>
                  <p className="font-semibold text-ink-800">{viewingJob.location}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-1">Positions</p>
                  <p className="font-semibold text-ink-800">{viewingJob.numberOfPositions}</p>
                </div>
                {viewingJob.salaryRange && (
                  <div className="col-span-2">
                    <p className="text-sm text-ink-600 mb-1 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Salary Range
                    </p>
                    <p className="font-semibold text-ink-800">{viewingJob.salaryRange}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-ink-700 mb-2">Description</h3>
                <p className="text-ink-600 text-sm whitespace-pre-line">{viewingJob.description}</p>
              </div>

              {viewingJob.responsibilities && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-2">Responsibilities</h3>
                  <p className="text-ink-600 text-sm whitespace-pre-line">{viewingJob.responsibilities}</p>
                </div>
              )}

              {viewingJob.requirements && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-2">Requirements</h3>
                  <p className="text-ink-600 text-sm whitespace-pre-line">{viewingJob.requirements}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                {viewingJob.experienceRequired && (
                  <div>
                    <p className="text-sm text-ink-600 mb-1">Experience Required</p>
                    <p className="font-semibold text-ink-800">{viewingJob.experienceRequired}</p>
                  </div>
                )}
                {viewingJob.educationRequired && (
                  <div>
                    <p className="text-sm text-ink-600 mb-1 flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      Education Required
                    </p>
                    <p className="font-semibold text-ink-800">{viewingJob.educationRequired}</p>
                  </div>
                )}
              </div>

              {viewingJob.skills && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-2">Skills</h3>
                  <p className="text-ink-600 text-sm">{viewingJob.skills}</p>
                </div>
              )}

              {viewingJob.benefits && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-2">Benefits</h3>
                  <p className="text-ink-600 text-sm whitespace-pre-line">{viewingJob.benefits}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-ink-600 mb-1">Posted Date</p>
                  <p className="font-semibold text-ink-800">{new Date(viewingJob.postedDate).toLocaleDateString()}</p>
                </div>
                {viewingJob.applicationDeadline && (
                  <div>
                    <p className="text-sm text-ink-600 mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Application Deadline
                    </p>
                    <p className="font-semibold text-ink-800">{new Date(viewingJob.applicationDeadline).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {(viewingJob.contactEmail || viewingJob.contactPhone) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    {viewingJob.contactEmail && (
                      <p className="text-ink-600">Email: <span className="font-medium text-ink-800">{viewingJob.contactEmail}</span></p>
                    )}
                    {viewingJob.contactPhone && (
                      <p className="text-ink-600">Phone: <span className="font-medium text-ink-800">{viewingJob.contactPhone}</span></p>
                    )}
                  </div>
                </div>
              )}

              {viewingJob.applications && viewingJob.applications.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-fuchsia-600" />
                    Applications ({viewingJob.applications.length})
                  </h3>
                  <p className="text-sm text-ink-600">Total applications received for this position</p>
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
