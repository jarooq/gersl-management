import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import {
  FileText, Users, Clock, AlertCircle, CheckCircle, XCircle,
  TrendingUp, Calendar, Plus, Eye, Edit, Trash2, Download,
  FileSignature, UserX, LogOut, Briefcase, Award, Mail
} from 'lucide-react';

const ContractManagementPage = () => {
  const [activeTab, setActiveTab] = useState('agreements');
  const [loading, setLoading] = useState(false);

  // Data states
  const [agreements, setAgreements] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [terminations, setTerminations] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [staff, setStaff] = useState([]);

  // Modal states
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [showResignationModal, setShowResignationModal] = useState(false);
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [agreementForm, setAgreementForm] = useState({
    staffId: '',
    agreementType: 'Initial',
    contractType: 'Permanent',
    contractDuration: '',
    startDate: '',
    endDate: '',
    probationPeriod: 3,
    salary: '',
    workingHours: 8,
    workingDays: 5,
    annualLeave: 14,
    casualLeave: 7,
    sickLeave: 7,
    noticePeriod: 60,
    notes: ''
  });

  const [renewalForm, setRenewalForm] = useState({
    staffId: '',
    renewalStartDate: '',
    renewalEndDate: '',
    newContractDuration: '',
    newSalary: '',
    salaryIncrease: '',
    performanceHighlights: '',
    notes: ''
  });

  const [terminationForm, setTerminationForm] = useState({
    staffId: '',
    terminationType: 'Voluntary Resignation',
    terminationDate: '',
    noticeDate: '',
    noticePeriod: 60,
    finalWorkingDay: '',
    reason: '',
    reasonCategory: '',
    exitInterview: false,
    exitInterviewDate: '',
    exitInterviewNotes: '',
    leaveEncashment: 0,
    gratuityEligible: false,
    notes: ''
  });

  const [resignationForm, setResignationForm] = useState({
    staffId: '',
    resignationDate: new Date().toISOString().split('T')[0],
    noticeRequirement: 60,
    proposedLastDay: '',
    reason: '',
    reasonCategory: '',
    newEmployer: '',
    newPosition: '',
    handoverPlan: '',
    notes: ''
  });

  const [jobDescForm, setJobDescForm] = useState({
    position: '',
    department: '',
    level: 'Mid-Level',
    responsibilities: '',
    qualifications: ''
  });

  const [generatedJobDesc, setGeneratedJobDesc] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
    loadStaff();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'agreements') {
        const data = await API.HRContract.getAllAgreements();
        setAgreements(data.agreements || []);
      } else if (activeTab === 'renewals') {
        const expiring = await API.HRContract.getExpiringContracts();
        setExpiringContracts(expiring.expiringContracts || []);
      } else if (activeTab === 'terminations') {
        const data = await API.HRContract.getAllTerminations();
        setTerminations(data.terminations || []);
      } else if (activeTab === 'resignations') {
        const data = await API.HRContract.getAllResignations();
        setResignations(data.resignations || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await API.HR.getAll();
      setStaff(response.staff || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  // Generate Employment Agreement with AI
  const handleGenerateAgreement = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedStaff = staff.find(s => s.id === parseInt(agreementForm.staffId));

      const result = await API.HRContract.createAgreement({
        ...agreementForm,
        staffId: parseInt(agreementForm.staffId),
        salary: parseFloat(agreementForm.salary),
        contractDuration: agreementForm.contractDuration ? parseInt(agreementForm.contractDuration) : null,
        // AI will generate the document_content automatically
        generateDocument: true
      });

      alert('Employment agreement generated successfully with AI!');
      setShowAgreementModal(false);
      resetAgreementForm();
      loadData();
    } catch (error) {
      console.error('Error generating agreement:', error);
      alert('Failed to generate agreement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create Contract Renewal with AI Letter
  const handleCreateRenewal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await API.HRContract.createRenewal({
        ...renewalForm,
        staffId: parseInt(renewalForm.staffId),
        newSalary: parseFloat(renewalForm.newSalary),
        salaryIncrease: renewalForm.salaryIncrease ? parseFloat(renewalForm.salaryIncrease) : null,
        newContractDuration: renewalForm.newContractDuration ? parseInt(renewalForm.newContractDuration) : null,
        // AI generates renewal letter automatically
        generateLetter: true
      });

      alert('Contract renewal created successfully with AI-generated letter!');
      setShowRenewalModal(false);
      resetRenewalForm();
      loadData();
    } catch (error) {
      console.error('Error creating renewal:', error);
      alert('Failed to create renewal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create Termination with AI Letter
  const handleCreateTermination = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await API.HRContract.createTermination({
        ...terminationForm,
        staffId: parseInt(terminationForm.staffId),
        noticePeriod: parseInt(terminationForm.noticePeriod),
        leaveEncashment: parseInt(terminationForm.leaveEncashment),
        // AI generates termination letter with final settlement calculation
        generateLetter: true
      });

      alert('Termination created successfully with AI-generated letter and final settlement calculation!');
      setShowTerminationModal(false);
      resetTerminationForm();
      loadData();
    } catch (error) {
      console.error('Error creating termination:', error);
      alert('Failed to create termination: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Resignation
  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await API.HRContract.submitResignation({
        ...resignationForm,
        staffId: parseInt(resignationForm.staffId),
        noticeRequirement: parseInt(resignationForm.noticeRequirement)
      });

      alert('Resignation submitted successfully!');
      setShowResignationModal(false);
      resetResignationForm();
      loadData();
    } catch (error) {
      console.error('Error submitting resignation:', error);
      alert('Failed to submit resignation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept Resignation with AI Acceptance Letter
  const handleAcceptResignation = async (resignationId) => {
    if (!confirm('Are you sure you want to accept this resignation? An AI-generated acceptance letter will be created.')) return;

    setLoading(true);
    try {
      await API.HRContract.acceptResignation(resignationId, {
        acknowledgment: 'Thank you for your service and contributions to the organization.',
        generateAcceptanceLetter: true
      });

      alert('Resignation accepted successfully with AI-generated acceptance letter!');
      loadData();
    } catch (error) {
      console.error('Error accepting resignation:', error);
      alert('Failed to accept resignation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate Job Description with AI
  const handleGenerateJobDesc = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await API.HRContract.generateJobDescription(jobDescForm);
      setGeneratedJobDesc(result.jobDescription);
      alert('Job description generated successfully!');
    } catch (error) {
      console.error('Error generating job description:', error);
      alert('Failed to generate job description: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign Agreement
  const handleSignAgreement = async (agreementId) => {
    if (!confirm('Are you sure you want to sign this agreement?')) return;

    setLoading(true);
    try {
      await API.HRContract.signAgreement(agreementId, {
        signedDate: new Date().toISOString().split('T')[0]
      });

      alert('Agreement signed successfully!');
      loadData();
    } catch (error) {
      console.error('Error signing agreement:', error);
      alert('Failed to sign agreement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form functions
  const resetAgreementForm = () => {
    setAgreementForm({
      staffId: '',
      agreementType: 'Initial',
      contractType: 'Permanent',
      contractDuration: '',
      startDate: '',
      endDate: '',
      probationPeriod: 3,
      salary: '',
      workingHours: 8,
      workingDays: 5,
      annualLeave: 14,
      casualLeave: 7,
      sickLeave: 7,
      noticePeriod: 60,
      notes: ''
    });
  };

  const resetRenewalForm = () => {
    setRenewalForm({
      staffId: '',
      renewalStartDate: '',
      renewalEndDate: '',
      newContractDuration: '',
      newSalary: '',
      salaryIncrease: '',
      performanceHighlights: '',
      notes: ''
    });
  };

  const resetTerminationForm = () => {
    setTerminationForm({
      staffId: '',
      terminationType: 'Voluntary Resignation',
      terminationDate: '',
      noticeDate: '',
      noticePeriod: 60,
      finalWorkingDay: '',
      reason: '',
      reasonCategory: '',
      exitInterview: false,
      exitInterviewDate: '',
      exitInterviewNotes: '',
      leaveEncashment: 0,
      gratuityEligible: false,
      notes: ''
    });
  };

  const resetResignationForm = () => {
    setResignationForm({
      staffId: '',
      resignationDate: new Date().toISOString().split('T')[0],
      noticeRequirement: 60,
      proposedLastDay: '',
      reason: '',
      reasonCategory: '',
      newEmployer: '',
      newPosition: '',
      handoverPlan: '',
      notes: ''
    });
  };

  // Get staff name by ID
  const getStaffName = (staffId) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember ? staffMember.fullName : 'Unknown';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-violet-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FileSignature className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">HR Contract Management</h1>
                <p className="text-purple-100 text-sm">AI-powered employment agreements, renewals & terminations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Active Agreements</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">{agreements.filter(a => a.status === 'Active').length}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently active</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <FileSignature className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-blue-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Expiring Soon</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-yellow-600">{expiringContracts.length}</h3>
                <TrendingUp className="w-3 h-3 text-yellow-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Needs attention</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <AlertCircle className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-yellow-600">Warning</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Pending Terminations</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-red-600">{terminations.filter(t => t.status === 'Pending Approval').length}</h3>
                <TrendingUp className="w-3 h-3 text-red-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <UserX className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-red-600">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Pending Resignations</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-purple-600">{resignations.filter(r => r.status === 'Submitted').length}</h3>
                <TrendingUp className="w-3 h-3 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <LogOut className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-purple-600">Submitted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'agreements', name: 'Employment Agreements', icon: FileSignature },
              { id: 'renewals', name: 'Contract Renewals', icon: TrendingUp },
              { id: 'terminations', name: 'Terminations', icon: UserX },
              { id: 'resignations', name: 'Resignations', icon: LogOut },
              { id: 'job-desc', name: 'Job Description Generator', icon: Briefcase }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Employment Agreements Tab */}
          {activeTab === 'agreements' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Employment Agreements</h2>
                <button
                  onClick={() => setShowAgreementModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Generate Agreement
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="mt-2 text-gray-600">Loading...</p>
                </div>
              ) : agreements.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">No employment agreements found</p>
                  <button
                    onClick={() => setShowAgreementModal(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Agreement
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agreements.map((agreement) => (
                        <tr key={agreement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{getStaffName(agreement.staffId)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agreement.agreementType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agreement.contractType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(agreement.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            LKR {parseFloat(agreement.salary).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${agreement.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                              ${agreement.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                              ${agreement.status === 'Expired' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                              {agreement.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => { setSelectedItem(agreement); setShowViewModal(true); }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            {agreement.status === 'Draft' && (
                              <button
                                onClick={() => handleSignAgreement(agreement.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contract Renewals Tab */}
          {activeTab === 'renewals' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Contract Renewals</h2>
                <button
                  onClick={() => setShowRenewalModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Renewal
                </button>
              </div>

              {/* Expiring Contracts Alert */}
              {expiringContracts.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>{expiringContracts.length} contract(s)</strong> expiring within the next 30 days
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">Contract renewal management coming soon</p>
              </div>
            </div>
          )}

          {/* Terminations Tab */}
          {activeTab === 'terminations' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Terminations</h2>
                <button
                  onClick={() => setShowTerminationModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Termination
                </button>
              </div>

              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <UserX className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">Termination management with final settlement calculation</p>
              </div>
            </div>
          )}

          {/* Resignations Tab */}
          {activeTab === 'resignations' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Resignations</h2>
                <button
                  onClick={() => setShowResignationModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Submit Resignation
                </button>
              </div>

              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <LogOut className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">Resignation management with 2 months notice tracking</p>
              </div>
            </div>
          )}

          {/* Job Description Generator Tab */}
          {activeTab === 'job-desc' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Job Description Generator</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Job Details</h3>

                  <form onSubmit={handleGenerateJobDesc} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position Title *</label>
                      <input
                        type="text"
                        required
                        value={jobDescForm.position}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, position: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Senior Project Manager"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <input
                        type="text"
                        required
                        value={jobDescForm.department}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Programs & Operations"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <select
                        value={jobDescForm.level}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Entry-Level">Entry-Level</option>
                        <option value="Mid-Level">Mid-Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Key Responsibilities (Optional)</label>
                      <textarea
                        value={jobDescForm.responsibilities}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, responsibilities: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter key responsibilities, one per line"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Required Qualifications (Optional)</label>
                      <textarea
                        value={jobDescForm.qualifications}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, qualifications: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter required qualifications, one per line"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Generating...' : 'Generate Job Description'}
                    </button>
                  </form>
                </div>

                {/* Generated Output */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Job Description</h3>

                  {generatedJobDesc ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                        {generatedJobDesc}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedJobDesc);
                          alert('Job description copied to clipboard!');
                        }}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Copy to Clipboard
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-gray-600">Generated job description will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Employment Agreement Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Generate Employment Agreement with AI</h3>
              <button onClick={() => { setShowAgreementModal(false); resetAgreementForm(); }} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleGenerateAgreement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member *</label>
                  <select
                    required
                    value={agreementForm.staffId}
                    onChange={(e) => setAgreementForm({ ...agreementForm, staffId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} - {s.position}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Type</label>
                  <select
                    value={agreementForm.agreementType}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreementType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Initial">Initial</option>
                    <option value="Renewal">Renewal</option>
                    <option value="Amendment">Amendment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                  <select
                    value={agreementForm.contractType}
                    onChange={(e) => setAgreementForm({ ...agreementForm, contractType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>

                {agreementForm.contractType === 'Contract' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Duration (months)</label>
                    <input
                      type="number"
                      value={agreementForm.contractDuration}
                      onChange={(e) => setAgreementForm({ ...agreementForm, contractDuration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={agreementForm.startDate}
                    onChange={(e) => setAgreementForm({ ...agreementForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={agreementForm.salary}
                    onChange={(e) => setAgreementForm({ ...agreementForm, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Probation Period (months)</label>
                  <input
                    type="number"
                    value={agreementForm.probationPeriod}
                    onChange={(e) => setAgreementForm({ ...agreementForm, probationPeriod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours/Day</label>
                  <input
                    type="number"
                    value={agreementForm.workingHours}
                    onChange={(e) => setAgreementForm({ ...agreementForm, workingHours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Sri Lankan Labour Law Compliance</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
                  <div>
                    <span className="font-medium">Annual Leave:</span> {agreementForm.annualLeave} days
                  </div>
                  <div>
                    <span className="font-medium">Casual Leave:</span> {agreementForm.casualLeave} days
                  </div>
                  <div>
                    <span className="font-medium">Sick Leave:</span> {agreementForm.sickLeave} days
                  </div>
                  <div>
                    <span className="font-medium">Notice Period:</span> {agreementForm.noticePeriod} days
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={agreementForm.notes}
                  onChange={(e) => setAgreementForm({ ...agreementForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Any additional notes or special conditions"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowAgreementModal(false); resetAgreementForm(); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Agreement with AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractManagementPage;
