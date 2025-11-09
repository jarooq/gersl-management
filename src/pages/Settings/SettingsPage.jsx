import React, { useState } from 'react';
import {
  Shield, Database, FileText, Users, AlertTriangle,
  CheckCircle, Clock, Award, Lock, Eye, Activity
} from 'lucide-react';
import { useCompliance } from '../../contexts/ComplianceContext';

const SettingsPage = () => {
  const {
    policies,
    incidents,
    backgroundChecks,
    dataProtection,
    trainingRecords,
    getStats
  } = useCompliance();

  const [activeTab, setActiveTab] = useState('safeguarding');
  const stats = getStats();

  const tabs = [
    { id: 'safeguarding', name: 'Safeguarding', icon: Shield },
    { id: 'data-protection', name: 'Data Protection', icon: Database },
    { id: 'incidents', name: 'Incidents', icon: AlertTriangle },
    { id: 'background-checks', name: 'Background Checks', icon: CheckCircle },
    { id: 'training', name: 'Training', icon: Award }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-gray-700 via-slate-700 to-zinc-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">System Settings</h1>
                <p className="text-gray-100 text-sm">Configure system preferences and manage settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={FileText}
          label="Active Policies"
          value={stats.activePolicies}
          total={stats.totalPolicies}
          color="bg-blue-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Incidents"
          value={stats.activeIncidents}
          total={stats.totalIncidents}
          color="bg-orange-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved"
          value={stats.resolvedIncidents}
          total={stats.totalIncidents}
          color="bg-green-500"
        />
        <StatCard
          icon={Clock}
          label="Expiring Checks"
          value={stats.expiringChecks}
          total={stats.totalBackgroundChecks}
          color="bg-yellow-500"
        />
        <StatCard
          icon={Award}
          label="Trainings"
          value={stats.totalTrainings}
          color="bg-purple-500"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-semibold transition whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'safeguarding' && <SafeguardingTab policies={policies} />}
          {activeTab === 'data-protection' && <DataProtectionTab dataProtection={dataProtection} />}
          {activeTab === 'incidents' && <IncidentsTab incidents={incidents} />}
          {activeTab === 'background-checks' && <BackgroundChecksTab checks={backgroundChecks} />}
          {activeTab === 'training' && <TrainingTab records={trainingRecords} />}
        </div>
      </div>
    </div>
  );
};

