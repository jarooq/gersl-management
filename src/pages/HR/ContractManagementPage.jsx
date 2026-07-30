import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import {
  FileText, Users, Clock, AlertCircle, CheckCircle, XCircle,
  TrendingUp, Calendar, Plus, Eye, Edit, Trash2, Download,
  FileSignature, UserX, LogOut, Briefcase, Award, Mail, X
} from 'lucide-react';

const ContractManagementPage = () => {
  const [activeTab, setActiveTab] = useState('agreements');
  const [loading, setLoading] = useState(false);

  // Data states
  const [agreements, setAgreements] = useState([]);
  const [renewals] = useState([]);
  const [terminations, setTerminations] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [staff, setStaff] = useState([]);

  // Modal states
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [showResignationModal, setShowResignationModal] = useState(false);
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
    basedOnEmployee: false,
    staffId: '',
    position: '',
    department: '',
    level: 'Mid-Level',
    responsibilities: '',
    qualifications: ''
  });

  const [generatedJobDesc, setGeneratedJobDesc] = useState('');

  const loadData = useCallback(async () => {
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
  }, [activeTab]);

  const loadStaff = useCallback(async () => {
    try {
      const response = await API.HR.getAll();
      setStaff(response.staff || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
    loadStaff();
  }, [loadData, loadStaff]);

  // Generate Employment Agreement with AI
  const handleGenerateAgreement = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare agreement data, excluding empty dates
      const agreementData = {
        ...agreementForm,
        staffId: parseInt(agreementForm.staffId),
        salary: parseFloat(agreementForm.salary),
        contractDuration: agreementForm.contractDuration ? parseInt(agreementForm.contractDuration) : null,
        // AI will generate the document_content automatically
        generateDocument: true
      };

      // Only include dates if they have values
      if (agreementForm.startDate) {
        agreementData.startDate = agreementForm.startDate;
      } else {
        delete agreementData.startDate;
      }

      if (agreementForm.endDate) {
        agreementData.endDate = agreementForm.endDate;
      } else {
        delete agreementData.endDate;
      }

      await API.HRContract.createAgreement(agreementData);

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
      await API.HRContract.createRenewal({
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
      await API.HRContract.createTermination({
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
      await API.HRContract.submitResignation({
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

  // Approve Contract Renewal
  const handleApproveRenewal = async (renewalId) => {
    if (!confirm('Are you sure you want to approve this contract renewal?')) return;

    setLoading(true);
    try {
      await API.HRContract.approveRenewal(renewalId, {
        approvalDate: new Date().toISOString(),
        comments: 'Contract renewal approved'
      });

      alert('Contract renewal approved successfully!');
      loadData();
    } catch (error) {
      console.error('Error approving renewal:', error);
      alert('Failed to approve renewal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve Termination
  const handleApproveTermination = async (terminationId) => {
    if (!confirm('Are you sure you want to approve this termination? This will process the final settlement calculation.')) return;

    setLoading(true);
    try {
      await API.HRContract.approveTermination(terminationId, {
        approvalDate: new Date().toISOString(),
        comments: 'Termination approved'
      });

      alert('Termination approved successfully! Final settlement has been calculated.');
      loadData();
    } catch (error) {
      console.error('Error approving termination:', error);
      alert('Failed to approve termination: ' + error.message);
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

  // Handle employee selection for job description
  const handleEmployeeSelectForJobDesc = (staffId) => {
    if (!staffId) {
      // Reset to manual mode
      setJobDescForm({
        basedOnEmployee: false,
        staffId: '',
        position: '',
        department: '',
        level: 'Mid-Level',
        responsibilities: '',
        qualifications: ''
      });
      return;
    }

    const selectedStaff = staff.find(s => s.id === parseInt(staffId));
    if (selectedStaff) {
      setJobDescForm({
        ...jobDescForm,
        basedOnEmployee: true,
        staffId: staffId,
        position: selectedStaff.position || '',
        department: selectedStaff.department || ''
      });
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

  // Download Job Description as PDF
  const handleDownloadJobDescPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Description - ${jobDescForm.position || 'Position'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }
          .org-name {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
          }
          .doc-title {
            font-size: 28px;
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 10px;
            text-align: center;
          }
          .job-info {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 12px;
            color: #6B7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
            color: #1F2937;
            font-weight: 500;
          }
          .content {
            white-space: pre-wrap;
            line-height: 1.8;
            font-size: 14px;
            color: #374151;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            font-size: 12px;
            color: #6B7280;
          }
          .footer-org {
            font-weight: 600;
            color: #4F46E5;
            margin-bottom: 5px;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <img src="/Logo 10.jpeg" alt="Organization Logo" class="logo" onerror="this.style.display='none'">
            <div class="org-name">Global Ehsan Relief<br/>Sri Lanka</div>
          </div>
        </div>

        <h1 class="doc-title">Job Description</h1>

        <div class="job-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Position Title</span>
              <span class="info-value">${jobDescForm.position || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Department</span>
              <span class="info-value">${jobDescForm.department || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Level</span>
              <span class="info-value">${jobDescForm.level || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date Generated</span>
              <span class="info-value">${currentDate}</span>
            </div>
          </div>
        </div>

        <div class="content">${generatedJobDesc}</div>

        <div class="footer">
          <div class="footer-org">Global Ehsan Relief - Sri Lanka</div>
          <div>Human Resources Department</div>
          <div>Generated on ${currentDate}</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Sign Agreement (Approve)
  const handleSignAgreement = async (agreementId) => {
    if (!confirm('Are you sure you want to sign and activate this agreement? This will change the status from Draft to Active.')) return;

    setLoading(true);
    try {
      await API.HRContract.signAgreement(agreementId, {
        signedDate: new Date().toISOString().split('T')[0]
      });

      alert('Agreement signed and activated successfully!');
      loadData();
    } catch (error) {
      console.error('Error signing agreement:', error);
      alert('Failed to sign agreement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Agreement
  const handleDeleteAgreement = async (agreementId) => {
    if (!confirm('Are you sure you want to delete this agreement? This action cannot be undone.')) return;

    setLoading(true);
    try {
      await API.HRContract.deleteAgreement(agreementId);
      alert('Agreement deleted successfully!');
      loadData();
    } catch (error) {
      console.error('Error deleting agreement:', error);
      alert('Failed to delete agreement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Download Agreement as PDF
  const handleDownloadAgreement = async (agreement) => {
    try {
      // Create a printable version of the agreement
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow.document.write(`
        <html>
          <head>
            <title>Employment Agreement - ${agreement.staff?.fullName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
              h2 { color: #4F46E5; margin-top: 30px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .info-item { margin-bottom: 10px; }
              .label { font-weight: bold; color: #666; }
              .value { color: #333; }
              .content { white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <h1>Employment Agreement</h1>
            <p><strong>Agreement Type:</strong> ${agreement.agreementType} - ${agreement.contractType}</p>

            <h2>Staff Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Name:</span>
                <span class="value">${agreement.staff?.fullName || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">Position:</span>
                <span class="value">${agreement.staff?.position || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">Department:</span>
                <span class="value">${agreement.staff?.department || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">Monthly Salary:</span>
                <span class="value">LKR ${agreement.salary?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>

            <h2>Contract Details</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Start Date:</span>
                <span class="value">${agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              ${agreement.endDate ? `
              <div class="info-item">
                <span class="label">End Date:</span>
                <span class="value">${new Date(agreement.endDate).toLocaleDateString()}</span>
              </div>
              ` : ''}
              <div class="info-item">
                <span class="label">Working Hours/Day:</span>
                <span class="value">${agreement.workingHours || 8} hours</span>
              </div>
              <div class="info-item">
                <span class="label">Working Days/Week:</span>
                <span class="value">${agreement.workingDays || 5} days</span>
              </div>
            </div>

            <h2>Leave Entitlements (Sri Lankan Labour Law)</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Annual Leave:</span>
                <span class="value">${agreement.annualLeave || 14} days</span>
              </div>
              <div class="info-item">
                <span class="label">Casual Leave:</span>
                <span class="value">${agreement.casualLeave || 7} days</span>
              </div>
              <div class="info-item">
                <span class="label">Sick Leave:</span>
                <span class="value">${agreement.sickLeave || 7} days</span>
              </div>
              <div class="info-item">
                <span class="label">Notice Period:</span>
                <span class="value">${agreement.noticePeriod || 60} days</span>
              </div>
            </div>

            ${agreement.documentContent ? `
            <h2>Agreement Document</h2>
            <div class="content">${agreement.documentContent}</div>
            ` : ''}

            ${agreement.signedDate ? `
            <div class="footer">
              <p><strong>Signed Date:</strong> ${new Date(agreement.signedDate).toLocaleDateString()}</p>
              ${agreement.signer ? `<p><strong>Signed By:</strong> ${agreement.signer.fullName} (${agreement.signer.role})</p>` : ''}
            </div>
            ` : ''}

            <div class="footer">
              <p style="text-align: center; color: #666;">
                Generated by Global Ehsan Relief - Sri Lanka HRMS<br>
                ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
              </p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (error) {
      console.error('Error downloading agreement:', error);
      alert('Failed to generate PDF: ' + error.message);
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
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
            <FileSignature className="w-5 h-5 text-mission-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Human Resources · Contracts</p>
            <h1 className="text-h2 font-bold leading-tight">HR Contract Management</h1>
            <p className="text-ink-200 text-sm mt-0.5">AI-powered employment agreements, renewals & terminations</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Active Agreements</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{agreements.filter(a => a.status === 'Active').length}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Currently active</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <FileSignature className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-blue-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Expiring Soon</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-yellow-600">{expiringContracts.length}</h3>
                <TrendingUp className="w-3 h-3 text-yellow-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Needs attention</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <AlertCircle className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-semibold text-yellow-600">Warning</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Pending Terminations</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-red-600">{terminations.filter(t => t.status === 'Pending Approval').length}</h3>
                <TrendingUp className="w-3 h-3 text-red-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Awaiting approval</p>
            </div>
            <div className="bg-danger-50 border border-danger-600/20 text-danger-700 p-2.5 rounded-lg shadow-sm transform group- transition-transform duration-200 flex-shrink-0">
              <UserX className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span className="text-xs font-semibold text-red-600">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Pending Resignations</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-purple-600">{resignations.filter(r => r.status === 'Submitted').length}</h3>
                <TrendingUp className="w-3 h-3 text-purple-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Awaiting review</p>
            </div>
            <div className="bg-violet-50 border border-violet-200 text-violet-700 p-2.5 rounded-lg shadow-sm transform group- transition-transform duration-200 flex-shrink-0">
              <LogOut className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <span className="text-xs font-semibold text-purple-600">Submitted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-ink-100 mb-6">
        <div className="border-b border-ink-100">
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
                    : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-200'
                  }
                `}
              >
                <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-ink-400 group-hover:text-ink-500'}`} />
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
                <h2 className="text-xl font-semibold text-ink-900">Employment Agreements</h2>
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
                  <p className="mt-2 text-ink-600">Loading...</p>
                </div>
              ) : agreements.length === 0 ? (
                <div className="text-center py-12 bg-ink-50 rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-ink-400" />
                  <p className="mt-2 text-ink-600">No employment agreements found</p>
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
                  <table className="min-w-full divide-y divide-ink-100">
                    <thead className="bg-ink-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Staff</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Contract</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-ink-100">
                      {agreements.map((agreement) => (
                        <tr key={agreement.id} className="hover:bg-ink-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-ink-900">{getStaffName(agreement.staffId)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">{agreement.agreementType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">{agreement.contractType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                            {new Date(agreement.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-500">
                            {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900 font-medium">
                            LKR {parseFloat(agreement.salary).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${agreement.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                              ${agreement.status === 'Draft' ? 'bg-ink-100 text-ink-800' : ''}
                              ${agreement.status === 'Expired' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                              {agreement.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {/* View Agreement */}
                              <button
                                onClick={() => { setSelectedItem(agreement); setShowViewModal(true); }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="View Agreement"
                              >
                                <Eye className="h-5 w-5" />
                              </button>

                              {/* Download PDF */}
                              <button
                                onClick={() => handleDownloadAgreement(agreement)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Download PDF"
                              >
                                <Download className="h-5 w-5" />
                              </button>

                              {/* Sign/Approve Agreement (Only for Draft) */}
                              {agreement.status === 'Draft' && (
                                <button
                                  onClick={() => handleSignAgreement(agreement.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Sign & Approve Agreement"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                              )}

                              {/* Delete Agreement (Only for Draft) */}
                              {agreement.status === 'Draft' && (
                                <button
                                  onClick={() => handleDeleteAgreement(agreement.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Agreement"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              )}
                            </div>
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
                <h2 className="text-xl font-semibold text-ink-900">Contract Renewals</h2>
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

              {/* Renewals Table */}
              {renewals.length === 0 ? (
                <div className="text-center py-12 bg-ink-50 rounded-lg">
                  <TrendingUp className="mx-auto h-12 w-12 text-ink-400" />
                  <p className="mt-2 text-ink-600">No contract renewals found</p>
                </div>
              ) : (
                <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-ink-100">
                    <thead className="bg-ink-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Staff</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Current End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">New Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">New Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-ink-100">
                      {renewals.map((renewal) => (
                        <tr key={renewal.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-ink-900">{renewal.staff?.fullName || 'N/A'}</div>
                            <div className="text-sm text-ink-500">{renewal.staff?.position || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                            {renewal.currentEndDate ? new Date(renewal.currentEndDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                            {renewal.renewalStartDate && renewal.renewalEndDate
                              ? `${new Date(renewal.renewalStartDate).toLocaleDateString()} - ${new Date(renewal.renewalEndDate).toLocaleDateString()}`
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                            LKR {renewal.newSalary?.toLocaleString() || 'N/A'}
                            {renewal.salaryIncrease && (
                              <span className="ml-2 text-green-600">+{renewal.salaryIncrease}%</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              renewal.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              renewal.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {renewal.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {renewal.status === 'Pending' && (
                              <button
                                onClick={() => handleApproveRenewal(renewal.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve Renewal"
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

          {/* Terminations Tab */}
          {activeTab === 'terminations' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-ink-900">Terminations</h2>
                <button
                  onClick={() => setShowTerminationModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Termination
                </button>
              </div>

              {/* Terminations Table */}
              {terminations.length === 0 ? (
                <div className="text-center py-12 bg-ink-50 rounded-lg">
                  <UserX className="mx-auto h-12 w-12 text-ink-400" />
                  <p className="mt-2 text-ink-600">No terminations found</p>
                </div>
              ) : (
                <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-ink-100">
                    <thead className="bg-ink-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Staff</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Termination Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Final Working Day</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-ink-100">
                      {terminations.map((termination) => (
                        <tr key={termination.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-ink-900">{termination.staff?.fullName || 'N/A'}</div>
                            <div className="text-sm text-ink-500">{termination.staff?.position || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                            {termination.terminationType || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                            {termination.terminationDate ? new Date(termination.terminationDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                            {termination.finalWorkingDay ? new Date(termination.finalWorkingDay).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              termination.status === 'Approved' || termination.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              termination.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {termination.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {termination.status === 'Pending' && (
                              <button
                                onClick={() => handleApproveTermination(termination.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve Termination"
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

          {/* Resignations Tab */}
          {activeTab === 'resignations' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-ink-900">Resignations</h2>
                <button
                  onClick={() => setShowResignationModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Submit Resignation
                </button>
              </div>

              {/* Resignations Table */}
              {resignations.length === 0 ? (
                <div className="text-center py-12 bg-ink-50 rounded-lg">
                  <LogOut className="mx-auto h-12 w-12 text-ink-400" />
                  <p className="mt-2 text-ink-600">No resignations found</p>
                </div>
              ) : (
                <div className="bg-white border border-ink-100 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-ink-100">
                    <thead className="bg-ink-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Staff</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Resignation Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Proposed Last Day</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-ink-100">
                      {resignations.map((resignation) => (
                        <tr key={resignation.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-ink-900">{resignation.staff?.fullName || 'N/A'}</div>
                            <div className="text-sm text-ink-500">{resignation.staff?.position || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                            {resignation.resignationDate ? new Date(resignation.resignationDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-900">
                            {resignation.proposedLastDay ? new Date(resignation.proposedLastDay).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-ink-900">
                            <div className="max-w-xs truncate" title={resignation.reason}>
                              {resignation.reasonCategory || resignation.reason || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              resignation.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                              resignation.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                              resignation.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {resignation.status || 'Submitted'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {(resignation.status === 'Submitted' || resignation.status === 'Reviewed') && (
                              <button
                                onClick={() => handleAcceptResignation(resignation.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Accept Resignation"
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

          {/* Job Description Generator Tab */}
          {activeTab === 'job-desc' && (
            <div>
              <h2 className="text-xl font-semibold text-ink-900 mb-4">AI Job Description Generator</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="bg-white border border-ink-100 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-ink-900 mb-4">Job Details</h3>

                  <form onSubmit={handleGenerateJobDesc} className="space-y-4">
                    {/* Employee Selector (Optional) */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                      <label className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={jobDescForm.basedOnEmployee}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            if (!isChecked) {
                              handleEmployeeSelectForJobDesc('');
                            }
                            setJobDescForm({ ...jobDescForm, basedOnEmployee: isChecked });
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-orange-500 border-ink-200 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-indigo-900">
                          Base on existing employee position
                        </span>
                      </label>

                      {jobDescForm.basedOnEmployee && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-ink-700 mb-1">Select Employee</label>
                          <select
                            value={jobDescForm.staffId}
                            onChange={(e) => handleEmployeeSelectForJobDesc(e.target.value)}
                            className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select an employee</option>
                            {staff.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.fullName} - {s.position} ({s.department})
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-indigo-600 mt-2">
                            Position and department will be auto-filled from the selected employee
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">Position Title *</label>
                      <input
                        type="text"
                        required
                        value={jobDescForm.position}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, position: e.target.value })}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., Senior Project Manager"
                        disabled={jobDescForm.basedOnEmployee && !jobDescForm.staffId}
                      />
                      {jobDescForm.basedOnEmployee && jobDescForm.staffId && (
                        <p className="text-xs text-ink-500 mt-1">Auto-filled from employee data</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">Department *</label>
                      <input
                        type="text"
                        required
                        value={jobDescForm.department}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, department: e.target.value })}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., Programs & Operations"
                        disabled={jobDescForm.basedOnEmployee && !jobDescForm.staffId}
                      />
                      {jobDescForm.basedOnEmployee && jobDescForm.staffId && (
                        <p className="text-xs text-ink-500 mt-1">Auto-filled from employee data</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">Level</label>
                      <select
                        value={jobDescForm.level}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, level: e.target.value })}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Entry-Level">Entry-Level</option>
                        <option value="Mid-Level">Mid-Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">Key Responsibilities (Optional)</label>
                      <textarea
                        value={jobDescForm.responsibilities}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, responsibilities: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter key responsibilities, one per line"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">Required Qualifications (Optional)</label>
                      <textarea
                        value={jobDescForm.qualifications}
                        onChange={(e) => setJobDescForm({ ...jobDescForm, qualifications: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                <div className="bg-white border border-ink-100 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-ink-900 mb-4">Generated Job Description</h3>

                  {generatedJobDesc ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-ink-50 p-4 rounded-lg whitespace-pre-wrap">
                        {generatedJobDesc}
                      </div>
                      <div className="mt-4 flex gap-3 flex-wrap">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedJobDesc);
                            alert('Job description copied to clipboard!');
                          }}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Download className="h-5 w-5 mr-2" />
                          Copy to Clipboard
                        </button>
                        <button
                          onClick={handleDownloadJobDescPDF}
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          <FileText className="h-5 w-5 mr-2" />
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-ink-50 rounded-lg">
                      <Briefcase className="mx-auto h-12 w-12 text-ink-400" />
                      <p className="mt-2 text-ink-600">Generated job description will appear here</p>
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
        <div className="fixed inset-0 bg-ink-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-card rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-ink-900">Generate Employment Agreement with AI</h3>
              <button onClick={() => { setShowAgreementModal(false); resetAgreementForm(); }} className="text-ink-400 hover:text-ink-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleGenerateAgreement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Staff Member *</label>
                  <select
                    required
                    value={agreementForm.staffId}
                    onChange={(e) => setAgreementForm({ ...agreementForm, staffId: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} - {s.position}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Agreement Type</label>
                  <select
                    value={agreementForm.agreementType}
                    onChange={(e) => setAgreementForm({ ...agreementForm, agreementType: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Initial">Initial</option>
                    <option value="Renewal">Renewal</option>
                    <option value="Amendment">Amendment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Contract Type</label>
                  <select
                    value={agreementForm.contractType}
                    onChange={(e) => setAgreementForm({ ...agreementForm, contractType: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>

                {agreementForm.contractType === 'Contract' && (
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Contract Duration (months)</label>
                    <input
                      type="number"
                      value={agreementForm.contractDuration}
                      onChange={(e) => setAgreementForm({ ...agreementForm, contractDuration: e.target.value })}
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={agreementForm.startDate}
                    onChange={(e) => setAgreementForm({ ...agreementForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Monthly Salary (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={agreementForm.salary}
                    onChange={(e) => setAgreementForm({ ...agreementForm, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Probation Period (months)</label>
                  <input
                    type="number"
                    value={agreementForm.probationPeriod}
                    onChange={(e) => setAgreementForm({ ...agreementForm, probationPeriod: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Working Hours/Day</label>
                  <input
                    type="number"
                    value={agreementForm.workingHours}
                    onChange={(e) => setAgreementForm({ ...agreementForm, workingHours: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                <label className="block text-sm font-medium text-ink-700 mb-1">Notes</label>
                <textarea
                  value={agreementForm.notes}
                  onChange={(e) => setAgreementForm({ ...agreementForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Any additional notes or special conditions"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowAgreementModal(false); resetAgreementForm(); }}
                  className="px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300"
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

      {/* View Agreement Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-h1 text-ink-900">Employment Agreement</h2>
                <p className="text-sm text-ink-600 mt-1">
                  {selectedItem.agreementType} - {selectedItem.contractType}
                </p>
              </div>
              <button
                onClick={() => { setShowViewModal(false); setSelectedItem(null); }}
                className="text-ink-400 hover:text-ink-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Agreement Details */}
              <div className="bg-ink-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-ink-900 mb-4">Agreement Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-ink-600">Staff Member</p>
                    <p className="font-medium text-ink-900">
                      {selectedItem.staff?.fullName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Position</p>
                    <p className="font-medium text-ink-900">
                      {selectedItem.staff?.position || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Department</p>
                    <p className="font-medium text-ink-900">
                      {selectedItem.staff?.department || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedItem.status === 'Active' ? 'bg-green-100 text-green-800' :
                      selectedItem.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-ink-100 text-ink-800'
                    }`}>
                      {selectedItem.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Contract Type</p>
                    <p className="font-medium text-ink-900">{selectedItem.contractType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Start Date</p>
                    <p className="font-medium text-ink-900">
                      {selectedItem.startDate ? new Date(selectedItem.startDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {selectedItem.endDate && (
                    <div>
                      <p className="text-sm text-ink-600">End Date</p>
                      <p className="font-medium text-ink-900">
                        {new Date(selectedItem.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-ink-600">Monthly Salary</p>
                    <p className="font-medium text-ink-900">
                      LKR {selectedItem.salary?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  {selectedItem.probationPeriod && (
                    <div>
                      <p className="text-sm text-ink-600">Probation Period</p>
                      <p className="font-medium text-ink-900">{selectedItem.probationPeriod} months</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-ink-600">Working Hours/Day</p>
                    <p className="font-medium text-ink-900">{selectedItem.workingHours || 8} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Working Days/Week</p>
                    <p className="font-medium text-ink-900">{selectedItem.workingDays || 5} days</p>
                  </div>
                </div>
              </div>

              {/* Leave Entitlements */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Leave Entitlements (Sri Lankan Labour Law)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Annual Leave</p>
                    <p className="text-xl font-bold text-blue-900">{selectedItem.annualLeave || 14} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Casual Leave</p>
                    <p className="text-xl font-bold text-blue-900">{selectedItem.casualLeave || 7} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Sick Leave</p>
                    <p className="text-xl font-bold text-blue-900">{selectedItem.sickLeave || 7} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Notice Period</p>
                    <p className="text-xl font-bold text-blue-900">{selectedItem.noticePeriod || 60} days</p>
                  </div>
                </div>
              </div>

              {/* AI Generated Document Content */}
              {selectedItem.documentContent && (
                <div className="border border-ink-100 rounded-lg p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-ink-900">Agreement Document</h3>
                    <span className="text-xs text-ink-500 bg-ink-100 px-2 py-1 rounded">
                      AI Generated
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-ink-700 whitespace-pre-wrap">
                    {selectedItem.documentContent}
                  </div>
                </div>
              )}

              {/* Signing Information */}
              {selectedItem.signedDate && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Signing Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-700">Signed Date</p>
                      <p className="font-medium text-green-900">
                        {new Date(selectedItem.signedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedItem.signer && (
                      <div>
                        <p className="text-sm text-green-700">Signed By</p>
                        <p className="font-medium text-green-900">
                          {selectedItem.signer.fullName} ({selectedItem.signer.role})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => { setShowViewModal(false); setSelectedItem(null); }}
                className="px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Print Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contract Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 bg-ink-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-card rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-ink-900">Create Contract Renewal</h3>
              <button onClick={() => { setShowRenewalModal(false); resetRenewalForm(); }} className="text-ink-400 hover:text-ink-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateRenewal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Staff Member *</label>
                  <select
                    required
                    value={renewalForm.staffId}
                    onChange={(e) => setRenewalForm({ ...renewalForm, staffId: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} - {s.position}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Renewal Start Date *</label>
                  <input
                    type="date"
                    required
                    value={renewalForm.renewalStartDate}
                    onChange={(e) => setRenewalForm({ ...renewalForm, renewalStartDate: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Renewal End Date</label>
                  <input
                    type="date"
                    value={renewalForm.renewalEndDate}
                    onChange={(e) => setRenewalForm({ ...renewalForm, renewalEndDate: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">New Contract Duration (months)</label>
                  <input
                    type="number"
                    value={renewalForm.newContractDuration}
                    onChange={(e) => setRenewalForm({ ...renewalForm, newContractDuration: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">New Salary (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={renewalForm.newSalary}
                    onChange={(e) => setRenewalForm({ ...renewalForm, newSalary: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Salary Increase (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={renewalForm.salaryIncrease}
                    onChange={(e) => setRenewalForm({ ...renewalForm, salaryIncrease: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Performance Highlights</label>
                <textarea
                  value={renewalForm.performanceHighlights}
                  onChange={(e) => setRenewalForm({ ...renewalForm, performanceHighlights: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Key achievements and performance highlights"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Notes</label>
                <textarea
                  value={renewalForm.notes}
                  onChange={(e) => setRenewalForm({ ...renewalForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Any additional notes"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowRenewalModal(false); resetRenewalForm(); }}
                  className="px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Renewal with AI Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Termination Modal */}
      {showTerminationModal && (
        <div className="fixed inset-0 bg-ink-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-card rounded-lg bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
              <h3 className="text-xl font-semibold text-ink-900">Create Termination</h3>
              <button onClick={() => { setShowTerminationModal(false); resetTerminationForm(); }} className="text-ink-400 hover:text-ink-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTermination} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Staff Member *</label>
                  <select
                    required
                    value={terminationForm.staffId}
                    onChange={(e) => setTerminationForm({ ...terminationForm, staffId: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} - {s.position}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Termination Type *</label>
                  <select
                    required
                    value={terminationForm.terminationType}
                    onChange={(e) => setTerminationForm({ ...terminationForm, terminationType: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Voluntary Resignation">Voluntary Resignation</option>
                    <option value="Termination with Cause">Termination with Cause</option>
                    <option value="Termination without Cause">Termination without Cause</option>
                    <option value="End of Contract">End of Contract</option>
                    <option value="Retirement">Retirement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Termination Date *</label>
                  <input
                    type="date"
                    required
                    value={terminationForm.terminationDate}
                    onChange={(e) => setTerminationForm({ ...terminationForm, terminationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Notice Date</label>
                  <input
                    type="date"
                    value={terminationForm.noticeDate}
                    onChange={(e) => setTerminationForm({ ...terminationForm, noticeDate: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Notice Period (days) *</label>
                  <input
                    type="number"
                    required
                    value={terminationForm.noticePeriod}
                    onChange={(e) => setTerminationForm({ ...terminationForm, noticePeriod: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Final Working Day *</label>
                  <input
                    type="date"
                    required
                    value={terminationForm.finalWorkingDay}
                    onChange={(e) => setTerminationForm({ ...terminationForm, finalWorkingDay: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Reason Category</label>
                  <select
                    value={terminationForm.reasonCategory}
                    onChange={(e) => setTerminationForm({ ...terminationForm, reasonCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Performance">Performance</option>
                    <option value="Misconduct">Misconduct</option>
                    <option value="Redundancy">Redundancy</option>
                    <option value="Personal">Personal</option>
                    <option value="Contract End">Contract End</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Leave Encashment (days)</label>
                  <input
                    type="number"
                    value={terminationForm.leaveEncashment}
                    onChange={(e) => setTerminationForm({ ...terminationForm, leaveEncashment: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Reason for Termination *</label>
                <textarea
                  required
                  value={terminationForm.reason}
                  onChange={(e) => setTerminationForm({ ...terminationForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Provide detailed reason for termination"
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={terminationForm.exitInterview}
                    onChange={(e) => setTerminationForm({ ...terminationForm, exitInterview: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-ink-200 rounded"
                  />
                  <span className="ml-2 text-sm text-ink-700">Exit Interview Required</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={terminationForm.gratuityEligible}
                    onChange={(e) => setTerminationForm({ ...terminationForm, gratuityEligible: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-ink-200 rounded"
                  />
                  <span className="ml-2 text-sm text-ink-700">Gratuity Eligible</span>
                </label>
              </div>

              {terminationForm.exitInterview && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-ink-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Exit Interview Date</label>
                    <input
                      type="date"
                      value={terminationForm.exitInterviewDate}
                      onChange={(e) => setTerminationForm({ ...terminationForm, exitInterviewDate: e.target.value })}
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-ink-700 mb-1">Exit Interview Notes</label>
                    <textarea
                      value={terminationForm.exitInterviewNotes}
                      onChange={(e) => setTerminationForm({ ...terminationForm, exitInterviewNotes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Exit interview notes and feedback"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Additional Notes</label>
                <textarea
                  value={terminationForm.notes}
                  onChange={(e) => setTerminationForm({ ...terminationForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Any additional notes"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => { setShowTerminationModal(false); resetTerminationForm(); }}
                  className="px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Termination with AI Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Resignation Modal */}
      {showResignationModal && (
        <div className="fixed inset-0 bg-ink-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-card rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-ink-900">Submit Resignation</h3>
              <button onClick={() => { setShowResignationModal(false); resetResignationForm(); }} className="text-ink-400 hover:text-ink-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitResignation} className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-900">
                  <strong>Notice Period:</strong> As per Sri Lankan Labour Law and company policy, the standard notice period is 60 days (2 months).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Staff Member *</label>
                  <select
                    required
                    value={resignationForm.staffId}
                    onChange={(e) => setResignationForm({ ...resignationForm, staffId: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} - {s.position}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Resignation Date *</label>
                  <input
                    type="date"
                    required
                    value={resignationForm.resignationDate}
                    onChange={(e) => setResignationForm({ ...resignationForm, resignationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Notice Period (days) *</label>
                  <input
                    type="number"
                    required
                    value={resignationForm.noticeRequirement}
                    onChange={(e) => setResignationForm({ ...resignationForm, noticeRequirement: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Proposed Last Day *</label>
                  <input
                    type="date"
                    required
                    value={resignationForm.proposedLastDay}
                    onChange={(e) => setResignationForm({ ...resignationForm, proposedLastDay: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Reason Category</label>
                  <select
                    value={resignationForm.reasonCategory}
                    onChange={(e) => setResignationForm({ ...resignationForm, reasonCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Better Opportunity">Better Opportunity</option>
                    <option value="Personal Reasons">Personal Reasons</option>
                    <option value="Relocation">Relocation</option>
                    <option value="Health">Health</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">New Employer (Optional)</label>
                  <input
                    type="text"
                    value={resignationForm.newEmployer}
                    onChange={(e) => setResignationForm({ ...resignationForm, newEmployer: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">New Position (Optional)</label>
                  <input
                    type="text"
                    value={resignationForm.newPosition}
                    onChange={(e) => setResignationForm({ ...resignationForm, newPosition: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Job title"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Reason for Resignation *</label>
                <textarea
                  required
                  value={resignationForm.reason}
                  onChange={(e) => setResignationForm({ ...resignationForm, reason: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Provide detailed reason for resignation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Handover Plan</label>
                <textarea
                  value={resignationForm.handoverPlan}
                  onChange={(e) => setResignationForm({ ...resignationForm, handoverPlan: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe the handover plan for current responsibilities"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Additional Notes</label>
                <textarea
                  value={resignationForm.notes}
                  onChange={(e) => setResignationForm({ ...resignationForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Any additional notes"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowResignationModal(false); resetResignationForm(); }}
                  className="px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Resignation'}
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
