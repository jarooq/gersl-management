import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  X, Calendar, DollarSign, Users, Target, MapPin, Heart,
  CheckCircle, Clock, AlertCircle, Plus, Edit, Trash2, FileText,
  MessageSquare, BarChart3, Users2, Lightbulb, Send
} from 'lucide-react';
import { useProjects } from '../../../contexts/ProjectContext';

const ProjectDetails = ({ project, onClose, onUpdateTask, onAddTask, onDeleteTask, onGenerateReport }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCFMModal, setShowCFMModal] = useState(false);
  const [cfmFormData, setCfmFormData] = useState({
    feedbackType: 'Complaint',
    channel: 'Hotline',
    severity: 'Medium',
    description: '',
    reportedBy: '',
    contactInfo: ''
  });

  const { addCFMFeedback, resolveCFMFeedback } = useProjects();

  if (!project) return null;

  const budgetUsed = ((project.spent / project.budget) * 100).toFixed(1);
  const beneficiaryProgress = ((project.beneficiaries / project.targetBeneficiaries) * 100).toFixed(1);

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'In Progress': return <Clock size={16} className="text-blue-500" />;
      case 'Pending': return <AlertCircle size={16} className="text-gray-400" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // CFM Handlers
  const handleCFMSubmit = (e) => {
    e.preventDefault();
    addCFMFeedback(project.id, cfmFormData);
    setCfmFormData({
      feedbackType: 'Complaint',
      channel: 'Hotline',
      severity: 'Medium',
      description: '',
      reportedBy: '',
      contactInfo: ''
    });
    setShowCFMModal(false);
  };

  const handleResolveCFM = (feedbackId) => {
    const resolution = prompt('Describe the action taken to resolve this feedback:');
    const responsiblePerson = prompt('Who handled this resolution?');

    if (resolution && responsiblePerson) {
      resolveCFMFeedback(project.id, feedbackId, {
        actionTaken: resolution,
        responsiblePerson: responsiblePerson
      });
    }
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case 'Complaint': return 'bg-red-100 text-red-700 border-red-300';
      case 'Suggestion': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Positive': return 'bg-green-100 text-green-700 border-green-300';
      case 'Query': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {project.programmeArea}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {project.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('meal')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                activeTab === 'meal'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 size={16} />
              MEAL Data
              {project.resultsFramework?.length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {project.resultsFramework.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cfm')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                activeTab === 'cfm'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare size={16} />
              CFM
              {project.cfmLog?.length > 0 && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                  {project.cfmLog.filter(f => f.status === 'Open').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'tasks'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tasks
            </button>
          </div>

          {/* Overview Cards */}
          {activeTab === 'overview' && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <OverviewCard
              icon={Target}
              label="Progress"
              value={`${project.progress}%`}
              color="bg-blue-500"
            />
            <OverviewCard
              icon={DollarSign}
              label="Budget Used"
              value={`${budgetUsed}%`}
              color="bg-green-500"
              subtitle={`${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}`}
            />
            <OverviewCard
              icon={Users}
              label="Beneficiaries"
              value={project.beneficiaries}
              color="bg-purple-500"
              subtitle={`Target: ${project.targetBeneficiaries}`}
            />
            <OverviewCard
              icon={Calendar}
              label="Days Remaining"
              value={Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24))}
              color="bg-orange-500"
            />
          </div>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={Heart} label="Donor" value={project.donor} />
                <InfoItem icon={MapPin} label="Location" value={project.location} />
                <InfoItem icon={Calendar} label="Start Date" value={project.startDate} />
                <InfoItem icon={Calendar} label="End Date" value={project.endDate} />
              </div>
              {project.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Budget</span>
                  <span className="font-bold text-gray-900">LKR {project.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Spent</span>
                  <span className="font-bold text-blue-600">LKR {project.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-bold text-green-600">LKR {(project.budget - project.spent).toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${budgetUsed}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">{budgetUsed}% of budget used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </>
          )}

          {/* MEAL Data Tab */}
          {activeTab === 'meal' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Results Framework</CardTitle>
                    <span className="text-sm text-gray-500">
                      {project.resultsFramework?.length || 0} indicators
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.resultsFramework && project.resultsFramework.length > 0 ? (
                    <div className="space-y-4">
                      {project.resultsFramework.map((indicator, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                {indicator.level}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{indicator.indicator}</h4>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Baseline:</span>
                              <span className="font-semibold text-gray-900 ml-1">{indicator.baseline}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Target:</span>
                              <span className="font-semibold text-green-600 ml-1">{indicator.target}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">MoV:</span>
                              <span className="text-gray-700 ml-1 text-xs">{indicator.meansOfVerification}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No indicators defined yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Beneficiary Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.beneficiaryBreakdown ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {project.beneficiaryBreakdown.directMale || 0}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Direct Male</p>
                      </div>
                      <div className="text-center p-4 bg-pink-50 rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">
                          {project.beneficiaryBreakdown.directFemale || 0}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Direct Female</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {project.beneficiaryBreakdown.directChildren || 0}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Children</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {project.beneficiaryBreakdown.directPWD || 0}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">PWD</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {project.beneficiaryBreakdown.indirectTotal || 0}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Indirect</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No beneficiary data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* CFM Tab */}
          {activeTab === 'cfm' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Community Feedback Mechanism</CardTitle>
                    <button
                      onClick={() => setShowCFMModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <Plus size={16} />
                      Log Feedback
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.cfmLog && project.cfmLog.length > 0 ? (
                    <div className="space-y-4">
                      {project.cfmLog.map((feedback) => (
                        <div key={feedback.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getFeedbackTypeColor(feedback.feedbackType)}`}>
                                {feedback.feedbackType}
                              </span>
                              <span className="text-xs text-gray-500">via {feedback.channel}</span>
                              <span className={`text-xs font-semibold ${getSeverityColor(feedback.severity)}`}>
                                {feedback.severity} Severity
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{feedback.date}</span>
                          </div>

                          <p className="text-sm text-gray-700 mb-2">{feedback.description}</p>

                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-gray-500">Reported by: </span>
                              <span className="font-semibold text-gray-700">{feedback.reportedBy}</span>
                              <span className="text-gray-500 ml-3">Contact: </span>
                              <span className="text-gray-700">{feedback.contactInfo}</span>
                            </div>

                            {feedback.status === 'Resolved' ? (
                              <div className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                <span className="text-green-700 font-semibold">✓ Resolved</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleResolveCFM(feedback.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                              >
                                Mark as Resolved
                              </button>
                            )}
                          </div>

                          {feedback.status === 'Resolved' && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600 mb-1">
                                <span className="font-semibold">Action Taken:</span> {feedback.actionTaken}
                              </p>
                              <p className="text-xs text-gray-600">
                                <span className="font-semibold">Resolved By:</span> {feedback.responsiblePerson} on {feedback.dateResolved}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No feedback logged yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tasks ({project.tasks?.length || 0})</CardTitle>
                  <button
                    onClick={() => alert('Add task coming soon!')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {project.tasks && project.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            {getTaskStatusIcon(task.status)}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{task.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">Assigned to: {task.assignedTo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTaskStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">Progress</span>
                            <span className="text-xs font-bold text-gray-900">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Start: {task.startDate}</span>
                          <span>End: {task.endDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No tasks added yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Close
            </button>
            {(project.status === 'Closing' || project.status === 'Completed') && (
              <button
                onClick={() => onGenerateReport(project)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition font-semibold flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                Generate Completion Report
              </button>
            )}
            <button
              onClick={() => alert('Edit project coming soon!')}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Edit Project
            </button>
          </div>
        </div>

        {/* CFM Modal */}
        {showCFMModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-blue-600 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Log Community Feedback</h3>
                  <button
                    onClick={() => setShowCFMModal(false)}
                    className="p-2 hover:bg-blue-700 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCFMSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Feedback Type *</label>
                    <select
                      value={cfmFormData.feedbackType}
                      onChange={(e) => setCfmFormData({...cfmFormData, feedbackType: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Complaint">Complaint</option>
                      <option value="Suggestion">Suggestion</option>
                      <option value="Positive">Positive Feedback</option>
                      <option value="Query">Query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Channel *</label>
                    <select
                      value={cfmFormData.channel}
                      onChange={(e) => setCfmFormData({...cfmFormData, channel: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Hotline">Hotline</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="In-Person">In-Person</option>
                      <option value="Feedback Box">Feedback Box</option>
                      <option value="Online Form">Online Form</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Severity *</label>
                  <select
                    value={cfmFormData.severity}
                    onChange={(e) => setCfmFormData({...cfmFormData, severity: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={cfmFormData.description}
                    onChange={(e) => setCfmFormData({...cfmFormData, description: e.target.value})}
                    required
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the feedback in detail..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Reported By *</label>
                    <input
                      type="text"
                      value={cfmFormData.reportedBy}
                      onChange={(e) => setCfmFormData({...cfmFormData, reportedBy: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Name of person reporting"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Info *</label>
                    <input
                      type="text"
                      value={cfmFormData.contactInfo}
                      onChange={(e) => setCfmFormData({...cfmFormData, contactInfo: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone/Email"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCFMModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Submit Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OverviewCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center gap-3">
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="text-white" size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon size={18} className="text-blue-500 mt-0.5" />
    <div>
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value || 'N/A'}</p>
    </div>
  </div>
);

export default ProjectDetails;