// Safeguarding Tab
const SafeguardingTab = ({ policies }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Safeguarding Policies</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Add Policy
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {policies.map((policy) => (
          <div key={policy.id} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="text-blue-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">{policy.name}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    {policy.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Category</p>
                <p className="text-sm font-semibold text-gray-900">{policy.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Version</p>
                <p className="text-sm font-semibold text-gray-900">{policy.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Effective Date</p>
                <p className="text-sm font-semibold text-gray-900">{policy.effectiveDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Review Date</p>
                <p className="text-sm font-semibold text-gray-900">{policy.reviewDate}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Acknowledged by {policy.acknowledgedBy.length} of {policy.totalStaff} staff
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm">
                    View Details
                  </button>
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm">
                    Track Acknowledgments
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Data Protection Tab
const DataProtectionTab = ({ dataProtection }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Data Protection & Privacy</h2>

      {/* Consent Records */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lock size={18} className="text-blue-600" />
          Consent Records
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {dataProtection.consentRecords.map((record) => (
            <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">{record.category}</h4>
                <span className="text-xs text-gray-500">Last updated: {record.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{record.totalRecords}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">With Consent</p>
                  <p className="text-2xl font-bold text-green-600">{record.withConsent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{record.pendingConsent}</p>
                </div>
                <div className="ml-auto">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(record.withConsent / record.totalRecords) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {((record.withConsent / record.totalRecords) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Access Requests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Eye size={18} className="text-purple-600" />
          Data Access Requests
        </h3>
        <div className="space-y-2">
          {dataProtection.dataAccessRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{request.requestType}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Requested by: {request.requestedBy}</p>
                  <p className="text-xs text-gray-500">Request Date: {request.requestDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Processed by</p>
                  <p className="font-semibold text-gray-900">{request.processedBy}</p>
                  {request.completedDate && (
                    <p className="text-xs text-gray-500 mt-1">Completed: {request.completedDate}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Protection Audit</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Last Audit</p>
            <p className="text-lg font-bold text-gray-900">{dataProtection.lastAudit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Audit</p>
            <p className="text-lg font-bold text-gray-900">{dataProtection.nextAudit}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Incidents Tab
const IncidentsTab = ({ incidents }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'Under Investigation': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Incident Reports</h2>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
          Report Incident
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {incidents.map((incident) => (
          <div key={incident.id} className="border border-gray-200 rounded-lg p-5 hover:border-orange-300 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="text-orange-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">{incident.incidentType}</h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                    {incident.severity} Severity
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{incident.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Reported By</p>
                <p className="text-sm font-semibold text-gray-900">{incident.reportedBy}</p>
                <p className="text-xs text-gray-500">{incident.reportedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Assigned To</p>
                <p className="text-sm font-semibold text-gray-900">{incident.assignedTo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Follow-Up Date</p>
                <p className="text-sm font-semibold text-gray-900">{incident.followUpDate}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase mb-1">Actions Taken</p>
              <p className="text-sm text-gray-700">{incident.actionsTaken}</p>
            </div>

            {incident.resolvedDate && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle size={16} />
                  Resolved on {incident.resolvedDate}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Background Checks Tab
const BackgroundChecksTab = ({ checks }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Valid': return 'bg-green-100 text-green-800';
      case 'Expiring Soon': return 'bg-yellow-100 text-yellow-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Background Verification</h2>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Add Verification
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {checks.map((check) => (
          <div key={check.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 flex-1">
                <CheckCircle size={20} className={
                  check.status === 'Valid' ? 'text-green-600' :
                  check.status === 'Expiring Soon' ? 'text-yellow-600' :
                  'text-red-600'
                } />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{check.staffName}</h4>
                  <p className="text-sm text-gray-600">{check.position}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Check Type</p>
                  <p className="text-sm font-semibold text-gray-900">{check.checkType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Verification Date</p>
                  <p className="text-sm font-semibold text-gray-900">{check.verificationDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expiry Date</p>
                  <p className="text-sm font-semibold text-gray-900">{check.expiryDate}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(check.status)}`}>
                    {check.status}
                  </span>
                  {check.renewalDue < 30 && check.renewalDue > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">Due in {check.renewalDue} days</p>
                  )}
                  {check.renewalDue < 0 && (
                    <p className="text-xs text-red-600 mt-1">Overdue by {Math.abs(check.renewalDue)} days</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Training Tab
const TrainingTab = ({ records }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Safeguarding Training</h2>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          Schedule Training
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {records.map((record) => (
          <div key={record.id} className="border border-gray-200 rounded-lg p-5 hover:border-purple-300 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="text-purple-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">{record.trainingName}</h3>
                  {record.certificatesIssued && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                      Certificates Issued
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Training Date</p>
                <p className="text-sm font-semibold text-gray-900">{record.trainingDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Facilitator</p>
                <p className="text-sm font-semibold text-gray-900">{record.facilitator}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Attendance</p>
                <p className="text-sm font-semibold text-gray-900">
                  {record.attendees.length} / {record.totalStaff} staff
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Next Training</p>
                <p className="text-sm font-semibold text-gray-900">{record.nextTraining}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase mb-2">Attendees</p>
              <div className="flex flex-wrap gap-2">
                {record.attendees.map((attendee, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {attendee}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, total, color }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center gap-3">
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="text-white" size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">{label}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value}
          {total && <span className="text-sm text-gray-500"> / {total}</span>}
        </p>
      </div>
    </div>
  </div>
);

export default SettingsPage;
