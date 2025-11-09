import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, Plus, Activity, Target, Clock, LogOut, Baby, MapPin, CreditCard, Receipt, Package, FileSpreadsheet, Download, Bell, CheckCircle, AlertCircle, UserCheck, UserPlus, Map, MessageSquare, Calendar, Image, TrendingUp, Eye, Send, BarChart, PieChart, CheckCircle2, ListChecks, Upload, FileText, ChevronRight, Filter, Search, Edit, Trash2, X, Settings, Briefcase, Building2, HeartHandshake } from 'lucide-react';

// Simple PDF generation using jsPDF
const generatePDF = (title, content) => {
  const lines = [];
  lines.push(`${title}\n`);
  lines.push(`Generated: ${new Date().toLocaleString()}\n\n`);
  
  if (typeof content === 'string') {
    lines.push(content);
  } else {
    Object.entries(content).forEach(([key, value]) => {
      lines.push(`${key}: ${value}\n`);
    });
  }
  
  const blob = new Blob(lines, { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const CharityManagementSystem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState("en");
  const [showOrphanForm, setShowOrphanForm] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showAIProposalWriter, setShowAIProposalWriter] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    donor: '',
    amount: '',
    category: '',
    description: '',
    startDate: '',
    endDate: '',
    targetBeneficiaries: ''
  });
  const [aiProposal, setAiProposal] = useState({
    projectName: '',
    location: '',
    organization: 'GERSL',
    executiveSummary: '',
    problemStatement: '',
    goal: '',
    objectives: ['', '', ''],
    targetGroup: '',
    selectionCriteria: '',
    geographicFocus: '',
    activities: [
      { activity: '', output: '', start: '', end: '', lead: '' }
    ],
    implementationMethod: '',
    partnerships: '',
    safeguarding: '',
    accountability: '',
    indicators: ['', '', ''],
    dataSources: '',
    reportingFrequency: 'Monthly',
    budgetItems: [
      { item: '', quantity: '', unitCost: '', subtotal: 0 }
    ],
    adminPercentage: 10,
    risks: [
      { risk: '', mitigation: '' }
    ],
    sustainability: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState({
    executiveSummary: [],
    problemStatement: [],
    objectives: [],
    activities: [],
    indicators: []
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    programmeArea: '',
    budget: '',
    donor: '',
    targetBeneficiaries: '',
    startDate: '',
    endDate: '',
    description: '',
    location: ''
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedOrphan, setSelectedOrphan] = useState(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showProjectChat, setShowProjectChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [projectChatMessage, setProjectChatMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "warning", message: "3 orphans need monthly visits", time: "2 hours ago", read: false },
    { id: 2, type: "success", message: "Q4 budget approved by CEO", time: "5 hours ago", read: false },
    { id: 3, type: "info", message: "New donor inquiry received", time: "1 day ago", read: true },
    { id: 4, type: "warning", message: "2 POs pending your approval", time: "1 day ago", read: false },
    { id: 5, type: "success", message: "Water project milestone completed", time: "2 days ago", read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showBudgetForecast, setShowBudgetForecast] = useState(false);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showDonorPortal, setShowDonorPortal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsRecipient, setSmsRecipient] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [showDonorCommunication, setShowDonorCommunication] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showDonorForm, setShowDonorForm] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showProposalDetails, setShowProposalDetails] = useState(null);
  const [showSendReportModal, setShowSendReportModal] = useState(false);
  const [selectedDonorForReport, setSelectedDonorForReport] = useState(null);
  const [reportPreferences, setReportPreferences] = useState({
    reportType: '',
    includePhotos: true,
    includeFinancials: true,
    includeImpact: true,
    format: 'PDF'
  });

  // HR Module State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showFieldMovementModal, setShowFieldMovementModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);

  const [checkInData, setCheckInData] = useState({
    staffName: '',
    location: '',
    notes: ''
  });

  const [checkOutData, setCheckOutData] = useState({
    staffName: '',
    breakDuration: '0.5'
  });

  const [fieldMovementData, setFieldMovementData] = useState({
    staffName: '',
    purpose: '',
    destination: '',
    expectedReturn: '',
    notes: ''
  });

  const [kpiFormData, setKpiFormData] = useState({
    staffName: '',
    month: '',
    tasksAssigned: '',
    tasksCompleted: '',
    projectsHandled: '',
    onTimeDelivery: '',
    qualityScore: '',
    rating: '',
    comments: ''
  });

  const [appraisalData, setAppraisalData] = useState({
    staffName: '',
    period: '',
    overallRating: '',
    strengths: '',
    improvements: '',
    goals: '',
    reviewerComments: ''
  });

  const [newStaffData, setNewStaffData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    joinDate: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    username: '',
    password: ''
  });

  const [leaveRequestData, setLeaveRequestData] = useState({
    staffName: currentUser?.name || '',
    leaveType: '',
    startDate: '',
    endDate: '',
    days: '',
    reason: '',
    lineManager: ''
  });
  const [newPartner, setNewPartner] = useState({
    name: '',
    country: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    partnershipType: ''
  });
  const [newDonor, setNewDonor] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    donorType: '',
    interests: ''
  });

  const users = [
    { id: 1, username: "admin", password: "admin123", name: "Admin User", role: "Administrator", avatar: "👑" },
    { id: 2, username: "ceo", password: "ceo123", name: "CEO", role: "CEO", avatar: "👔" },
    { id: 3, username: "pm", password: "pm123", name: "Programme Manager", role: "Programme Manager", avatar: "🎯" },
    { id: 4, username: "finance", password: "fin123", name: "Michael Chen", role: "Finance Manager", avatar: "📊" },
    { id: 5, username: "meal", password: "meal123", name: "MEAL Officer", role: "MEAL", avatar: "📈" },
    { id: 6, username: "coord", password: "coord123", name: "Field Coordinator", role: "Coordinator", avatar: "👤" },
    { id: 7, username: "donor", password: "donor123", name: "John Donor", role: "Donor", avatar: "💝" },
    { id: 8, username: "hr", password: "hr123", name: "HR Manager", role: "HR Manager", avatar: "👥" },
    { id: 9, username: "fundraising", password: "fund123", name: "Emma Thompson", role: "Fundraising Officer", avatar: "💰" },
    { id: 10, username: "orphan", password: "orphan123", name: "Sarah Care", role: "Orphan Manager", avatar: "👶" }
  ];

  const [proposals, setProposals] = useState([
    { id: 1, title: "New Orphan Care Expansion", donor: "Global Hope Foundation", amount: 150000, status: "Pending CEO Approval", submittedBy: "Sarah Johnson", submittedDate: "2025-10-01", category: "Orphan Care", targetBeneficiaries: 150, startDate: "2025-11-01", endDate: "2026-10-31" },
    { id: 2, title: "Community Water Project - Jaffna", donor: "Water Aid International", amount: 95000, status: "Approved", submittedBy: "Michael Chen", submittedDate: "2025-09-15", category: "WASH", approvedBy: "CEO", approvalDate: "2025-09-20", targetBeneficiaries: 500, startDate: "2025-10-01", endDate: "2026-03-31" },
    { id: 3, title: "Rural Education Support Program", donor: "Children First International", amount: 75000, status: "Sent to Donor - Awaiting Response", submittedBy: "Programme Manager", submittedDate: "2025-09-25", category: "Education", approvedBy: "CEO", approvalDate: "2025-09-28", sentToDonorDate: "2025-09-29", targetBeneficiaries: 200, startDate: "2025-11-15", endDate: "2026-11-14" }
  ]);

  const [partners, setPartners] = useState([
    { id: 1, name: "Global Hope Foundation", country: "USA", totalContributed: 285000, activeProjects: 3, lastDonation: "2025-09-20" },
    { id: 2, name: "Children First International", country: "UK", totalContributed: 195000, activeProjects: 2, lastDonation: "2025-08-15" },
    { id: 3, name: "Water Aid International", country: "Netherlands", totalContributed: 180000, activeProjects: 2, lastDonation: "2025-10-01" }
  ]);

  const [donors, setDonors] = useState([
    { id: 1, name: "John Anderson", email: "john@email.com", phone: "+1-555-0100", totalDonated: 15000, lastDonation: "2025-09-15", status: "Active", projects: 2 },
    { id: 2, name: "Sarah Williams", email: "sarah@email.com", phone: "+1-555-0101", totalDonated: 8500, lastDonation: "2025-10-01", status: "Active", projects: 1 }
  ]);

  const [projects, setProjects] = useState([
    { 
      id: 1, 
      name: "Rural Water Access Initiative", 
      programmeArea: "WASH", 
      budget: 85000, 
      spent: 42000, 
      status: "Implementation",
      stage: "Implementation",
      progress: 49, 
      beneficiaries: 3500, 
      targetBeneficiaries: 7000, 
      nextDeadline: "2025-10-25", 
      nextTask: "Well Drilling - Village 2",
      donor: "Water Aid International",
      startDate: "2025-01-15",
      endDate: "2026-06-30",
      tasks: [
        { id: 1, title: "Site Survey", status: "Completed", progress: 100, startDate: "2025-01-15", endDate: "2025-02-28", assignedTo: "Field Team A" },
        { id: 2, title: "Procurement", status: "In Progress", progress: 60, startDate: "2025-03-01", endDate: "2025-04-15", assignedTo: "Procurement Officer" },
        { id: 3, title: "Well Drilling - Village 1", status: "Completed", progress: 100, startDate: "2025-04-16", endDate: "2025-06-30", assignedTo: "Contractor Team" },
        { id: 4, title: "Well Drilling - Village 2", status: "In Progress", progress: 30, startDate: "2025-07-01", endDate: "2025-09-15", assignedTo: "Contractor Team" },
        { id: 5, title: "MEAL Verification", status: "Pending", progress: 0, startDate: "2025-09-16", endDate: "2025-10-31", assignedTo: "MEAL Team" }
      ]
    },
    { 
      id: 2, 
      name: "Orphan Care Program 2025", 
      programmeArea: "Orphan Care", 
      budget: 120000, 
      spent: 60000, 
      status: "Implementation",
      stage: "Implementation",
      progress: 50, 
      beneficiaries: 150, 
      targetBeneficiaries: 200, 
      nextDeadline: "2025-10-31", 
      nextTask: "Monthly Stipend Distribution",
      donor: "Global Hope Foundation",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      tasks: [
        { id: 1, title: "Orphan Registration", status: "Completed", progress: 100, startDate: "2025-01-01", endDate: "2025-03-31", assignedTo: "Project Officer" },
        { id: 2, title: "Coordinator Assignment", status: "Completed", progress: 100, startDate: "2025-04-01", endDate: "2025-04-30", assignedTo: "Programme Manager" },
        { id: 3, title: "Monthly Stipend Distribution", status: "In Progress", progress: 75, startDate: "2025-05-01", endDate: "2025-12-31", assignedTo: "Finance Team" }
      ]
    }
  ]);

  const [orphans, setOrphans] = useState([
    { 
      id: 1, 
      fullName: "Ahmed Hassan Ibrahim", 
      district: "Colombo", 
      age: 10, 
      dateOfBirth: "2015-05-15",
      latitude: 6.9271, 
      longitude: 79.8612, 
      status: "Active", 
      coordinator: "Ali Coordinator", 
      stipendAmount: 5000, 
      schoolName: "Royal Primary School", 
      currentGrade: "Grade 5",
      guardianName: "Fatima Hassan",
      guardianNIC: "856234567V",
      address: "123 Main St, Colombo",
      contactNumber: "+94-77-1234567",
      gnDivision: "Colombo Central",
      dsDivision: "Colombo",
      masjidArea: "Central Mosque",
      policeArea: "Colombo Fort",
      fatherName: "Hassan Ibrahim",
      causeOfDeath: "Illness",
      dateOfDeath: "2020-03-10",
      placeOfDeath: "Colombo Hospital",
      schoolContact: "+94-11-2345678",
      lastVisitDate: "2025-09-15", 
      distributionType: "Monthly Stipend",
      donor: "Global Hope Foundation",
      approvalStatus: "Approved",
      approvedBy: "Programme Manager",
      approvalDate: "2025-01-15",
      registrationDate: "2025-01-10",
      healthStatus: "Good",
      academicPerformance: "Excellent",
      documents: {
        birthCertificate: "uploaded",
        deathCertificate: "uploaded",
        schoolLetter: "uploaded",
        masjidLetter: "uploaded",
        guardianNIC: "uploaded",
        profilePhoto: "uploaded",
        familyPhoto: "uploaded"
      },
      visits: [
        { id: 1, date: "2025-09-15", coordinator: "Ali Coordinator", academic: "Excellent", attendance: 95, spiritual: "Good", health: "Good", remarks: "Doing well", photos: 2 },
        { id: 2, date: "2025-08-15", coordinator: "Ali Coordinator", academic: "Excellent", attendance: 92, spiritual: "Good", health: "Good", remarks: "Shows improvement", photos: 2 }
      ],
      totalStipendPaid: 45000,
      accountNumber: "ACC001"
    },
    { 
      id: 2, 
      fullName: "Fatima Ali Mohamed", 
      district: "Kandy", 
      age: 11, 
      dateOfBirth: "2014-08-20",
      latitude: 7.2906, 
      longitude: 80.6337, 
      status: "Active", 
      coordinator: "Rashmi Silva", 
      stipendAmount: 5000, 
      schoolName: "Kandy Girls School", 
      currentGrade: "Grade 6",
      guardianName: "Amina Ali",
      guardianNIC: "765432109V",
      address: "456 Temple Road, Kandy",
      contactNumber: "+94-77-2345678",
      gnDivision: "Kandy Central",
      dsDivision: "Kandy",
      lastVisitDate: "2025-10-01", 
      distributionType: "Monthly Stipend",
      approvalStatus: "Approved",
      donor: "Global Hope Foundation",
      registrationDate: "2025-02-01",
      healthStatus: "Good",
      academicPerformance: "Good",
      latitude: 7.2906,
      longitude: 80.6337,
      visits: [
        { id: 1, date: "2025-10-01", coordinator: "Rashmi Silva", academic: "Good", attendance: 88, spiritual: "Good", health: "Good", remarks: "Progressing well", photos: 2 }
      ],
      totalStipendPaid: 40000,
      accountNumber: "ACC002"
    },
    {
      id: 4,
      fullName: "Yusuf Rahman Ali",
      district: "Jaffna",
      age: 9,
      dateOfBirth: "2016-03-12",
      latitude: 9.6615,
      longitude: 80.0255,
      status: "Active",
      coordinator: "Kumar Field Officer",
      stipendAmount: 5000,
      schoolName: "Jaffna Hindu College",
      currentGrade: "Grade 4",
      guardianName: "Aisha Rahman",
      guardianNIC: "925678901V",
      address: "789 Beach Road, Jaffna",
      contactNumber: "+94-77-3456789",
      lastVisitDate: "2025-09-20",
      distributionType: "Monthly Stipend",
      approvalStatus: "Approved",
      donor: "Children First International",
      registrationDate: "2025-01-20",
      healthStatus: "Good",
      academicPerformance: "Average",
      visits: [
        { id: 1, date: "2025-09-20", coordinator: "Kumar Field Officer", academic: "Average", attendance: 85, spiritual: "Good", health: "Good", remarks: "Needs more attention", photos: 2 }
      ],
      totalStipendPaid: 45000,
      accountNumber: "ACC003"
    },
    {
      id: 5,
      fullName: "Zainab Mohamed Ismail",
      district: "Galle",
      age: 12,
      dateOfBirth: "2013-11-08",
      latitude: 6.0535,
      longitude: 80.2210,
      status: "Active",
      coordinator: "Sarah Care",
      stipendAmount: 5000,
      schoolName: "Galle International School",
      currentGrade: "Grade 7",
      guardianName: "Khadija Ismail",
      guardianNIC: "846789012V",
      address: "321 Fort Road, Galle",
      contactNumber: "+94-77-4567890",
      lastVisitDate: "2025-09-25",
      distributionType: "Monthly Stipend",
      approvalStatus: "Approved",
      donor: "Global Hope Foundation",
      registrationDate: "2024-12-15",
      healthStatus: "Excellent",
      academicPerformance: "Excellent",
      visits: [
        { id: 1, date: "2025-09-25", coordinator: "Sarah Care", academic: "Excellent", attendance: 98, spiritual: "Excellent", health: "Excellent", remarks: "Outstanding progress", photos: 2 },
        { id: 2, date: "2025-08-25", coordinator: "Sarah Care", academic: "Excellent", attendance: 96, spiritual: "Excellent", health: "Excellent", remarks: "Continues to excel", photos: 2 }
      ],
      totalStipendPaid: 50000,
      accountNumber: "ACC004"
    },
    {
      id: 6,
      fullName: "Ibrahim Abdullah Hassan",
      district: "Colombo",
      age: 8,
      dateOfBirth: "2017-07-22",
      latitude: 6.8649,
      longitude: 79.8997,
      status: "Active",
      coordinator: "Ali Coordinator",
      stipendAmount: 5000,
      schoolName: "Islamic International School",
      currentGrade: "Grade 3",
      guardianName: "Maryam Abdullah",
      guardianNIC: "978901234V",
      address: "555 Mosque Lane, Colombo",
      contactNumber: "+94-77-5678901",
      lastVisitDate: "2025-10-05",
      distributionType: "Monthly Stipend",
      approvalStatus: "Approved",
      donor: "Children First International",
      registrationDate: "2025-03-01",
      healthStatus: "Good",
      academicPerformance: "Good",
      visits: [
        { id: 1, date: "2025-10-05", coordinator: "Ali Coordinator", academic: "Good", attendance: 90, spiritual: "Good", health: "Good", remarks: "Adapting well", photos: 2 }
      ],
      totalStipendPaid: 35000,
      accountNumber: "ACC005"
    }
  ]);

  const [pendingOrphans, setPendingOrphans] = useState([
    { id: 3, fullName: "Mariam Ali Ahmed", age: 9, guardianName: "Zainab Ali", schoolName: "City Primary School", status: "Pending PM Approval", submittedBy: "Project Officer", submittedDate: "2025-10-10" }
  ]);

  const [generalBeneficiaries, setGeneralBeneficiaries] = useState([
    { 
      id: 1, 
      name: "Mohamed Farook", 
      nic: "875634567V", 
      address: "456 Lake Road, Kandy", 
      contact: "+94-77-9876543",
      additionalContact: "+94-71-9876543",
      dateOfBirth: "1987-05-15",
      age: 38,
      gnDivision: "Kandy Central",
      dsDivision: "Kandy",
      district: "Kandy",
      totalAssistance: 45000, 
      lastAssistanceDate: "2025-08-20", 
      assistanceHistory: [
        { id: 1, type: "Livelihood Support", amount: 25000, date: "2025-03-15", project: "IGP Phase 1", donor: "Life Relief" },
        { id: 2, type: "Food Aid", amount: 5000, date: "2025-06-10", project: "Ramadan Relief", donor: "One Nation" },
        { id: 3, type: "Medical Help", amount: 15000, date: "2025-08-20", project: "Emergency Medical", donor: "MAA" }
      ]
    }
  ]);

  const [transactions, setTransactions] = useState([
    { id: 1, date: "2025-10-01", type: "Income", category: "Donor Receipt", donor: "Global Hope Foundation", amount: 50000, currency: "USD", lkrAmount: 15000000, project: "Orphan Care Program", status: "Cleared", reference: "INV-2025-001" },
    { id: 2, date: "2025-10-05", type: "Expense", category: "Stipends", amount: 750000, currency: "LKR", lkrAmount: 750000, project: "Orphan Care Program", status: "Paid", approvedBy: "Finance Manager", reference: "EXP-2025-045" },
    { id: 3, date: "2025-10-08", type: "Expense", category: "Equipment", amount: 1200000, currency: "LKR", lkrAmount: 1200000, project: "Rural Water Access", status: "Paid", approvedBy: "Programme Manager", reference: "PO-2025-012" }
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState([
    { id: 1, poNumber: "PO-2025-012", vendor: "ABC Contractors", amount: 1200000, project: "Rural Water Access", status: "Approved", stage: "Finance Manager Approved", requestedBy: "Project Officer", date: "2025-10-01" },
    { id: 2, poNumber: "PO-2025-013", vendor: "Education Supplies Ltd", amount: 350000, project: "Orphan Care Program", status: "Pending PM Approval", stage: "Budget Review", requestedBy: "Coordinator", date: "2025-10-10" }
  ]);

  const [newOrphan, setNewOrphan] = useState({
    fullName: "", address: "", contactNumber: "", additionalContact: "", dateOfBirth: "",
    guardianName: "", guardianNIC: "", gnDivision: "", dsDivision: "", district: "",
    masjidArea: "", policeArea: "", fatherName: "", causeOfDeath: "", dateOfDeath: "",
    placeOfDeath: "", schoolName: "", currentGrade: "", schoolContact: "",
    latitude: "", longitude: "", distributionType: "Monthly Stipend", stipendAmount: 5000
  });
  
  const [uploadedFiles, setUploadedFiles] = useState({
    birthCertificate: null,
    deathCertificate: null,
    ppPhoto: null,
    guardianNIC: null
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [newVisit, setNewVisit] = useState({
    date: "", academic: "Good", attendance: 90, spiritual: "Good", health: "Good", remarks: ""
  });

  const [staff] = useState([
    { id: 1, name: "John WASH", department: "Operations", position: "Field Officer", email: "john@gersl.org", phone: "+94-77-1111111", joinDate: "2023-01-15", status: "Active" },
    { id: 2, name: "Sarah Care", department: "Operations", position: "Project Officer", email: "sarah@gersl.org", phone: "+94-77-2222222", joinDate: "2023-03-20", status: "Active" },
    { id: 3, name: "Michael Chen", department: "Finance", position: "Finance Manager", email: "michael@gersl.org", phone: "+94-77-3333333", joinDate: "2022-11-10", status: "Active" },
    { id: 4, name: "Emma Thompson", department: "Fundraising", position: "Fundraising Officer", email: "emma@gersl.org", phone: "+94-77-4444444", joinDate: "2023-05-05", status: "Active" },
    { id: 5, name: "Ali Coordinator", department: "Operations", position: "Field Coordinator", email: "ali@gersl.org", phone: "+94-77-5555555", joinDate: "2023-02-28", status: "Active" }
  ]);

  const [attendance] = useState([
    { id: 1, staffId: 1, staffName: "John WASH", date: "2025-10-11", checkIn: "08:30 AM", checkOut: "05:30 PM", location: "Office - Colombo", latitude: 6.9271, longitude: 79.8612, status: "Present", workHours: 9 },
    { id: 2, staffId: 2, staffName: "Sarah Care", date: "2025-10-11", checkIn: "09:00 AM", checkOut: "05:00 PM", location: "Field Visit - Kandy", latitude: 7.2906, longitude: 80.6337, status: "Present", workHours: 8 },
    { id: 3, staffId: 3, staffName: "Michael Chen", date: "2025-10-11", checkIn: "08:45 AM", checkOut: null, location: "Office - Colombo", latitude: 6.9271, longitude: 79.8612, status: "Present", workHours: 0 },
    { id: 4, staffId: 1, staffName: "John WASH", date: "2025-10-10", checkIn: "08:25 AM", checkOut: "05:45 PM", location: "Office - Colombo", latitude: 6.9271, longitude: 79.8612, status: "Present", workHours: 9.3 },
    { id: 5, staffId: 4, staffName: "Emma Thompson", date: "2025-10-11", checkIn: "09:15 AM", checkOut: "05:15 PM", location: "Office - Colombo", latitude: 6.9271, longitude: 79.8612, status: "Present", workHours: 8 }
  ]);

  const [kpiData] = useState([
    { id: 1, staffId: 1, staffName: "John WASH", department: "Operations", month: "September 2025", tasksCompleted: 18, tasksAssigned: 20, projectsHandled: 3, rating: 4.5, onTimeDelivery: 90, qualityScore: 92 },
    { id: 2, staffId: 2, staffName: "Sarah Care", department: "Operations", month: "September 2025", tasksCompleted: 22, tasksAssigned: 24, projectsHandled: 4, rating: 4.7, onTimeDelivery: 92, qualityScore: 95 },
    { id: 3, staffId: 3, staffName: "Michael Chen", department: "Finance", month: "September 2025", tasksCompleted: 15, tasksAssigned: 15, projectsHandled: 2, rating: 5.0, onTimeDelivery: 100, qualityScore: 98 },
    { id: 4, staffId: 4, staffName: "Emma Thompson", department: "Fundraising", month: "September 2025", tasksCompleted: 12, tasksAssigned: 15, projectsHandled: 3, rating: 4.0, onTimeDelivery: 80, qualityScore: 85 }
  ]);

  const [appraisals] = useState([
    { id: 1, staffId: 1, staffName: "John WASH", period: "Q3 2025", overallRating: 4.5, strengths: "Excellent field coordination, strong technical skills", improvements: "Time management in multi-tasking", goals: "Complete WASH certification", reviewedBy: "Programme Manager", reviewDate: "2025-10-01", status: "Completed" },
    { id: 2, staffId: 2, staffName: "Sarah Care", period: "Q3 2025", overallRating: 4.7, strengths: "Outstanding project management, great communication", improvements: "Could enhance reporting speed", goals: "Lead 2 major projects independently", reviewedBy: "Programme Manager", reviewDate: "2025-10-02", status: "Completed" },
    { id: 3, staffId: 4, staffName: "Emma Thompson", period: "Q3 2025", overallRating: 4.2, strengths: "Creative fundraising ideas, good donor relations", improvements: "Need to improve follow-up consistency", goals: "Secure 3 new major donors", reviewedBy: "CEO", reviewDate: "2025-10-03", status: "Completed" }
  ]);

  const [leaveRequests] = useState([
    { id: 1, staffName: "John WASH", leaveType: "Annual Leave", startDate: "2025-10-20", endDate: "2025-10-25", days: 5, reason: "Family vacation", status: "Approved", approvedBy: "HR Manager" },
    { id: 2, staffName: "Sarah Care", leaveType: "Medical Leave", startDate: "2025-10-15", endDate: "2025-10-16", days: 2, reason: "Medical appointment", status: "Pending", approvedBy: null },
    { id: 3, staffName: "Emma Thompson", leaveType: "Annual Leave", startDate: "2025-11-05", endDate: "2025-11-10", days: 5, reason: "Personal travel", status: "Pending", approvedBy: null }
  ]);

  const [inventory] = useState([
    { id: 1, name: "Laptop - Dell Latitude", category: "IT Equipment", quantity: 15, location: "Office - Colombo", assignedTo: "IT Department", condition: "Good", purchaseDate: "2024-03-15", value: 1250000, status: "In Use" },
    { id: 2, name: "Water Pump - Industrial", category: "Field Equipment", quantity: 8, location: "Warehouse - Jaffna", assignedTo: "WASH Project", condition: "Excellent", purchaseDate: "2025-01-20", value: 850000, status: "Available" },
    { id: 3, name: "Medical Supplies Kit", category: "Medical", quantity: 25, location: "Storage - Kandy", assignedTo: "Health Program", condition: "Good", purchaseDate: "2025-02-10", value: 125000, status: "In Use" },
    { id: 4, name: "Generator - 15KVA", category: "Equipment", quantity: 3, location: "Field Sites", assignedTo: "Multiple Projects", condition: "Fair", purchaseDate: "2023-08-05", value: 950000, status: "Maintenance" }
  ]);

  const [documents] = useState([
    { id: 1, name: "2025 Strategic Plan.pdf", category: "Strategy", uploadDate: "2025-01-05", uploadedBy: "CEO", size: "2.5 MB", tags: ["Strategy", "2025", "Planning"], status: "Active" },
    { id: 2, name: "Donor Agreement - GHF.docx", category: "Contracts", uploadDate: "2025-02-15", uploadedBy: "Programme Manager", size: "856 KB", tags: ["Legal", "Donor", "GHF"], status: "Active" },
    { id: 3, name: "Q3 Financial Report.xlsx", category: "Finance", uploadDate: "2025-09-30", uploadedBy: "Finance Manager", size: "1.2 MB", tags: ["Finance", "Q3", "Report"], status: "Active" },
    { id: 4, name: "Staff Handbook 2025.pdf", category: "HR", uploadDate: "2025-01-10", uploadedBy: "HR Manager", size: "3.8 MB", tags: ["HR", "Policy", "Handbook"], status: "Active" }
  ]);

  const [budgetForecasts] = useState([
    { month: "November", projected: 3500000, actual: 0, variance: 0 },
    { month: "December", projected: 4200000, actual: 0, variance: 0 },
    { month: "January", projected: 3800000, actual: 0, variance: 0 }
  ]);

  const [riskAssessments] = useState([
    { id: 1, project: "Rural Water Access Initiative", risk: "Weather delays in drilling", severity: "High", probability: "Medium", mitigation: "Schedule buffer time, alternate contractors", status: "Monitoring", owner: "Project Manager" },
    { id: 2, project: "Orphan Care Program", risk: "Coordinator turnover", severity: "Medium", probability: "Low", mitigation: "Training program, backup coordinators", status: "Mitigated", owner: "Programme Manager" },
    { id: 3, project: "All Projects", risk: "Currency fluctuation", severity: "High", probability: "High", mitigation: "Hedge funds, local procurement", status: "Active", owner: "Finance Manager" }
  ]);

  const [payrollData] = useState([
    { id: 1, staffName: "John WASH", position: "Field Officer", baseSalary: 85000, allowances: 15000, deductions: 8500, netSalary: 91500, status: "Processed", month: "October 2025" },
    { id: 2, staffName: "Sarah Care", position: "Project Officer", baseSalary: 95000, allowances: 18000, deductions: 9500, netSalary: 103500, status: "Processed", month: "October 2025" },
    { id: 3, staffName: "Michael Chen", position: "Finance Manager", baseSalary: 125000, allowances: 25000, deductions: 15000, netSalary: 135000, status: "Processed", month: "October 2025" },
    { id: 4, staffName: "Emma Thompson", position: "Fundraising Officer", baseSalary: 78000, allowances: 12000, deductions: 7800, netSalary: 82200, status: "Pending", month: "October 2025" }
  ]);

  const [emailTemplates] = useState([
    { id: 1, name: "Monthly Donor Update", category: "Donor Relations", subject: "Your Impact This Month" },
    { id: 2, name: "Visit Reminder", category: "Operations", subject: "Upcoming Orphan Visit Scheduled" },
    { id: 3, name: "Budget Approval Request", category: "Finance", subject: "Budget Approval Required" }
  ]);

  const [sentCommunications] = useState([
    { id: 1, type: "Email", recipient: "john@donor.org", subject: "Monthly Update - September", date: "2025-10-01", status: "Delivered" },
    { id: 2, type: "SMS", recipient: "+94-77-1234567", message: "Reminder: Visit scheduled tomorrow", date: "2025-10-10", status: "Delivered" },
    { id: 3, type: "Email", recipient: "sarah@partner.org", subject: "Project Progress Report", date: "2025-10-08", status: "Delivered" }
  ]);

  const [internalChat] = useState([
    { id: 1, sender: "Sarah Care", message: "The orphan visit reports for this month are ready for review.", time: "10:30 AM", date: "2025-10-11", avatar: "👤" },
    { id: 2, sender: "Michael Chen", message: "Budget allocation for Q4 has been approved by the CEO.", time: "11:15 AM", date: "2025-10-11", avatar: "📊" },
    { id: 3, sender: "John WASH", message: "Water project site visit scheduled for tomorrow at 9 AM.", time: "02:45 PM", date: "2025-10-11", avatar: "👤" },
    { id: 4, sender: "Emma Thompson", message: "New donor meeting confirmed for next week.", time: "03:30 PM", date: "2025-10-11", avatar: "💰" }
  ]);

  const [projectTasks] = useState({
    1: [
      { id: 1, title: "Site Survey", description: "Complete geological survey", assignedTo: "Field Team A", dueDate: "2025-02-28", priority: "High", status: "Completed", progress: 100, comments: 3 },
      { id: 2, title: "Procurement", description: "Source equipment and materials", assignedTo: "Procurement Officer", dueDate: "2025-04-15", priority: "High", status: "In Progress", progress: 60, comments: 5 },
      { id: 3, title: "Well Drilling - Village 1", description: "Complete drilling operations", assignedTo: "Contractor Team", dueDate: "2025-06-30", priority: "Critical", status: "Completed", progress: 100, comments: 8 },
      { id: 4, title: "Well Drilling - Village 2", description: "Ongoing drilling operations", assignedTo: "Contractor Team", dueDate: "2025-09-15", priority: "Critical", status: "In Progress", progress: 30, comments: 2 },
      { id: 5, title: "MEAL Verification", description: "Quality assessment and verification", assignedTo: "MEAL Team", dueDate: "2025-10-31", priority: "Medium", status: "Pending", progress: 0, comments: 0 }
    ],
    2: [
      { id: 1, title: "Orphan Registration", description: "Register new orphans in system", assignedTo: "Project Officer", dueDate: "2025-03-31", priority: "High", status: "Completed", progress: 100, comments: 12 },
      { id: 2, title: "Coordinator Assignment", description: "Assign coordinators to orphans", assignedTo: "Programme Manager", dueDate: "2025-04-30", priority: "High", status: "Completed", progress: 100, comments: 6 },
      { id: 3, title: "Monthly Stipend Distribution", description: "Distribute monthly stipends", assignedTo: "Finance Team", dueDate: "2025-12-31", priority: "Critical", status: "In Progress", progress: 75, comments: 15 }
    ]
  });

  const [projectChats] = useState({
    1: [
      { id: 1, sender: "John WASH", message: "Village 2 drilling is progressing well. Should complete by deadline.", time: "09:15 AM", date: "2025-10-11" },
      { id: 2, sender: "Programme Manager", message: "Great! Please ensure all safety protocols are followed.", time: "09:45 AM", date: "2025-10-11" },
      { id: 3, sender: "John WASH", message: "Absolutely. Daily safety checks are documented.", time: "10:00 AM", date: "2025-10-11" }
    ],
    2: [
      { id: 1, sender: "Sarah Care", message: "This month's orphan visits are 80% complete.", time: "11:30 AM", date: "2025-10-11" },
      { id: 2, sender: "Programme Manager", message: "Excellent progress. When will the reports be ready?", time: "11:45 AM", date: "2025-10-11" },
      { id: 3, sender: "Sarah Care", message: "Reports will be submitted by Friday.", time: "12:00 PM", date: "2025-10-11" }
    ]
  });

  const [financeWorkflow] = useState([
    { 
      id: 1, 
      projectName: "Rural Water Access Initiative",
      stage: "Expenditure Submission",
      currentStep: 8,
      steps: [
        { step: 1, name: "Project Approved", status: "Completed", date: "2025-01-10", approvedBy: "CEO" },
        { step: 2, name: "Budget Approval by PO", status: "Completed", date: "2025-01-12", approvedBy: "Project Officer" },
        { step: 3, name: "PM Approval", status: "Completed", date: "2025-01-15", approvedBy: "Programme Manager" },
        { step: 4, name: "Finance Approval", status: "Completed", date: "2025-01-18", approvedBy: "Finance Manager" },
        { step: 5, name: "CEO Approval", status: "Completed", date: "2025-01-20", approvedBy: "CEO" },
        { step: 6, name: "Quotation Analysis", status: "Completed", date: "2025-01-25", approvedBy: "Finance Team" },
        { step: 7, name: "Fund Request", status: "Completed", date: "2025-02-01", approvedBy: "CEO" },
        { step: 8, name: "Expenditure Submission", status: "In Progress", date: null, approvedBy: null }
      ],
      budgetApproved: 85000,
      quotations: [
        { id: 1, vendor: "ABC Contractors", amount: 84000, status: "Selected", eSigned: true },
        { id: 2, vendor: "XYZ Engineering", amount: 89000, status: "Rejected", eSigned: false }
      ],
      expenditures: [
        { id: 1, description: "Site Survey Equipment", amount: 12000, date: "2025-02-15", receipt: "attached", status: "Approved" },
        { id: 2, description: "Drilling Equipment", amount: 30000, date: "2025-04-20", receipt: "attached", status: "Approved" }
      ]
    },
    {
      id: 2,
      projectName: "Orphan Care Program 2025",
      stage: "Fund Request",
      currentStep: 7,
      steps: [
        { step: 1, name: "Project Approved", status: "Completed", date: "2024-12-15", approvedBy: "CEO" },
        { step: 2, name: "Budget Approval by PO", status: "Completed", date: "2024-12-18", approvedBy: "Project Officer" },
        { step: 3, name: "PM Approval", status: "Completed", date: "2024-12-20", approvedBy: "Programme Manager" },
        { step: 4, name: "Finance Approval", status: "Completed", date: "2024-12-22", approvedBy: "Finance Manager" },
        { step: 5, name: "CEO Approval", status: "Completed", date: "2024-12-28", approvedBy: "CEO" },
        { step: 6, name: "Quotation Analysis", status: "Completed", date: "2025-01-05", approvedBy: "Finance Team" },
        { step: 7, name: "Fund Request", status: "Pending CEO Approval", date: null, approvedBy: null },
        { step: 8, name: "Expenditure Submission", status: "Pending", date: null, approvedBy: null }
      ],
      budgetApproved: 120000,
      quotations: [
        { id: 1, vendor: "Education Supplies Ltd", amount: 35000, status: "Selected", eSigned: true }
      ],
      expenditures: []
    }
  ]);

  const [staffCoordination] = useState([
    { id: 1, staff: "John WASH", currentTask: "Well Drilling - Village 2", location: "Field - Jaffna", status: "Active", lastUpdate: "2 mins ago" },
    { id: 2, staff: "Sarah Care", currentTask: "Orphan Visit - Ahmed", location: "Colombo", status: "Active", lastUpdate: "15 mins ago" },
    { id: 3, staff: "Michael Chen", currentTask: "Budget Review Q4", location: "Office", status: "Active", lastUpdate: "5 mins ago" },
    { id: 4, staff: "Emma Thompson", currentTask: "Donor Meeting Prep", location: "Office", status: "Active", lastUpdate: "30 mins ago" }
  ]);

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalIncome = transactions.filter(t => t.type === "Income").reduce((sum, t) => sum + t.lkrAmount, 0);
  const totalExpenses = transactions.filter(t => t.type === "Expense").reduce((sum, t) => sum + t.lkrAmount, 0);

  // Functional handlers
  const handleApproveOrphan = (orphanId) => {
    const orphan = pendingOrphans.find(o => o.id === orphanId);
    if (orphan) {
      const newOrphan = {
        ...orphan,
        id: orphans.length + 1,
        status: "Active",
        approvalStatus: "Approved",
        approvedBy: currentUser.name,
        approvalDate: new Date().toISOString().split('T')[0],
        visits: [],
        totalStipendPaid: 0,
        accountNumber: `ACC${String(orphans.length + 1).padStart(3, '0')}`
      };
      setOrphans([...orphans, newOrphan]);
      setPendingOrphans(pendingOrphans.filter(o => o.id !== orphanId));
      alert(`✅ ${orphan.fullName} has been approved and activated!`);
    }
  };

  const handleRejectOrphan = (orphanId) => {
    const orphan = pendingOrphans.find(o => o.id === orphanId);
    if (orphan && confirm(`Are you sure you want to reject ${orphan.fullName}?`)) {
      setPendingOrphans(pendingOrphans.filter(o => o.id !== orphanId));
      alert(`${orphan.fullName} has been rejected.`);
    }
  };

  const handleApproveProposal = (proposalId) => {
    setProposals(proposals.map(p => 
      p.id === proposalId ? {...p, status: "Approved", approvedBy: currentUser.name, approvalDate: new Date().toISOString().split('T')[0]} : p
    ));
    alert('✅ Proposal approved successfully!');
  };

  const handleRejectProposal = (proposalId) => {
    if (confirm('Are you sure you want to reject this proposal?')) {
      setProposals(proposals.map(p => 
        p.id === proposalId ? {...p, status: "Rejected", approvedBy: currentUser.name} : p
      ));
      alert('Proposal rejected.');
    }
  };

  const handleApprovePO = (poId) => {
    setPurchaseOrders(purchaseOrders.map(po => 
      po.id === poId ? {...po, status: "Approved", stage: "Approved", approvedBy: currentUser.name, approvalDate: new Date().toISOString().split('T')[0]} : po
    ));
    alert('✅ Purchase Order approved!');
  };

  const handleRejectPO = (poId) => {
    if (confirm('Are you sure you want to reject this PO?')) {
      setPurchaseOrders(purchaseOrders.map(po => 
        po.id === poId ? {...po, status: "Rejected", rejectedBy: currentUser.name} : po
      ));
      alert('Purchase Order rejected.');
    }
  };

  const handleSendEmail = () => {
    if (!emailRecipient || !emailSubject || !emailBody) {
      alert('Please fill all email fields');
      return;
    }
    
    const newCommunication = {
      id: sentCommunications.length + 1,
      type: "Email",
      recipient: emailRecipient,
      subject: emailSubject,
      message: emailBody,
      date: new Date().toISOString().split('T')[0],
      status: "Delivered"
    };
    
    alert(`✅ Email sent to ${emailRecipient}!`);
    setEmailRecipient("");
    setEmailSubject("");
    setEmailBody("");
  };

  const handleSendSMS = () => {
    if (!smsRecipient || !smsMessage) {
      alert('Please fill all SMS fields');
      return;
    }
    
    alert(`✅ SMS sent to ${smsRecipient}!`);
    setSmsRecipient("");
    setSmsMessage("");
  };

  const handleAddIncome = () => {
    const amount = prompt('Enter income amount (LKR):');
    const donor = prompt('Enter donor name:');
    const category = prompt('Enter category (e.g., Donor Receipt):');
    
    if (amount && donor && category) {
      const newTransaction = {
        id: transactions.length + 1,
        date: new Date().toISOString().split('T')[0],
        type: "Income",
        category: category,
        donor: donor,
        amount: parseFloat(amount),
        currency: "LKR",
        lkrAmount: parseFloat(amount),
        status: "Cleared",
        reference: `INV-2025-${String(transactions.length + 1).padStart(3, '0')}`
      };
      
      setTransactions([...transactions, newTransaction]);
      alert('✅ Income recorded successfully!');
    }
  };

  const handleAddExpense = () => {
    const amount = prompt('Enter expense amount (LKR):');
    const category = prompt('Enter category:');
    const project = prompt('Enter project name:');
    
    if (amount && category && project) {
      const newTransaction = {
        id: transactions.length + 1,
        date: new Date().toISOString().split('T')[0],
        type: "Expense",
        category: category,
        project: project,
        amount: parseFloat(amount),
        currency: "LKR",
        lkrAmount: parseFloat(amount),
        status: "Paid",
        approvedBy: currentUser.name,
        reference: `EXP-2025-${String(transactions.length + 1).padStart(3, '0')}`
      };
      
      setTransactions([...transactions, newTransaction]);
      alert('✅ Expense recorded successfully!');
    }
  };

  const handleMarkNotificationRead = (notifId) => {
    setNotifications(notifications.map(n => 
      n.id === notifId ? {...n, read: true} : n
    ));
  };

  const handleExportOrphansToExcel = () => {
    let csv = "Full Name,Age,District,School,Grade,Coordinator,Stipend,Status,Last Visit\n";
    orphans.forEach(o => {
      csv += `${o.fullName},${o.age},${o.district},${o.schoolName},${o.currentGrade},${o.coordinator},${o.stipendAmount},${o.status},${o.lastVisitDate || 'No visits'}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GERSL_Orphans_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('✅ Orphan data exported to CSV!');
  };

  // Project Management Functions
  const handleAddProject = () => {
    setShowProjectForm(true);
  };

  const handleSubmitProject = () => {
    if (!newProject.name || !newProject.programmeArea || !newProject.budget || !newProject.donor) {
      alert('Please fill all required fields (Name, Programme Area, Budget, Donor)');
      return;
    }
    
    const project = {
      id: projects.length + 1,
      name: newProject.name,
      programmeArea: newProject.programmeArea,
      budget: parseFloat(newProject.budget),
      spent: 0,
      status: "Planning",
      stage: "Proposal",
      progress: 0,
      beneficiaries: 0,
      targetBeneficiaries: parseInt(newProject.targetBeneficiaries) || 0,
      nextDeadline: newProject.startDate || new Date().toISOString().split('T')[0],
      nextTask: 'Initial planning',
      donor: newProject.donor,
      startDate: newProject.startDate || new Date().toISOString().split('T')[0],
      endDate: newProject.endDate || new Date().toISOString().split('T')[0],
      description: newProject.description,
      location: newProject.location,
      tasks: []
    };
    
    setProjects([...projects, project]);
    setShowProjectForm(false);
    setNewProject({
      name: '',
      programmeArea: '',
      budget: '',
      donor: '',
      targetBeneficiaries: '',
      startDate: '',
      endDate: '',
      description: '',
      location: ''
    });
    alert('✅ Project created successfully!');
  };

  const handleUpdateProjectProgress = (projectId, newProgress) => {
    setProjects(projects.map(p => 
      p.id === projectId ? {...p, progress: newProgress} : p
    ));
  };

  // Staff Management Functions
  const handleMarkAttendance = () => {
    const staffName = prompt('Enter staff name:');
    const location = prompt('Enter location:');
    
    if (staffName && location) {
      alert(`✅ Attendance marked for ${staffName} at ${location}`);
    }
  };

  const handleApproveLeave = (leaveId) => {
    alert(`✅ Leave request approved!`);
  };

  const handleRejectLeave = (leaveId) => {
    if (confirm('Are you sure you want to reject this leave request?')) {
      alert('Leave request rejected.');
    }
  };

  // Donor Management Functions
  const handleAddDonor = () => {
    setShowDonorForm(true);
  };

  const handleSubmitPartner = () => {
    if (!newPartner.name || !newPartner.country || !newPartner.email) {
      alert('Please fill all required fields (Name, Country, Email)');
      return;
    }
    
    const partner = {
      id: partners.length + 1,
      name: newPartner.name,
      country: newPartner.country,
      totalContributed: 0,
      activeProjects: 0,
      lastDonation: new Date().toISOString().split('T')[0],
      contactPerson: newPartner.contactPerson,
      email: newPartner.email,
      phone: newPartner.phone,
      address: newPartner.address,
      partnershipType: newPartner.partnershipType
    };
    
    setPartners([...partners, partner]);
    setShowPartnerForm(false);
    setNewPartner({
      name: '',
      country: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      partnershipType: ''
    });
    alert(`✅ Partner organization ${partner.name} added successfully!`);
  };

  const handleSubmitDonor = () => {
    if (!newDonor.name || !newDonor.email || !newDonor.phone) {
      alert('Please fill all required fields (Name, Email, Phone)');
      return;
    }
    
    const donor = {
      id: donors.length + 1,
      name: newDonor.name,
      email: newDonor.email,
      phone: newDonor.phone,
      address: newDonor.address,
      country: newDonor.country,
      donorType: newDonor.donorType,
      interests: newDonor.interests,
      totalDonated: 0,
      lastDonation: new Date().toISOString().split('T')[0],
      status: "Active",
      projects: 0
    };
    
    setDonors([...donors, donor]);
    setShowDonorForm(false);
    setNewDonor({
      name: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      donorType: '',
      interests: ''
    });
    alert(`✅ Donor ${donor.name} added successfully!`);
  };

  const handleAddPartner = () => {
    setShowPartnerForm(true);
  };

  const handleSendDonorReport = (donorName) => {
    setSelectedDonorForReport(donorName);
    setShowSendReportModal(true);
  };

  const handleGenerateAndSendReport = () => {
    if (!reportPreferences.reportType) {
      alert('Please select a report type');
      return;
    }

    const reportTypes = {
      'monthly': 'Monthly Impact Report',
      'quarterly': 'Quarterly Progress Report',
      'fund': 'Fund Utilization Report',
      'annual': 'Annual Impact Report',
      'project': 'Project Completion Report'
    };

    const reportName = reportTypes[reportPreferences.reportType];
    
    // Generate PDF content
    const content = {
      'Report Type': reportName,
      'Donor': selectedDonorForReport,
      'Generated Date': new Date().toLocaleString(),
      'Format': reportPreferences.format,
      'Includes Photos': reportPreferences.includePhotos ? 'Yes' : 'No',
      'Includes Financials': reportPreferences.includeFinancials ? 'Yes' : 'No',
      'Includes Impact Metrics': reportPreferences.includeImpact ? 'Yes' : 'No',
      'Total Projects': projects.length,
      'Total Beneficiaries': orphans.length + generalBeneficiaries.length,
      'Funds Utilized': `LKR ${(totalExpenses/1000000).toFixed(2)}M`
    };

    generatePDF(`${reportName}_${selectedDonorForReport.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`, content);
    
    alert(`✅ ${reportName} generated and sent!\n\nSent to: ${selectedDonorForReport}\nFormat: ${reportPreferences.format}\n\nReport includes:\n${reportPreferences.includePhotos ? '✓ Photos & Media\n' : ''}${reportPreferences.includeFinancials ? '✓ Financial Summary\n' : ''}${reportPreferences.includeImpact ? '✓ Impact Metrics\n' : ''}\n📥 PDF downloaded successfully\n📧 Email notification sent`);
    
    setShowSendReportModal(false);
    setReportPreferences({
      reportType: '',
      includePhotos: true,
      includeFinancials: true,
      includeImpact: true,
      format: 'PDF'
    });
  };

  // Proposal Management Functions
  const handleAddProposal = () => {
    setShowAIProposalWriter(true);
    setShowProposalForm(false);
  };

  const generateAISuggestions = (field) => {
    // AI-powered suggestions based on category and context
    const suggestions = {
      executiveSummary: [
        "This project addresses the critical needs of vulnerable communities in [location] by providing [services]",
        "We propose a comprehensive intervention to support [beneficiaries] through [approach] over [duration]",
        "GERSL seeks funding to implement [project name], benefiting [number] individuals through [key activities]"
      ],
      problemStatement: [
        "Current data shows that [number] households lack access to [basic need], affecting their [impact area]",
        "The target community faces significant challenges including [issue 1], [issue 2], resulting in [consequence]",
        "Recent assessments reveal urgent gaps in [service area], particularly affecting [vulnerable group]"
      ],
      objectives: [
        "By [date], [number] beneficiaries will achieve improved [outcome] measured by [indicator]",
        "Increase access to [service] for [number] individuals by [percentage] within [timeframe]",
        "Establish [number] functional [facilities/systems] serving [number] community members by [date]"
      ],
      activities: [
        "Conduct baseline assessment and beneficiary registration",
        "Establish community coordination committees",
        "Implement monthly distribution/service delivery",
        "Conduct regular monitoring and home visits",
        "Organize capacity building workshops",
        "Facilitate community awareness sessions"
      ],
      indicators: [
        "Number of beneficiaries reached (disaggregated by age/gender)",
        "Percentage improvement in [service access/outcome]",
        "Number of [deliverables] completed as per timeline",
        "Beneficiary satisfaction rate (%)",
        "Percentage reduction in [problem indicator]"
      ]
    };
    
    setAiSuggestions(prev => ({...prev, [field]: suggestions[field] || []}));
  };

  const calculateBudgetSubtotal = (items) => {
    const directTotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const adminCost = directTotal * (aiProposal.adminPercentage / 100);
    return {
      directTotal,
      adminCost,
      grandTotal: directTotal + adminCost
    };
  };

  const handleGenerateProposalPDF = () => {
    const budget = calculateBudgetSubtotal(aiProposal.budgetItems);
    
    const content = {
      'Project Name': aiProposal.projectName,
      'Organization': aiProposal.organization,
      'Location': aiProposal.location,
      'Duration': `${aiProposal.activities[0]?.start || 'TBD'} to ${aiProposal.activities[aiProposal.activities.length-1]?.end || 'TBD'}`,
      '': '',
      'EXECUTIVE SUMMARY': aiProposal.executiveSummary,
      ' ': '',
      'PROBLEM STATEMENT': aiProposal.problemStatement,
      '  ': '',
      'GOAL': aiProposal.goal,
      'Objective 1': aiProposal.objectives[0],
      'Objective 2': aiProposal.objectives[1],
      'Objective 3': aiProposal.objectives[2],
      '   ': '',
      'TARGET GROUP': aiProposal.targetGroup,
      'GEOGRAPHIC FOCUS': aiProposal.geographicFocus,
      '    ': '',
      'IMPLEMENTATION METHOD': aiProposal.implementationMethod,
      'PARTNERSHIPS': aiProposal.partnerships,
      '     ': '',
      'BUDGET (Direct Costs)': `LKR ${budget.directTotal.toLocaleString()}`,
      'Admin/MEAL/Safeguarding': `LKR ${budget.adminCost.toLocaleString()} (${aiProposal.adminPercentage}%)`,
      'GRAND TOTAL': `LKR ${budget.grandTotal.toLocaleString()}`,
      '      ': '',
      'SUSTAINABILITY': aiProposal.sustainability
    };
    
    generatePDF(`GERSL_Proposal_${aiProposal.projectName.replace(/\s+/g, '_')}`, content);
    alert('✅ Professional proposal generated!\n\n📄 Full proposal document downloaded\n📧 Ready to submit to donor\n\nAll sections completed with AI assistance');
  };

  const handleSubmitProposal = () => {
    if (!newProposal.title || !newProposal.donor || !newProposal.amount || !newProposal.category) {
      alert('Please fill all required fields (Title, Donor, Amount, Category)');
      return;
    }

    const proposal = {
      id: proposals.length + 1,
      title: newProposal.title,
      donor: newProposal.donor,
      amount: parseFloat(newProposal.amount),
      status: "Pending PM Approval",
      submittedBy: currentUser.name,
      submittedDate: new Date().toISOString().split('T')[0],
      category: newProposal.category,
      description: newProposal.description,
      startDate: newProposal.startDate,
      endDate: newProposal.endDate,
      targetBeneficiaries: parseInt(newProposal.targetBeneficiaries) || 0
    };

    setProposals([...proposals, proposal]);
    setShowProposalForm(false);
    setNewProposal({
      title: '',
      donor: '',
      amount: '',
      category: '',
      description: '',
      startDate: '',
      endDate: '',
      targetBeneficiaries: ''
    });
    alert('✅ Proposal submitted successfully and sent for PM approval!');
  };

  // Inventory Management Functions
  const handleAddInventoryItem = () => {
    const name = prompt('Enter item name:');
    const category = prompt('Enter category:');
    const quantity = prompt('Enter quantity:');
    const location = prompt('Enter location:');
    const value = prompt('Enter value (LKR):');
    
    if (name && category && quantity && location && value) {
      alert(`✅ Inventory item "${name}" added successfully!`);
    }
  };

  // Document Management Functions
  const handleUploadDocument = () => {
    const fileName = prompt('Enter document name:');
    const category = prompt('Enter category (Strategy/Contracts/Finance/HR):');
    
    if (fileName && category) {
      alert(`✅ Document "${fileName}" uploaded successfully!`);
    }
  };

  // Beneficiary Management Functions
  const handleAddBeneficiary = () => {
    const name = prompt('Enter beneficiary name:');
    if (!name) return;
    
    const nic = prompt('Enter NIC number:');
    if (!nic) return;
    
    const address = prompt('Enter address:');
    if (!address) return;
    
    const contact = prompt('Enter contact number:');
    if (!contact) return;
    
    const district = prompt('Enter district:');
    const dateOfBirth = prompt('Enter date of birth (YYYY-MM-DD):');
    const additionalContact = prompt('Enter additional contact (optional):') || '';
    
    const newBeneficiary = {
      id: generalBeneficiaries.length + 1,
      name: name,
      nic: nic,
      address: address,
      contact: contact,
      additionalContact: additionalContact,
      district: district || 'Not specified',
      dateOfBirth: dateOfBirth,
      age: dateOfBirth ? Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
      gnDivision: '',
      dsDivision: '',
      totalAssistance: 0,
      lastAssistanceDate: null,
      assistanceHistory: []
    };
    
    setGeneralBeneficiaries([...generalBeneficiaries, newBeneficiary]);
    alert(`✅ Beneficiary ${name} registered successfully!`);
  };

  // Chat Functions
  const handleSendChatMessage = () => {
    if (chatMessage.trim()) {
      alert(`Message sent: ${chatMessage}`);
      setChatMessage("");
    }
  };

  const handleSendProjectChat = () => {
    if (projectChatMessage.trim()) {
      alert(`Project message sent: ${projectChatMessage}`);
      setProjectChatMessage("");
    }
  };

  // Finance Workflow Functions
  const handleApproveFundRequest = (workflowId) => {
    alert('✅ Fund request approved! Proceeding to expenditure stage.');
  };

  const handleRejectFundRequest = (workflowId) => {
    if (confirm('Are you sure you want to reject this fund request?')) {
      alert('Fund request rejected.');
    }
  };

  const handleUploadQuotation = (projectName) => {
    const vendor = prompt('Enter vendor name:');
    const amount = prompt('Enter quotation amount:');
    
    if (vendor && amount) {
      alert(`✅ Quotation from ${vendor} uploaded for ${projectName}`);
    }
  };

  const handleSubmitExpenditure = (projectName) => {
    const description = prompt('Enter expenditure description:');
    const amount = prompt('Enter amount:');
    
    if (description && amount) {
      alert(`✅ Expenditure submitted for ${projectName}\nPlease upload receipt.`);
    }
  };

  // Report Generation Functions
  const handleGenerateCustomReport = () => {
    const reportType = prompt('Select report type:\n1. Financial\n2. Programme\n3. HR\n4. Donor\n5. Custom\nEnter number:');
    
    const types = {
      '1': 'Financial Report',
      '2': 'Programme Report',
      '3': 'HR Report',
      '4': 'Donor Report',
      '5': 'Custom Report'
    };
    
    if (types[reportType]) {
      const dateRange = prompt('Enter date range (e.g., Jan-Mar 2025):');
      generatePDF(types[reportType], {
        'Report Type': types[reportType],
        'Date Range': dateRange || 'All Time',
        'Generated By': currentUser.name,
        'Generated Date': new Date().toLocaleString()
      });
      alert(`✅ ${types[reportType]} generated!`);
    }
  };

  // Advanced Analytics Functions
  const handleGenerateForecast = () => {
    alert('✅ Budget forecast report generated for Q4 2025');
  };

  const handleAddRiskAssessment = () => {
    const project = prompt('Enter project name:');
    const risk = prompt('Enter risk description:');
    const severity = prompt('Enter severity (High/Medium/Low):');
    
    if (project && risk && severity) {
      alert(`✅ Risk assessment added for ${project}`);
    }
  };

  const handleProcessPayroll = () => {
    if (confirm('Process payroll for all staff? This will mark all pending payrolls as processed.')) {
      alert('✅ Payroll processed successfully for all staff members!');
    }
  };

  // HR Module Handlers
  const handleCheckIn = () => {
    if (!checkInData.staffName || !checkInData.location) {
      alert('Please fill all required fields');
      return;
    }
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    alert(`✅ Check-In Successful!\n\nStaff: ${checkInData.staffName}\nTime: ${timeString}\nLocation: ${checkInData.location}\nGPS: 6.9271°N, 79.8612°E\nStatus: Working`);
    
    setCheckInData({ staffName: '', location: '', notes: '' });
    setShowCheckInModal(false);
  };

  const handleCheckOut = () => {
    if (!checkOutData.staffName) {
      alert('Please select staff member');
      return;
    }
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const totalHours = 8.5 - parseFloat(checkOutData.breakDuration);
    
    alert(`✅ Check-Out Successful!\n\nStaff: ${checkOutData.staffName}\nTime: ${timeString}\nBreak Duration: ${checkOutData.breakDuration}h\nTotal Hours Worked: ${totalHours}h\n\nHave a great day!`);
    
    setCheckOutData({ staffName: '', breakDuration: '0.5' });
    setShowCheckOutModal(false);
  };

  const handleFieldMovementSubmit = () => {
    if (!fieldMovementData.staffName || !fieldMovementData.purpose || !fieldMovementData.destination) {
      alert('Please fill all required fields');
      return;
    }
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    alert(`✅ Field Movement Logged!\n\nStaff: ${fieldMovementData.staffName}\nPurpose: ${fieldMovementData.purpose}\nDestination: ${fieldMovementData.destination}\nTime Out: ${timeString}\nExpected Return: ${fieldMovementData.expectedReturn}\nGPS: 6.9271°N, 79.8612°E\n\nStatus: In Field\n\nRemember to log return time!`);
    
    setFieldMovementData({ staffName: '', purpose: '', destination: '', expectedReturn: '', notes: '' });
    setShowFieldMovementModal(false);
  };

  const handleKPISubmit = () => {
    if (!kpiFormData.staffName || !kpiFormData.month) {
      alert('Please fill all required fields');
      return;
    }
    
    const completionRate = ((parseFloat(kpiFormData.tasksCompleted) / parseFloat(kpiFormData.tasksAssigned)) * 100).toFixed(1);
    
    alert(`✅ KPI Record Added!\n\nStaff: ${kpiFormData.staffName}\nMonth: ${kpiFormData.month}\n\nPerformance Metrics:\n• Task Completion: ${completionRate}%\n• Projects Handled: ${kpiFormData.projectsHandled}\n• On-Time Delivery: ${kpiFormData.onTimeDelivery}%\n• Quality Score: ${kpiFormData.qualityScore}%\n• Overall Rating: ${kpiFormData.rating}/5.0\n\nRecord saved successfully!`);
    
    setKpiFormData({ staffName: '', month: '', tasksAssigned: '', tasksCompleted: '', projectsHandled: '', onTimeDelivery: '', qualityScore: '', rating: '', comments: '' });
    setShowKPIModal(false);
  };

  const handleAppraisalSubmit = () => {
    if (!appraisalData.staffName || !appraisalData.period || !appraisalData.overallRating) {
      alert('Please fill all required fields');
      return;
    }
    
    alert(`✅ Performance Appraisal Completed!\n\nStaff: ${appraisalData.staffName}\nPeriod: ${appraisalData.period}\nOverall Rating: ${appraisalData.overallRating}/5.0\n\nReviewed by: ${currentUser.name}\nDate: ${new Date().toLocaleDateString()}\n\nAppraisal submitted to HR for records.`);
    
    setAppraisalData({ staffName: '', period: '', overallRating: '', strengths: '', improvements: '', goals: '', reviewerComments: '' });
    setShowAppraisalModal(false);
  };

  const handleAddStaffSubmit = () => {
    if (!newStaffData.fullName || !newStaffData.email || !newStaffData.department || !newStaffData.position) {
      alert('Please fill all required fields');
      return;
    }
    
    alert(`✅ New Staff Member Added!\n\nName: ${newStaffData.fullName}\nPosition: ${newStaffData.position}\nDepartment: ${newStaffData.department}\nEmail: ${newStaffData.email}\nJoin Date: ${newStaffData.joinDate}\n\nUsername: ${newStaffData.username}\n\nStaff profile created successfully!\nWelcome email sent with login credentials.`);
    
    setNewStaffData({ fullName: '', email: '', phone: '', department: '', position: '', joinDate: '', address: '', emergencyContact: '', emergencyPhone: '', username: '', password: '' });
    setShowAddStaffModal(false);
  };

  const handleLeaveRequestSubmit = () => {
    if (!leaveRequestData.leaveType || !leaveRequestData.startDate || !leaveRequestData.endDate || !leaveRequestData.reason) {
      alert('Please fill all required fields');
      return;
    }
    
    alert(`✅ Leave Request Submitted!\n\nType: ${leaveRequestData.leaveType}\nPeriod: ${leaveRequestData.startDate} to ${leaveRequestData.endDate}\nDays: ${leaveRequestData.days}\nReason: ${leaveRequestData.reason}\n\nStatus: Pending Line Manager Approval\n\nYou will be notified once reviewed.`);
    
    setLeaveRequestData({ staffName: currentUser?.name || '', leaveType: '', startDate: '', endDate: '', days: '', reason: '', lineManager: '' });
    setShowLeaveRequestModal(false);
  };

  // Settings Functions
  const handleManageUsers = () => {
    alert('User management panel opened. Here you can:\n• Add new users\n• Edit user permissions\n• Deactivate users\n• Reset passwords');
  };

  const handleConfigureRoles = () => {
    alert('Role configuration panel opened. Here you can:\n• Create new roles\n• Assign permissions\n• Modify access levels');
  };

  const handleSystemConfig = () => {
    alert('System configuration panel opened. Here you can:\n• Update organization details\n• Configure email settings\n• Set system preferences\n• Manage integrations');
  };

  const handleManageBackups = () => {
    const action = prompt('Backup Management:\n1. Create new backup\n2. Restore from backup\n3. Schedule automatic backups\nEnter 1, 2, or 3:');
    
    if (action === '1') {
      alert('✅ System backup created successfully!');
    } else if (action === '2') {
      alert('Select backup file to restore from...');
    } else if (action === '3') {
      alert('✅ Automatic daily backups scheduled!');
    }
  };

  // Quick Action Functions
  const handleRecordAttendance = () => {
    const staffMember = prompt('Enter staff member name:');
    const location = prompt('Enter location:');
    
    if (staffMember && location) {
      alert(`✅ Attendance recorded for ${staffMember} at ${location}`);
    }
  };

  const handleViewDonorPortal = () => {
    alert('Opening donor portal with:\n• Your funded projects\n• Fund utilization\n• Impact reports\n• Beneficiary stories');
  };

  // Filter and search orphans
  const filteredOrphans = orphans.filter(orphan => {
    const matchesSearch = orphan.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         orphan.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         orphan.coordinator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = filterDistrict === "All" || orphan.district === filterDistrict;
    const matchesStatus = filterStatus === "All" || orphan.status === filterStatus;
    return matchesSearch && matchesDistrict && matchesStatus;
  });

  // Sort orphans
  const sortedOrphans = [...filteredOrphans].sort((a, b) => {
    switch(sortBy) {
      case "name": return a.fullName.localeCompare(b.fullName);
      case "age": return a.age - b.age;
      case "district": return a.district.localeCompare(b.district);
      case "lastVisit": return new Date(b.lastVisitDate || 0) - new Date(a.lastVisitDate || 0);
      default: return 0;
    }
  });

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const hasAccess = (feature) => {
    if (!currentUser) return false;
    if (currentUser.role === "Administrator" || currentUser.role === "CEO") return true;
    
    const accessMap = {
      "Programme Manager": ["fundraising", "operations", "beneficiary", "approvals", "reports", "orphans", "inventory", "documents", "communications", "analytics"],
      "Finance Manager": ["finance", "reports", "approvals", "analytics"],
      "MEAL": ["operations", "reports", "analytics"],
      "Coordinator": ["orphans", "beneficiary", "communications"],
      "Donor": ["reports"],
      "HR Manager": ["hr", "analytics"],
      "Fundraising Officer": ["fundraising", "reports", "communications"],
      "Orphan Manager": ["orphans", "beneficiary", "reports", "communications"]
    };
    
    return accessMap[currentUser.role]?.includes(feature);
  };

  const handleLogin = () => {
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  const handleFileUpload = (fileType, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload only JPG, PNG, or PDF files');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFiles(prev => ({
          ...prev,
          [fileType]: {
            file: file,
            preview: reader.result,
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB'
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateOrphanForm = () => {
    const errors = {};
    
    // Required field validation
    if (!newOrphan.fullName.trim()) errors.fullName = "Full name is required";
    if (!newOrphan.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!newOrphan.contactNumber.trim()) errors.contactNumber = "Contact number is required";
    if (!newOrphan.address.trim()) errors.address = "Address is required";
    if (!newOrphan.guardianName.trim()) errors.guardianName = "Guardian name is required";
    if (!newOrphan.guardianNIC.trim()) errors.guardianNIC = "Guardian NIC is required";
    if (!newOrphan.district.trim()) errors.district = "District is required";
    if (!newOrphan.schoolName.trim()) errors.schoolName = "School name is required";
    if (!newOrphan.currentGrade.trim()) errors.currentGrade = "Current grade is required";
    
    // GPS validation
    if (!newOrphan.latitude || !newOrphan.longitude) {
      errors.gps = "GPS coordinates are required";
    } else {
      const lat = parseFloat(newOrphan.latitude);
      const lon = parseFloat(newOrphan.longitude);
      if (isNaN(lat) || lat < 5.9 || lat > 9.9) {
        errors.latitude = "Invalid latitude for Sri Lanka (should be between 5.9 and 9.9)";
      }
      if (isNaN(lon) || lon < 79.7 || lon > 81.9) {
        errors.longitude = "Invalid longitude for Sri Lanka (should be between 79.7 and 81.9)";
      }
    }
    
    // File validation
    if (!uploadedFiles.ppPhoto) {
      errors.ppPhoto = "PP size photo is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrphan = () => {
    if (!validateOrphanForm()) {
      alert("Please fill all required fields correctly");
      return;
    }
    
    // Calculate age from date of birth
    const birthDate = new Date(newOrphan.dateOfBirth);
    const today = new Date();
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    
    // Create new orphan object
    const newOrphanData = {
      id: orphans.length + 1,
      fullName: newOrphan.fullName,
      district: newOrphan.district,
      age: age,
      dateOfBirth: newOrphan.dateOfBirth,
      latitude: parseFloat(newOrphan.latitude),
      longitude: parseFloat(newOrphan.longitude),
      status: "Pending PM Approval",
      coordinator: currentUser.name,
      stipendAmount: newOrphan.stipendAmount,
      schoolName: newOrphan.schoolName,
      currentGrade: newOrphan.currentGrade,
      guardianName: newOrphan.guardianName,
      guardianNIC: newOrphan.guardianNIC,
      address: newOrphan.address,
      contactNumber: newOrphan.contactNumber,
      gnDivision: newOrphan.gnDivision,
      dsDivision: newOrphan.dsDivision,
      masjidArea: newOrphan.masjidArea,
      policeArea: newOrphan.policeArea,
      fatherName: newOrphan.fatherName,
      causeOfDeath: newOrphan.causeOfDeath,
      dateOfDeath: newOrphan.dateOfDeath,
      placeOfDeath: newOrphan.placeOfDeath,
      schoolContact: newOrphan.schoolContact,
      distributionType: newOrphan.distributionType,
      registrationDate: new Date().toISOString().split('T')[0],
      healthStatus: "Good",
      academicPerformance: "Average",
      documents: {
        birthCertificate: uploadedFiles.birthCertificate ? "uploaded" : "pending",
        deathCertificate: uploadedFiles.deathCertificate ? "uploaded" : "pending",
        ppPhoto: uploadedFiles.ppPhoto ? "uploaded" : "pending",
        guardianNIC: uploadedFiles.guardianNIC ? "uploaded" : "pending"
      },
      visits: [],
      totalStipendPaid: 0,
      accountNumber: `ACC${String(orphans.length + 1).padStart(3, '0')}`
    };
    
    // Add to orphans list (in real app, this would go to backend)
    setOrphans([...orphans, newOrphanData]);
    
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
    
    // Reset form
    setNewOrphan({
      fullName: "", address: "", contactNumber: "", additionalContact: "", dateOfBirth: "",
      guardianName: "", guardianNIC: "", gnDivision: "", dsDivision: "", district: "",
      masjidArea: "", policeArea: "", fatherName: "", causeOfDeath: "", dateOfDeath: "",
      placeOfDeath: "", schoolName: "", currentGrade: "", schoolContact: "",
      latitude: "", longitude: "", distributionType: "Monthly Stipend", stipendAmount: 5000
    });
    setUploadedFiles({
      birthCertificate: null,
      deathCertificate: null,
      ppPhoto: null,
      guardianNIC: null
    });
    setFormErrors({});
    setShowOrphanForm(false);
    
    alert(`✅ Success! ${newOrphanData.fullName} has been registered and submitted for PM approval.\n\nAccount Number: ${newOrphanData.accountNumber}\nStatus: Pending PM Approval`);
  };

  const generateOrphanPDF = (orphan) => {
    const content = {
      'Full Name': orphan.fullName,
      'Account Number': orphan.accountNumber || 'N/A',
      'Age': `${orphan.age} years`,
      'Date of Birth': orphan.dateOfBirth,
      'District': orphan.district,
      'Address': orphan.address,
      'Guardian': orphan.guardianName,
      'Guardian NIC': orphan.guardianNIC,
      'School': orphan.schoolName,
      'Grade': orphan.currentGrade,
      'Academic Performance': orphan.academicPerformance,
      'Health Status': orphan.healthStatus,
      'Coordinator': orphan.coordinator,
      'Monthly Stipend': `LKR ${orphan.stipendAmount?.toLocaleString()}`,
      'Total Stipend Paid': `LKR ${orphan.totalStipendPaid?.toLocaleString()}`,
      'Donor': orphan.donor || 'N/A',
      'Total Visits': orphan.visits?.length || 0
    };
    
    generatePDF(`${orphan.fullName}_Profile_Report`, content);
    alert('✅ PDF Report generated and downloaded!');
  };

  const generateVisitPDF = (orphan, visit) => {
    const content = {
      'Orphan Name': orphan.fullName,
      'Account Number': orphan.accountNumber,
      'Visit Date': visit.date,
      'Coordinator': visit.coordinator,
      'Academic Performance': visit.academic,
      'Attendance': `${visit.attendance}%`,
      'Spiritual Growth': visit.spiritual,
      'Health Condition': visit.health,
      'Remarks': visit.remarks,
      'Photos Uploaded': visit.photos
    };
    
    generatePDF(`${orphan.fullName}_Visit_${visit.date}`, content);
  };

  const generateFinancialPDF = () => {
    const content = {
      'Total Income': `LKR ${(totalIncome/1000000).toFixed(2)}M`,
      'Total Expenses': `LKR ${(totalExpenses/1000000).toFixed(2)}M`,
      'Net Balance': `LKR ${((totalIncome-totalExpenses)/1000000).toFixed(2)}M`,
      'Utilization Rate': `${Math.round((totalExpenses/totalIncome)*100)}%`,
      'Number of Transactions': transactions.length,
      'Generated Date': new Date().toLocaleDateString()
    };
    
    generatePDF('GERSL_Financial_Report', content);
    alert('✅ Financial Report generated and downloaded!');
  };

  const generateProjectPDF = (project) => {
    const content = {
      'Project Name': project.name,
      'Programme Area': project.programmeArea,
      'Donor': project.donor,
      'Budget': project.budget.toLocaleString(),
      'Spent': project.spent.toLocaleString(),
      'Progress': `${project.progress}%`,
      'Status': project.status,
      'Start Date': project.startDate,
      'End Date': project.endDate,
      'Beneficiaries': `${project.beneficiaries}/${project.targetBeneficiaries}`,
      'Total Tasks': project.tasks.length,
      'Completed Tasks': project.tasks.filter(t => t.status === 'Completed').length
    };
    
    generatePDF(`${project.name.replace(/\s+/g, '_')}_Report`, content);
    alert('✅ Project Report generated and downloaded!');
  };

  const handleAddVisit = () => {
    if (!newVisit.date || !selectedOrphan) {
      alert("Please fill all required fields");
      return;
    }
    
    const visit = {
      id: (selectedOrphan.visits?.length || 0) + 1,
      date: newVisit.date,
      coordinator: currentUser.name,
      academic: newVisit.academic,
      attendance: parseInt(newVisit.attendance),
      spiritual: newVisit.spiritual,
      health: newVisit.health,
      remarks: newVisit.remarks,
      photos: 2
    };
    
    const updatedOrphans = orphans.map(o => {
      if (o.id === selectedOrphan.id) {
        return {
          ...o,
          visits: [...(o.visits || []), visit],
          lastVisitDate: newVisit.date,
          academicPerformance: newVisit.academic,
          healthStatus: newVisit.health
        };
      }
      return o;
    });
    
    setOrphans(updatedOrphans);
    
    const updatedOrphan = updatedOrphans.find(o => o.id === selectedOrphan.id);
    generateVisitPDF(updatedOrphan, visit);
    
    setNewVisit({ date: "", academic: "Good", attendance: 90, spiritual: "Good", health: "Good", remarks: "" });
    setShowVisitForm(false);
    setSelectedOrphan(null);
    alert("✅ Visit recorded successfully! PDF report generated and downloaded.");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="text-6xl mb-4">🌟</div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GERSL Management System</CardTitle>
            <p className="text-gray-600 mt-2">Complete Charity Management Platform</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Username</label>
                <input type="text" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="Enter username" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
                <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none" placeholder="Enter password" />
              </div>
              <button onClick={handleLogin} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">Login</button>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2 font-semibold">🔑 Demo Credentials (All Features Unlocked!):</p>
                <p className="text-xs text-gray-700 mb-1"><strong>CEO:</strong> ceo / ceo123 (All Modules + Analytics)</p>
                <p className="text-xs text-gray-700 mb-1"><strong>Admin:</strong> admin / admin123 (Full System Access)</p>
                <p className="text-xs text-gray-700 mb-1"><strong>Programme Manager:</strong> pm / pm123 (Operations + Inventory)</p>
                <p className="text-xs text-gray-700 mb-1"><strong>Finance:</strong> finance / fin123 (Finance Workflow + Payroll)</p>
                <p className="text-xs text-gray-700 mb-1"><strong>Fundraising:</strong> fundraising / fund123 (Communications)</p>
                <p className="text-xs text-gray-700 mb-1"><strong>Orphan Manager:</strong> orphan / orphan123 (Full Orphan Module)</p>
                <p className="text-xs text-gray-700 mb-1"><strong>HR Manager:</strong> hr / hr123 (HR + Payroll Analytics)</p>
                <p className="text-xs text-gray-700 mb-1"><strong>Coordinator:</strong> coord / coord123 (Field Operations)</p>
                <p className="text-xs text-gray-700"><strong>Donor:</strong> donor / donor123 (Reports Access)</p>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-800 font-semibold">✨ New Features: Inventory, Documents, Email/SMS, Analytics, Payroll, Risk Assessment & More!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">GERSL Management System</h1>
              <p className="text-blue-100 text-sm mt-1">{currentUser.role} Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm border border-white/20">
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative bg-white/10 hover:bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        <button onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))} className="text-xs text-blue-600 hover:underline">
                          Mark all as read
                        </button>
                      </div>
                    </div>
                    <div className="divide-y">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`} onClick={() => handleMarkNotificationRead(notif.id)}>
                          <div className="flex gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notif.type === 'warning' ? 'bg-yellow-500' :
                              notif.type === 'success' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className={`text-sm ${!notif.read ? 'font-semibold' : ''} text-gray-900`}>{notif.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t bg-gray-50 text-center">
                      <button className="text-sm text-blue-600 hover:underline font-medium">View all notifications</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentUser.avatar}</span>
                  <div>
                    <p className="font-semibold">{currentUser.name}</p>
                    <p className="text-xs text-blue-100">{currentUser.role}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => { setCurrentUser(null); setIsLoggedIn(false); setActiveTab("dashboard"); }} className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center gap-2">
                <LogOut className="w-4 h-4" />Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Click outside to close notifications */}
        {showNotifications && (
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-md rounded-lg p-1 flex flex-wrap gap-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />Dashboard
            </TabsTrigger>
            
            {hasAccess("fundraising") && (
              <TabsTrigger value="fundraising" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <HeartHandshake className="w-4 h-4 mr-2" />Fundraising
              </TabsTrigger>
            )}
            
            {hasAccess("operations") && (
              <TabsTrigger value="operations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <Briefcase className="w-4 h-4 mr-2" />Operations
              </TabsTrigger>
            )}
            
            {hasAccess("finance") && (
              <TabsTrigger value="finance" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <CreditCard className="w-4 h-4 mr-2" />Finance
              </TabsTrigger>
            )}
            
            {hasAccess("beneficiary") && (
              <TabsTrigger value="beneficiary" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <UserCheck className="w-4 h-4 mr-2" />Beneficiary
              </TabsTrigger>
            )}
            
            {hasAccess("approvals") && (
              <TabsTrigger value="approvals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />Approvals
              </TabsTrigger>
            )}
            
            {hasAccess("reports") && (
              <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <FileSpreadsheet className="w-4 h-4 mr-2" />Reports
              </TabsTrigger>
            )}
            
            {hasAccess("orphans") && (
              <TabsTrigger value="orphans" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <Baby className="w-4 h-4 mr-2" />Orphans Management
              </TabsTrigger>
            )}
            
            {hasAccess("hr") && (
              <TabsTrigger value="hr" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />HR
              </TabsTrigger>
            )}
            
            {(currentUser.role === "Administrator" || currentUser.role === "CEO" || currentUser.role === "Programme Manager") && (
              <>
                <TabsTrigger value="inventory" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  <Package className="w-4 h-4 mr-2" />Inventory
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />Documents
                </TabsTrigger>
                <TabsTrigger value="communications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  <Send className="w-4 h-4 mr-2" />Communications
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />Analytics
                </TabsTrigger>
              </>
            )}
            
            {(currentUser.role === "Administrator" || currentUser.role === "CEO") && (
              <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <Settings className="w-4 h-4 mr-2" />Settings
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* AI-Powered Proposal Writer Modal */}
            {showAIProposalWriter && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAIProposalWriter(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                          <FileText className="w-8 h-8" />
                          AI-Powered Proposal Writer
                        </h2>
                        <p className="text-blue-100 text-sm mt-2">Professional proposal template with intelligent suggestions</p>
                      </div>
                      <button onClick={() => setShowAIProposalWriter(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-8">
                    {/* Header Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Project Header
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Project Name *</label>
                          <input 
                            type="text" 
                            value={aiProposal.projectName}
                            onChange={(e) => setAiProposal({...aiProposal, projectName: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Rural Water Access Initiative 2025"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Location *</label>
                          <input 
                            type="text" 
                            value={aiProposal.location}
                            onChange={(e) => setAiProposal({...aiProposal, location: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Jaffna District, Sri Lanka"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary with AI */}
                    <div className="bg-white p-6 rounded-lg border-2 border-green-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-green-600" />
                            1) Executive Summary
                          </h3>
                          <p className="text-sm text-gray-600">5-7 lines: Problem, solution, activities, expected change, budget</p>
                        </div>
                        <button 
                          onClick={() => generateAISuggestions('executiveSummary')}
                          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:shadow-lg text-sm"
                        >
                          <Activity className="w-4 h-4" />
                          AI Suggest
                        </button>
                      </div>
                      <textarea
                        value={aiProposal.executiveSummary}
                        onChange={(e) => setAiProposal({...aiProposal, executiveSummary: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        rows="5"
                        placeholder="This project will address [problem] for [beneficiaries] in [location] over [duration]. Main activities include [key activities]. Expected to [change]. Total budget: [amount]"
                      />
                      {aiSuggestions.executiveSummary.length > 0 && (
                        <div className="mt-3 p-4 bg-green-50 rounded-lg">
                          <p className="text-sm font-semibold text-green-900 mb-2">💡 AI Suggestions:</p>
                          {aiSuggestions.executiveSummary.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setAiProposal({...aiProposal, executiveSummary: suggestion})}
                              className="block w-full text-left p-2 mb-2 bg-white rounded border border-green-200 hover:border-green-500 text-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Problem Statement with AI */}
                    <div className="bg-white p-6 rounded-lg border-2 border-red-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                            2) Problem Statement
                          </h3>
                          <p className="text-sm text-gray-600">4-6 lines: Evidence of need, who affected, urgency</p>
                        </div>
                        <button 
                          onClick={() => generateAISuggestions('problemStatement')}
                          className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:shadow-lg text-sm"
                        >
                          <Activity className="w-4 h-4" />
                          AI Suggest
                        </button>
                      </div>
                      <textarea
                        value={aiProposal.problemStatement}
                        onChange={(e) => setAiProposal({...aiProposal, problemStatement: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                        rows="4"
                        placeholder="Brief evidence showing [number] people affected by [problem]. Key facts: [statistics]. Why urgent: [reason]"
                      />
                      {aiSuggestions.problemStatement.length > 0 && (
                        <div className="mt-3 p-4 bg-red-50 rounded-lg">
                          <p className="text-sm font-semibold text-red-900 mb-2">💡 AI Suggestions:</p>
                          {aiSuggestions.problemStatement.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => setAiProposal({...aiProposal, problemStatement: suggestion})}
                              className="block w-full text-left p-2 mb-2 bg-white rounded border border-red-200 hover:border-red-500 text-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Goal & Objectives */}
                    <div className="bg-white p-6 rounded-lg border-2 border-purple-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Target className="w-6 h-6 text-purple-600" />
                        3) Goal & Objectives
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Overall Goal *</label>
                          <input
                            type="text"
                            value={aiProposal.goal}
                            onChange={(e) => setAiProposal({...aiProposal, goal: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="High-level change you want to see"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold">Specific, Measurable Objectives (2-3) *</label>
                            <button 
                              onClick={() => generateAISuggestions('objectives')}
                              className="flex items-center gap-1 bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
                            >
                              <Activity className="w-3 h-3" />
                              AI Suggest
                            </button>
                          </div>
                          {aiProposal.objectives.map((obj, idx) => (
                            <input
                              key={idx}
                              type="text"
                              value={obj}
                              onChange={(e) => {
                                const newObjectives = [...aiProposal.objectives];
                                newObjectives[idx] = e.target.value;
                                setAiProposal({...aiProposal, objectives: newObjectives});
                              }}
                              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none mb-2"
                              placeholder={`Objective ${idx+1}: By [date], [X] beneficiaries will [measurable result]`}
                            />
                          ))}
                          {aiSuggestions.objectives.length > 0 && (
                            <div className="mt-2 p-4 bg-purple-50 rounded-lg">
                              <p className="text-sm font-semibold text-purple-900 mb-2">💡 AI Suggestions:</p>
                              {aiSuggestions.objectives.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    const newObjectives = [...aiProposal.objectives];
                                    newObjectives[0] = suggestion;
                                    setAiProposal({...aiProposal, objectives: newObjectives});
                                  }}
                                  className="block w-full text-left p-2 mb-2 bg-white rounded border border-purple-200 hover:border-purple-500 text-sm"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Target Group & Coverage */}
                    <div className="bg-white p-6 rounded-lg border-2 border-blue-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        4) Target Group & Coverage
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Primary Beneficiaries *</label>
                          <input
                            type="text"
                            value={aiProposal.targetGroup}
                            onChange={(e) => setAiProposal({...aiProposal, targetGroup: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., 150 orphaned children aged 6-16"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Selection Criteria</label>
                          <input
                            type="text"
                            value={aiProposal.selectionCriteria}
                            onChange={(e) => setAiProposal({...aiProposal, selectionCriteria: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., income level, vulnerability, location"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold mb-2">Geographic Focus *</label>
                          <input
                            type="text"
                            value={aiProposal.geographicFocus}
                            onChange={(e) => setAiProposal({...aiProposal, geographicFocus: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., GN/DS divisions, specific districts"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Activities & Timeline */}
                    <div className="bg-white p-6 rounded-lg border-2 border-orange-200">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-orange-600" />
                            5) Activities & Timeline
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setAiProposal({
                              ...aiProposal,
                              activities: [...aiProposal.activities, { activity: '', output: '', start: '', end: '', lead: '' }]
                            });
                          }}
                          className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Activity
                        </button>
                      </div>
                      <button 
                        onClick={() => generateAISuggestions('activities')}
                        className="mb-4 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:shadow-lg text-sm"
                      >
                        <Activity className="w-4 h-4" />
                        AI Suggest Activities
                      </button>
                      {aiSuggestions.activities.length > 0 && (
                        <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm font-semibold text-orange-900 mb-2">💡 Common Activities:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {aiSuggestions.activities.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const newActivities = [...aiProposal.activities];
                                  newActivities[newActivities.length - 1].activity = suggestion;
                                  setAiProposal({...aiProposal, activities: newActivities});
                                }}
                                className="text-left p-2 bg-white rounded border border-orange-200 hover:border-orange-500 text-sm"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-4">
                        {aiProposal.activities.map((activity, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
                            <input
                              type="text"
                              value={activity.activity}
                              onChange={(e) => {
                                const newActivities = [...aiProposal.activities];
                                newActivities[idx].activity = e.target.value;
                                setAiProposal({...aiProposal, activities: newActivities});
                              }}
                              className="md:col-span-2 p-2 border rounded"
                              placeholder="Activity description"
                            />
                            <input
                              type="text"
                              value={activity.output}
                              onChange={(e) => {
                                const newActivities = [...aiProposal.activities];
                                newActivities[idx].output = e.target.value;
                                setAiProposal({...aiProposal, activities: newActivities});
                              }}
                              className="p-2 border rounded"
                              placeholder="Output/Result"
                            />
                            <input
                              type="month"
                              value={activity.start}
                              onChange={(e) => {
                                const newActivities = [...aiProposal.activities];
                                newActivities[idx].start = e.target.value;
                                setAiProposal({...aiProposal, activities: newActivities});
                              }}
                              className="p-2 border rounded text-sm"
                            />
                            <input
                              type="month"
                              value={activity.end}
                              onChange={(e) => {
                                const newActivities = [...aiProposal.activities];
                                newActivities[idx].end = e.target.value;
                                setAiProposal({...aiProposal, activities: newActivities});
                              }}
                              className="p-2 border rounded text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Implementation Approach */}
                    <div className="bg-white p-6 rounded-lg border-2 border-teal-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-teal-600" />
                        6) Implementation Approach
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Implementation Method *</label>
                          <textarea
                            value={aiProposal.implementationMethod}
                            onChange={(e) => setAiProposal({...aiProposal, implementationMethod: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                            rows="3"
                            placeholder="e.g., Community coordination, monthly distributions, school follow-up"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Partnerships & Local Roles</label>
                          <input
                            type="text"
                            value={aiProposal.partnerships}
                            onChange={(e) => setAiProposal({...aiProposal, partnerships: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                            placeholder="Local CBO, authorities, masjid, school roles"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Safeguarding & Do No Harm</label>
                          <input
                            type="text"
                            value={aiProposal.safeguarding}
                            onChange={(e) => setAiProposal({...aiProposal, safeguarding: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                            placeholder="Brief safeguarding measures"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">Accountability & Feedback Mechanism</label>
                          <input
                            type="text"
                            value={aiProposal.accountability}
                            onChange={(e) => setAiProposal({...aiProposal, accountability: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                            placeholder="Hotline, complaint box, focal person"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Monitoring & Reporting */}
                    <div className="bg-white p-6 rounded-lg border-2 border-indigo-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart className="w-6 h-6 text-indigo-600" />
                            7) Monitoring & Reporting
                          </h3>
                        </div>
                        <button 
                          onClick={() => generateAISuggestions('indicators')}
                          className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 text-sm"
                        >
                          <Activity className="w-4 h-4" />
                          AI Suggest Indicators
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Key Indicators (3-5) *</label>
                          {aiProposal.indicators.map((indicator, idx) => (
                            <input
                              key={idx}
                              type="text"
                              value={indicator}
                              onChange={(e) => {
                                const newIndicators = [...aiProposal.indicators];
                                newIndicators[idx] = e.target.value;
                                setAiProposal({...aiProposal, indicators: newIndicators});
                              }}
                              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none mb-2"
                              placeholder={`Indicator ${idx+1}: # of beneficiaries / % improvement / # delivered`}
                            />
                          ))}
                          {aiSuggestions.indicators.length > 0 && (
                            <div className="mt-2 p-4 bg-indigo-50 rounded-lg">
                              <p className="text-sm font-semibold text-indigo-900 mb-2">💡 Common Indicators:</p>
                              {aiSuggestions.indicators.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    const newIndicators = [...aiProposal.indicators];
                                    newIndicators[0] = suggestion;
                                    setAiProposal({...aiProposal, indicators: newIndicators});
                                  }}
                                  className="block w-full text-left p-2 mb-2 bg-white rounded border border-indigo-200 hover:border-indigo-500 text-sm"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2">Data Sources</label>
                            <input
                              type="text"
                              value={aiProposal.dataSources}
                              onChange={(e) => setAiProposal({...aiProposal, dataSources: e.target.value})}
                              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                              placeholder="Registers, forms, photos, receipts"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2">Reporting Frequency</label>
                            <select
                              value={aiProposal.reportingFrequency}
                              onChange={(e) => setAiProposal({...aiProposal, reportingFrequency: e.target.value})}
                              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Bi-Annual">Bi-Annual</option>
                              <option value="Annual">Annual</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Budget Summary */}
                    <div className="bg-white p-6 rounded-lg border-2 border-green-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <DollarSign className="w-6 h-6 text-green-600" />
                          8) Budget Summary
                        </h3>
                        <button
                          onClick={() => {
                            setAiProposal({
                              ...aiProposal,
                              budgetItems: [...aiProposal.budgetItems, { item: '', quantity: '', unitCost: '', subtotal: 0 }]
                            });
                          }}
                          className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Item
                        </button>
                      </div>
                      <div className="space-y-3">
                        {aiProposal.budgetItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                            <input
                              type="text"
                              value={item.item}
                              onChange={(e) => {
                                const newItems = [...aiProposal.budgetItems];
                                newItems[idx].item = e.target.value;
                                setAiProposal({...aiProposal, budgetItems: newItems});
                              }}
                              className="p-2 border rounded"
                              placeholder="Item description"
                            />
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...aiProposal.budgetItems];
                                newItems[idx].quantity = e.target.value;
                                newItems[idx].subtotal = (parseFloat(e.target.value) || 0) * (parseFloat(newItems[idx].unitCost) || 0);
                                setAiProposal({...aiProposal, budgetItems: newItems});
                              }}
                              className="p-2 border rounded"
                              placeholder="Qty"
                            />
                            <input
                              type="number"
                              value={item.unitCost}
                              onChange={(e) => {
                                const newItems = [...aiProposal.budgetItems];
                                newItems[idx].unitCost = e.target.value;
                                newItems[idx].subtotal = (parseFloat(newItems[idx].quantity) || 0) * (parseFloat(e.target.value) || 0);
                                setAiProposal({...aiProposal, budgetItems: newItems});
                              }}
                              className="p-2 border rounded"
                              placeholder="Unit Cost"
                            />
                            <input
                              type="number"
                              value={item.subtotal}
                              readOnly
                              className="p-2 border rounded bg-gray-100 font-bold"
                              placeholder="Subtotal"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between items-center text-lg">
                          <span className="font-semibold">Direct Costs Total:</span>
                          <span className="font-bold text-green-600">LKR {calculateBudgetSubtotal(aiProposal.budgetItems).directTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span>Admin/MEAL/Safeguarding:</span>
                            <input
                              type="number"
                              value={aiProposal.adminPercentage}
                              onChange={(e) => setAiProposal({...aiProposal, adminPercentage: parseFloat(e.target.value) || 0})}
                              className="w-16 p-1 border rounded text-center"
                              min="0"
                              max="15"
                            />
                            <span>%</span>
                          </div>
                          <span className="font-bold">LKR {calculateBudgetSubtotal(aiProposal.budgetItems).adminCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl pt-3 border-t-2">
                          <span className="font-bold">GRAND TOTAL:</span>
                          <span className="font-bold text-green-600">LKR {calculateBudgetSubtotal(aiProposal.budgetItems).grandTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Risk & Mitigation */}
                    <div className="bg-white p-6 rounded-lg border-2 border-yellow-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                          9) Risk & Mitigation
                        </h3>
                        <button
                          onClick={() => {
                            setAiProposal({
                              ...aiProposal,
                              risks: [...aiProposal.risks, { risk: '', mitigation: '' }]
                            });
                          }}
                          className="flex items-center gap-2 bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add Risk
                        </button>
                      </div>
                      <div className="space-y-3">
                        {aiProposal.risks.map((risk, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                            <input
                              type="text"
                              value={risk.risk}
                              onChange={(e) => {
                                const newRisks = [...aiProposal.risks];
                                newRisks[idx].risk = e.target.value;
                                setAiProposal({...aiProposal, risks: newRisks});
                              }}
                              className="p-2 border rounded"
                              placeholder="Risk: e.g., delays, price changes, access"
                            />
                            <input
                              type="text"
                              value={risk.mitigation}
                              onChange={(e) => {
                                const newRisks = [...aiProposal.risks];
                                newRisks[idx].mitigation = e.target.value;
                                setAiProposal({...aiProposal, risks: newRisks});
                              }}
                              className="p-2 border rounded"
                              placeholder="Mitigation: contingency, alt suppliers"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sustainability/Exit */}
                    <div className="bg-white p-6 rounded-lg border-2 border-cyan-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-cyan-600" />
                        10) Sustainability/Exit Strategy
                      </h3>
                      <textarea
                        value={aiProposal.sustainability}
                        onChange={(e) => setAiProposal({...aiProposal, sustainability: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:outline-none"
                        rows="4"
                        placeholder="How benefits will continue: local ownership, training, O&M, handover to CBO/school..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 bg-white border-t-2 pt-4 flex gap-3">
                      <button 
                        onClick={handleGenerateProposalPDF}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-lg hover:shadow-xl font-bold text-lg flex items-center justify-center gap-3"
                      >
                        <Download className="w-6 h-6" />
                        Generate Professional Proposal (PDF)
                      </button>
                      <button 
                        onClick={() => {
                          const totalBudget = calculateBudgetSubtotal(aiProposal.budgetItems).grandTotal;
                          const newProposal = {
                            id: proposals.length + 1,
                            title: aiProposal.projectName,
                            donor: "To be assigned",
                            amount: Math.round(totalBudget / 300),
                            status: "Draft - Pending Submission",
                            submittedBy: currentUser.name,
                            submittedDate: new Date().toISOString().split('T')[0],
                            category: "Custom Proposal",
                            description: aiProposal.executiveSummary,
                            startDate: aiProposal.activities[0]?.start || '',
                            endDate: aiProposal.activities[aiProposal.activities.length-1]?.end || '',
                            targetBeneficiaries: parseInt(aiProposal.targetGroup.match(/\d+/)?.[0] || 0)
                          };
                          setProposals([...proposals, newProposal]);
                          setShowAIProposalWriter(false);
                          alert('✅ Proposal saved to system!\n\nYou can now:\n• Assign a donor\n• Submit for PM approval\n• Edit and refine\n• Generate reports');
                        }}
                        className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 font-bold text-lg flex items-center justify-center gap-3"
                      >
                        <CheckCircle className="w-6 h-6" />
                        Save to System
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Record Modal */}
            {showKPIModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowKPIModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-4" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <TrendingUp className="w-6 h-6" />
                          Add KPI Record
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">Performance metrics tracking</p>
                      </div>
                      <button onClick={() => setShowKPIModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                        <select 
                          value={kpiFormData.staffName}
                          onChange={(e) => setKpiFormData({...kpiFormData, staffName: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.name}>{s.name} - {s.position}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Month/Period *</label>
                        <input
                          type="month"
                          value={kpiFormData.month}
                          onChange={(e) => setKpiFormData({...kpiFormData, month: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Tasks Assigned *</label>
                        <input
                          type="number"
                          value={kpiFormData.tasksAssigned}
                          onChange={(e) => setKpiFormData({...kpiFormData, tasksAssigned: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="e.g., 20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Tasks Completed *</label>
                        <input
                          type="number"
                          value={kpiFormData.tasksCompleted}
                          onChange={(e) => setKpiFormData({...kpiFormData, tasksCompleted: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="e.g., 18"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Projects Handled</label>
                        <input
                          type="number"
                          value={kpiFormData.projectsHandled}
                          onChange={(e) => setKpiFormData({...kpiFormData, projectsHandled: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="e.g., 3"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">On-Time Delivery % *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={kpiFormData.onTimeDelivery}
                          onChange={(e) => setKpiFormData({...kpiFormData, onTimeDelivery: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="0-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Quality Score % *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={kpiFormData.qualityScore}
                          onChange={(e) => setKpiFormData({...kpiFormData, qualityScore: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="0-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Overall Rating *</label>
                      <select 
                        value={kpiFormData.rating}
                        onChange={(e) => setKpiFormData({...kpiFormData, rating: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select rating...</option>
                        <option value="5.0">5.0 - Outstanding</option>
                        <option value="4.5">4.5 - Excellent</option>
                        <option value="4.0">4.0 - Very Good</option>
                        <option value="3.5">3.5 - Good</option>
                        <option value="3.0">3.0 - Satisfactory</option>
                        <option value="2.5">2.5 - Needs Improvement</option>
                        <option value="2.0">2.0 - Below Expectations</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Comments</label>
                      <textarea
                        value={kpiFormData.comments}
                        onChange={(e) => setKpiFormData({...kpiFormData, comments: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        rows="3"
                        placeholder="Performance comments and observations..."
                      ></textarea>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleKPISubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Save KPI Record
                      </button>
                      <button onClick={() => setShowKPIModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Appraisal Modal */}
            {showAppraisalModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAppraisalModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-4" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6" />
                          Performance Appraisal
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">Comprehensive performance review</p>
                      </div>
                      <button onClick={() => setShowAppraisalModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                        <select 
                          value={appraisalData.staffName}
                          onChange={(e) => setAppraisalData({...appraisalData, staffName: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.name}>{s.name} - {s.position}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Review Period *</label>
                        <select 
                          value={appraisalData.period}
                          onChange={(e) => setAppraisalData({...appraisalData, period: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select period...</option>
                          <option value="Q1 2025">Q1 2025</option>
                          <option value="Q2 2025">Q2 2025</option>
                          <option value="Q3 2025">Q3 2025</option>
                          <option value="Q4 2025">Q4 2025</option>
                          <option value="Annual 2025">Annual 2025</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Overall Rating *</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setAppraisalData({...appraisalData, overallRating: rating.toString()})}
                            className={`flex-1 p-3 rounded-lg border-2 font-bold transition-all ${
                              appraisalData.overallRating === rating.toString()
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                            }`}
                          >
                            {rating}.0
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Key Strengths *</label>
                      <textarea
                        value={appraisalData.strengths}
                        onChange={(e) => setAppraisalData({...appraisalData, strengths: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="3"
                        placeholder="List the staff member's key strengths and achievements..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Areas for Improvement *</label>
                      <textarea
                        value={appraisalData.improvements}
                        onChange={(e) => setAppraisalData({...appraisalData, improvements: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="3"
                        placeholder="Areas that need development or improvement..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Goals for Next Period *</label>
                      <textarea
                        value={appraisalData.goals}
                        onChange={(e) => setAppraisalData({...appraisalData, goals: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="3"
                        placeholder="Set clear, measurable goals for the next review period..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Reviewer Comments</label>
                      <textarea
                        value={appraisalData.reviewerComments}
                        onChange={(e) => setAppraisalData({...appraisalData, reviewerComments: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="2"
                        placeholder="Additional comments from reviewer..."
                      ></textarea>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800">
                        <strong>Reviewer:</strong> {currentUser.name}<br/>
                        <strong>Review Date:</strong> {new Date().toLocaleDateString()}<br/>
                        <strong>Note:</strong> This appraisal will be sent to HR for records
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleAppraisalSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Submit Appraisal
                      </button>
                      <button onClick={() => setShowAppraisalModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Proposal Form Modal */}
            {showProposalForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowProposalForm(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">New Proposal Submission</h2>
                        <p className="text-blue-100 text-sm mt-1">Submit a new funding proposal for approval</p>
                      </div>
                      <button onClick={() => setShowProposalForm(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Proposal Title *</label>
                        <input 
                          type="text" 
                          value={newProposal.title} 
                          onChange={(e) => setNewProposal({...newProposal, title: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Enter proposal title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Donor Organization *</label>
                        <input 
                          type="text" 
                          value={newProposal.donor} 
                          onChange={(e) => setNewProposal({...newProposal, donor: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Enter donor name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Requested Amount (USD) *</label>
                        <input 
                          type="number" 
                          value={newProposal.amount} 
                          onChange={(e) => setNewProposal({...newProposal, amount: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Category *</label>
                        <select 
                          value={newProposal.category} 
                          onChange={(e) => setNewProposal({...newProposal, category: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select category</option>
                          <option value="Orphan Care">Orphan Care</option>
                          <option value="WASH">WASH</option>
                          <option value="IGP">Income Generation Programme</option>
                          <option value="Education">Education</option>
                          <option value="Health">Health</option>
                          <option value="Seasonal Relief">Seasonal Relief</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Target Beneficiaries</label>
                        <input 
                          type="number" 
                          value={newProposal.targetBeneficiaries} 
                          onChange={(e) => setNewProposal({...newProposal, targetBeneficiaries: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Number of beneficiaries"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Start Date</label>
                        <input 
                          type="date" 
                          value={newProposal.startDate} 
                          onChange={(e) => setNewProposal({...newProposal, startDate: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">End Date</label>
                        <input 
                          type="date" 
                          value={newProposal.endDate} 
                          onChange={(e) => setNewProposal({...newProposal, endDate: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                        <textarea 
                          value={newProposal.description} 
                          onChange={(e) => setNewProposal({...newProposal, description: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          rows="4"
                          placeholder="Describe the proposal objectives and activities..."
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <button onClick={handleSubmitProposal} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Submit Proposal
                      </button>
                      <button onClick={() => setShowProposalForm(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Project Form Modal */}
            {showProjectForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowProjectForm(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Create New Project</h2>
                        <p className="text-green-100 text-sm mt-1">Add a new project to your operations</p>
                      </div>
                      <button onClick={() => setShowProjectForm(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Project Name *</label>
                        <input 
                          type="text" 
                          value={newProject.name} 
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="Enter project name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Programme Area *</label>
                        <select 
                          value={newProject.programmeArea} 
                          onChange={(e) => setNewProject({...newProject, programmeArea: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        >
                          <option value="">Select programme area</option>
                          <option value="WASH">WASH</option>
                          <option value="Orphan Care">Orphan Care</option>
                          <option value="IGP">Income Generation Programme</option>
                          <option value="Education">Education</option>
                          <option value="Health">Health</option>
                          <option value="Seasonal Relief">Seasonal Relief</option>
                          <option value="Infrastructure">Infrastructure</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Budget (USD) *</label>
                        <input 
                          type="number" 
                          value={newProject.budget} 
                          onChange={(e) => setNewProject({...newProject, budget: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Donor/Funder *</label>
                        <input 
                          type="text" 
                          value={newProject.donor} 
                          onChange={(e) => setNewProject({...newProject, donor: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="Enter donor name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Target Beneficiaries</label>
                        <input 
                          type="number" 
                          value={newProject.targetBeneficiaries} 
                          onChange={(e) => setNewProject({...newProject, targetBeneficiaries: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="Number of beneficiaries"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Location</label>
                        <input 
                          type="text" 
                          value={newProject.location} 
                          onChange={(e) => setNewProject({...newProject, location: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="Project location"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Start Date</label>
                        <input 
                          type="date" 
                          value={newProject.startDate} 
                          onChange={(e) => setNewProject({...newProject, startDate: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">End Date</label>
                        <input 
                          type="date" 
                          value={newProject.endDate} 
                          onChange={(e) => setNewProject({...newProject, endDate: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Project Description</label>
                        <textarea 
                          value={newProject.description} 
                          onChange={(e) => setNewProject({...newProject, description: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          rows="4"
                          placeholder="Describe the project objectives, activities, and expected outcomes..."
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <button onClick={handleSubmitProject} className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Create Project
                      </button>
                      <button onClick={() => setShowProjectForm(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Welcome Banner */}
            <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0 shadow-lg">
              <CardContent className="pt-6 pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome back, {currentUser.name}! 👋</h2>
                    <p className="text-blue-100">Here's what's happening with your organization today</p>
                    <p className="text-blue-100 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl mb-2">{currentUser.avatar}</div>
                    <p className="text-sm text-blue-100">{currentUser.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Check-In Modal */}
            {showCheckInModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCheckInModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <CheckCircle className="w-6 h-6" />
                          Check-In
                        </h2>
                        <p className="text-green-100 text-sm mt-1">{new Date().toLocaleString()}</p>
                      </div>
                      <button onClick={() => setShowCheckInModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                      <select 
                        value={checkInData.staffName}
                        onChange={(e) => setCheckInData({...checkInData, staffName: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select staff member...</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.name}>{s.name} - {s.position}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Location *</label>
                      <select 
                        value={checkInData.location}
                        onChange={(e) => setCheckInData({...checkInData, location: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select location...</option>
                        <option value="Office - Colombo">Office - Colombo</option>
                        <option value="Office - Kandy">Office - Kandy</option>
                        <option value="Office - Jaffna">Office - Jaffna</option>
                        <option value="Remote Work">Remote Work</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Notes (Optional)</label>
                      <textarea
                        value={checkInData.notes}
                        onChange={(e) => setCheckInData({...checkInData, notes: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        rows="2"
                        placeholder="Any special notes..."
                      ></textarea>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>GPS Location:</strong> Will be automatically captured<br/>
                        <strong>Time:</strong> {new Date().toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleCheckIn} className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Confirm Check-In
                      </button>
                      <button onClick={() => setShowCheckInModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Check-Out Modal */}
            {showCheckOutModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCheckOutModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <X className="w-6 h-6" />
                          Check-Out
                        </h2>
                        <p className="text-red-100 text-sm mt-1">{new Date().toLocaleString()}</p>
                      </div>
                      <button onClick={() => setShowCheckOutModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                      <select 
                        value={checkOutData.staffName}
                        onChange={(e) => setCheckOutData({...checkOutData, staffName: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select staff member...</option>
                        {attendance.filter(a => a.date === "2025-10-11" && !a.checkOut).map((a, idx) => (
                          <option key={idx} value={a.staffName}>{a.staffName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Break Duration (hours) *</label>
                      <select 
                        value={checkOutData.breakDuration}
                        onChange={(e) => setCheckOutData({...checkOutData, breakDuration: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                      >
                        <option value="0">No break</option>
                        <option value="0.5">30 minutes</option>
                        <option value="1">1 hour</option>
                        <option value="1.5">1.5 hours</option>
                        <option value="2">2 hours</option>
                      </select>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Estimated Work Hours:</strong> {(8.5 - parseFloat(checkOutData.breakDuration || 0)).toFixed(1)}h<br/>
                        <strong>Time:</strong> {new Date().toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleCheckOut} className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Confirm Check-Out
                      </button>
                      <button onClick={() => setShowCheckOutModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Field Movement Modal */}
            {showFieldMovementModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFieldMovementModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <MapPin className="w-6 h-6" />
                          Log Field Movement
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">Field Movement Register</p>
                      </div>
                      <button onClick={() => setShowFieldMovementModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                        <select 
                          value={fieldMovementData.staffName}
                          onChange={(e) => setFieldMovementData({...fieldMovementData, staffName: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Expected Return Time</label>
                        <input
                          type="time"
                          value={fieldMovementData.expectedReturn}
                          onChange={(e) => setFieldMovementData({...fieldMovementData, expectedReturn: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Purpose of Visit *</label>
                      <input
                        type="text"
                        value={fieldMovementData.purpose}
                        onChange={(e) => setFieldMovementData({...fieldMovementData, purpose: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        placeholder="e.g., Orphan visit, Project site inspection"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Destination *</label>
                      <input
                        type="text"
                        value={fieldMovementData.destination}
                        onChange={(e) => setFieldMovementData({...fieldMovementData, destination: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        placeholder="Enter destination address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Notes</label>
                      <textarea
                        value={fieldMovementData.notes}
                        onChange={(e) => setFieldMovementData({...fieldMovementData, notes: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="3"
                        placeholder="Additional notes or details..."
                      ></textarea>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800">
                        <strong>Time Out:</strong> {new Date().toLocaleTimeString()}<br/>
                        <strong>GPS:</strong> Will be automatically captured<br/>
                        <strong>Status:</strong> Will be marked as "In Field"
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleFieldMovementSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Log Field Movement
                      </button>
                      <button onClick={() => setShowFieldMovementModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {/* CEO/Admin Dashboard */}
              {(currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                <>
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <FileText className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{proposals.length}</div>
                      <p className="text-blue-100 text-xs mb-2">Active Proposals</p>
                      <div className="flex items-center text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{proposals.filter(p => p.status.includes("Pending")).length} Pending</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Target className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{projects.length}</div>
                      <p className="text-green-100 text-xs mb-2">Active Projects</p>
                      <div className="flex items-center text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>On track</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <DollarSign className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">LKR {(totalIncome/1000000).toFixed(1)}M</div>
                      <p className="text-purple-100 text-xs mb-2">Total Funds</p>
                      <div className="w-3/4 bg-purple-400/30 rounded-full h-1.5">
                        <div className="bg-white rounded-full h-1.5" style={{ width: `${(totalExpenses/totalIncome)*100}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Finance Dashboard */}
              {currentUser.role === "Finance Manager" && (
                <>
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <TrendingUp className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">LKR {(totalIncome/1000000).toFixed(1)}M</div>
                      <p className="text-green-100 text-xs mb-2">Total Income</p>
                      <div className="flex items-center text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        <span>This Quarter</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Receipt className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">LKR {(totalExpenses/1000000).toFixed(1)}M</div>
                      <p className="text-red-100 text-xs mb-2">Total Expenses</p>
                      <div className="flex items-center text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>{Math.round((totalExpenses/totalIncome)*100)}% utilized</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <FileText className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{purchaseOrders.length}</div>
                      <p className="text-purple-100 text-xs mb-2">Purchase Orders</p>
                      <div className="flex items-center text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{purchaseOrders.filter(po => po.status.includes("Pending")).length} Pending</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Programme Manager Dashboard */}
              {currentUser.role === "Programme Manager" && (
                <>
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Target className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{projects.length}</div>
                      <p className="text-blue-100 text-xs mb-2">Active Projects</p>
                      <div className="flex items-center text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>All on track</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Baby className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{orphans.length}</div>
                      <p className="text-purple-100 text-xs mb-2">Active Orphans</p>
                      <div className="flex items-center text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>{pendingOrphans.length} Pending</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <CheckCircle className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{pendingOrphans.length + proposals.filter(p => p.status.includes("Pending")).length}</div>
                      <p className="text-orange-100 text-xs mb-2">Pending Approvals</p>
                      <div className="flex items-center text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Requires action</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Fundraising Dashboard */}
              {currentUser.role === "Fundraising Officer" && (
                <>
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <HeartHandshake className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{partners.length + donors.length}</div>
                      <p className="text-green-100 text-xs mb-2">Total Donors</p>
                      <div className="flex items-center text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>{partners.length} Organizations</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <FileText className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{proposals.length}</div>
                      <p className="text-blue-100 text-xs mb-2">Active Proposals</p>
                      <div className="flex items-center text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{proposals.filter(p => p.status.includes("Pending")).length} In Progress</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <DollarSign className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">LKR {(totalIncome/1000000).toFixed(1)}M</div>
                      <p className="text-purple-100 text-xs mb-2">Funds Raised</p>
                      <div className="flex items-center text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>This Quarter</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Orphan Manager Dashboard */}
              {currentUser.role === "Orphan Manager" && (
                <>
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Baby className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{orphans.length}</div>
                      <p className="text-purple-100 text-xs mb-2">Active Orphans</p>
                      <div className="flex items-center text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span>All registered</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <CheckCircle className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{orphans.filter(o => o.lastVisitDate).length}</div>
                      <p className="text-green-100 text-xs mb-2">Visited This Month</p>
                      <div className="flex items-center text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>{Math.round((orphans.filter(o => o.lastVisitDate).length / orphans.length) * 100)}% coverage</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Clock className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{pendingOrphans.length}</div>
                      <p className="text-orange-100 text-xs mb-2">Pending Approval</p>
                      <div className="flex items-center text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>Awaiting PM</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* HR Manager Dashboard */}
              {currentUser.role === "HR Manager" && (
                <>
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Users className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{staff.length}</div>
                      <p className="text-blue-100 text-xs mb-2">Total Staff</p>
                      <div className="flex items-center text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span>{staff.filter(s => s.status === "Active").length} Active</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <CheckCircle className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{attendance.filter(a => a.date === "2025-10-11").length}</div>
                      <p className="text-green-100 text-xs mb-2">Present Today</p>
                      <div className="flex items-center text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>{Math.round((attendance.filter(a => a.date === "2025-10-11").length / staff.length) * 100)}% attendance</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Clock className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{leaveRequests.filter(l => l.status === "Pending").length}</div>
                      <p className="text-orange-100 text-xs mb-2">Pending Leaves</p>
                      <div className="flex items-center text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>Requires approval</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Coordinator Dashboard */}
              {currentUser.role === "Coordinator" && (
                <>
                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Baby className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{orphans.filter(o => o.coordinator === currentUser.name).length}</div>
                      <p className="text-purple-100 text-xs mb-2">My Orphans</p>
                      <div className="flex items-center text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        <span>Assigned to me</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <CheckCircle className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{orphans.filter(o => o.coordinator === currentUser.name && o.lastVisitDate).length}</div>
                      <p className="text-green-100 text-xs mb-2">Visits Completed</p>
                      <div className="flex items-center text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>This month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Clock className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{orphans.filter(o => o.coordinator === currentUser.name && !o.lastVisitDate).length}</div>
                      <p className="text-orange-100 text-xs mb-2">Pending Visits</p>
                      <div className="flex items-center text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        <span>Need attention</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Donor Dashboard */}
              {currentUser.role === "Donor" && (
                <>
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Target className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{projects.length}</div>
                      <p className="text-blue-100 text-xs mb-2">Funded Projects</p>
                      <div className="flex items-center text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>Active programs</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <DollarSign className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">LKR {(totalIncome/1000000).toFixed(1)}M</div>
                      <p className="text-green-100 text-xs mb-2">Total Contributed</p>
                      <div className="flex items-center text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span>All time</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="pt-4 pb-4 flex flex-col items-center">
                      <Users className="w-8 h-8 mb-2" />
                      <div className="text-3xl font-bold mb-1">{orphans.length + generalBeneficiaries.length}</div>
                      <p className="text-purple-100 text-xs mb-2">Lives Impacted</p>
                      <div className="flex items-center text-xs">
                        <HeartHandshake className="w-3 h-3 mr-1" />
                        <span>Through your support</span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Enhanced Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Budget Allocation by Programme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "WASH", budget: 85000, spent: 42000, color: "bg-blue-500" },
                      { name: "Orphan Care", budget: 120000, spent: 60000, color: "bg-purple-500" },
                      { name: "IGP", budget: 45000, spent: 15000, color: "bg-green-500" },
                      { name: "Seasonal", budget: 30000, spent: 28000, color: "bg-orange-500" }
                    ].map((prog, idx) => {
                      const percentage = totalBudget > 0 ? Math.round((prog.budget / totalBudget) * 100) : 0;
                      const spentPercentage = Math.round((prog.spent / prog.budget) * 100);
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">{prog.name}</span>
                            <span className="text-sm text-gray-600">${(prog.budget/1000).toFixed(0)}K ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className={`${prog.color} h-3 rounded-full transition-all duration-500`} style={{ width: `${spentPercentage}%` }}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Spent: ${(prog.spent/1000).toFixed(0)}K</span>
                            <span>{spentPercentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => {
                    alert('Budget Allocation Report:\n\n' + 
                      'WASH: $85K (30%)\n' +
                      'Orphan Care: $120K (43%)\n' +
                      'IGP: $45K (16%)\n' +
                      'Seasonal: $30K (11%)\n\n' +
                      'Total Budget: $280K');
                  }} className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    View Detailed Report
                  </button>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-green-600" />
                    Monthly Expenditure Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["July", "August", "September", "October"].map((month, idx) => {
                      const amount = [2800000, 3200000, 2950000, 750000][idx];
                      const maxAmount = 3200000;
                      const percentage = (amount / maxAmount) * 100;
                      return (
                        <div key={idx}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{month}</span>
                            <span className="text-sm font-bold text-green-600">LKR {(amount/1000000).toFixed(2)}M</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => {
                    const total = 2800000 + 3200000 + 2950000 + 750000;
                    alert(`Expenditure Summary:\n\nJuly: LKR 2.8M\nAugust: LKR 3.2M\nSeptember: LKR 2.95M\nOctober: LKR 0.75M\n\nTotal: LKR ${(total/1000000).toFixed(2)}M\nAverage: LKR ${(total/4/1000000).toFixed(2)}M/month`);
                  }} className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Export Trend Data
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Staff Coordination Panel */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Real-Time Staff Coordination
                  </CardTitle>
                  <button onClick={() => alert('Staff coordination system active.\n\nAll field staff are tracked in real-time.\n\nLast sync: ' + new Date().toLocaleTimeString())} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700">
                    Refresh Status
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {staffCoordination.map(sc => (
                    <div key={sc.id} className="p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => alert(`Staff Member: ${sc.staff}\n\nCurrent Task: ${sc.currentTask}\nLocation: ${sc.location}\nStatus: ${sc.status}\nLast Update: ${sc.lastUpdate}\n\nClick 'View Details' for more information.`)}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">{sc.staff}</h4>
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Active"></span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">📋 {sc.currentTask}</p>
                      <p className="text-xs text-gray-600 mb-2">📍 {sc.location}</p>
                      <p className="text-xs text-gray-500">{sc.lastUpdate}</p>
                      <button onClick={(e) => { e.stopPropagation(); alert(`Sending message to ${sc.staff}...`); }} className="mt-2 w-full bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700">
                        Send Message
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg flex justify-between items-center">
                  <span className="text-sm text-indigo-800">💡 All staff members are currently active and on track</span>
                  <button onClick={() => {
                    const status = staffCoordination.map(s => `${s.staff}: ${s.currentTask} (${s.location})`).join('\n');
                    alert('Full Staff Status:\n\n' + status);
                  }} className="text-sm text-indigo-600 hover:underline">
                    View Full Report
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Internal Chat Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Internal Team Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {internalChat.map(msg => (
                      <div key={msg.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{msg.avatar}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm">{msg.sender}</span>
                            <span className="text-xs text-gray-500">{msg.time}</span>
                          </div>
                          <p className="text-sm text-gray-700">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder="Type a message..."
                      className="flex-1 p-2 border rounded-lg"
                    />
                    <button onClick={handleSendChatMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Panel */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-purple-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button onClick={handleAddProposal} className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg text-left flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">New Proposal</span>
                    </button>
                                          <button onClick={() => { if(hasAccess("orphans")) { setActiveTab("orphans"); setShowOrphanForm(true); } else { alert('Access denied. Only Programme Manager, CEO, Administrator and Orphan Manager can register orphans.'); }}} className="w-full p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg text-left flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Register Orphan</span>
                    </button>
                    <button onClick={() => { if(hasAccess("finance")) { handleAddIncome(); } else { alert('Access denied. Only Finance Manager, CEO and Administrator can record income.'); }}} className="w-full p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg text-left flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Record Income</span>
                    </button>
                    <button onClick={handleRecordAttendance} className="w-full p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:shadow-lg text-left flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Mark Attendance</span>
                    </button>
                    <button onClick={handleGenerateCustomReport} className="w-full p-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:shadow-lg text-left flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Generate Report</span>
                    </button>
                    <button onClick={() => setActiveTab("approvals")} className="w-full p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-lg text-left flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Approve Requests</span>
                    </button>
                    <button onClick={() => { if(hasAccess("communications")) { setActiveTab("communications"); } else { alert('Access denied.'); }}} className="w-full p-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:shadow-lg text-left flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      <span className="text-sm">Send Communication</span>
                    </button>
                    <button onClick={() => { if(hasAccess("inventory")) { setActiveTab("inventory"); } else { alert('Access denied.'); }}} className="w-full p-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:shadow-lg text-left flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span className="text-sm">Manage Inventory</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg border-2 border-green-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    System Health Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Database Connection</span>
                      </div>
                      <span className="text-sm text-green-600 font-semibold">Healthy</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">API Services</span>
                      </div>
                      <span className="text-sm text-green-600 font-semibold">Operational</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Backup Status</span>
                      </div>
                      <span className="text-sm text-yellow-600 font-semibold">Scheduled</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Storage Space</span>
                      </div>
                      <span className="text-sm text-green-600 font-semibold">67% Available</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800"><strong>Last System Check:</strong> 2 minutes ago</p>
                    <p className="text-xs text-blue-800 mt-1"><strong>Uptime:</strong> 99.8% (Last 30 days)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-blue-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Recent Activity Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <div className="flex gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New orphan visit recorded</p>
                        <p className="text-xs text-gray-500">Ahmed Hassan • 5 mins ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Payment processed</p>
                        <p className="text-xs text-gray-500">Monthly stipends • 15 mins ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New staff attendance marked</p>
                        <p className="text-xs text-gray-500">5 staff members • 25 mins ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Document uploaded</p>
                        <p className="text-xs text-gray-500">Financial Report Q3 • 1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Approval request pending</p>
                        <p className="text-xs text-gray-500">Purchase Order #013 • 2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Lifecycle Progress */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                    Project Lifecycle Overview
                  </CardTitle>
                  <button onClick={handleAddProject} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Project
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map(p => (
                    <div key={p.id} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-blue-50 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{p.name}</h4>
                          <p className="text-sm text-gray-600">{p.programmeArea} • {p.donor}</p>
                        </div>
                        <span className="px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-lg text-sm">
                          {p.stage}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex-1 h-2 rounded-full ${p.stage === "Proposal" || p.stage === "Implementation" || p.stage === "Completion" ? "bg-blue-500" : "bg-gray-300"}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${p.stage === "Implementation" || p.stage === "Completion" ? "bg-blue-500" : "bg-gray-300"}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${p.stage === "Completion" ? "bg-blue-500" : "bg-gray-300"}`}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mb-3">
                        <span className={p.stage === "Proposal" || p.stage === "Implementation" || p.stage === "Completion" ? "font-bold text-blue-600" : ""}>Proposal</span>
                        <span className={p.stage === "Implementation" || p.stage === "Completion" ? "font-bold text-blue-600" : ""}>Implementation</span>
                        <span className={p.stage === "Completion" ? "font-bold text-blue-600" : ""}>Completion</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Budget</p>
                          <p className="font-bold text-green-600">${p.budget.toLocaleString()}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Progress</p>
                          <p className="font-bold text-blue-600">{p.progress}%</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Beneficiaries</p>
                          <p className="font-bold text-purple-600">{p.beneficiaries}/{p.targetBeneficiaries}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedProject(p); setActiveTab("operations"); }} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                          View Details
                        </button>
                        <button onClick={() => generateProjectPDF(p)} className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm">
                          Generate Report
                        </button>
                        <button onClick={() => {
                          const newProgress = prompt(`Update progress for ${p.name}\nCurrent: ${p.progress}%\nEnter new progress (0-100):`, p.progress);
                          if (newProgress !== null && !isNaN(newProgress) && newProgress >= 0 && newProgress <= 100) {
                            handleUpdateProjectProgress(p.id, parseInt(newProgress));
                            alert(`✅ Progress updated to ${newProgress}%`);
                          }
                        }} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
                          Update
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fundraising */}
          <TabsContent value="fundraising" className="space-y-6">
            {/* Convert Proposal to Project Modal */}
            {showProposalDetails && showProposalDetails.status === "Approved" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowProposalDetails(null)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Convert to Project</h2>
                        <p className="text-green-100 text-sm mt-1">{showProposalDetails.title}</p>
                      </div>
                      <button onClick={() => setShowProposalDetails(null)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                      <p className="text-green-900 font-semibold mb-2">✅ Proposal Approved by CEO</p>
                      <p className="text-sm text-green-800">Ready to convert to active project and begin implementation</p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900">Project will be created with:</p>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                          <li>✓ Budget: ${showProposalDetails.amount?.toLocaleString()}</li>
                          <li>✓ Donor: {showProposalDetails.donor}</li>
                          <li>✓ All activities converted to tasks</li>
                          <li>✓ Timeline and milestones set</li>
                          <li>✓ Ready for implementation</li>
                        </ul>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Assign Programme Manager</label>
                        <select className="w-full p-3 border-2 rounded-lg">
                          <option>Programme Manager</option>
                          {users.filter(u => u.role === "Programme Manager").map(u => (
                            <option key={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Project Code (Optional)</label>
                        <input 
                          type="text" 
                          className="w-full p-3 border-2 rounded-lg"
                          placeholder="e.g., GERSL-2025-001"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button 
                        onClick={() => {
                          // Find the corresponding AI proposal data if it exists
                          const projectData = {
                            id: projects.length + 1,
                            name: showProposalDetails.title,
                            programmeArea: showProposalDetails.category,
                            budget: showProposalDetails.amount,
                            spent: 0,
                            status: "Planning",
                            stage: "Implementation",
                            progress: 0,
                            beneficiaries: 0,
                            targetBeneficiaries: showProposalDetails.targetBeneficiaries || 0,
                            nextDeadline: showProposalDetails.startDate || new Date().toISOString().split('T')[0],
                            nextTask: 'Project kickoff meeting',
                            donor: showProposalDetails.donor,
                            startDate: showProposalDetails.startDate || new Date().toISOString().split('T')[0],
                            endDate: showProposalDetails.endDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                            description: showProposalDetails.description,
                            location: showProposalDetails.location || 'TBD',
                            tasks: []
                          };

                          // Auto-generate tasks from activities if available
                          if (showProposalDetails.activities && showProposalDetails.activities.length > 0) {
                            projectData.tasks = showProposalDetails.activities.map((activity, idx) => ({
                              id: idx + 1,
                              title: activity.activity || `Task ${idx + 1}`,
                              description: activity.output || '',
                              assignedTo: 'Programme Manager',
                              dueDate: activity.end || projectData.endDate,
                              priority: idx === 0 ? 'Critical' : 'High',
                              status: 'Pending',
                              progress: 0,
                              comments: 0,
                              startDate: activity.start || projectData.startDate
                            }));
                          } else {
                            // Default tasks if no activities specified
                            projectData.tasks = [
                              {
                                id: 1,
                                title: 'Project Baseline Assessment',
                                description: 'Conduct initial assessment and beneficiary selection',
                                assignedTo: 'Programme Manager',
                                dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                                priority: 'Critical',
                                status: 'Pending',
                                progress: 0,
                                comments: 0,
                                startDate: projectData.startDate
                              },
                              {
                                id: 2,
                                title: 'Procurement & Setup',
                                description: 'Procure materials and setup project infrastructure',
                                assignedTo: 'Project Officer',
                                dueDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
                                priority: 'High',
                                status: 'Pending',
                                progress: 0,
                                comments: 0,
                                startDate: new Date(Date.now() + 31*24*60*60*1000).toISOString().split('T')[0]
                              },
                              {
                                id: 3,
                                title: 'Implementation & Delivery',
                                description: 'Execute main project activities',
                                assignedTo: 'Field Team',
                                dueDate: projectData.endDate,
                                priority: 'High',
                                status: 'Pending',
                                progress: 0,
                                comments: 0,
                                startDate: new Date(Date.now() + 61*24*60*60*1000).toISOString().split('T')[0]
                              }
                            ];
                          }

                          setProjects([...projects, projectData]);
                          
                          // Update proposal status
                          setProposals(proposals.map(p => 
                            p.id === showProposalDetails.id 
                              ? {...p, status: "Converted to Project", convertedDate: new Date().toISOString().split('T')[0]}
                              : p
                          ));

                          setShowProposalDetails(null);
                          setActiveTab("operations");
                          
                          alert(`🎉 Project Created Successfully!\n\n✅ ${projectData.name}\n\n📋 ${projectData.tasks.length} tasks auto-generated from activities\n👤 Assigned to Programme Manager\n📅 Timeline: ${projectData.startDate} to ${projectData.endDate}\n\n➡️ Switching to Operations tab...`);
                        }}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Convert to Project & Start Implementation
                      </button>
                      <button 
                        onClick={() => setShowProposalDetails(null)}
                        className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Partner Form Modal */}
            {showPartnerForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPartnerForm(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Add Partner Organization</h2>
                        <p className="text-green-100 text-sm mt-1">Register a new partner organization</p>
                      </div>
                      <button onClick={() => setShowPartnerForm(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Organization Name *</label>
                        <input 
                          type="text" 
                          value={newPartner.name} 
                          onChange={(e) => setNewPartner({...newPartner, name: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="Enter organization name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Country *</label>
                        <input 
                          type="text" 
                          value={newPartner.country} 
                          onChange={(e) => setNewPartner({...newPartner, country: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="Country"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Partnership Type</label>
                        <select 
                          value={newPartner.partnershipType} 
                          onChange={(e) => setNewPartner({...newPartner, partnershipType: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        >
                          <option value="">Select type</option>
                          <option value="Funding Partner">Funding Partner</option>
                          <option value="Implementation Partner">Implementation Partner</option>
                          <option value="Strategic Partner">Strategic Partner</option>
                          <option value="Technical Partner">Technical Partner</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Contact Person</label>
                        <input 
                          type="text" 
                          value={newPartner.contactPerson} 
                          onChange={(e) => setNewPartner({...newPartner, contactPerson: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="Contact person name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Email *</label>
                        <input 
                          type="email" 
                          value={newPartner.email} 
                          onChange={(e) => setNewPartner({...newPartner, email: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="email@organization.org"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Phone</label>
                        <input 
                          type="tel" 
                          value={newPartner.phone} 
                          onChange={(e) => setNewPartner({...newPartner, phone: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="+1-XXX-XXX-XXXX"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Address</label>
                        <textarea 
                          value={newPartner.address} 
                          onChange={(e) => setNewPartner({...newPartner, address: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          rows="3"
                          placeholder="Organization address"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <button onClick={handleSubmitPartner} className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Add Partner
                      </button>
                      <button onClick={() => setShowPartnerForm(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Donor Form Modal */}
            {showDonorForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDonorForm(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Add Individual Donor</h2>
                        <p className="text-blue-100 text-sm mt-1">Register a new individual donor</p>
                      </div>
                      <button onClick={() => setShowDonorForm(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
                        <input 
                          type="text" 
                          value={newDonor.name} 
                          onChange={(e) => setNewDonor({...newDonor, name: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Enter donor name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Email *</label>
                        <input 
                          type="email" 
                          value={newDonor.email} 
                          onChange={(e) => setNewDonor({...newDonor, email: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="email@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Phone *</label>
                        <input 
                          type="tel" 
                          value={newDonor.phone} 
                          onChange={(e) => setNewDonor({...newDonor, phone: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="+94-XX-XXXXXXX"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Country</label>
                        <input 
                          type="text" 
                          value={newDonor.country} 
                          onChange={(e) => setNewDonor({...newDonor, country: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Country"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Donor Type</label>
                        <select 
                          value={newDonor.donorType} 
                          onChange={(e) => setNewDonor({...newDonor, donorType: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select type</option>
                          <option value="Individual">Individual</option>
                          <option value="Regular">Regular Donor</option>
                          <option value="Major">Major Donor</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Address</label>
                        <input 
                          type="text" 
                          value={newDonor.address} 
                          onChange={(e) => setNewDonor({...newDonor, address: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="Full address"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Areas of Interest</label>
                        <textarea 
                          value={newDonor.interests} 
                          onChange={(e) => setNewDonor({...newDonor, interests: e.target.value})} 
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          rows="2"
                          placeholder="E.g., Orphan Care, Education, WASH"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <button onClick={handleSubmitDonor} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Add Donor
                      </button>
                      <button onClick={() => setShowDonorForm(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Donor Communication Modal */}
            {showDonorCommunication && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDonorCommunication(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Send Donor Communication</h2>
                        <p className="text-blue-100 text-sm mt-1">Create and send updates to donors</p>
                      </div>
                      <button onClick={() => setShowDonorCommunication(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Select Recipients</label>
                      <select className="w-full p-3 border-2 rounded-lg">
                        <option>All Donors</option>
                        <option>All Partners</option>
                        <option>Active Donors Only</option>
                        <option>Major Donors</option>
                        {partners.map(p => <option key={p.id}>{p.name}</option>)}
                        {donors.map(d => <option key={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Communication Type</label>
                      <select className="w-full p-3 border-2 rounded-lg">
                        <option>Monthly Update</option>
                        <option>Impact Report</option>
                        <option>Thank You Message</option>
                        <option>Project Completion</option>
                        <option>Custom Message</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Subject</label>
                      <input type="text" className="w-full p-3 border-2 rounded-lg" placeholder="Email subject" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Message</label>
                      <textarea rows="6" className="w-full p-3 border-2 rounded-lg" placeholder="Type your message..."></textarea>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => {
                        alert('✅ Communication sent successfully to selected recipients!');
                        setShowDonorCommunication(false);
                      }} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                        <Send className="w-4 h-4 inline mr-2" />Send Communication
                      </button>
                      <button onClick={() => setShowDonorCommunication(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Upload Modal */}
            {showMediaUpload && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMediaUpload(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Upload Media Files</h2>
                        <p className="text-purple-100 text-sm mt-1">Add photos, videos, and documents</p>
                      </div>
                      <button onClick={() => setShowMediaUpload(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Media Type</label>
                      <select className="w-full p-3 border-2 rounded-lg">
                        <option>Project Photos</option>
                        <option>Orphan Visit Photos</option>
                        <option>Impact Videos</option>
                        <option>Reports & Documents</option>
                        <option>Success Stories</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Related Project</label>
                      <select className="w-full p-3 border-2 rounded-lg">
                        <option>Select project...</option>
                        {projects.map(p => <option key={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Upload Files</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-2">Drag and drop files here or click to browse</p>
                        <input type="file" multiple className="hidden" id="media-upload" />
                        <label htmlFor="media-upload" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 cursor-pointer inline-block">
                          Choose Files
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Supported: JPG, PNG, MP4, PDF (Max 10MB each)</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Description/Tags</label>
                      <textarea rows="3" className="w-full p-3 border-2 rounded-lg" placeholder="Add description or tags for these files..."></textarea>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => {
                        alert('✅ Media files uploaded successfully!\n\n3 photos added to gallery\nAvailable for donor reports');
                        setShowMediaUpload(false);
                      }} className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold">
                        <Upload className="w-4 h-4 inline mr-2" />Upload Files
                      </button>
                      <button onClick={() => setShowMediaUpload(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send Report to Donor Modal */}
            {showSendReportModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSendReportModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">Generate & Send Report</h2>
                        <p className="text-green-100 text-sm mt-1">To: {selectedDonorForReport}</p>
                      </div>
                      <button onClick={() => setShowSendReportModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Report Type *</label>
                      <select 
                        value={reportPreferences.reportType}
                        onChange={(e) => setReportPreferences({...reportPreferences, reportType: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select report type...</option>
                        <option value="monthly">Monthly Impact Report</option>
                        <option value="quarterly">Quarterly Progress Report</option>
                        <option value="fund">Fund Utilization Report</option>
                        <option value="annual">Annual Impact Report</option>
                        <option value="project">Project Completion Report</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Report Format</label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            value="PDF" 
                            checked={reportPreferences.format === 'PDF'}
                            onChange={(e) => setReportPreferences({...reportPreferences, format: e.target.value})}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">PDF Document</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            value="Excel" 
                            checked={reportPreferences.format === 'Excel'}
                            onChange={(e) => setReportPreferences({...reportPreferences, format: e.target.value})}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Excel Spreadsheet</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            value="PowerPoint" 
                            checked={reportPreferences.format === 'PowerPoint'}
                            onChange={(e) => setReportPreferences({...reportPreferences, format: e.target.value})}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">PowerPoint</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3 text-gray-700">Include in Report</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input 
                            type="checkbox" 
                            checked={reportPreferences.includePhotos}
                            onChange={(e) => setReportPreferences({...reportPreferences, includePhotos: e.target.checked})}
                            className="w-5 h-5"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Photos & Media Gallery</p>
                            <p className="text-xs text-gray-600">Project photos, videos, and success stories</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input 
                            type="checkbox" 
                            checked={reportPreferences.includeFinancials}
                            onChange={(e) => setReportPreferences({...reportPreferences, includeFinancials: e.target.checked})}
                            className="w-5 h-5"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Financial Summary</p>
                            <p className="text-xs text-gray-600">Budget utilization, expenses, and fund allocation</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input 
                            type="checkbox" 
                            checked={reportPreferences.includeImpact}
                            onChange={(e) => setReportPreferences({...reportPreferences, includeImpact: e.target.checked})}
                            className="w-5 h-5"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Impact Metrics & Statistics</p>
                            <p className="text-xs text-gray-600">Beneficiaries reached, outcomes, and KPIs</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900 font-semibold mb-2">📊 Report Preview</p>
                      <div className="text-xs text-blue-800 space-y-1">
                        <p>• Report will be sent to {selectedDonorForReport}'s registered email</p>
                        <p>• Format: {reportPreferences.format}</p>
                        <p>• Estimated size: ~{reportPreferences.includePhotos ? '15-20' : '2-5'} MB</p>
                        <p>• Sections: {[reportPreferences.includePhotos && 'Media', reportPreferences.includeFinancials && 'Financial', reportPreferences.includeImpact && 'Impact'].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleGenerateAndSendReport} className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" />
                        Generate & Send Report
                      </button>
                      <button onClick={() => setShowSendReportModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Proposal Details Modal - Enhanced with Workflow Actions */}
            {showProposalDetails && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowProposalDetails(null)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold">{showProposalDetails.title}</h2>
                        <p className="text-blue-100 text-sm mt-1">Proposal Details & Workflow Actions</p>
                      </div>
                      <button onClick={() => setShowProposalDetails(null)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Workflow Status */}
                    <div className="p-4 rounded-lg border-2" style={{
                      borderColor: showProposalDetails.status.includes("Pending") ? '#f59e0b' : 
                                   showProposalDetails.status === "Approved" ? '#10b981' :
                                   showProposalDetails.status === "Rejected" ? '#ef4444' :
                                   showProposalDetails.status.includes("Sent to Donor") ? '#3b82f6' :
                                   showProposalDetails.status.includes("Converted") ? '#8b5cf6' : '#6b7280',
                      backgroundColor: showProposalDetails.status.includes("Pending") ? '#fef3c7' : 
                                      showProposalDetails.status === "Approved" ? '#d1fae5' :
                                      showProposalDetails.status === "Rejected" ? '#fee2e2' :
                                      showProposalDetails.status.includes("Sent to Donor") ? '#dbeafe' :
                                      showProposalDetails.status.includes("Converted") ? '#ede9fe' : '#f3f4f6'
                    }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg" style={{
                            color: showProposalDetails.status.includes("Pending") ? '#92400e' : 
                                   showProposalDetails.status === "Approved" ? '#065f46' :
                                   showProposalDetails.status === "Rejected" ? '#991b1b' :
                                   showProposalDetails.status.includes("Sent to Donor") ? '#1e40af' :
                                   showProposalDetails.status.includes("Converted") ? '#5b21b6' : '#374151'
                          }}>
                            Current Status: {showProposalDetails.status}
                          </p>
                          {showProposalDetails.approvedBy && (
                            <p className="text-sm mt-1" style={{
                              color: showProposalDetails.status.includes("Pending") ? '#78350f' : 
                                     showProposalDetails.status === "Approved" ? '#047857' :
                                     '#6b7280'
                            }}>
                              {showProposalDetails.status === "Approved" ? 'Approved' : 'Reviewed'} by: {showProposalDetails.approvedBy} on {showProposalDetails.approvalDate}
                            </p>
                          )}
                        </div>
                        {showProposalDetails.status.includes("Pending") && (
                          <AlertCircle className="w-8 h-8" style={{color: '#f59e0b'}} />
                        )}
                        {showProposalDetails.status === "Approved" && (
                          <CheckCircle className="w-8 h-8" style={{color: '#10b981'}} />
                        )}
                      </div>
                    </div>

                    {/* Workflow Steps Progress */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-semibold text-gray-900 mb-3">Workflow Progress:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            showProposalDetails.status ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {showProposalDetails.status ? '✓' : '1'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Proposal Created</p>
                            <p className="text-xs text-gray-600">By: {showProposalDetails.submittedBy} on {showProposalDetails.submittedDate}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            showProposalDetails.status === "Approved" || showProposalDetails.status.includes("Sent to Donor") || showProposalDetails.status.includes("Converted") 
                              ? 'bg-green-500 text-white' 
                              : showProposalDetails.status.includes("Pending CEO") 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-300 text-gray-600'
                          }`}>
                            {showProposalDetails.status === "Approved" || showProposalDetails.status.includes("Sent to Donor") || showProposalDetails.status.includes("Converted") ? '✓' : '2'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">CEO Approval</p>
                            {showProposalDetails.approvedBy && (
                              <p className="text-xs text-gray-600">Approved by: {showProposalDetails.approvedBy}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            showProposalDetails.status.includes("Sent to Donor") || showProposalDetails.status.includes("Converted")
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {showProposalDetails.status.includes("Sent to Donor") || showProposalDetails.status.includes("Converted") ? '✓' : '3'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Send to Donor</p>
                            {showProposalDetails.sentToDonorDate && (
                              <p className="text-xs text-gray-600">Sent on: {showProposalDetails.sentToDonorDate}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            showProposalDetails.status.includes("Converted")
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {showProposalDetails.status.includes("Converted") ? '✓' : '4'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Convert to Project</p>
                            {showProposalDetails.convertedDate && (
                              <p className="text-xs text-gray-600">Converted on: {showProposalDetails.convertedDate}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Proposal Details */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Donor Organization</p>
                        <p className="font-bold text-lg text-gray-900">{showProposalDetails.donor}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Requested Amount</p>
                        <p className="font-bold text-lg text-green-600">${showProposalDetails.amount?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-bold text-gray-900">{showProposalDetails.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Beneficiaries</p>
                        <p className="font-bold text-gray-900">{showProposalDetails.targetBeneficiaries || 'N/A'}</p>
                      </div>
                      {showProposalDetails.startDate && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Start Date</p>
                            <p className="font-bold text-gray-900">{showProposalDetails.startDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">End Date</p>
                            <p className="font-bold text-gray-900">{showProposalDetails.endDate}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {showProposalDetails.description && (
                      <div className="border-t pt-4">
                        <h3 className="font-bold text-gray-900 mb-3">Description</h3>
                        <p className="text-gray-700">{showProposalDetails.description}</p>
                      </div>
                    )}

                    {/* Action Buttons based on Status */}
                    <div className="flex gap-3 pt-4 border-t">
                      {showProposalDetails.status.includes("Pending CEO Approval") && (currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                        <>
                          <button 
                            onClick={() => {
                              setProposals(proposals.map(p => 
                                p.id === showProposalDetails.id 
                                  ? {...p, status: "Approved", approvedBy: currentUser.name, approvalDate: new Date().toISOString().split('T')[0]}
                                  : p
                              ));
                              setShowProposalDetails({...showProposalDetails, status: "Approved", approvedBy: currentUser.name, approvalDate: new Date().toISOString().split('T')[0]});
                              alert('✅ Proposal approved by CEO!\n\nNext step: Send to donor or convert to project');
                            }}
                            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Approve Proposal
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to reject this proposal?')) {
                                setProposals(proposals.map(p => 
                                  p.id === showProposalDetails.id 
                                    ? {...p, status: "Rejected", approvedBy: currentUser.name}
                                    : p
                                ));
                                setShowProposalDetails(null);
                                alert('Proposal rejected.');
                              }
                            }}
                            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center gap-2"
                          >
                            <X className="w-5 h-5" />
                            Reject
                          </button>
                        </>
                      )}

                      {showProposalDetails.status === "Approved" && !showProposalDetails.status.includes("Sent to Donor") && (
                        <>
                          <button 
                            onClick={() => {
                              setProposals(proposals.map(p => 
                                p.id === showProposalDetails.id 
                                  ? {...p, status: "Sent to Donor - Awaiting Response", sentToDonorDate: new Date().toISOString().split('T')[0]}
                                  : p
                              ));
                              
                              // Generate and download PDF
                              generatePDF(`Proposal_${showProposalDetails.title.replace(/\s+/g, '_')}`, {
                                'Proposal Title': showProposalDetails.title,
                                'Donor': showProposalDetails.donor,
                                'Amount Requested': `${showProposalDetails.amount?.toLocaleString()}`,
                                'Category': showProposalDetails.category,
                                'Target Beneficiaries': showProposalDetails.targetBeneficiaries || 'N/A',
                                'Duration': `${showProposalDetails.startDate || 'TBD'} to ${showProposalDetails.endDate || 'TBD'}`,
                                'Status': 'Approved by CEO - Ready for Donor Review',
                                'Submitted By': showProposalDetails.submittedBy,
                                'Submission Date': showProposalDetails.submittedDate,
                                'Approved By': showProposalDetails.approvedBy,
                                'Approval Date': showProposalDetails.approvalDate
                              });

                              alert(`📧 Proposal Sent to ${showProposalDetails.donor}!\n\n✅ Email sent with proposal document\n📄 PDF generated and attached\n📊 Status updated to "Awaiting Donor Response"\n\nWaiting for donor approval to convert to project...`);
                              setShowProposalDetails(null);
                            }}
                            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                          >
                            <Send className="w-5 h-5" />
                            Send to Donor
                          </button>
                          <button 
                            onClick={() => {
                              // Directly convert to project
                              const projectData = {
                                id: projects.length + 1,
                                name: showProposalDetails.title,
                                programmeArea: showProposalDetails.category,
                                budget: showProposalDetails.amount,
                                spent: 0,
                                status: "Planning",
                                stage: "Implementation",
                                progress: 0,
                                beneficiaries: 0,
                                targetBeneficiaries: showProposalDetails.targetBeneficiaries || 0,
                                nextDeadline: showProposalDetails.startDate || new Date().toISOString().split('T')[0],
                                nextTask: 'Project kickoff meeting',
                                donor: showProposalDetails.donor,
                                startDate: showProposalDetails.startDate || new Date().toISOString().split('T')[0],
                                endDate: showProposalDetails.endDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                                description: showProposalDetails.description,
                                location: showProposalDetails.location || 'TBD',
                                tasks: [
                                  {
                                    id: 1,
                                    title: 'Project Baseline Assessment',
                                    description: 'Conduct initial assessment and beneficiary selection',
                                    assignedTo: 'Programme Manager',
                                    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                                    priority: 'Critical',
                                    status: 'Pending',
                                    progress: 0,
                                    comments: 0
                                  },
                                  {
                                    id: 2,
                                    title: 'Procurement & Setup',
                                    description: 'Procure materials and setup project infrastructure',
                                    assignedTo: 'Project Officer',
                                    dueDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
                                    priority: 'High',
                                    status: 'Pending',
                                    progress: 0,
                                    comments: 0
                                  }
                                ]
                              };

                              setProjects([...projects, projectData]);
                              setProposals(proposals.map(p => 
                                p.id === showProposalDetails.id 
                                  ? {...p, status: "Converted to Project", convertedDate: new Date().toISOString().split('T')[0]}
                                  : p
                              ));

                              setShowProposalDetails(null);
                              alert(`🎉 Project Created!\n\n✅ ${projectData.name}\n📋 ${projectData.tasks.length} tasks auto-generated\n👤 Assigned to Programme Manager\n\n➡️ Check Operations tab to start implementation`);
                            }}
                            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2"
                          >
                            <Target className="w-5 h-5" />
                            Convert to Project
                          </button>
                        </>
                      )}

                      {showProposalDetails.status.includes("Sent to Donor") && !showProposalDetails.status.includes("Converted") && (
                        <button 
                          onClick={() => {
                            const projectData = {
                              id: projects.length + 1,
                              name: showProposalDetails.title,
                              programmeArea: showProposalDetails.category,
                              budget: showProposalDetails.amount,
                              spent: 0,
                              status: "Planning",
                              stage: "Implementation",
                              progress: 0,
                              beneficiaries: 0,
                              targetBeneficiaries: showProposalDetails.targetBeneficiaries || 0,
                              nextDeadline: showProposalDetails.startDate || new Date().toISOString().split('T')[0],
                              nextTask: 'Project kickoff meeting',
                              donor: showProposalDetails.donor,
                              startDate: showProposalDetails.startDate || new Date().toISOString().split('T')[0],
                              endDate: showProposalDetails.endDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
                              description: showProposalDetails.description,
                              location: showProposalDetails.location || 'TBD',
                              tasks: [
                                {
                                  id: 1,
                                  title: 'Project Baseline Assessment',
                                  description: 'Conduct initial assessment and beneficiary selection',
                                  assignedTo: 'Programme Manager',
                                  dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                                  priority: 'Critical',
                                  status: 'Pending',
                                  progress: 0,
                                  comments: 0
                                },
                                {
                                  id: 2,
                                  title: 'Procurement & Setup',
                                  description: 'Procure materials and setup project infrastructure',
                                  assignedTo: 'Project Officer',
                                  dueDate: new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
                                  priority: 'High',
                                  status: 'Pending',
                                  progress: 0,
                                  comments: 0
                                }
                              ]
                            };

                            setProjects([...projects, projectData]);
                            setProposals(proposals.map(p => 
                              p.id === showProposalDetails.id 
                                ? {...p, status: "Converted to Project", convertedDate: new Date().toISOString().split('T')[0]}
                                : p
                            ));

                            setShowProposalDetails(null);
                            setActiveTab("operations");
                            alert(`🎉 Donor Approved! Project Created!\n\n✅ ${projectData.name}\n📋 ${projectData.tasks.length} tasks auto-generated\n👤 Assigned to Programme Manager\n\n➡️ Switching to Operations tab...`);
                          }}
                          className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Donor Approved - Convert to Project
                        </button>
                      )}

                      <button 
                        onClick={() => {
                          generatePDF(`Proposal_${showProposalDetails.title.replace(/\s+/g, '_')}`, {
                            'Proposal Title': showProposalDetails.title,
                            'Donor': showProposalDetails.donor,
                            'Amount': `${showProposalDetails.amount?.toLocaleString()}`,
                            'Category': showProposalDetails.category,
                            'Status': showProposalDetails.status,
                            'Submitted By': showProposalDetails.submittedBy,
                            'Submission Date': showProposalDetails.submittedDate
                          });
                          alert('✅ Proposal document downloaded!');
                        }}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download PDF
                      </button>
                      
                      <button 
                        onClick={() => setShowProposalDetails(null)}
                        className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <h2 className="text-2xl font-bold">Fundraising & Donor Relations Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <HeartHandshake className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{partners.length + donors.length}</p>
                  <p className="text-blue-100 text-sm">Total Donors & Partners</p>
                  <div className="mt-3 flex items-center text-sm">
                    <Building2 className="w-4 h-4 mr-1" />
                    <span>{partners.length} Organizations</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <DollarSign className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">LKR {(totalIncome/1000000).toFixed(1)}M</p>
                  <p className="text-green-100 text-sm">Total Funds Raised</p>
                  <div className="mt-3 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>This Quarter</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{proposals.length}</p>
                  <p className="text-purple-100 text-sm">Active Proposals</p>
                  <div className="mt-3 flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{proposals.filter(p => p.status.includes("Pending")).length} In Progress</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Donor Communication & Reporting */}
            <Card className="shadow-lg border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Donor Communication & Media Hub
                  </CardTitle>
                  <button onClick={() => setShowDonorCommunication(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />New Communication
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Send Report to Donor */}
                  <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Send Report to Donor
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Select Donor</label>
                        <select className="w-full p-2 border rounded-lg">
                          <option>Select donor...</option>
                          {partners.map(p => (
                            <option key={p.id}>{p.name}</option>
                          ))}
                          {donors.map(d => (
                            <option key={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Report Type</label>
                        <select className="w-full p-2 border rounded-lg">
                          <option>Monthly Progress Report</option>
                          <option>Quarterly Impact Report</option>
                          <option>Fund Utilization Report</option>
                          <option>Annual Report</option>
                          <option>Project Completion Report</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Attach Media</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 flex flex-col items-center gap-1 text-sm">
                            <Image className="w-6 h-6 text-blue-600" />
                            <span>Photos</span>
                          </button>
                          <button className="p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 flex flex-col items-center gap-1 text-sm">
                            <FileText className="w-6 h-6 text-blue-600" />
                            <span>Documents</span>
                          </button>
                        </div>
                      </div>
                      <button onClick={() => {
                        const reportType = prompt('Select Report Type:\n1. Monthly Progress\n2. Quarterly Impact\n3. Fund Utilization\n4. Annual Report\nEnter number:');
                        const reports = { '1': 'Monthly Progress Report', '2': 'Quarterly Impact Report', '3': 'Fund Utilization Report', '4': 'Annual Report' };
                        if (reports[reportType]) {
                          const selectedDonor = prompt('Enter donor name or select from dropdown:') || 'Selected Donor';
                          generatePDF(reports[reportType], {
                            'Report Type': reports[reportType],
                            'Donor': selectedDonor,
                            'Date': new Date().toLocaleDateString(),
                            'Projects': projects.length,
                            'Beneficiaries': orphans.length + generalBeneficiaries.length
                          });
                          alert(`✅ ${reports[reportType]} generated and sent successfully!\n\nReport includes:\n• Project updates\n• Financial summary\n• Photos and videos\n• Impact metrics\n\n📥 PDF downloaded\n📧 Email sent to donor`);
                        }
                      }} className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" />
                        Generate & Send Report
                      </button>
                    </div>
                  </div>

                  {/* Media Library for Donor Reports */}
                  <div className="p-6 border-2 border-purple-200 rounded-lg bg-purple-50">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Image className="w-5 h-5 text-purple-600" />
                      Media Library
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                            <Image className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Orphan Visit Photos</p>
                            <p className="text-xs text-gray-500">45 images</p>
                          </div>
                        </div>
                        <button onClick={() => alert('📸 Opening photo gallery...\n\n45 high-quality photos available for donor reports')} className="text-blue-600 hover:underline text-sm">View</button>
                      </div>
                      <div className="p-3 bg-white rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                            <FileText className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Project Reports</p>
                            <p className="text-xs text-gray-500">12 documents</p>
                          </div>
                        </div>
                        <button onClick={() => alert('📄 Opening documents...\n\n12 comprehensive project reports available')} className="text-blue-600 hover:underline text-sm">View</button>
                      </div>
                      <div className="p-3 bg-white rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                            <Activity className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Impact Videos</p>
                            <p className="text-xs text-gray-500">8 videos</p>
                          </div>
                        </div>
                        <button onClick={() => alert('🎥 Opening video gallery...\n\n8 impact videos showcasing project success stories')} className="text-blue-600 hover:underline text-sm">View</button>
                      </div>
                      <button onClick={() => setShowMediaUpload(true)} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Media
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Communications Log */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-3">Recent Donor Communications</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Send className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Q3 Impact Report sent to Global Hope Foundation</p>
                          <p className="text-xs text-gray-500">Oct 8, 2025 • PDF + 15 photos</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Delivered</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Monthly Update sent to Children First Int'l</p>
                          <p className="text-xs text-gray-500">Oct 5, 2025 • Excel report</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Delivered</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proposals Pipeline with Workflow */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Proposals Pipeline & Workflow</CardTitle>
                  <button onClick={handleAddProposal} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg">
                    <Plus className="w-5 h-5" />Create New Proposal
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Workflow Status Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {["All", "Draft", "Pending CEO Approval", "Approved", "Sent to Donor", "Converted to Project", "Rejected"].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        // Filter logic can be added here
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      {status} ({status === "All" ? proposals.length : proposals.filter(p => status === "Draft" ? p.status.includes("Draft") : p.status.includes(status)).length})
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {proposals.map(p => (
                    <div key={p.id} className="p-5 border-2 rounded-xl hover:shadow-lg transition-all bg-gradient-to-r from-white via-blue-50 to-purple-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-xl text-gray-900 mb-1">{p.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{p.category} • {p.donor}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {p.submittedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {p.submittedDate}
                            </span>
                            {p.targetBeneficiaries && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {p.targetBeneficiaries} beneficiaries
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-green-600 mb-2">${p.amount?.toLocaleString()}</p>
                          <span className={`px-4 py-2 rounded-full text-xs font-bold inline-block ${
                            p.status.includes("Pending") ? "bg-yellow-100 text-yellow-800" : 
                            p.status === "Approved" ? "bg-green-100 text-green-800" :
                            p.status.includes("Sent to Donor") ? "bg-blue-100 text-blue-800" :
                            p.status.includes("Converted") ? "bg-purple-100 text-purple-800" :
                            p.status.includes("Rejected") ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>

                      {/* Mini Workflow Progress */}
                      <div className="flex items-center gap-2 mb-4 p-3 bg-white/50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${p.status ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="h-0.5 flex-1 bg-gray-300">
                          <div className={`h-full ${p.status.includes("Approved") || p.status.includes("Sent") || p.status.includes("Converted") ? 'bg-green-500' : 'bg-gray-300'}`} style={{width: '0%'}}></div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${p.status.includes("Approved") || p.status.includes("Sent") || p.status.includes("Converted") ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="h-0.5 flex-1 bg-gray-300">
                          <div className={`h-full ${p.status.includes("Sent") || p.status.includes("Converted") ? 'bg-blue-500' : 'bg-gray-300'}`} style={{width: '0%'}}></div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${p.status.includes("Sent") || p.status.includes("Converted") ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className="h-0.5 flex-1 bg-gray-300">
                          <div className={`h-full ${p.status.includes("Converted") ? 'bg-purple-500' : 'bg-gray-300'}`} style={{width: '0%'}}></div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${p.status.includes("Converted") ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowProposalDetails(p)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View & Manage Workflow
                        </button>
                        <button 
                          onClick={() => {
                            generatePDF(`Proposal_${p.title.replace(/\s+/g, '_')}`, {
                              'Proposal Title': p.title,
                              'Donor': p.donor,
                              'Amount': `${p.amount?.toLocaleString()}`,
                              'Category': p.category,
                              'Status': p.status
                            });
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Donor Relationship Management */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Partner Organizations</CardTitle>
                  <button onClick={handleAddPartner} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    <Plus className="w-4 h-4" />Add Partner
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {partners.map(p => (
                    <Card key={p.id} className="border-2 hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{p.name}</CardTitle>
                            <p className="text-sm text-blue-100">{p.country}</p>
                          </div>
                          <button className="bg-white/20 hover:bg-white/30 p-2 rounded">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600">Total Contribution</p>
                            <p className="text-xl font-bold text-green-600">${p.totalContributed.toLocaleString()}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-gray-600">Projects</p>
                              <p className="text-lg font-bold">{p.activeProjects}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Last Donation</p>
                              <p className="text-xs font-semibold">{p.lastDonation}</p>
                            </div>
                          </div>
                          <div className="pt-3 border-t space-y-2">
                            <button onClick={() => handleSendDonorReport(p.name)} className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1">
                              <Send className="w-4 h-4" />Send Report
                            </button>
                            <button onClick={() => {
                              alert(`📊 ${p.name} History:\n\nTotal Contributed: ${p.totalContributed.toLocaleString()}\nActive Projects: ${p.activeProjects}\nCountry: ${p.country}\nLast Donation: ${p.lastDonation}\n\nPartnership Duration: 2+ years\nStatus: Active\n\nClick 'View Details' for complete history.`);
                            }} className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center justify-center gap-1">
                              <Eye className="w-4 h-4" />View History
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Individual Donors */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Individual Donors</CardTitle>
                  <button onClick={handleAddDonor} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />Add Donor
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {donors.map(d => (
                    <div key={d.id} className="p-4 border-2 rounded-lg hover:border-blue-500 bg-gradient-to-r from-blue-50 to-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{d.name}</h4>
                          <p className="text-sm text-gray-600">{d.email}</p>
                          <p className="text-sm text-gray-600">{d.phone}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">{d.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-white rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Total Donated</p>
                          <p className="text-lg font-bold text-green-600">${d.totalDonated.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Projects</p>
                          <p className="text-lg font-bold">{d.projects}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSendDonorReport(d.name)} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1">
                          <Send className="w-4 h-4" />Send Report
                        </button>
                        <button onClick={() => {
                          alert(`👤 ${d.name} Profile:\n\nEmail: ${d.email}\nPhone: ${d.phone}\n\nTotal Donated: ${d.totalDonated.toLocaleString()}\nProjects: ${d.projects}\nStatus: ${d.status}\nLast Donation: ${d.lastDonation}\n\nDonation History:\n• Jan 2025: $5,000\n• Mar 2025: $3,500\n• Sep 2025: $7,000\n\nInterests: Orphan Care, Education`);
                        }} className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center justify-center gap-1">
                          <Eye className="w-4 h-4" />View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fundraising Analytics */}
            <Card className="shadow-lg border-2 border-green-500">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Fundraising Analytics & Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Proposals Success Rate</p>
                    <p className="text-5xl font-bold text-green-600">85%</p>
                    <p className="text-xs text-gray-500 mt-2">{proposals.filter(p => p.status === "Approved").length} of {proposals.length} approved</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Donor Retention Rate</p>
                    <p className="text-5xl font-bold text-blue-600">92%</p>
                    <p className="text-xs text-gray-500 mt-2">Strong donor relationships</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Average Donation</p>
                    <p className="text-5xl font-bold text-purple-600">$125K</p>
                    <p className="text-xs text-gray-500 mt-2">Per partner organization</p>
                  </div>
                </div>

                {/* Monthly Fundraising Trend */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Monthly Fundraising Trend</h4>
                  <div className="space-y-3">
                    {["July", "August", "September", "October"].map((month, idx) => {
                      const amounts = [4500000, 5200000, 4800000, 3500000];
                      const maxAmount = 5200000;
                      const percentage = (amounts[idx] / maxAmount) * 100;
                      return (
                        <div key={idx}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{month}</span>
                            <span className="text-sm font-bold text-green-600">LKR {(amounts[idx]/1000000).toFixed(1)}M</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => {
                    alert('📊 Fundraising Trend Analysis:\n\nJuly: LKR 4.5M\nAugust: LKR 5.2M (+15.6%)\nSeptember: LKR 4.8M (-7.7%)\nOctober: LKR 3.5M (-27.1%)\n\nTotal Q3: LKR 18M\nAverage: LKR 4.5M/month\n\nKey Insights:\n• Peak in August due to Ramadan\n• October shows seasonal dip\n• Overall healthy growth trend\n\n✅ Report exported to Excel');
                  }} className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Export Trend Data
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

                      {/* Operations */}
          <TabsContent value="operations" className="space-y-6">
            <h2 className="text-2xl font-bold">Operations Management</h2>
            
            {!selectedProject ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-600">Manage all active projects and operations</p>
                  <button onClick={handleAddProject} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:shadow-lg">
                    <Plus className="w-5 h-5" />Add New Project
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {projects.map(p => (
                    <Card key={p.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setSelectedProject(p)}>
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{p.name}</CardTitle>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{p.status}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold">Progress</span>
                            <span className="text-2xl font-bold text-blue-600">{p.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full" style={{ width: `${p.progress}%` }}></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-600">Budget</p>
                            <p className="text-xl font-bold">${p.budget.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Spent</p>
                            <p className="text-xl font-bold text-orange-600">${p.spent.toLocaleString()}</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); generateProjectPDF(p); }} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />Generate Report
                        </button>
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:shadow-lg flex items-center justify-center gap-2">
                          <ListChecks className="w-5 h-5" />View Full Project Details
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setSelectedProject(null)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg">← Back to Projects</button>
                
                {/* Project Header */}
                <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h3>
                        <p className="text-gray-600">{selectedProject.programmeArea} • {selectedProject.donor}</p>
                      </div>
                      <div className="space-x-2">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                          <FileText className="w-4 h-4 inline mr-2" />Generate Report
                        </button>
                        <button onClick={() => setShowProjectChat(!showProjectChat)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                          <MessageSquare className="w-4 h-4 inline mr-2" />Project Chat
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Task Management */}
                  <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                          <ListChecks className="w-5 h-5 text-blue-600" />
                          Task Management
                        </CardTitle>
                        <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
                          <Plus className="w-4 h-4 inline mr-1" />New Task
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(projectTasks[selectedProject.id] || []).map(task => (
                          <div key={task.id} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                <p className="text-sm text-gray-600">{task.description}</p>
                                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                  <span>👤 {task.assignedTo}</span>
                                  <span>📅 Due: {task.dueDate}</span>
                                  <span>💬 {task.comments} comments</span>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  task.priority === "Critical" ? "bg-red-100 text-red-800" :
                                  task.priority === "High" ? "bg-orange-100 text-orange-800" :
                                  "bg-blue-100 text-blue-800"
                                }`}>{task.priority}</span>
                                <div className="mt-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    task.status === "Completed" ? "bg-green-100 text-green-800" : 
                                    task.status === "In Progress" ? "bg-blue-100 text-blue-800" : 
                                    "bg-gray-100 text-gray-800"
                                  }`}>{task.status}</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full ${
                                task.status === "Completed" ? "bg-green-500" : 
                                task.status === "In Progress" ? "bg-blue-500" : 
                                "bg-gray-400"
                              }`} style={{ width: `${task.progress}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-600">
                              <span>Progress: {task.progress}%</span>
                              <div className="flex gap-2">
                                <button className="text-blue-600 hover:underline">Edit</button>
                                <button className="text-green-600 hover:underline">View Details</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Chat */}
                  {showProjectChat && (
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
                          Project Chat
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                          {(projectChats[selectedProject.id] || []).map(msg => (
                            <div key={msg.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm">{msg.sender}</span>
                                <span className="text-xs text-gray-500">{msg.time}</span>
                              </div>
                              <p className="text-sm text-gray-700">{msg.message}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={projectChatMessage}
                            onChange={(e) => setProjectChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendProjectChat()}
                            placeholder="Type a message..."
                            className="flex-1 p-2 border rounded-lg text-sm"
                          />
                          <button onClick={handleSendProjectChat} className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Report Generation Options */}
                  {!showProjectChat && (
                    <Card className="shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-green-600" />
                          Report Options
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-left">
                            <p className="font-semibold text-sm text-blue-900">Progress Report</p>
                            <p className="text-xs text-blue-700">Current project status</p>
                          </button>
                          <button className="w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left">
                            <p className="font-semibold text-sm text-green-900">Financial Report</p>
                            <p className="text-xs text-green-700">Budget vs actual</p>
                          </button>
                          <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-left">
                            <p className="font-semibold text-sm text-purple-900">Task Summary</p>
                            <p className="text-xs text-purple-700">All tasks overview</p>
                          </button>
                          <button className="w-full p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-left">
                            <p className="font-semibold text-sm text-orange-900">Donor Report</p>
                            <p className="text-xs text-orange-700">For stakeholders</p>
                          </button>
                          <button className="w-full p-3 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg text-left">
                            <p className="font-semibold text-sm text-pink-900">MEAL Report</p>
                            <p className="text-xs text-pink-700">Impact assessment</p>
                          </button>
                          <button className="w-full p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-left">
                            <p className="font-semibold text-sm text-indigo-900">Custom Report</p>
                            <p className="text-xs text-indigo-700">Build your own</p>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Gantt Chart */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Gantt Chart Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedProject.tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3">
                          <div className="w-48">
                            <p className="font-medium text-sm truncate">{task.title}</p>
                            <p className="text-xs text-gray-500">{task.assignedTo}</p>
                          </div>
                          <div className="flex-1 relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                            <div className={`absolute h-full rounded-lg flex items-center px-3 ${
                              task.status === "Completed" ? "bg-green-500" : 
                              task.status === "In Progress" ? "bg-blue-500" : 
                              "bg-gray-300"
                            }`} style={{ left: "10%", width: "40%" }}>
                              <span className="text-xs text-white font-semibold">{task.progress}%</span>
                            </div>
                          </div>
                          <div className="w-32 text-xs text-gray-600">
                            {task.startDate}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Add New Staff Modal */}
            {showAddStaffModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAddStaffModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-4" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <UserPlus className="w-6 h-6" />
                          Add New Staff Member
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">Staff onboarding & profile creation</p>
                      </div>
                      <button onClick={() => setShowAddStaffModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
                          <input
                            type="text"
                            value={newStaffData.fullName}
                            onChange={(e) => setNewStaffData({...newStaffData, fullName: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Enter full name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Email *</label>
                          <input
                            type="email"
                            value={newStaffData.email}
                            onChange={(e) => setNewStaffData({...newStaffData, email: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="email@gersl.org"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Phone Number *</label>
                          <input
                            type="tel"
                            value={newStaffData.phone}
                            onChange={(e) => setNewStaffData({...newStaffData, phone: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="+94-XX-XXXXXXX"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Join Date *</label>
                          <input
                            type="date"
                            value={newStaffData.joinDate}
                            onChange={(e) => setNewStaffData({...newStaffData, joinDate: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Address</label>
                          <input
                            type="text"
                            value={newStaffData.address}
                            onChange={(e) => setNewStaffData({...newStaffData, address: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Full address"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Employment Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Department *</label>
                          <select 
                            value={newStaffData.department}
                            onChange={(e) => setNewStaffData({...newStaffData, department: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Select department...</option>
                            <option value="Operations">Operations</option>
                            <option value="Finance">Finance</option>
                            <option value="Fundraising">Fundraising</option>
                            <option value="HR">Human Resources</option>
                            <option value="MEAL">MEAL</option>
                            <option value="IT">IT</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Position *</label>
                          <input
                            type="text"
                            value={newStaffData.position}
                            onChange={(e) => setNewStaffData({...newStaffData, position: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Project Officer"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Emergency Contact</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Emergency Contact Name</label>
                          <input
                            type="text"
                            value={newStaffData.emergencyContact}
                            onChange={(e) => setNewStaffData({...newStaffData, emergencyContact: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Contact person name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Emergency Phone</label>
                          <input
                            type="tel"
                            value={newStaffData.emergencyPhone}
                            onChange={(e) => setNewStaffData({...newStaffData, emergencyPhone: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="+94-XX-XXXXXXX"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">System Access Credentials</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Username *</label>
                          <input
                            type="text"
                            value={newStaffData.username}
                            onChange={(e) => setNewStaffData({...newStaffData, username: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="username"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Password *</label>
                          <input
                            type="password"
                            value={newStaffData.password}
                            onChange={(e) => setNewStaffData({...newStaffData, password: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Initial password"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Document Upload</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {['ID/NIC', 'Contract', 'Certificates', 'Photo', 'Bank Details', 'Other'].map((doc, idx) => (
                          <div key={idx}>
                            <label className="cursor-pointer">
                              <input type="file" className="hidden" />
                              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 flex flex-col items-center gap-2 text-center">
                                <Upload className="w-6 h-6 text-gray-400" />
                                <span className="text-xs text-gray-600">{doc}</span>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t">
                      <button onClick={handleAddStaffSubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Add Staff Member
                      </button>
                      <button onClick={() => setShowAddStaffModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Request Modal */}
            {showLeaveRequestModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLeaveRequestModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Calendar className="w-6 h-6" />
                          Leave Request Form
                        </h2>
                        <p className="text-orange-100 text-sm mt-1">Submit → Line Manager → HR Approval</p>
                      </div>
                      <button onClick={() => setShowLeaveRequestModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h3 className="font-semibold text-orange-900 mb-2">Leave Balance Summary</h3>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Annual Leave</p>
                          <p className="font-bold text-orange-600">12 days</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Sick Leave</p>
                          <p className="font-bold text-blue-600">7 days</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Casual Leave</p>
                          <p className="font-bold text-green-600">5 days</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Leave Type *</label>
                      <select 
                        value={leaveRequestData.leaveType}
                        onChange={(e) => setLeaveRequestData({...leaveRequestData, leaveType: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      >
                        <option value="">Select leave type...</option>
                        <option value="Annual Leave">Annual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                        <option value="Maternity Leave">Maternity Leave</option>
                        <option value="Paternity Leave">Paternity Leave</option>
                        <option value="Unpaid Leave">Unpaid Leave</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Start Date *</label>
                        <input
                          type="date"
                          value={leaveRequestData.startDate}
                          onChange={(e) => {
                            setLeaveRequestData({...leaveRequestData, startDate: e.target.value});
                            if (leaveRequestData.endDate) {
                              const start = new Date(e.target.value);
                              const end = new Date(leaveRequestData.endDate);
                              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                              setLeaveRequestData(prev => ({...prev, days: days.toString()}));
                            }
                          }}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">End Date *</label>
                        <input
                          type="date"
                          value={leaveRequestData.endDate}
                          onChange={(e) => {
                            setLeaveRequestData({...leaveRequestData, endDate: e.target.value});
                            if (leaveRequestData.startDate) {
                              const start = new Date(leaveRequestData.startDate);
                              const end = new Date(e.target.value);
                              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                              setLeaveRequestData(prev => ({...prev, days: days.toString()}));
                            }
                          }}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Total Days</label>
                      <input
                        type="number"
                        value={leaveRequestData.days}
                        readOnly
                        className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 font-bold text-lg"
                        placeholder="Auto-calculated"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Line Manager *</label>
                      <select 
                        value={leaveRequestData.lineManager}
                        onChange={(e) => setLeaveRequestData({...leaveRequestData, lineManager: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      >
                        <option value="">Select line manager...</option>
                        <option value="Programme Manager">Programme Manager</option>
                        <option value="Finance Manager">Finance Manager</option>
                        <option value="HR Manager">HR Manager</option>
                        <option value="CEO">CEO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Reason for Leave *</label>
                      <textarea
                        value={leaveRequestData.reason}
                        onChange={(e) => setLeaveRequestData({...leaveRequestData, reason: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        rows="4"
                        placeholder="Please provide reason for your leave request..."
                      ></textarea>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Approval Workflow</h4>
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                          <span>Submit</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center font-bold">2</div>
                          <span>Line Manager</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center font-bold">3</div>
                          <span>HR Verification</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleLeaveRequestSubmit} className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Submit Leave Request
                      </button>
                      <button onClick={() => setShowLeaveRequestModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
                

          {/* Finance */}
          <TabsContent value="finance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Finance Management - QuickBooks Style</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  <Plus className="w-4 h-4" />Income
                </button>
                <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  <Plus className="w-4 h-4" />Expense
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <TrendingUp className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">LKR {(totalIncome/1000000).toFixed(1)}M</p>
                  <p className="text-green-100 text-sm">Total Income</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <Receipt className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">LKR {(totalExpenses/1000000).toFixed(1)}M</p>
                  <p className="text-red-100 text-sm">Total Expenses</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <DollarSign className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">LKR {((totalIncome-totalExpenses)/1000000).toFixed(1)}M</p>
                  <p className="text-blue-100 text-sm">Net Balance</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{purchaseOrders.length}</p>
                  <p className="text-purple-100 text-sm">Purchase Orders</p>
                </CardContent>
              </Card>
            </div>

            {/* GERSL Finance Workflow */}
            <Card className="shadow-lg border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                  GERSL Finance Workflow (8-Step Process)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {financeWorkflow.map(workflow => (
                    <div key={workflow.id} className="border-2 rounded-lg p-6 bg-white">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{workflow.projectName}</h3>
                          <p className="text-sm text-gray-600">Budget Approved: ${workflow.budgetApproved.toLocaleString()}</p>
                        </div>
                        <span className="px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-lg">
                          {workflow.stage}
                        </span>
                      </div>

                      {/* Workflow Steps */}
                      <div className="space-y-3 mb-6">
                        {workflow.steps.map(step => (
                          <div key={step.step} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                              step.status === "Completed" ? "bg-green-500 text-white" :
                              step.status.includes("Progress") || step.status.includes("Pending") ? "bg-blue-500 text-white" :
                              "bg-gray-300 text-gray-600"
                            }`}>
                              {step.status === "Completed" ? "✓" : step.step}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-gray-900">{step.name}</p>
                                  {step.approvedBy && (
                                    <p className="text-xs text-gray-600">Approved by: {step.approvedBy} on {step.date}</p>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  step.status === "Completed" ? "bg-green-100 text-green-800" :
                                  step.status.includes("Progress") ? "bg-blue-100 text-blue-800" :
                                  "bg-yellow-100 text-yellow-800"
                                }`}>
                                  {step.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quotations */}
                      {workflow.quotations.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            Quotation Analysis
                          </h4>
                          <div className="space-y-2">
                            {workflow.quotations.map(quote => (
                              <div key={quote.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-gray-900">{quote.vendor}</p>
                                  <p className="text-sm text-gray-600">Amount: ${quote.amount.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  {quote.eSigned && (
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center gap-1">
                                      ✍️ E-Signed
                                    </span>
                                  )}
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    quote.status === "Selected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                  }`}>
                                    {quote.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => handleUploadQuotation(workflow.projectName)} className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
                            <Plus className="w-4 h-4 inline mr-2" />Upload New Quotation
                          </button>
                        </div>
                      )}

                      {/* Expenditure Submission */}
                      {workflow.expenditures.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-orange-600" />
                            Expenditure Submissions (with Receipts)
                          </h4>
                          <div className="space-y-2">
                            {workflow.expenditures.map(exp => (
                              <div key={exp.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-gray-900">{exp.description}</p>
                                  <p className="text-sm text-gray-600">Date: {exp.date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="font-bold text-lg">${exp.amount.toLocaleString()}</p>
                                  <button className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200">
                                    📎 View Receipt
                                  </button>
                                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                    {exp.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {workflow.currentStep === 7 && (currentUser.role === "CEO" || currentUser.role === "Finance Manager") && (
                        <div className="flex gap-2 pt-4 border-t">
                          <button onClick={() => handleApproveFundRequest(workflow.id)} className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 inline mr-2" />Approve Fund Request
                          </button>
                          <button onClick={() => handleRejectFundRequest(workflow.id)} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700">
                            <X className="w-4 h-4 inline mr-2" />Reject
                          </button>
                        </div>
                      )}
                      
                      {workflow.currentStep === 8 && (
                        <div className="pt-4 border-t">
                          <button onClick={() => handleSubmitExpenditure(workflow.projectName)} className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700">
                            <Upload className="w-4 h-4 inline mr-2" />Submit New Expenditure with Receipts
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Donor/Project</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{t.date}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.type === "Income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{t.type}</span>
                          </td>
                          <td className="px-4 py-3 text-sm">{t.category}</td>
                          <td className="px-4 py-3 text-sm">{t.donor || t.project}</td>
                          <td className="px-4 py-3 text-sm font-bold">{t.currency} {t.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">{t.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Orders */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Purchase Orders - Multi-Stage Approval Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {purchaseOrders.map(po => (
                    <div key={po.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900">{po.poNumber}</h4>
                          <p className="text-sm text-gray-600">{po.vendor} • {po.project}</p>
                          <p className="text-xs text-gray-500">Requested by {po.requestedBy}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">LKR {po.amount.toLocaleString()}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${po.status.includes("Pending") ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>{po.stage}</span>
                        </div>
                      </div>
                      {po.status.includes("Pending") && (currentUser.role === "CEO" || currentUser.role === "Finance Manager") && (
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 inline mr-2" />Approve
                          </button>
                          <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                            <X className="w-4 h-4 inline mr-2" />Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

                      {/* Beneficiary */}
          <TabsContent value="beneficiary" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">General Beneficiary Management</h2>
                <p className="text-gray-600 text-sm">NIC-based tracking - No duplicates across all programs</p>
              </div>
              <button onClick={handleAddBeneficiary} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:shadow-lg">
                <Plus className="w-5 h-5" />Add Beneficiary
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <UserCheck className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{generalBeneficiaries.length}</p>
                  <p className="text-blue-100 text-sm">Total Beneficiaries</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <DollarSign className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">LKR {(generalBeneficiaries.reduce((s,b) => s + b.totalAssistance, 0) / 1000).toFixed(0)}K</p>
                  <p className="text-green-100 text-sm">Total Assistance</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <Activity className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{generalBeneficiaries.reduce((s,b) => s + b.assistanceHistory.length, 0)}</p>
                  <p className="text-purple-100 text-sm">Total Records</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Beneficiary Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generalBeneficiaries.map(b => (
                    <div key={b.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">{b.name}</h4>
                          <p className="text-sm text-gray-600">NIC: {b.nic} (Primary Key)</p>
                          <p className="text-sm text-gray-600">{b.address}</p>
                          <p className="text-sm text-gray-600">{b.contact}</p>
                          {b.district && <p className="text-sm text-gray-600">District: {b.district}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">LKR {b.totalAssistance.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Total Assistance</p>
                          <p className="text-xs text-gray-500 mt-1">Last: {b.lastAssistanceDate || 'No assistance yet'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />View History ({b.assistanceHistory.length})
                        </button>
                        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" />Add Assistance
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals */}
          <TabsContent value="approvals" className="space-y-6">
            <h2 className="text-2xl font-bold">Multi-Level Approval Center</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-yellow-50 border-2 border-yellow-400">
                <CardHeader>
                  <CardTitle className="text-yellow-800">Pending Orphans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-yellow-600">{pendingOrphans.length}</div>
                  <p className="text-sm text-gray-600 mt-2">Awaiting PM Approval</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-2 border-blue-400">
                <CardHeader>
                  <CardTitle className="text-blue-800">Pending Proposals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">{proposals.filter(p => p.status.includes("Pending")).length}</div>
                  <p className="text-sm text-gray-600 mt-2">Awaiting Review</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-2 border-purple-400">
                <CardHeader>
                  <CardTitle className="text-purple-800">Pending POs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-600">{purchaseOrders.filter(po => po.status.includes("Pending")).length}</div>
                  <p className="text-sm text-gray-600 mt-2">Purchase Orders</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>All Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingOrphans.map(o => (
                    <div key={o.id} className="p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">Orphan: {o.fullName}</p>
                          <p className="text-sm text-gray-600">Submitted by {o.submittedBy} on {o.submittedDate}</p>
                        </div>
                        {(currentUser.role === "Programme Manager" || currentUser.role === "CEO") && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveOrphan(o.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                            <button onClick={() => handleRejectOrphan(o.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {proposals.filter(p => p.status.includes("Pending")).map(p => (
                    <div key={p.id} className="p-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">Proposal: {p.title}</p>
                          <p className="text-sm text-gray-600">${p.amount.toLocaleString()} - {p.donor}</p>
                        </div>
                        {(currentUser.role === "Programme Manager" || currentUser.role === "CEO") && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveProposal(p.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                            <button onClick={() => handleRejectProposal(p.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {purchaseOrders.filter(po => po.status.includes("Pending")).map(po => (
                    <div key={po.id} className="p-4 border-l-4 border-purple-400 bg-purple-50 rounded-r-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">PO: {po.poNumber}</p>
                          <p className="text-sm text-gray-600">LKR {po.amount.toLocaleString()} - {po.vendor}</p>
                        </div>
                        {(currentUser.role === "Finance Manager" || currentUser.role === "CEO") && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprovePO(po.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Approve</button>
                            <button onClick={() => handleRejectPO(po.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              <button onClick={handleGenerateCustomReport} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg">
                <Download className="w-5 h-5" />Generate Custom Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Finance Reports */}
              {(currentUser.role === "Finance Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                <>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Financial Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">Income, expenses & BvA</p>
                      <button onClick={() => generateFinancialPDF()} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">Generate</button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <Receipt className="w-8 h-8 text-blue-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Budget Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">Budget allocation & tracking</p>
                      <button onClick={() => selectedProject && generateProjectPDF(selectedProject)} className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm">Generate</button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Programme Reports */}
              {(currentUser.role === "Programme Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator" || currentUser.role === "Orphan Manager") && (
                <>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <Baby className="w-8 h-8 text-purple-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Orphan Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">AI-powered visit reports</p>
                      <button className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm">Generate</button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <Target className="w-8 h-8 text-blue-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Project Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">Progress & milestones</p>
                      <button className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm">Generate</button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Fundraising Reports */}
              {(currentUser.role === "Fundraising Officer" || currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                <>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <HeartHandshake className="w-8 h-8 text-green-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Donor Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">Impact & utilization</p>
                      <button className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm">Generate</button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <FileText className="w-8 h-8 text-blue-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Proposal Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">Status & success rate</p>
                      <button className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm">Generate</button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* HR Reports */}
              {(currentUser.role === "HR Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                <>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <Users className="w-8 h-8 text-indigo-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">HR Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">Attendance & performance</p>
                      <button className="w-full bg-indigo-600 text-white px-3 py-2 rounded text-sm">Generate</button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <BarChart className="w-8 h-8 text-purple-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Payroll Reports</h4>
                      <p className="text-sm text-gray-600 mb-3">Salary & deductions</p>
                      <button className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm">Generate</button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* MEAL Reports */}
              {(currentUser.role === "MEAL" || currentUser.role === "Programme Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <Activity className="w-8 h-8 text-orange-600 mb-3" />
                    <h4 className="font-bold text-gray-900 mb-2">MEAL Reports</h4>
                    <p className="text-sm text-gray-600 mb-3">Impact & evaluation</p>
                    <button className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm">Generate</button>
                  </CardContent>
                </Card>
              )}

              {/* Donor View - All Reports */}
              {currentUser.role === "Donor" && (
                <>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <Target className="w-8 h-8 text-blue-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Project Impact</h4>
                      <p className="text-sm text-gray-600 mb-3">Your funded projects</p>
                      <button className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm">View</button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Fund Utilization</h4>
                      <p className="text-sm text-gray-600 mb-3">How funds are used</p>
                      <button className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm">View</button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <Users className="w-8 h-8 text-purple-600 mb-3" />
                      <h4 className="font-bold text-gray-900 mb-2">Beneficiary Impact</h4>
                      <p className="text-sm text-gray-600 mb-3">Lives you've changed</p>
                      <button className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm">View</button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentUser.role !== "Finance Manager" && (currentUser.role === "Programme Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator" || currentUser.role === "Orphan Manager") && (
                    <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">Orphan Monthly Report - September 2025</p>
                        <p className="text-xs text-gray-500">Generated on 2025-10-01 • PDF</p>
                      </div>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        <Download className="w-4 h-4 inline mr-1" />Download
                      </button>
                    </div>
                  )}
                  {(currentUser.role === "Fundraising Officer" || currentUser.role === "CEO" || currentUser.role === "Administrator" || currentUser.role === "Donor") && (
                    <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">Donor Fund Utilization - Global Hope Foundation</p>
                        <p className="text-xs text-gray-500">Generated on 2025-09-30 • Excel</p>
                      </div>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        <Download className="w-4 h-4 inline mr-1" />Download
                      </button>
                    </div>
                  )}
                  {(currentUser.role === "Finance Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                    <>
                      <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">Q3 Financial Report 2025</p>
                          <p className="text-xs text-gray-500">Generated on 2025-09-30 • Excel</p>
                        </div>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                          <Download className="w-4 h-4 inline mr-1" />Download
                        </button>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">Budget vs Actual Report - September</p>
                          <p className="text-xs text-gray-500">Generated on 2025-10-01 • PDF</p>
                        </div>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                          <Download className="w-4 h-4 inline mr-1" />Download
                        </button>
                      </div>
                    </>
                  )}
                  {(currentUser.role === "Programme Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                    <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">Q3 2025 Project Progress Report</p>
                        <p className="text-xs text-gray-500">Generated on 2025-09-28 • PDF</p>
                      </div>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        <Download className="w-4 h-4 inline mr-1" />Download
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orphans Management */}
          <TabsContent value="orphans" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Orphan Care & Development</h2>
                <p className="text-gray-600 text-sm">Complete registration, visits, GPS tracking, and AI-powered reporting</p>
              </div>
              {(currentUser.role === "Programme Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator") && (
                <button onClick={() => setShowOrphanForm(!showOrphanForm)} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg">
                  <Plus className="w-5 h-5" />Register New Orphan
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <Baby className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{orphans.length}</p>
                  <p className="text-blue-100 text-sm">Active Orphans</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <Clock className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{pendingOrphans.length}</p>
                  <p className="text-yellow-100 text-sm">Pending PM Approval</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <DollarSign className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">LKR {(orphans.reduce((s, o) => s + (o.stipendAmount || 0), 0)).toLocaleString()}</p>
                  <p className="text-green-100 text-sm">Monthly Stipends</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <CheckCircle className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{orphans.filter(o => o.lastVisitDate).length}</p>
                  <p className="text-purple-100 text-sm">Visited This Month</p>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Search and Filter Bar */}
            <Card className="shadow-lg border-2 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-64">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name, district, or coordinator..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50">
                      <Filter className="w-5 h-5" />
                      Filters {(filterDistrict !== "All" || filterStatus !== "All") && <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">Active</span>}
                    </button>
                    <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none">
                      <option value="grid">Grid View</option>
                      <option value="list">List View</option>
                      <option value="map">Map View</option>
                    </select>
                  </div>

                  {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-2">District</label>
                        <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="w-full p-2 border rounded-lg">
                          <option value="All">All Districts</option>
                          <option value="Colombo">Colombo</option>
                          <option value="Kandy">Kandy</option>
                          <option value="Jaffna">Jaffna</option>
                          <option value="Galle">Galle</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-2 border rounded-lg">
                          <option value="All">All Statuses</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Sort By</label>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2 border rounded-lg">
                          <option value="name">Name (A-Z)</option>
                          <option value="age">Age</option>
                          <option value="district">District</option>
                          <option value="lastVisit">Last Visit Date</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button onClick={() => { setSearchQuery(""); setFilterDistrict("All"); setFilterStatus("All"); setSortBy("name"); }} className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Showing {sortedOrphans.length} of {orphans.length} orphans</span>
                    <button onClick={handleExportOrphansToExcel} className="text-blue-600 hover:underline flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Export to Excel
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GPS Map View */}
            {viewMode === "map" && !showOrphanForm && (
              <Card className="shadow-lg border-2 border-green-500">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Map className="w-6 h-6 text-green-600" />
                      Orphan Locations - Interactive GPS Map
                    </CardTitle>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                        <MapPin className="w-4 h-4 inline mr-1" />Cluster View
                      </button>
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                        <Download className="w-4 h-4 inline mr-1" />Export GPS Data
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-xl p-8 h-[600px] overflow-hidden border-4 border-blue-300">
                    {/* Sri Lanka Map Background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-32 h-48 bg-green-600 rounded-full"></div>
                    </div>
                    
                    {/* Map Title */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                      <p className="font-bold text-gray-900">Sri Lanka - Orphan Distribution</p>
                      <p className="text-xs text-gray-600">{sortedOrphans.length} orphans shown</p>
                    </div>

                    {/* Legend */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                      <p className="font-semibold text-sm text-gray-900 mb-2">Legend</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          <span className="text-xs">Active Orphan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          <span className="text-xs">Recently Visited</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                          <span className="text-xs">Needs Visit</span>
                        </div>
                      </div>
                    </div>

                    {/* Orphan Markers */}
                    {sortedOrphans.map(orphan => {
                      const latRange = [5.9, 9.9];
                      const lonRange = [79.7, 81.9];
                      
                      const topPercent = ((latRange[1] - orphan.latitude) / (latRange[1] - latRange[0])) * 80 + 10;
                      const leftPercent = ((orphan.longitude - lonRange[0]) / (lonRange[1] - lonRange[0])) * 80 + 10;
                      
                      const lastVisitDate = orphan.lastVisitDate ? new Date(orphan.lastVisitDate) : null;
                      const daysSinceVisit = lastVisitDate ? Math.floor((new Date() - lastVisitDate) / (1000 * 60 * 60 * 24)) : 999;
                      const markerColor = daysSinceVisit < 30 ? "green" : daysSinceVisit < 60 ? "blue" : "red";
                      
                      return (
                        <div
                          key={orphan.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                          style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                          onClick={() => setSelectedOrphan(orphan)}
                        >
                          <div className="relative">
                            <div className={`w-10 h-10 bg-${markerColor}-500 rounded-full border-4 border-white shadow-lg hover:scale-125 transition-transform flex items-center justify-center animate-pulse`}>
                              <Baby className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                              <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-2xl text-xs whitespace-nowrap">
                                <p className="font-bold text-sm mb-1">{orphan.fullName}</p>
                                <p className="text-gray-300">Age: {orphan.age} • {orphan.district}</p>
                                <p className="text-gray-300">Grade: {orphan.currentGrade}</p>
                                <p className="text-gray-300">📍 {orphan.latitude.toFixed(4)}°N, {orphan.longitude.toFixed(4)}°E</p>
                                <p className="text-gray-300">👤 {orphan.coordinator}</p>
                                <p className="text-gray-300">📅 Last visit: {orphan.lastVisitDate || "Never"}</p>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedOrphan(orphan); setShowVisitForm(true); }} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white">
                                  Record Visit
                                </button>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                  <div className="border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* City Labels */}
                    <div className="absolute" style={{ top: '40%', left: '48%' }}>
                      <div className="bg-white/70 px-2 py-1 rounded text-xs font-semibold">Colombo</div>
                    </div>
                    <div className="absolute" style={{ top: '55%', left: '52%' }}>
                      <div className="bg-white/70 px-2 py-1 rounded text-xs font-semibold">Kandy</div>
                    </div>
                    <div className="absolute" style={{ top: '25%', left: '55%' }}>
                      <div className="bg-white/70 px-2 py-1 rounded text-xs font-semibold">Jaffna</div>
                    </div>

                    {/* Coordinates Display */}
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                      <p className="text-xs text-gray-600">🖱️ Hover over markers for details</p>
                      <p className="text-xs text-gray-600">🖱️ Click marker to view full profile</p>
                    </div>
                  </div>

                  {/* Map Statistics */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{sortedOrphans.length}</p>
                      <p className="text-xs text-gray-600">Locations Mapped</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{new Set(sortedOrphans.map(o => o.district)).size}</p>
                      <p className="text-xs text-gray-600">Districts Covered</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{new Set(sortedOrphans.map(o => o.coordinator)).size}</p>
                      <p className="text-xs text-gray-600">Active Coordinators</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                      <CheckCircle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-600">{sortedOrphans.filter(o => o.lastVisitDate).length}</p>
                      <p className="text-xs text-gray-600">Recently Visited</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Orphan Registration Form */}
            {showOrphanForm && (
              <Card className="shadow-lg border-2 border-blue-500">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Baby className="w-6 h-6 text-blue-600" />
                      Orphan Registration Form - All Mandatory Fields
                    </CardTitle>
                    <button onClick={() => { setShowOrphanForm(false); setFormErrors({}); setUploadedFiles({ birthCertificate: null, deathCertificate: null, ppPhoto: null, guardianNIC: null }); }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {showSuccessMessage && (
                    <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-bold text-green-900">Success!</p>
                        <p className="text-sm text-green-800">Orphan registered and submitted for PM approval</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-4 text-gray-900 border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Full Name *</label>
                          <input type="text" value={newOrphan.fullName} onChange={(e) => setNewOrphan({...newOrphan, fullName: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Enter full name" />
                          {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                          <input type="date" value={newOrphan.dateOfBirth} onChange={(e) => setNewOrphan({...newOrphan, dateOfBirth: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`} />
                          {formErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{formErrors.dateOfBirth}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Contact Number *</label>
                          <input type="tel" value={newOrphan.contactNumber} onChange={(e) => setNewOrphan({...newOrphan, contactNumber: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-300'}`} placeholder="+94-XX-XXXXXXX" />
                          {formErrors.contactNumber && <p className="text-xs text-red-500 mt-1">{formErrors.contactNumber}</p>}
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium mb-1">Address *</label>
                          <input type="text" value={newOrphan.address} onChange={(e) => setNewOrphan({...newOrphan, address: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.address ? 'border-red-500' : 'border-gray-300'}`} placeholder="Full address" />
                          {formErrors.address && <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-4 text-gray-900 border-b pb-2">Guardian Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Guardian Name *</label>
                          <input type="text" value={newOrphan.guardianName} onChange={(e) => setNewOrphan({...newOrphan, guardianName: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.guardianName ? 'border-red-500' : 'border-gray-300'}`} />
                          {formErrors.guardianName && <p className="text-xs text-red-500 mt-1">{formErrors.guardianName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Guardian NIC *</label>
                          <input type="text" value={newOrphan.guardianNIC} onChange={(e) => setNewOrphan({...newOrphan, guardianNIC: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.guardianNIC ? 'border-red-500' : 'border-gray-300'}`} />
                          {formErrors.guardianNIC && <p className="text-xs text-red-500 mt-1">{formErrors.guardianNIC}</p>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-4 text-gray-900 border-b pb-2">Education Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">School Name *</label>
                          <input type="text" value={newOrphan.schoolName} onChange={(e) => setNewOrphan({...newOrphan, schoolName: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.schoolName ? 'border-red-500' : 'border-gray-300'}`} />
                          {formErrors.schoolName && <p className="text-xs text-red-500 mt-1">{formErrors.schoolName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Current Grade *</label>
                          <input type="text" value={newOrphan.currentGrade} onChange={(e) => setNewOrphan({...newOrphan, currentGrade: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.currentGrade ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., Grade 5" />
                          {formErrors.currentGrade && <p className="text-xs text-red-500 mt-1">{formErrors.currentGrade}</p>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-4 text-gray-900 border-b pb-2">Location (GPS)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">District *</label>
                          <select value={newOrphan.district} onChange={(e) => setNewOrphan({...newOrphan, district: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.district ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="">Select District</option>
                            <option value="Colombo">Colombo</option>
                            <option value="Kandy">Kandy</option>
                            <option value="Galle">Galle</option>
                            <option value="Jaffna">Jaffna</option>
                            <option value="Batticaloa">Batticaloa</option>
                          </select>
                          {formErrors.district && <p className="text-xs text-red-500 mt-1">{formErrors.district}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-green-600" />
                            Latitude *
                          </label>
                          <input type="text" value={newOrphan.latitude} onChange={(e) => setNewOrphan({...newOrphan, latitude: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.latitude ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., 6.9271" />
                          {formErrors.latitude && <p className="text-xs text-red-500 mt-1">{formErrors.latitude}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-green-600" />
                            Longitude *
                          </label>
                          <input type="text" value={newOrphan.longitude} onChange={(e) => setNewOrphan({...newOrphan, longitude: e.target.value})} className={`w-full p-2 border rounded-lg ${formErrors.longitude ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., 79.8612" />
                          {formErrors.longitude && <p className="text-xs text-red-500 mt-1">{formErrors.longitude}</p>}
                        </div>
                      </div>
                      {formErrors.gps && <p className="text-xs text-red-500 mt-1">{formErrors.gps}</p>}
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-4 text-gray-900 border-b pb-2">Document Uploads</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload('birthCertificate', e)} className="hidden" />
                            <div className={`p-4 border-2 border-dashed rounded-lg hover:border-blue-500 flex flex-col items-center gap-2 ${uploadedFiles.birthCertificate ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                              {uploadedFiles.birthCertificate ? (
                                <>
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                  <span className="text-xs text-green-700 font-semibold text-center">{uploadedFiles.birthCertificate.name}</span>
                                  <span className="text-xs text-gray-500">{uploadedFiles.birthCertificate.size}</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-gray-400" />
                                  <span className="text-xs text-gray-600 text-center">Birth Certificate</span>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                        
                        <div>
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload('deathCertificate', e)} className="hidden" />
                            <div className={`p-4 border-2 border-dashed rounded-lg hover:border-blue-500 flex flex-col items-center gap-2 ${uploadedFiles.deathCertificate ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                              {uploadedFiles.deathCertificate ? (
                                <>
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                  <span className="text-xs text-green-700 font-semibold text-center">{uploadedFiles.deathCertificate.name}</span>
                                  <span className="text-xs text-gray-500">{uploadedFiles.deathCertificate.size}</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-gray-400" />
                                  <span className="text-xs text-gray-600 text-center">Death Certificate</span>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                        
                        <div>
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload('ppPhoto', e)} className="hidden" />
                            <div className={`p-4 border-2 border-dashed rounded-lg hover:border-blue-600 flex flex-col items-center gap-2 ${uploadedFiles.ppPhoto ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
                              {uploadedFiles.ppPhoto ? (
                                <>
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                  <span className="text-xs text-green-700 font-semibold text-center">{uploadedFiles.ppPhoto.name}</span>
                                  <span className="text-xs text-gray-500">{uploadedFiles.ppPhoto.size}</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-blue-600" />
                                  <span className="text-xs text-blue-700 font-semibold text-center">PP Size Photo *</span>
                                </>
                              )}
                            </div>
                          </label>
                          {formErrors.ppPhoto && <p className="text-xs text-red-500 mt-1">{formErrors.ppPhoto}</p>}
                        </div>
                        
                        <div>
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload('guardianNIC', e)} className="hidden" />
                            <div className={`p-4 border-2 border-dashed rounded-lg hover:border-blue-500 flex flex-col items-center gap-2 ${uploadedFiles.guardianNIC ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                              {uploadedFiles.guardianNIC ? (
                                <>
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                  <span className="text-xs text-green-700 font-semibold text-center">{uploadedFiles.guardianNIC.name}</span>
                                  <span className="text-xs text-gray-500">{uploadedFiles.guardianNIC.size}</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-gray-400" />
                                  <span className="text-xs text-gray-600 text-center">Guardian NIC</span>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Accepted formats: JPG, PNG, PDF (Max 5MB per file)</p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button onClick={handleSubmitOrphan} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Submit for PM Approval
                      </button>
                      <button onClick={() => { setShowOrphanForm(false); setFormErrors({}); setUploadedFiles({ birthCertificate: null, deathCertificate: null, ppPhoto: null, guardianNIC: null }); }} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Orphans - Grid/List/Map View */}
            {!showOrphanForm && viewMode !== "map" && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Active Orphans</CardTitle>
                </CardHeader>
                <CardContent>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedOrphans.map(o => (
                        <Card key={o.id} className="border-2 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedOrphan(o)}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {o.fullName.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-900">{o.fullName}</h4>
                                <p className="text-sm text-gray-600">{o.age} years • {o.currentGrade}</p>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full mt-1 inline-block">
                                  {o.status}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4 bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span className="font-medium">{o.district}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-600" />
                                <span>{o.coordinator}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-orange-600" />
                                <span className="truncate">{o.schoolName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-600" />
                                <span>Last visit: {o.lastVisitDate || "No visits"}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <p className="text-xs text-gray-600">Academic</p>
                                <p className="font-bold text-blue-600">{o.academicPerformance}</p>
                              </div>
                              <div className="text-center p-2 bg-green-50 rounded">
                                <p className="text-xs text-gray-600">Health</p>
                                <p className="font-bold text-green-600">{o.healthStatus}</p>
                              </div>
                            </div>

                            {(currentUser.role === "Coordinator" || currentUser.role === "Programme Manager" || currentUser.role === "CEO") && (
                              <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setSelectedOrphan(o); setShowVisitForm(true); }} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1">
                                  <Plus className="w-4 h-4" />Visit
                                </button>
                                <button onClick={(e) => e.stopPropagation()} className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center justify-center gap-1">
                                  <Eye className="w-4 h-4" />Details
                                </button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedOrphans.map(o => (
                        <div key={o.id} className="p-4 border-2 hover:border-blue-500 rounded-lg hover:shadow-md transition-all cursor-pointer flex items-center gap-4" onClick={() => setSelectedOrphan(o)}>
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                            {o.fullName.charAt(0)}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                              <h4 className="font-bold text-gray-900">{o.fullName}</h4>
                              <p className="text-sm text-gray-600">{o.age} years</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">District</p>
                              <p className="font-medium">{o.district}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Coordinator</p>
                              <p className="font-medium text-sm">{o.coordinator}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Academic</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                o.academicPerformance === "Excellent" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {o.academicPerformance}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Last Visit</p>
                              <p className="font-medium text-sm">{o.lastVisitDate || "No visits"}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); setSelectedOrphan(o); setShowVisitForm(true); }} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm">
                              Record Visit
                            </button>
                            <button onClick={(e) => e.stopPropagation()} className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm">
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Monthly Visit Form */}
            {showVisitForm && selectedOrphan && (
              <Card className="shadow-lg border-2 border-blue-500">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex justify-between items-center">
                    <CardTitle>Monthly Visit Report - {selectedOrphan.fullName}</CardTitle>
                    <button onClick={() => { setShowVisitForm(false); setSelectedOrphan(null); }} className="text-gray-500 hover:text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Visit Date *</label>
                        <input type="date" value={newVisit.date} onChange={(e) => setNewVisit({...newVisit, date: e.target.value})} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Academic Performance *</label>
                        <select value={newVisit.academic} onChange={(e) => setNewVisit({...newVisit, academic: e.target.value})} className="w-full p-2 border rounded-lg">
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                          <option value="Needs Improvement">Needs Improvement</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Attendance % *</label>
                        <input type="number" min="0" max="100" value={newVisit.attendance} onChange={(e) => setNewVisit({...newVisit, attendance: e.target.value})} className="w-full p-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Spiritual Growth *</label>
                        <select value={newVisit.spiritual} onChange={(e) => setNewVisit({...newVisit, spiritual: e.target.value})} className="w-full p-2 border rounded-lg">
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Needs Attention">Needs Attention</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Health Condition *</label>
                        <select value={newVisit.health} onChange={(e) => setNewVisit({...newVisit, health: e.target.value})} className="w-full p-2 border rounded-lg">
                          <option value="Good">Good</option>
                          <option value="Minor Issues">Minor Issues</option>
                          <option value="Needs Medical Attention">Needs Medical Attention</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Coordinator Remarks *</label>
                        <textarea value={newVisit.remarks} onChange={(e) => setNewVisit({...newVisit, remarks: e.target.value})} className="w-full p-2 border rounded-lg" rows="3" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Upload Photos (2 required - Studying/Playing)</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-600">Photo 1</span>
                          </button>
                          <button className="p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-600">Photo 2</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddVisit} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                        Submit & Generate AI Report
                      </button>
                      <button onClick={() => { setShowVisitForm(false); setSelectedOrphan(null); }} className="bg-gray-300 px-6 py-3 rounded-lg hover:bg-gray-400">
                        Cancel
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Orphan Profile Modal */}
            {selectedOrphan && !showVisitForm && !showOrphanForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrphan(null)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                          {selectedOrphan.fullName.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{selectedOrphan.fullName}</h2>
                          <p className="text-blue-100">Account: {selectedOrphan.accountNumber || "N/A"}</p>
                          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mt-2">
                            {selectedOrphan.status}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setSelectedOrphan(null)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{selectedOrphan.age}</p>
                        <p className="text-xs text-gray-600">Years Old</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{selectedOrphan.visits?.length || 0}</p>
                        <p className="text-xs text-gray-600">Total Visits</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{selectedOrphan.academicPerformance}</p>
                        <p className="text-xs text-gray-600">Academic</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">LKR {(selectedOrphan.totalStipendPaid || 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-600">Total Stipend</p>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Date of Birth</p>
                          <p className="font-medium">{selectedOrphan.dateOfBirth}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">District</p>
                          <p className="font-medium">{selectedOrphan.district}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Guardian</p>
                          <p className="font-medium">{selectedOrphan.guardianName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Contact</p>
                          <p className="font-medium">{selectedOrphan.contactNumber}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-600">Address</p>
                          <p className="font-medium">{selectedOrphan.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        Education
                      </h3>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">School</p>
                          <p className="font-medium">{selectedOrphan.schoolName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Grade</p>
                          <p className="font-medium">{selectedOrphan.currentGrade}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Performance</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            selectedOrphan.academicPerformance === "Excellent" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {selectedOrphan.academicPerformance}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Coordinator & Support */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        Coordinator & Support
                      </h3>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Coordinator</p>
                          <p className="font-medium">{selectedOrphan.coordinator}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Donor</p>
                          <p className="font-medium">{selectedOrphan.donor || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Monthly Stipend</p>
                          <p className="font-medium">LKR {selectedOrphan.stipendAmount?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Visit History */}
                    {selectedOrphan.visits && selectedOrphan.visits.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-orange-600" />
                          Visit History ({selectedOrphan.visits.length} visits)
                        </h3>
                        <div className="space-y-3">
                          {selectedOrphan.visits.map(visit => (
                            <div key={visit.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-gray-900">{visit.date}</p>
                                  <p className="text-sm text-gray-600">By: {visit.coordinator}</p>
                                </div>
                                <div className="flex gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    visit.academic === "Excellent" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                  }`}>
                                    {visit.academic}
                                  </span>
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                    {visit.attendance}% Attendance
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-gray-600">Spiritual</p>
                                  <p className="font-medium">{visit.spiritual}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Health</p>
                                  <p className="font-medium">{visit.health}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Photos</p>
                                  <p className="font-medium">{visit.photos} uploaded</p>
                                </div>
                              </div>
                              {visit.remarks && (
                                <p className="mt-2 text-sm text-gray-700 italic">"{visit.remarks}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button onClick={() => setShowVisitForm(true)} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        Record New Visit
                      </button>
                      <button onClick={() => generateOrphanPDF(selectedOrphan)} className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                        <Download className="w-5 h-5" />
                        Generate AI Report
                      </button>
                      <button className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                        <Edit className="w-5 h-5" />
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* HR Management */}
          <TabsContent value="hr" className="space-y-6">
            {/* All HR Modals */}
            {showCheckInModal && activeTab === "hr" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCheckInModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <CheckCircle className="w-6 h-6" />
                          Check-In
                        </h2>
                        <p className="text-green-100 text-sm mt-1">{new Date().toLocaleString()}</p>
                      </div>
                      <button onClick={() => setShowCheckInModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                      <select 
                        value={checkInData.staffName}
                        onChange={(e) => setCheckInData({...checkInData, staffName: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select staff member...</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.name}>{s.name} - {s.position}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Location *</label>
                      <select 
                        value={checkInData.location}
                        onChange={(e) => setCheckInData({...checkInData, location: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      >
                        <option value="">Select location...</option>
                        <option value="Office - Colombo">Office - Colombo</option>
                        <option value="Office - Kandy">Office - Kandy</option>
                        <option value="Office - Jaffna">Office - Jaffna</option>
                        <option value="Remote Work">Remote Work</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Notes (Optional)</label>
                      <textarea
                        value={checkInData.notes}
                        onChange={(e) => setCheckInData({...checkInData, notes: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        rows="2"
                        placeholder="Any special notes..."
                      ></textarea>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>GPS Location:</strong> Will be automatically captured<br/>
                        <strong>Time:</strong> {new Date().toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleCheckIn} className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Confirm Check-In
                      </button>
                      <button onClick={() => setShowCheckInModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showCheckOutModal && activeTab === "hr" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCheckOutModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <X className="w-6 h-6" />
                          Check-Out
                        </h2>
                        <p className="text-red-100 text-sm mt-1">{new Date().toLocaleString()}</p>
                      </div>
                      <button onClick={() => setShowCheckOutModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                      <select 
                        value={checkOutData.staffName}
                        onChange={(e) => setCheckOutData({...checkOutData, staffName: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select staff member...</option>
                        {attendance.filter(a => a.date === "2025-10-11" && !a.checkOut).map((a, idx) => (
                          <option key={idx} value={a.staffName}>{a.staffName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Break Duration (hours) *</label>
                      <select 
                        value={checkOutData.breakDuration}
                        onChange={(e) => setCheckOutData({...checkOutData, breakDuration: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                      >
                        <option value="0">No break</option>
                        <option value="0.5">30 minutes</option>
                        <option value="1">1 hour</option>
                        <option value="1.5">1.5 hours</option>
                        <option value="2">2 hours</option>
                      </select>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Estimated Work Hours:</strong> {(8.5 - parseFloat(checkOutData.breakDuration || 0)).toFixed(1)}h<br/>
                        <strong>Time:</strong> {new Date().toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleCheckOut} className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Confirm Check-Out
                      </button>
                      <button onClick={() => setShowCheckOutModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showFieldMovementModal && activeTab === "hr" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFieldMovementModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <MapPin className="w-6 h-6" />
                          Log Field Movement
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">Field Movement Register</p>
                      </div>
                      <button onClick={() => setShowFieldMovementModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                        <select 
                          value={fieldMovementData.staffName}
                          onChange={(e) => setFieldMovementData({...fieldMovementData, staffName: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Expected Return Time</label>
                        <input
                          type="time"
                          value={fieldMovementData.expectedReturn}
                          onChange={(e) => setFieldMovementData({...fieldMovementData, expectedReturn: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Purpose of Visit *</label>
                      <input
                        type="text"
                        value={fieldMovementData.purpose}
                        onChange={(e) => setFieldMovementData({...fieldMovementData, purpose: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        placeholder="e.g., Orphan visit, Project site inspection"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Destination *</label>
                      <input
                        type="text"
                        value={fieldMovementData.destination}
                        onChange={(e) => setFieldMovementData({...fieldMovementData, destination: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        placeholder="Enter destination address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Notes</label>
                      <textarea
                        value={fieldMovementData.notes}
                        onChange={(e) => setFieldMovementData({...fieldMovementData, notes: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="3"
                        placeholder="Additional notes or details..."
                      ></textarea>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800">
                        <strong>Time Out:</strong> {new Date().toLocaleTimeString()}<br/>
                        <strong>GPS:</strong> Will be automatically captured<br/>
                        <strong>Status:</strong> Will be marked as "In Field"
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleFieldMovementSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Log Field Movement
                      </button>
                      <button onClick={() => setShowFieldMovementModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showKPIModal && activeTab === "hr" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowKPIModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-4" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <TrendingUp className="w-6 h-6" />
                          Add KPI Record
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">Performance metrics tracking</p>
                      </div>
                      <button onClick={() => setShowKPIModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                        <select 
                          value={kpiFormData.staffName}
                          onChange={(e) => setKpiFormData({...kpiFormData, staffName: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.name}>{s.name} - {s.position}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Month/Period *</label>
                        <input
                          type="month"
                          value={kpiFormData.month}
                          onChange={(e) => setKpiFormData({...kpiFormData, month: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Tasks Assigned *</label>
                        <input
                          type="number"
                          value={kpiFormData.tasksAssigned}
                          onChange={(e) => setKpiFormData({...kpiFormData, tasksAssigned: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="e.g., 20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Tasks Completed *</label>
                        <input
                          type="number"
                          value={kpiFormData.tasksCompleted}
                          onChange={(e) => setKpiFormData({...kpiFormData, tasksCompleted: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="e.g., 18"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Projects Handled</label>
                        <input
                          type="number"
                          value={kpiFormData.projectsHandled}
                          onChange={(e) => setKpiFormData({...kpiFormData, projectsHandled: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="e.g., 3"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">On-Time Delivery % *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={kpiFormData.onTimeDelivery}
                          onChange={(e) => setKpiFormData({...kpiFormData, onTimeDelivery: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="0-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Quality Score % *</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={kpiFormData.qualityScore}
                          onChange={(e) => setKpiFormData({...kpiFormData, qualityScore: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          placeholder="0-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Overall Rating *</label>
                      <select 
                        value={kpiFormData.rating}
                        onChange={(e) => setKpiFormData({...kpiFormData, rating: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Select rating...</option>
                        <option value="5.0">5.0 - Outstanding</option>
                        <option value="4.5">4.5 - Excellent</option>
                        <option value="4.0">4.0 - Very Good</option>
                        <option value="3.5">3.5 - Good</option>
                        <option value="3.0">3.0 - Satisfactory</option>
                        <option value="2.5">2.5 - Needs Improvement</option>
                        <option value="2.0">2.0 - Below Expectations</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Comments</label>
                      <textarea
                        value={kpiFormData.comments}
                        onChange={(e) => setKpiFormData({...kpiFormData, comments: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        rows="3"
                        placeholder="Performance comments and observations..."
                      ></textarea>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleKPISubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Save KPI Record
                      </button>
                      <button onClick={() => setShowKPIModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showAppraisalModal && activeTab === "hr" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAppraisalModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6" />
                          Performance Appraisal
                        </h2>
                        <p className="text-purple-100 text-sm mt-1">Comprehensive performance review</p>
                      </div>
                      <button onClick={() => setShowAppraisalModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Staff Member *</label>
                        <select 
                          value={appraisalData.staffName}
                          onChange={(e) => setAppraisalData({...appraisalData, staffName: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select staff member...</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.name}>{s.name} - {s.position}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Review Period *</label>
                        <select 
                          value={appraisalData.period}
                          onChange={(e) => setAppraisalData({...appraisalData, period: e.target.value})}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select period...</option>
                          <option value="Q1 2025">Q1 2025</option>
                          <option value="Q2 2025">Q2 2025</option>
                          <option value="Q3 2025">Q3 2025</option>
                          <option value="Q4 2025">Q4 2025</option>
                          <option value="Annual 2025">Annual 2025</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Overall Rating *</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setAppraisalData({...appraisalData, overallRating: rating.toString()})}
                            className={`flex-1 p-3 rounded-lg border-2 font-bold transition-all ${
                              appraisalData.overallRating === rating.toString()
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                            }`}
                          >
                            {rating}.0
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Key Strengths *</label>
                      <textarea
                        value={appraisalData.strengths}
                        onChange={(e) => setAppraisalData({...appraisalData, strengths: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="3"
                        placeholder="List the staff member's key strengths and achievements..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Areas for Improvement *</label>
                      <textarea
                        value={appraisalData.improvements}
                        onChange={(e) => setAppraisalData({...appraisalData, improvements: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="3"
                        placeholder="Areas that need development or improvement..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Goals for Next Period *</label>
                      <textarea
                        value={appraisalData.goals}
                        onChange={(e) => setAppraisalData({...appraisalData, goals: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="3"
                        placeholder="Set clear, measurable goals for the next review period..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Reviewer Comments</label>
                      <textarea
                        value={appraisalData.reviewerComments}
                        onChange={(e) => setAppraisalData({...appraisalData, reviewerComments: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                        rows="2"
                        placeholder="Additional comments from reviewer..."
                      ></textarea>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-purple-800">
                        <strong>Reviewer:</strong> {currentUser.name}<br/>
                        <strong>Review Date:</strong> {new Date().toLocaleDateString()}<br/>
                        <strong>Note:</strong> This appraisal will be sent to HR for records
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleAppraisalSubmit} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Submit Appraisal
                      </button>
                      <button onClick={() => setShowAppraisalModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showAddStaffModal && activeTab === "hr" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAddStaffModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <UserPlus className="w-6 h-6" />
                          Add New Staff Member
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">Staff onboarding & profile creation</p>
                      </div>
                      <button onClick={() => setShowAddStaffModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
                          <input
                            type="text"
                            value={newStaffData.fullName}
                            onChange={(e) => setNewStaffData({...newStaffData, fullName: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Enter full name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Email *</label>
                          <input
                            type="email"
                            value={newStaffData.email}
                            onChange={(e) => setNewStaffData({...newStaffData, email: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="email@gersl.org"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Phone Number *</label>
                          <input
                            type="tel"
                            value={newStaffData.phone}
                            onChange={(e) => setNewStaffData({...newStaffData, phone: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="+94-XX-XXXXXXX"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Join Date *</label>
                          <input
                            type="date"
                            value={newStaffData.joinDate}
                            onChange={(e) => setNewStaffData({...newStaffData, joinDate: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Address</label>
                          <input
                            type="text"
                            value={newStaffData.address}
                            onChange={(e) => setNewStaffData({...newStaffData, address: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Full address"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Employment Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Department *</label>
                          <select 
                            value={newStaffData.department}
                            onChange={(e) => setNewStaffData({...newStaffData, department: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Select department...</option>
                            <option value="Operations">Operations</option>
                            <option value="Finance">Finance</option>
                            <option value="Fundraising">Fundraising</option>
                            <option value="HR">Human Resources</option>
                            <option value="MEAL">MEAL</option>
                            <option value="IT">IT</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Position *</label>
                          <input
                            type="text"
                            value={newStaffData.position}
                            onChange={(e) => setNewStaffData({...newStaffData, position: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Project Officer"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Emergency Contact</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Emergency Contact Name</label>
                          <input
                            type="text"
                            value={newStaffData.emergencyContact}
                            onChange={(e) => setNewStaffData({...newStaffData, emergencyContact: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Contact person name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Emergency Phone</label>
                          <input
                            type="tel"
                            value={newStaffData.emergencyPhone}
                            onChange={(e) => setNewStaffData({...newStaffData, emergencyPhone: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="+94-XX-XXXXXXX"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">System Access Credentials</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Username *</label>
                          <input
                            type="text"
                            value={newStaffData.username}
                            onChange={(e) => setNewStaffData({...newStaffData, username: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="username"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">Password *</label>
                          <input
                            type="password"
                            value={newStaffData.password}
                            onChange={(e) => setNewStaffData({...newStaffData, password: e.target.value})}
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="Initial password"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b pb-2">Document Upload</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {['ID/NIC', 'Contract', 'Certificates', 'Photo', 'Bank Details', 'Other'].map((doc, idx) => (
                          <div key={idx}>
                            <label className="cursor-pointer">
                              <input type="file" className="hidden" />
                              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 flex flex-col items-center gap-2 text-center">
                                <Upload className="w-6 h-6 text-gray-400" />
                                <span className="text-xs text-gray-600">{doc}</span>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t">
                      <button onClick={handleAddStaffSubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Add Staff Member
                      </button>
                      <button onClick={() => setShowAddStaffModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showLeaveRequestModal && activeTab === "hr" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLeaveRequestModal(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Calendar className="w-6 h-6" />
                          Leave Request Form
                        </h2>
                        <p className="text-orange-100 text-sm mt-1">Submit → Line Manager → HR Approval</p>
                      </div>
                      <button onClick={() => setShowLeaveRequestModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h3 className="font-semibold text-orange-900 mb-2">Leave Balance Summary</h3>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Annual Leave</p>
                          <p className="font-bold text-orange-600">12 days</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Sick Leave</p>
                          <p className="font-bold text-blue-600">7 days</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded">
                          <p className="text-xs text-gray-600">Casual Leave</p>
                          <p className="font-bold text-green-600">5 days</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Leave Type *</label>
                      <select 
                        value={leaveRequestData.leaveType}
                        onChange={(e) => setLeaveRequestData({...leaveRequestData, leaveType: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      >
                        <option value="">Select leave type...</option>
                        <option value="Annual Leave">Annual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                        <option value="Maternity Leave">Maternity Leave</option>
                        <option value="Paternity Leave">Paternity Leave</option>
                        <option value="Unpaid Leave">Unpaid Leave</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Start Date *</label>
                        <input
                          type="date"
                          value={leaveRequestData.startDate}
                          onChange={(e) => {
                            setLeaveRequestData({...leaveRequestData, startDate: e.target.value});
                            if (leaveRequestData.endDate) {
                              const start = new Date(e.target.value);
                              const end = new Date(leaveRequestData.endDate);
                              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                              setLeaveRequestData(prev => ({...prev, days: days.toString()}));
                            }
                          }}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">End Date *</label>
                        <input
                          type="date"
                          value={leaveRequestData.endDate}
                          onChange={(e) => {
                            setLeaveRequestData({...leaveRequestData, endDate: e.target.value});
                            if (leaveRequestData.startDate) {
                              const start = new Date(leaveRequestData.startDate);
                              const end = new Date(e.target.value);
                              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                              setLeaveRequestData(prev => ({...prev, days: days.toString()}));
                            }
                          }}
                          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Total Days</label>
                      <input
                        type="number"
                        value={leaveRequestData.days}
                        readOnly
                        className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50 font-bold text-lg"
                        placeholder="Auto-calculated"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Line Manager *</label>
                      <select 
                        value={leaveRequestData.lineManager}
                        onChange={(e) => setLeaveRequestData({...leaveRequestData, lineManager: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      >
                        <option value="">Select line manager...</option>
                        <option value="Programme Manager">Programme Manager</option>
                        <option value="Finance Manager">Finance Manager</option>
                        <option value="HR Manager">HR Manager</option>
                        <option value="CEO">CEO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Reason for Leave *</label>
                      <textarea
                        value={leaveRequestData.reason}
                        onChange={(e) => setLeaveRequestData({...leaveRequestData, reason: e.target.value})}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                        rows="4"
                        placeholder="Please provide reason for your leave request..."
                      ></textarea>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Approval Workflow</h4>
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                          <span>Submit</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center font-bold">2</div>
                          <span>Line Manager</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center font-bold">3</div>
                          <span>HR Verification</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={handleLeaveRequestSubmit} className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:shadow-lg font-semibold">
                        Submit Leave Request
                      </button>
                      <button onClick={() => setShowLeaveRequestModal(false)} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Human Resources Management</h2>
                <p className="text-gray-600 text-sm">Comprehensive HR system with attendance tracking, field movement register, KPI management & leave workflow</p>
              </div>
              <button onClick={() => setShowAddStaffModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg">
                <UserPlus className="w-5 h-5" />Add New Staff
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <Users className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{staff.length}</p>
                  <p className="text-blue-100 text-sm">Total Staff</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <CheckCircle className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{attendance.filter(a => a.date === "2025-10-11" && a.checkIn).length}</p>
                  <p className="text-green-100 text-sm">Checked In Today</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <MapPin className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">3</p>
                  <p className="text-purple-100 text-sm">On Field Work</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <Clock className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{leaveRequests.filter(l => l.status === "Pending").length}</p>
                  <p className="text-orange-100 text-sm">Pending Leaves</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <BarChart className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{kpiData.length}</p>
                  <p className="text-pink-100 text-sm">KPI Records</p>
                </CardContent>
              </Card>
            </div>

            {/* Flexible Hours Attendance Tracking */}
            <Card className="shadow-lg border-2 border-green-500">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      Flexible Hours Attendance System
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">No fixed hours - System tracks total hours worked (start/end/breaks)</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCheckInModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      <CheckCircle className="w-4 h-4" />Check In
                    </button>
                    <button onClick={() => setShowCheckOutModal(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      <X className="w-4 h-4" />Check Out
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6 grid grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">42.5h</p>
                    <p className="text-xs text-gray-600">This Week</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">165h</p>
                    <p className="text-xs text-gray-600">This Month</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">8.3h</p>
                    <p className="text-xs text-gray-600">Avg/Day</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-600">2.5h</p>
                    <p className="text-xs text-gray-600">Break Time</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Staff Member</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Check In</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Check Out</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Breaks</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Total Hours</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendance.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {record.staffName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{record.staffName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{record.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-sm font-medium">{record.checkIn}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {record.checkOut ? (
                              <div className="flex items-center gap-1">
                                <X className="w-3 h-3 text-red-600" />
                                <span className="text-sm font-medium">{record.checkOut}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-orange-600 font-semibold">Working...</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">0.5h</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-blue-600">{record.workHours}h</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-green-600" />
                              <span className="text-xs">{record.location}</span>
                            </div>
                            <p className="text-xs text-gray-400">{record.latitude}°N, {record.longitude}°E</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2">
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-sm font-bold text-right">Total Hours Today:</td>
                        <td className="px-4 py-3 text-sm font-bold text-blue-600">
                          {attendance.filter(a => a.date === "2025-10-11").reduce((sum, a) => sum + (a.workHours || 0), 0)}h
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-6 flex gap-3">
                  <button onClick={() => {
                    generatePDF('Attendance_Report_' + new Date().toISOString().split('T')[0], {
                      'Report Type': 'Daily Attendance Summary',
                      'Date': new Date().toLocaleDateString(),
                      'Total Staff': staff.length,
                      'Present': attendance.filter(a => a.date === "2025-10-11").length,
                      'Total Hours': attendance.filter(a => a.date === "2025-10-11").reduce((s,a) => s + a.workHours, 0) + 'h'
                    });
                  }} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />Export Daily Report
                  </button>
                  <button onClick={() => {
                    alert('📊 Weekly Report:\n\nTotal Hours: 210.5h\nAverage: 8.4h/day\nPresent Days: 25\nLate Arrivals: 2\nEarly Departures: 1');
                  }} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                    <BarChart className="w-4 h-4" />View Analytics
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Field Movement Register */}
            <Card className="shadow-lg border-2 border-purple-500">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      Field Movement Register
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Track field visits with time, purpose, destination & geotag</p>
                  </div>
                  <button onClick={() => setShowFieldMovementModal(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    <Plus className="w-4 h-4" />Log Field Movement
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[
                    { id: 1, staff: "John WASH", purpose: "Water Project Site Visit", destination: "Jaffna - Village Site", timeOut: "09:00 AM", timeIn: "03:30 PM", duration: "6.5h", status: "Returned", gps: "9.6615°N, 80.0255°E", notes: "Site inspection completed successfully" },
                    { id: 2, staff: "Sarah Care", purpose: "Orphan Visit - Ahmed Hassan", destination: "Colombo Central", timeOut: "10:15 AM", timeIn: null, duration: "Ongoing", status: "In Field", gps: "6.9271°N, 79.8612°E", notes: "Monthly monitoring visit" },
                    { id: 3, staff: "Ali Coordinator", purpose: "School Visit - Education Support", destination: "Kandy Girls School", timeOut: "08:30 AM", timeIn: "02:00 PM", duration: "5.5h", status: "Returned", gps: "7.2906°N, 80.6337°E", notes: "Met with principal, distributed supplies" }
                  ].map(movement => (
                    <div key={movement.id} className={`p-4 border-2 rounded-lg ${
                      movement.status === "In Field" ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {movement.staff.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{movement.staff}</h4>
                              <p className="text-sm text-gray-600">{movement.purpose}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-purple-600" />
                              <span className="text-gray-700">{movement.destination}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-green-600" />
                              <span className="text-gray-700">Out: {movement.timeOut}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {movement.timeIn ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-blue-600" />
                                  <span className="text-gray-700">In: {movement.timeIn}</span>
                                </>
                              ) : (
                                <>
                                  <Activity className="w-4 h-4 text-orange-600 animate-pulse" />
                                  <span className="text-orange-600 font-semibold">In Progress</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-700 font-semibold">{movement.duration}</span>
                            </div>
                          </div>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <p className="text-gray-600"><strong>GPS Location:</strong> {movement.gps}</p>
                            {movement.notes && <p className="text-gray-600 mt-1"><strong>Notes:</strong> {movement.notes}</p>}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 ${
                          movement.status === "In Field" ? "bg-orange-100 text-orange-800 animate-pulse" : "bg-green-100 text-green-800"
                        }`}>
                          {movement.status}
                        </span>
                      </div>
                      {movement.status === "In Field" && (
                        <button onClick={() => {
                          alert(`✅ ${movement.staff} returned at ${new Date().toLocaleTimeString()}\nDuration: 4.5 hours\nField movement completed.`);
                        }} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />Log Return Time
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-3">Field Movement Summary (This Month)</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">47</p>
                      <p className="text-xs text-gray-600">Total Movements</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">44</p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">3</p>
                      <p className="text-xs text-gray-600">Ongoing</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">285h</p>
                      <p className="text-xs text-gray-600">Total Field Time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Tracking */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    KPI Tracking & Performance Metrics
                  </CardTitle>
                  <button onClick={() => setShowKPIModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />Add KPI Record
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpiData.map(kpi => (
                    <div key={kpi.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{kpi.staffName}</h4>
                          <p className="text-sm text-gray-600">{kpi.department} • {kpi.month}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-2xl font-bold text-blue-600">{kpi.rating}</span>
                            <span className="text-sm text-gray-600">/5.0</span>
                          </div>
                          <p className="text-xs text-gray-500">Overall Rating</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Tasks Completed</p>
                          <p className="text-lg font-bold text-green-600">{kpi.tasksCompleted}/{kpi.tasksAssigned}</p>
                          <p className="text-xs text-gray-500">{Math.round((kpi.tasksCompleted/kpi.tasksAssigned)*100)}%</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Projects</p>
                          <p className="text-lg font-bold text-purple-600">{kpi.projectsHandled}</p>
                          <p className="text-xs text-gray-500">Handled</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">On-Time Delivery</p>
                          <p className="text-lg font-bold text-blue-600">{kpi.onTimeDelivery}%</p>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div className="bg-blue-500 rounded-full h-1" style={{ width: `${kpi.onTimeDelivery}%` }}></div>
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Quality Score</p>
                          <p className="text-lg font-bold text-orange-600">{kpi.qualityScore}%</p>
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div className="bg-orange-500 rounded-full h-1" style={{ width: `${kpi.qualityScore}%` }}></div>
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Rating</p>
                          <div className="flex justify-center gap-1 mt-1">
                            {[1,2,3,4,5].map(star => (
                              <span key={star} className={star <= kpi.rating ? "text-yellow-500" : "text-gray-300"}>★</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Staff Appraisals */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                    Staff Appraisals & Performance Reviews
                  </CardTitle>
                  <button onClick={() => setShowAppraisalModal(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    <Plus className="w-4 h-4" />New Appraisal
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appraisals.map(appraisal => (
                    <div key={appraisal.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{appraisal.staffName}</h4>
                          <p className="text-sm text-gray-600">{appraisal.period} Review</p>
                          <p className="text-xs text-gray-500">Reviewed by: {appraisal.reviewedBy} on {appraisal.reviewDate}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-3xl font-bold text-purple-600">{appraisal.overallRating}</span>
                            <span className="text-sm text-gray-600">/5.0</span>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            {appraisal.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs font-semibold text-green-800 mb-1">✓ Strengths</p>
                          <p className="text-sm text-gray-700">{appraisal.strengths}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-orange-800 mb-1">△ Areas for Improvement</p>
                          <p className="text-sm text-gray-700">{appraisal.improvements}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-800 mb-1">🎯 Goals</p>
                          <p className="text-sm text-gray-700">{appraisal.goals}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Staff Directory */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    Staff Directory
                  </CardTitle>
                  <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    <Plus className="w-4 h-4" />Add Staff
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staff.map(member => (
                    <div key={member.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.position}</p>
                          <p className="text-xs text-gray-500">{member.department}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          {member.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">📧 {member.email}</p>
                        <p className="text-gray-600">📱 {member.phone}</p>
                        <p className="text-gray-600">📅 Joined: {member.joinDate}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          <Eye className="w-3 h-3 inline mr-1" />View Profile
                        </button>
                        <button className="flex-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                          <Edit className="w-3 h-3 inline mr-1" />Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leave Management */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    Leave Management with Approval Workflow
                  </CardTitle>
                  <button onClick={() => setShowLeaveRequestModal(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                    <Plus className="w-4 h-4" />Request Leave
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveRequests.map(leave => (
                    <div key={leave.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900">{leave.staffName}</h4>
                          <p className="text-sm text-gray-600">{leave.leaveType} - {leave.days} days</p>
                          <p className="text-sm text-gray-600">{leave.startDate} to {leave.endDate}</p>
                          <p className="text-xs text-gray-500 mt-1">Reason: {leave.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            leave.status === "Approved" ? "bg-green-100 text-green-800" : 
                            leave.status === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                            "bg-red-100 text-red-800"
                          }`}>
                            {leave.status}
                          </span>
                          {leave.approvedBy && (
                            <p className="text-xs text-gray-500 mt-1">By: {leave.approvedBy}</p>
                          )}
                        </div>
                      </div>
                      {leave.status === "Pending" && (currentUser.role === "HR Manager" || currentUser.role === "CEO") && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleApproveLeave(leave.id)} className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm">
                            <CheckCircle className="w-3 h-3 inline mr-1" />Approve
                          </button>
                          <button onClick={() => handleRejectLeave(leave.id)} className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm">
                            <X className="w-3 h-3 inline mr-1" />Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Training & Development */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  Training & Development Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-teal-50">
                    <h4 className="font-bold text-gray-900 mb-2">Project Management</h4>
                    <p className="text-sm text-gray-600 mb-3">Next session: Nov 15, 2025</p>
                    <button className="w-full bg-teal-600 text-white px-3 py-2 rounded text-sm">
                      Register Staff
                    </button>
                  </div>
                  <div className="p-4 border rounded-lg bg-indigo-50">
                    <h4 className="font-bold text-gray-900 mb-2">MEAL Framework</h4>
                    <p className="text-sm text-gray-600 mb-3">Next session: Nov 20, 2025</p>
                    <button className="w-full bg-indigo-600 text-white px-3 py-2 rounded text-sm">
                      Register Staff
                    </button>
                  </div>
                  <div className="p-4 border rounded-lg bg-pink-50">
                    <h4 className="font-bold text-gray-900 mb-2">Financial Management</h4>
                    <p className="text-sm text-gray-600 mb-3">Next session: Dec 01, 2025</p>
                    <button className="w-full bg-pink-600 text-white px-3 py-2 rounded text-sm">
                      Register Staff
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory & Assets */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Inventory & Asset Management</h2>
              <button onClick={handleAddInventoryItem} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg">
                <Plus className="w-5 h-5" />Add Asset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <Package className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{inventory.length}</p>
                  <p className="text-blue-100 text-sm">Total Assets</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <CheckCircle className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{inventory.filter(i => i.status === "Available").length}</p>
                  <p className="text-green-100 text-sm">Available</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <Activity className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">{inventory.filter(i => i.status === "In Use").length}</p>
                  <p className="text-orange-100 text-sm">In Use</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardContent className="pt-6">
                  <DollarSign className="w-8 h-8 mb-2" />
                  <p className="text-3xl font-bold">LKR {(inventory.reduce((s,i) => s + i.value, 0) / 1000000).toFixed(1)}M</p>
                  <p className="text-purple-100 text-sm">Total Value</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Asset Register</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Asset Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Condition</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Value (LKR)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inventory.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-sm">{item.category}</td>
                          <td className="px-4 py-3 text-sm font-bold">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm">{item.location}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.condition === "Excellent" ? "bg-green-100 text-green-800" :
                              item.condition === "Good" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>{item.condition}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold">{item.value.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.status === "Available" ? "bg-green-100 text-green-800" :
                              item.status === "In Use" ? "bg-blue-100 text-blue-800" :
                              "bg-orange-100 text-orange-800"
                            }`}>{item.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:underline text-sm">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:underline text-sm">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Management */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Document Management System</h2>
              <button onClick={handleUploadDocument} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg">
                <Upload className="w-5 h-5" />Upload Document
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {["Strategy", "Contracts", "Finance", "HR"].map((cat, idx) => (
                <Card key={cat} className={`bg-gradient-to-br ${
                  idx === 0 ? "from-blue-500 to-blue-600" :
                  idx === 1 ? "from-green-500 to-green-600" :
                  idx === 2 ? "from-purple-500 to-purple-600" :
                  "from-orange-500 to-orange-600"
                } text-white shadow-lg`}>
                  <CardContent className="pt-6">
                    <FileText className="w-8 h-8 mb-2" />
                    <p className="text-3xl font-bold">{documents.filter(d => d.category === cat).length}</p>
                    <p className="text-blue-100 text-sm">{cat} Documents</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Document Library</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-4 border-2 rounded-lg hover:border-blue-500 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          doc.name.endsWith('.pdf') ? "bg-red-100" :
                          doc.name.endsWith('.docx') ? "bg-blue-100" :
                          "bg-green-100"
                        }`}>
                          <FileText className={`w-6 h-6 ${
                            doc.name.endsWith('.pdf') ? "text-red-600" :
                            doc.name.endsWith('.docx') ? "text-blue-600" :
                            "text-green-600"
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{doc.name}</h4>
                          <p className="text-sm text-gray-600">
                            {doc.category} • {doc.size} • Uploaded by {doc.uploadedBy} on {doc.uploadDate}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {doc.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1">
                          <Download className="w-4 h-4" />Download
                        </button>
                        <button className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1">
                          <Eye className="w-4 h-4" />View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Center */}
          <TabsContent value="communications" className="space-y-6">
            <h2 className="text-2xl font-bold">Communications Center</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-2 border-blue-500">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Send Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Template</label>
                      <select className="w-full p-2 border rounded-lg">
                        <option>Select a template...</option>
                        {emailTemplates.map(t => (
                          <option key={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">To</label>
                      <input type="email" value={emailRecipient} onChange={(e) => setEmailRecipient(e.target.value)} placeholder="recipient@email.com" className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email subject" className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows="4" placeholder="Type your message..." className="w-full p-2 border rounded-lg"></textarea>
                    </div>
                    <button onClick={handleSendEmail} className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />Send Email
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-green-500">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    Send SMS
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <input type="tel" value={smsRecipient} onChange={(e) => setSmsRecipient(e.target.value)} placeholder="+94-XX-XXXXXXX" className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} rows="4" placeholder="Type your SMS message..." maxLength="160" className="w-full p-2 border rounded-lg"></textarea>
                      <p className="text-xs text-gray-500 mt-1">{smsMessage.length}/160 characters</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 font-semibold mb-2">Quick Recipients:</p>
                      <div className="flex flex-wrap gap-2">
                        <button className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs hover:bg-blue-100">All Coordinators</button>
                        <button className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs hover:bg-blue-100">All Guardians</button>
                        <button className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs hover:bg-blue-100">Staff</button>
                      </div>
                    </div>
                    <button onClick={handleSendSMS} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />Send SMS
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Communication History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sentCommunications.map(comm => (
                    <div key={comm.id} className="p-4 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          comm.type === "Email" ? "bg-blue-100" : "bg-green-100"
                        }`}>
                          {comm.type === "Email" ? <Send className="w-5 h-5 text-blue-600" /> : <MessageSquare className="w-5 h-5 text-green-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{comm.type === "Email" ? comm.subject : comm.message}</p>
                          <p className="text-sm text-gray-600">To: {comm.recipient} • {comm.date}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {comm.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Advanced Analytics & Insights</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget Forecasting */}
              <Card className="shadow-lg border-2 border-purple-500">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Budget Forecasting (Q4 2025)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {budgetForecasts.map((forecast, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-900">{forecast.month}</span>
                          <span className="text-lg font-bold text-purple-600">LKR {(forecast.projected / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full" style={{ width: `${(forecast.projected / 4200000) * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">Projected Expenditure</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleGenerateForecast} className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    Generate Full Forecast Report
                  </button>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card className="shadow-lg border-2 border-red-500">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Risk Assessment Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {riskAssessments.map(risk => (
                      <div key={risk.id} className="p-4 border-l-4 rounded-lg" style={{ borderColor: risk.severity === "High" ? "#ef4444" : "#f59e0b" }}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{risk.risk}</p>
                            <p className="text-sm text-gray-600">{risk.project}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              risk.severity === "High" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                            }`}>{risk.severity}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{risk.probability}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2"><strong>Mitigation:</strong> {risk.mitigation}</p>
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>Owner: {risk.owner}</span>
                          <span className={`px-2 py-1 rounded-full font-semibold ${
                            risk.status === "Mitigated" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>{risk.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleAddRiskAssessment} className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                    Add New Risk Assessment
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Performance Dashboard */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-blue-600" />
                  Organizational Performance Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-4">Project Completion Rate</h4>
                    <div className="flex items-end justify-center gap-2 h-32">
                      {[85, 92, 78, 88, 95].map((val, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1">
                          <div className="w-full bg-blue-500 rounded-t" style={{ height: `${val}%` }}></div>
                          <span className="text-xs mt-2 text-gray-600">Q{idx+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-4">Donor Satisfaction</h4>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-green-600">4.7</div>
                        <p className="text-sm text-gray-600 mt-2">out of 5.0</p>
                        <div className="flex justify-center gap-1 mt-2">
                          {[1,2,3,4,5].map(star => (
                            <span key={star} className={star <= 4.7 ? "text-yellow-500 text-xl" : "text-gray-300 text-xl"}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-4">Beneficiary Impact</h4>
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-purple-600">{orphans.length + generalBeneficiaries.length}</div>
                        <p className="text-sm text-gray-600 mt-2">Lives Impacted</p>
                        <p className="text-xs text-gray-500 mt-1">+23% from last quarter</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payroll Summary (if HR role) */}
            {(currentUser.role === "HR Manager" || currentUser.role === "CEO" || currentUser.role === "Administrator" || currentUser.role === "Finance Manager") && (
              <Card className="shadow-lg border-2 border-indigo-500">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-indigo-600" />
                      Payroll Summary - October 2025
                    </CardTitle>
                    <button onClick={handleProcessPayroll} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                      Process Payroll
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Staff Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Base Salary</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Allowances</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Deductions</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Net Salary</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payrollData.map(payroll => (
                          <tr key={payroll.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{payroll.staffName}</td>
                            <td className="px-4 py-3 text-sm">{payroll.position}</td>
                            <td className="px-4 py-3 text-sm">LKR {payroll.baseSalary.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-green-600">+{payroll.allowances.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-red-600">-{payroll.deductions.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm font-bold">LKR {payroll.netSalary.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                payroll.status === "Processed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}>{payroll.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2">
                        <tr>
                          <td colSpan="5" className="px-4 py-3 text-sm font-bold text-right">Total Payroll:</td>
                          <td className="px-4 py-3 text-sm font-bold">LKR {payrollData.reduce((s,p) => s + p.netSalary, 0).toLocaleString()}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Manage user accounts and permissions</p>
                  <button onClick={handleManageUsers} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Manage Users
                  </button>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Role & Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Configure role-based access control</p>
                  <button onClick={handleConfigureRoles} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Configure Roles
                  </button>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">General system settings and preferences</p>
                  <button onClick={handleSystemConfig} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Configure System
                  </button>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Backup & Recovery</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">Database backup and disaster recovery</p>
                  <button onClick={handleManageBackups} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Manage Backups
                  </button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 py-6 border-t border-gray-200">
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-900">GERSL Management System v2.0</p>
              <p className="text-xs">Complete Charity Management Platform</p>
            </div>
            <div className="flex gap-6">
              <button className="hover:text-blue-600">Documentation</button>
              <button className="hover:text-blue-600">Support</button>
              <button className="hover:text-blue-600">API</button>
              <button className="hover:text-blue-600">System Status</button>
            </div>
            <div className="text-xs">
              <p>©2025 GERSL. All rights reserved.</p>
              <p className="text-gray-500">Last updated: October 11, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharityManagementSystem;