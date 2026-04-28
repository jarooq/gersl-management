import React, { useState } from 'react';
import { useHR } from '../../contexts/HRContext';
import API from '../../services/api';
import StaffProfileModal from '../../components/hr/StaffProfileModal';
import {
  Users, UserPlus, Clock, Calendar, TrendingUp, CheckCircle,
  XCircle, AlertCircle, ArrowRight, LogIn, LogOut, FileText,
  MapPin, Package, Navigation, Car, Home, Receipt, Map, Play,
  StopCircle, Eye, Check, X, Edit, Activity, DollarSign,
  Briefcase, Shield, Target, BarChart3, PieChart, TrendingDown,
  Clipboard, Award, Star, Plus, Trash2
} from 'lucide-react';

const HRPage = () => {
  const {
    staff,
    attendance,
    leaveRequests,
    onboardingRecords,
    appraisalRecords,
    gpsAttendance,
    assetCheckouts,
    vehicleRequests,
    accommodationRequests
  } = useHR();
  const [activeTab, setActiveTab] = useState('overview');

  // Handle tab change with local state (not routing)
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Modal states
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAssetCheckoutModal, setShowAssetCheckoutModal] = useState(false);
  const [showVehicleRequestModal, setShowVehicleRequestModal] = useState(false);
  const [showAccommodationRequestModal, setShowAccommodationRequestModal] = useState(false);
  const [showStaffProfileModal, setShowStaffProfileModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState({});

  // Calculate stats locally
  const stats = {
    totalStaff: staff?.length || 0,
    activeStaff: staff?.filter(s => s.status === 'Active')?.length || 0,
    presentToday: attendance?.filter(a => {
      const today = new Date().toISOString().split('T')[0];
      return a.date === today && a.status === 'Present';
    })?.length || 0,
    attendanceRate: staff?.length > 0
      ? Math.round((attendance?.filter(a => {
          const today = new Date().toISOString().split('T')[0];
          return a.date === today && a.status === 'Present';
        })?.length || 0) / staff.length * 100)
      : 0,
    pendingLeaves: leaveRequests?.filter(lr => lr.status === 'Pending')?.length || 0,
    onboardingCount: onboardingRecords?.filter(or => or.status === 'In Progress')?.length || 0
  };

  // Staff form state
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    joiningDate: '',
    salary: '',
    leaveBalance: 21,
    status: 'Active',
    // User account credentials
    username: '',
    password: '',
    userRole: '', // Will be selected from dropdown
    userStatus: 'Active'
  });

  // Roles - hardcoded to match User model ENUM (schema-defined, don't change)
  const roles = [
    'Admin', 'BOD', 'CEO', 'Director Programmes', 'Programme Manager',
    'Finance Manager', 'Finance Officer', 'Fundraising Manager',
    'HR Manager', 'HR Officer', 'Project Officer WASH', 'Project Officer Orphans',
    'Project Officer Livelihoods', 'Project Officer Infrastructure',
    'Project Officer Education', 'Project Officer Women', 'Project Officer',
    'Field Officer', 'MEAL Officer', 'Media Production Officer', 'Media Officer',
    'Accountant', 'Project Assistant', 'Finance Assistant', 'Fundraising Assistant',
    'HR Assistant', 'Orphan Coordinator', 'Guest'
  ];

  // Departments - hardcoded to match User model ENUM
  const departments = [
    'Governance', 'Executive', 'Programmes', 'Finance',
    'Fundraising', 'HR', 'MEAL', 'IT'
  ];

  // Positions - hardcoded standard organizational positions
  const positions = [
    'Executive Director', 'Director Programmes', 'Programme Manager',
    'Finance Manager', 'HR Manager', 'Fundraising Manager',
    'Project Officer', 'Finance Officer', 'HR Officer',
    'MEAL Officer', 'Media Production Officer', 'Media Officer',
    'Field Officer', 'Accountant', 'Project Assistant',
    'Finance Assistant', 'HR Assistant', 'Fundraising Assistant',
    'Orphan Coordinator', 'Program Coordinator', 'Operations Officer',
    'IT Officer', 'Administrative Officer', 'Driver', 'Office Assistant'
  ];




  // Onboarding form state
  const [onboardingForm, setOnboardingForm] = useState({
    employeeId: '',
    startDate: '',
    mentor: ''
  });

  // Appraisal form state
  const [appraisalForm, setAppraisalForm] = useState({
    employeeId: '',
    period: '',
    dueDate: '',
    reviewer: '',
    rating: ''
  });

  // Leave form state
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    days: '',
    reason: ''
  });

  // Asset checkout form state
  const [assetCheckoutForm, setAssetCheckoutForm] = useState({
    assetName: '',
    assetCode: '',
    category: '',
    checkedOutTo: '',
    checkedOutDate: '',
    expectedReturn: '',
    purpose: ''
  });

  // Vehicle request form state
  const [vehicleRequestForm, setVehicleRequestForm] = useState({
    requestedBy: '',
    project: '',
    activity: '',
    vehicleType: '',
    date: '',
    startTime: '',
    endTime: '',
    passengers: '',
    destination: '',
    purpose: ''
  });

  // Accommodation request form state
  const [accommodationRequestForm, setAccommodationRequestForm] = useState({
    requestedBy: '',
    project: '',
    activity: '',
    location: '',
    checkIn: '',
    checkOut: '',
    rooms: '',
    guests: '',
    accommodationType: '',
    specialRequirements: ''
  });

  // Calculate department distribution dynamically
  const departmentDistribution = React.useMemo(() => {
    const activeStaff = staff.filter(s => s.status === 'Active');
    const deptCounts = {};

    activeStaff.forEach(member => {
      const dept = member.department || 'Other';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const totalActive = activeStaff.length;
    const deptColors = {
      'Executive': 'from-purple-500 to-indigo-600',
      'Finance': 'from-green-500 to-emerald-600',
      'Projects': 'from-orange-500 to-amber-600',
      'HR': 'from-pink-500 to-rose-600',
      'Orphan Care': 'from-blue-500 to-cyan-600',
      'MEAL': 'from-teal-500 to-cyan-600',
      'Proposals': 'from-yellow-500 to-orange-600',
      'Operations': 'from-indigo-500 to-purple-600',
      'Other': 'from-gray-500 to-slate-600'
    };

    return Object.entries(deptCounts)
      .map(([dept, count]) => ({
        dept,
        count,
        percent: totalActive > 0 ? Math.round((count / totalActive) * 100) : 0,
        color: deptColors[dept] || 'from-gray-500 to-slate-600'
      }))
      .sort((a, b) => b.count - a.count);
  }, [staff]);

  // Calculate leave statistics dynamically
  const leaveStatistics = React.useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter leaves for current month
    const currentMonthLeaves = leaveRequests.filter(leave => {
      const leaveDate = new Date(leave.appliedDate);
      return leaveDate.getMonth() === currentMonth && leaveDate.getFullYear() === currentYear;
    });

    // Calculate by leave type
    const leaveTypes = {
      'Annual Leave': { count: 0, approved: 0, pending: 0, color: 'bg-green-500' },
      'Sick Leave': { count: 0, approved: 0, pending: 0, color: 'bg-red-500' },
      'Casual Leave': { count: 0, approved: 0, pending: 0, color: 'bg-blue-500' },
      'Maternity/Paternity': { count: 0, approved: 0, pending: 0, color: 'bg-purple-500' },
      'Other': { count: 0, approved: 0, pending: 0, color: 'bg-gray-500' }
    };

    currentMonthLeaves.forEach(leave => {
      const type = leave.leaveType || 'Other';
      if (leaveTypes[type]) {
        leaveTypes[type].count += leave.days || 1;
        if (leave.status === 'Approved') {
          leaveTypes[type].approved += leave.days || 1;
        } else if (leave.status === 'Pending') {
          leaveTypes[type].pending += leave.days || 1;
        }
      } else {
        leaveTypes['Other'].count += leave.days || 1;
        if (leave.status === 'Approved') {
          leaveTypes['Other'].approved += leave.days || 1;
        } else if (leave.status === 'Pending') {
          leaveTypes['Other'].pending += leave.days || 1;
        }
      }
    });

    const totalLeaves = Object.values(leaveTypes).reduce((sum, type) => sum + type.count, 0);

    return {
      total: totalLeaves,
      types: Object.entries(leaveTypes).map(([type, data]) => ({
        type,
        ...data
      }))
    };
  }, [leaveRequests]);

  // Handle Add Staff
  const handleAddStaff = async () => {
    if (!staffForm.fullName || !staffForm.email || !staffForm.department || !staffForm.position) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate user credentials
    if (!staffForm.username || !staffForm.password) {
      alert('Please provide username and password for user account');
      return;
    }

    // Validate user role
    if (!staffForm.userRole) {
      alert('Please select a user role');
      return;
    }

    try {
      // Call backend to create staff and user account
      const result = await API.HR.create({
        ...staffForm,
        salary: parseFloat(staffForm.salary) || 0
      });

      // Reset form
      setStaffForm({
        fullName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        joiningDate: '',
        salary: '',
        leaveBalance: 21,
        status: 'Active',
        // User account credentials
        username: '',
        password: '',
        userRole: '', // Reset to empty to show "Select Role" placeholder
        userStatus: 'Active'
      });

      setShowAddStaffModal(false);
      alert('✅ Staff member and user account created successfully!\n\nThe staff member can now log in with their credentials.');

      // Refresh HR data
      window.location.reload(); // Simple reload to refresh data
    } catch (error) {
      console.error('Error creating staff:', error);
      alert('❌ Error: ' + (error.message || 'Failed to create staff member'));
    }
  };

  // Handle Add Onboarding
  const handleAddOnboarding = () => {
    if (!onboardingForm.employeeId || !onboardingForm.startDate) {
      alert('Please select an employee and start date');
      return;
    }

    addOnboarding(onboardingForm);

    // Reset form
    setOnboardingForm({
      employeeId: '',
      startDate: '',
      mentor: ''
    });

    setShowOnboardingModal(false);
    alert('Onboarding record created successfully!');
  };

  // Handle Add Appraisal
  const handleAddAppraisal = () => {
    if (!appraisalForm.employeeId || !appraisalForm.period) {
      alert('Please select an employee and review period');
      return;
    }

    addAppraisal({
      ...appraisalForm,
      rating: appraisalForm.rating ? parseFloat(appraisalForm.rating) : null
    });

    // Reset form
    setAppraisalForm({
      employeeId: '',
      period: '',
      dueDate: '',
      reviewer: '',
      rating: ''
    });

    setShowAppraisalModal(false);
    alert('Appraisal record created successfully!');
  };

  // Handle GPS Check-in
  const handleGpsCheckIn = () => {
    // Simulate GPS check-in - in real app, this would get actual GPS coordinates
    if (staff.length === 0) {
      alert('No staff members available. Please add staff first.');
      return;
    }

    const currentUser = staff[0]; // In real app, this would be the logged-in user

    addGpsAttendance({
      employeeId: currentUser.id,
      location: 'Office Location',
      latitude: 6.9271,
      longitude: 79.8612,
      distance: '0m',
      verified: true
    });

    alert('GPS Check-in successful!');
  };

  // Handle Apply Leave
  const handleApplyLeave = () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.leaveType) {
      alert('Please fill in all required fields');
      return;
    }

    applyLeave({
      ...leaveForm,
      days: parseInt(leaveForm.days) || 0
    });

    // Reset form and close modal
    setLeaveForm({
      employeeId: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      days: '',
      reason: ''
    });

    setShowLeaveModal(false);
    alert('Leave application submitted successfully!');
  };

  // Handle Checkout Asset
  const handleCheckoutAsset = () => {
    if (!assetCheckoutForm.assetName || !assetCheckoutForm.checkedOutTo || !assetCheckoutForm.checkedOutDate) {
      alert('Please fill in all required fields');
      return;
    }

    addAssetCheckout({
      ...assetCheckoutForm,
      passengers: parseInt(assetCheckoutForm.passengers) || 0
    });

    // Reset form and close modal
    setAssetCheckoutForm({
      assetName: '',
      assetCode: '',
      category: '',
      checkedOutTo: '',
      checkedOutDate: '',
      expectedReturn: '',
      purpose: ''
    });

    setShowAssetCheckoutModal(false);
    alert('Asset checked out successfully!');
  };

  // Handle Request Vehicle
  const handleRequestVehicle = () => {
    if (!vehicleRequestForm.requestedBy || !vehicleRequestForm.date || !vehicleRequestForm.destination || !vehicleRequestForm.vehicleType) {
      alert('Please fill in all required fields');
      return;
    }

    addVehicleRequest({
      ...vehicleRequestForm,
      passengers: parseInt(vehicleRequestForm.passengers) || 0
    });

    // Reset form and close modal
    setVehicleRequestForm({
      requestedBy: '',
      project: '',
      activity: '',
      vehicleType: '',
      date: '',
      startTime: '',
      endTime: '',
      passengers: '',
      destination: '',
      purpose: ''
    });

    setShowVehicleRequestModal(false);
    alert('Vehicle request submitted successfully!');
  };

  // Handle Request Accommodation
  const handleRequestAccommodation = () => {
    if (!accommodationRequestForm.requestedBy || !accommodationRequestForm.location || !accommodationRequestForm.checkIn || !accommodationRequestForm.checkOut) {
      alert('Please fill in all required fields');
      return;
    }

    addAccommodationRequest({
      ...accommodationRequestForm,
      rooms: parseInt(accommodationRequestForm.rooms) || 0,
      guests: parseInt(accommodationRequestForm.guests) || 0
    });

    // Reset form and close modal
    setAccommodationRequestForm({
      requestedBy: '',
      project: '',
      activity: '',
      location: '',
      checkIn: '',
      checkOut: '',
      rooms: '',
      guests: '',
      accommodationType: '',
      specialRequirements: ''
    });

    setShowAccommodationRequestModal(false);
    alert('Accommodation request submitted successfully!');
  };

  // Calculate weekly attendance trend dynamically
  const weeklyAttendanceTrend = React.useMemo(() => {
    const today = new Date();
    const totalStaff = staff.filter(s => s.status === 'Active').length;

    if (totalStaff === 0) {
      return {
        averageRate: 0,
        trend: 0,
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
          day,
          percent: 0,
          count: 0
        }))
      };
    }

    // Get last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    // Calculate attendance for each day
    const dailyAttendance = last7Days.map((date, index) => {
      const dateObj = new Date(date);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
      const presentCount = attendance.filter(a => a.date === date && a.status === 'Present').length;
      const percent = totalStaff > 0 ? Math.round((presentCount / totalStaff) * 100) : 0;

      return {
        day: dayName,
        percent,
        count: presentCount
      };
    });

    // Calculate average attendance rate for this week
    const totalPresent = dailyAttendance.reduce((sum, day) => sum + day.count, 0);
    const averageRate = Math.round((totalPresent / (totalStaff * 7)) * 100);

    // Calculate previous week for comparison
    const previous7Days = [];
    for (let i = 13; i >= 7; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      previous7Days.push(date.toISOString().split('T')[0]);
    }

    const previousWeekPresent = previous7Days.reduce((sum, date) => {
      return sum + attendance.filter(a => a.date === date && a.status === 'Present').length;
    }, 0);

    const previousWeekRate = totalStaff > 0 ? Math.round((previousWeekPresent / (totalStaff * 7)) * 100) : 0;
    const trend = averageRate - previousWeekRate;

    return {
      averageRate,
      trend,
      days: dailyAttendance
    };
  }, [attendance, staff]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">HR Management</h1>
                <p className="text-orange-100 text-sm">Managing {stats.totalStaff} team members with excellence</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Staff',
            value: stats.totalStaff,
            icon: Users,
            gradient: 'from-orange-500 to-amber-600',
            change: `${stats.activeStaff} active`,
            subtitle: 'team members'
          },
          {
            title: 'Present Today',
            value: stats.presentToday,
            icon: CheckCircle,
            gradient: 'from-green-500 to-emerald-600',
            change: `${stats.attendanceRate}% attendance`,
            subtitle: 'checked in'
          },
          {
            title: 'Pending Leaves',
            value: stats.pendingLeaves,
            icon: Calendar,
            gradient: 'from-blue-500 to-cyan-600',
            change: 'Awaiting approval',
            subtitle: 'leave requests'
          },
          {
            title: 'Departments',
            value: departmentDistribution.length,
            icon: TrendingUp,
            gradient: 'from-purple-500 to-indigo-600',
            change: 'All operational',
            subtitle: 'active teams'
          }
        ].map((stat, index) => (
          <div
            key={index}
            className="stat-card group cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 mb-2">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                <stat.icon className="text-white" size={18} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-600">{stat.change}</span>
              <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* HR Analytics and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="text-orange-600" size={18} />
                Department Distribution
              </h3>
              <p className="text-xs text-gray-600 mt-1">Staff across departments</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">{stats.activeStaff}</div>
              <div className="text-xs text-orange-600">Active Staff</div>
            </div>
          </div>
          <div className="space-y-3">
            {departmentDistribution.map((dept, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{dept.name}</span>
                  <span className="text-xs font-bold text-gray-900">{dept.count} staff</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full bg-gradient-to-r ${dept.color} transition-all duration-500`}
                    style={{ width: `${dept.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-blue-600" size={18} />
                Leave Status Overview
              </h3>
              <p className="text-xs text-gray-600 mt-1">Current leave requests</p>
            </div>
          </div>
          <div className="space-y-4">
            {(() => {
              const pendingCount = leaveRequests.filter(r => r.status === 'Pending').length;
              const approvedCount = leaveRequests.filter(r => r.status === 'Approved').length;
              const rejectedCount = leaveRequests.filter(r => r.status === 'Rejected').length;
              const total = leaveRequests.length || 1;

              const leaveStats = [
                { status: 'Pending', count: pendingCount, percent: Math.round((pendingCount / total) * 100), color: 'bg-yellow-500' },
                { status: 'Approved', count: approvedCount, percent: Math.round((approvedCount / total) * 100), color: 'bg-green-500' },
                { status: 'Rejected', count: rejectedCount, percent: Math.round((rejectedCount / total) * 100), color: 'bg-red-500' }
              ].filter(item => item.count > 0);

              if (leaveStats.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No leave requests yet
                  </div>
                );
              }

              return leaveStats.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-900">{item.count} requests</span>
                    <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">{item.percent}%</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Attendance Trend (Last 7 Days) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-green-600" size={18} />
                Weekly Attendance Trend
              </h3>
              <p className="text-xs text-gray-600 mt-1">Last 7 days</p>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold flex items-center gap-1 ${
                weeklyAttendanceTrend.trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {weeklyAttendanceTrend.trend >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                {weeklyAttendanceTrend.averageRate}%
              </div>
              <div className="text-xs text-gray-600">Avg attendance</div>
            </div>
          </div>
          <div className="space-y-2">
            {weeklyAttendanceTrend.days.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No attendance data for the last 7 days
              </div>
            ) : (
              (() => {
                const maxValue = Math.max(...weeklyAttendanceTrend.days.map(d => d.count), 1);
                return weeklyAttendanceTrend.days.map((day, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 w-16">{day.day}</span>
                    <div className="flex-1 flex gap-1">
                      <div className="bg-green-500 h-8 rounded transition-all duration-300"
                        style={{ width: `${(day.count / maxValue) * 100}%` }}
                        title={`${day.count} present`}></div>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{day.count}/{stats.totalStaff}</span>
                  </div>
                ));
              })()
            )}
          </div>
        </div>

        {/* HR Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Target className="text-purple-600" size={18} />
                HR Performance Metrics
              </h3>
              <p className="text-xs text-gray-600 mt-1">Key performance indicators</p>
            </div>
            {(() => {
              // Calculate overall HR performance score
              const attendanceScore = stats.attendanceRate || 0;
              const staffRetention = stats.totalStaff > 0 ? Math.round((stats.activeStaff / stats.totalStaff) * 100) : 0;
              const leaveApprovalRate = stats.totalLeaves > 0 ? Math.round(((stats.totalLeaves - stats.pendingLeaves) / stats.totalLeaves) * 100) : 0;
              const overallScore = Math.round((attendanceScore + staffRetention + leaveApprovalRate) / 3);

              return (
                <div className="text-right">
                  <div className={`text-xl font-bold ${
                    overallScore >= 75 ? 'text-green-600' :
                    overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {overallScore}%
                  </div>
                  <div className="text-xs text-gray-600">Overall Score</div>
                </div>
              );
            })()}
          </div>
          <div className="space-y-4">
            {(() => {
              const attendanceScore = stats.attendanceRate || 0;
              const staffRetention = stats.totalStaff > 0 ? Math.round((stats.activeStaff / stats.totalStaff) * 100) : 0;
              const leaveApprovalRate = stats.totalLeaves > 0 ? Math.round(((stats.totalLeaves - stats.pendingLeaves) / stats.totalLeaves) * 100) : 0;
              const onboardingComplete = onboardingRecords.filter(r => r.status === 'Completed').length;
              const onboardingTotal = onboardingRecords.length || 1;
              const onboardingRate = Math.round((onboardingComplete / onboardingTotal) * 100);

              return [
                { metric: 'Attendance Rate', value: attendanceScore, target: 90, status: attendanceScore >= 90 ? 'above' : 'below' },
                { metric: 'Staff Retention', value: staffRetention, target: 95, status: staffRetention >= 95 ? 'above' : 'below' },
                { metric: 'Leave Processing', value: leaveApprovalRate, target: 80, status: leaveApprovalRate >= 80 ? 'above' : 'below' },
                { metric: 'Onboarding Complete', value: onboardingRate, target: 85, status: onboardingRate >= 85 ? 'above' : 'below' }
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">{item.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{item.value}%</span>
                      {item.status === 'above' && (
                        <TrendingUp className="text-green-600" size={14} />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        item.value >= item.target
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                      }`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">Target: {item.target}%</span>
                    <span className={`text-xs font-medium ${
                      item.value >= item.target ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {item.value - item.target > 0 ? `+${item.value - item.target}%` : `${item.value - item.target}%`}
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-0">
            {[
              { id: 'overview', label: 'Staff Directory', icon: Users },
              { id: 'leave', label: 'Leave Management', icon: Calendar },
              { id: 'staffMovement', label: 'Staff Movement', icon: MapPin },
              { id: 'assetRegister', label: 'Asset Register', icon: Package },
              { id: 'vehicleRequests', label: 'Vehicle Requests', icon: Car },
              { id: 'accommodation', label: 'Accommodation', icon: Home },
              { id: 'expenses', label: 'Expenses', icon: Receipt }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-4 font-semibold text-sm transition-colors border-r border-b border-gray-100 ${
                  activeTab === tab.id
                    ? 'text-orange-600 bg-orange-50 border-b-2 border-b-orange-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          {/* Staff Directory Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Staff Directory</h2>
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-700 text-white rounded-lg hover:from-orange-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                  <UserPlus size={18} />
                  Add Staff
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((member, index) => (
                  <div
                    key={member.id}
                    className="card-modern group p-4 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-105 transition-transform">
                        {member.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 leading-tight truncate">{member.fullName}</h3>
                        <p className="text-sm text-gray-600">{member.position}</p>
                        <span className="text-xs text-gray-500">{member.employeeId}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {member.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={14} />
                        <span>{member.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText size={14} />
                        <span>Leave: {member.leaveBalance} days</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setShowStaffProfileModal(true);
                          }}
                          className="flex-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-all text-xs font-semibold border border-orange-200">
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Today's Attendance</h2>
                <div className="text-sm text-gray-600">
                  Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Check-In</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Check-Out</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staff.map((member) => {
                      const today = new Date().toISOString().split('T')[0];
                      const todayAttendance = attendance.find(
                        a => a.employeeId === member.id && a.date === today
                      );

                      return (
                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                                {member.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{member.fullName}</p>
                                <p className="text-xs text-gray-500">{member.position}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{member.department}</td>
                          <td className="px-4 py-3">
                            {todayAttendance?.checkIn ? (
                              <span className="text-sm font-semibold text-green-600">{todayAttendance.checkIn}</span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {todayAttendance?.checkOut ? (
                              <span className="text-sm font-semibold text-blue-600">{todayAttendance.checkOut}</span>
                            ) : todayAttendance?.checkIn ? (
                              <span className="text-sm text-orange-600">Working...</span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {todayAttendance ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                todayAttendance.status === 'Present' ? 'bg-green-100 text-green-700' :
                                todayAttendance.status === 'Leave' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {todayAttendance.status}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {!todayAttendance?.checkIn && (
                                <button
                                  onClick={() => checkIn(member.id)}
                                  className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-xs font-semibold border border-green-200 flex items-center gap-1"
                                >
                                  <LogIn size={12} />
                                  Check In
                                </button>
                              )}
                              {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                                <button
                                  onClick={() => checkOut(member.id)}
                                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-xs font-semibold border border-blue-200 flex items-center gap-1"
                                >
                                  <LogOut size={12} />
                                  Check Out
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leave Management Tab */}
          {activeTab === 'leave' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Leave Requests</h2>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-lg hover:from-blue-700 hover:to-cyan-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                  <Calendar size={18} />
                  Apply Leave
                </button>
              </div>

              <div className="space-y-3">
                {leaveRequests.map((leave, index) => (
                  <div
                    key={leave.id}
                    className="card-modern p-4 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-lg flex items-center justify-center font-bold">
                            {leave.employeeName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{leave.employeeName}</h3>
                            <p className="text-sm text-gray-600">{leave.leaveType} Leave - {leave.days} days</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">From:</span>
                            <span className="ml-2 font-semibold text-gray-900">{leave.startDate}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">To:</span>
                            <span className="ml-2 font-semibold text-gray-900">{leave.endDate}</span>
                          </div>
                        </div>

                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700"><span className="font-semibold">Reason:</span> {leave.reason}</p>
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ml-4 ${
                        leave.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                        leave.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>
                        {leave.status}
                      </span>
                    </div>

                    {leave.status === 'Pending' && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => approveLeave(leave.id, 'Admin')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-sm font-semibold border border-green-200"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectLeave(leave.id, 'Admin')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-semibold border border-red-200"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}

                    {leave.status !== 'Pending' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        {leave.status} by {leave.approvedBy} on {leave.approvedDate}
                      </div>
                    )}
                  </div>
                ))}

                {leaveRequests.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No leave requests at the moment</p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Staff Movement Register Tab */}
          {activeTab === 'staffMovement' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Staff Movement Register</h2>
                <button
                  onClick={() => alert('Start GPS tracking for staff movement')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:from-purple-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                  <MapPin size={18} />
                  Start Tracking
                </button>
              </div>

              {/* Map View Placeholder */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border-2 border-dashed border-purple-300 mb-6">
                <div className="text-center">
                  <Map className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Real-time Staff Movement Map</h3>
                  <p className="text-sm text-gray-600 mb-4">Interactive map showing staff locations and routes</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold">
                    <Navigation size={16} />
                    Map integration ready
                  </div>
                </div>
              </div>

              {/* Active Movements */}
              <h3 className="font-bold text-gray-900 mb-3">Active Movements</h3>
              <div className="space-y-3">
                {[].map((movement) => (
                  <div key={movement.id} className="card-modern p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                          {movement.staffName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{movement.staffName}</h3>
                          <p className="text-sm text-gray-600">{movement.department}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                          <Play size={12} />
                          {movement.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Start Time</p>
                        <p className="text-sm font-semibold text-gray-900">{movement.startTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Distance</p>
                        <p className="text-sm font-semibold text-gray-900">{movement.distance}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ETA</p>
                        <p className="text-sm font-semibold text-gray-900">{movement.estimatedArrival}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Actions</p>
                        <button
                          onClick={() => alert(`Tracking ${movement.staffName} in real-time`)}
                          className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all text-xs font-semibold border border-purple-200 flex items-center gap-1">
                          <Eye size={12} />
                          Track
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                      <MapPin size={14} className="text-purple-600 flex-shrink-0" />
                      <div className="flex-1 text-sm">
                        <span className="font-semibold text-gray-900">{movement.currentLocation}</span>
                        <ArrowRight size={14} className="inline mx-2 text-gray-400" />
                        <span className="font-semibold text-gray-900">{movement.destination}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asset Register Tab */}
          {activeTab === 'assetRegister' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Asset Movement Register</h2>
                <button
                  onClick={() => setShowAssetCheckoutModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-lg hover:from-teal-700 hover:to-cyan-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                  <Package size={18} />
                  Checkout Asset
                </button>
              </div>

              {/* Asset Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Assets', value: 0, color: 'from-teal-500 to-cyan-600' },
                  { label: 'Checked Out', value: 0, color: 'from-orange-500 to-amber-600' },
                  { label: 'Available', value: 0, color: 'from-green-500 to-emerald-600' },
                  { label: 'In Repair', value: 0, color: 'from-red-500 to-rose-600' }
                ].map((stat, i) => (
                  <div key={i} className="card-modern p-4">
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                      <div className={`bg-gradient-to-br ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <Package className="text-white" size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checked Out Assets */}
              <h3 className="font-bold text-gray-900 mb-3">Checked Out Assets</h3>
              <div className="space-y-3">
                {assetCheckouts.map((asset) => (
                  <div key={asset.id} className="card-modern p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-xl flex items-center justify-center">
                          <Package size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{asset.assetName}</h3>
                          <p className="text-sm text-gray-600">{asset.assetCode} • {asset.category}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          asset.status === 'Checked Out' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {asset.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Checked Out To</p>
                        <p className="text-sm font-semibold text-gray-900">{asset.checkedOutTo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Checkout Date</p>
                        <p className="text-sm font-semibold text-gray-900">{asset.checkedOutDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expected Return</p>
                        <p className="text-sm font-semibold text-gray-900">{asset.expectedReturn}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Actions</p>
                        <button
                          onClick={() => alert(`Returning ${asset.assetName} from ${asset.checkedOutTo}`)}
                          className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-xs font-semibold border border-green-200 flex items-center gap-1">
                          <Check size={12} />
                          Return
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50 rounded-lg">
                      <p className="text-sm text-gray-700"><span className="font-semibold">Purpose:</span> {asset.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GPS Attendance Tab */}
          {activeTab === 'gpsAttendance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">GPS-Based Attendance</h2>
                <button
                  onClick={handleGpsCheckIn}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                  <Navigation size={18} />
                  Check In (GPS)
                </button>
              </div>

              {/* Office Location Info */}
              <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 mb-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <MapPin className="text-green-600" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Office Location</h3>
                    <p className="text-sm text-gray-600 mb-2">Colombo Main Office</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-700"><span className="font-semibold">Lat:</span> 6.9271</span>
                      <span className="text-gray-700"><span className="font-semibold">Lng:</span> 79.8612</span>
                      <span className="text-gray-700"><span className="font-semibold">Radius:</span> 100m</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                    Auto-Reconcile ON
                  </span>
                </div>
              </div>

              {/* Today's GPS Attendance */}
              <h3 className="font-bold text-gray-900 mb-3">Today's GPS Check-ins</h3>
              <div className="space-y-3">
                {gpsAttendance.length === 0 ? (
                  <div className="card-modern p-6 text-center text-gray-500">
                    No GPS attendance records for today. Click "Check In (GPS)" to add one.
                  </div>
                ) : (
                  gpsAttendance.map((record) => (
                    <div key={record.id} className="card-modern p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
                            {record.employeeName?.charAt(0) || 'N'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{record.employeeName}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin size={12} />
                              {record.location || record.department}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            record.verified
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          }`}>
                            {record.verified ? 'Verified' : 'Manual Review'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check-In</p>
                          <p className="text-sm font-semibold text-green-600">{record.time || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check-Out</p>
                          <p className="text-sm font-semibold text-blue-600">
                            {record.checkOutTime || 'Working...'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Distance from Office</p>
                          <p className="text-sm font-semibold text-gray-900">{record.distance || '0m'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Coordinates</p>
                          <p className="text-xs font-mono text-gray-900">{record.coordinates || record.latitude + ', ' + record.longitude || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Actions</p>
                          <button
                            onClick={() => deleteGpsAttendance(record.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-xs font-semibold border border-red-200 flex items-center gap-1">
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>

                      {!record.verified && (
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => updateGpsAttendance(record.id, { verified: true })}
                            className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-sm font-semibold border border-green-200 flex items-center justify-center gap-1">
                            <Check size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => deleteGpsAttendance(record.id)}
                            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-semibold border border-red-200 flex items-center justify-center gap-1">
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Vehicle Requests Tab */}
          {activeTab === 'vehicleRequests' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Vehicle Requests</h2>
                <button
                  onClick={() => setShowVehicleRequestModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-700 text-white rounded-lg hover:from-blue-700 hover:to-sky-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                  <Car size={18} />
                  Request Vehicle
                </button>
              </div>

              {/* Request Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Pending', value: 0, color: 'from-yellow-500 to-amber-600' },
                  { label: 'Approved', value: 0, color: 'from-green-500 to-emerald-600' },
                  { label: 'In Use', value: 0, color: 'from-blue-500 to-sky-600' },
                  { label: 'Completed', value: 0, color: 'from-gray-500 to-slate-600' }
                ].map((stat, i) => (
                  <div key={i} className="card-modern p-4">
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                      <div className={`bg-gradient-to-br ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <Car className="text-white" size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Requests */}
              <h3 className="font-bold text-gray-900 mb-3">Recent Vehicle Requests</h3>
              <div className="space-y-3">
                {vehicleRequests.map((request) => (
                  <div key={request.id} className="card-modern p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-600 text-white rounded-lg flex items-center justify-center">
                            <Car size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{request.requestNo}</h3>
                            <p className="text-sm text-gray-600">{request.requestedBy}</p>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Project</p>
                        <p className="text-sm font-semibold text-gray-900">{request.project}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Activity</p>
                        <p className="text-sm font-semibold text-gray-900">{request.activity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Est. Cost</p>
                        <p className="text-sm font-semibold text-blue-600">LKR {request.estimatedCost.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vehicle Type</p>
                        <p className="text-sm font-semibold text-gray-900">{request.vehicleType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm font-semibold text-gray-900">{request.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time</p>
                        <p className="text-sm font-semibold text-gray-900">{request.startTime} - {request.endTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Passengers</p>
                        <p className="text-sm font-semibold text-gray-900">{request.passengers}</p>
                      </div>
                    </div>

                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Destination</p>
                      <p className="text-sm font-semibold text-gray-900 mb-2">{request.destination}</p>
                      <p className="text-sm text-gray-700"><span className="font-semibold">Purpose:</span> {request.purpose}</p>
                    </div>

                    {request.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert(`Approved vehicle request ${request.requestNo} for ${request.project}`)}
                          className="flex-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-sm font-semibold border border-green-200 flex items-center justify-center gap-1">
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => alert(`Rejected vehicle request ${request.requestNo}`)}
                          className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-semibold border border-red-200 flex items-center justify-center gap-1">
                          <X size={14} />
                          Reject
                        </button>
                        <button
                          onClick={() => alert(`Editing vehicle request ${request.requestNo}`)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-semibold border border-blue-200 flex items-center gap-1">
                          <Edit size={14} />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accommodation Requests Tab */}
          {activeTab === 'accommodation' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Accommodation Requests</h2>
                <button
                  onClick={() => setShowAccommodationRequestModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-700 text-white rounded-lg hover:from-rose-700 hover:to-pink-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                  <Home size={18} />
                  Request Accommodation
                </button>
              </div>

              {/* Request Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Pending', value: 0, color: 'from-yellow-500 to-amber-600' },
                  { label: 'Approved', value: 0, color: 'from-green-500 to-emerald-600' },
                  { label: 'Booked', value: 0, color: 'from-rose-500 to-pink-600' },
                  { label: 'Completed', value: 0, color: 'from-gray-500 to-slate-600' }
                ].map((stat, i) => (
                  <div key={i} className="card-modern p-4">
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                      <div className={`bg-gradient-to-br ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <Home className="text-white" size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Requests */}
              <h3 className="font-bold text-gray-900 mb-3">Recent Accommodation Requests</h3>
              <div className="space-y-3">
                {accommodationRequests.map((request) => (
                  <div key={request.id} className="card-modern p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-lg flex items-center justify-center">
                            <Home size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{request.requestNo}</h3>
                            <p className="text-sm text-gray-600">{request.requestedBy}</p>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 p-3 bg-rose-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Project</p>
                        <p className="text-sm font-semibold text-gray-900">{request.project}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Activity</p>
                        <p className="text-sm font-semibold text-gray-900">{request.activity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Budget</p>
                        <p className="text-sm font-semibold text-rose-600">LKR {request.budget.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="text-sm font-semibold text-gray-900">{request.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Check-In</p>
                        <p className="text-sm font-semibold text-gray-900">{request.checkIn}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Check-Out</p>
                        <p className="text-sm font-semibold text-gray-900">{request.checkOut}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-sm font-semibold text-gray-900">{request.nights} nights</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Rooms/Guests</p>
                        <p className="text-sm font-semibold text-gray-900">{request.rooms} / {request.guests}</p>
                      </div>
                    </div>

                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Type</p>
                          <p className="text-sm font-semibold text-gray-900">{request.accommodationType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Special Requirements</p>
                          <p className="text-sm text-gray-700">{request.specialRequirements}</p>
                        </div>
                      </div>
                    </div>

                    {request.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert(`Approved accommodation request ${request.requestNo} for ${request.project}`)}
                          className="flex-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all text-sm font-semibold border border-green-200 flex items-center justify-center gap-1">
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => alert(`Rejected accommodation request ${request.requestNo}`)}
                          className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-semibold border border-red-200 flex items-center justify-center gap-1">
                          <X size={14} />
                          Reject
                        </button>
                        <button
                          onClick={() => alert(`Editing accommodation request ${request.requestNo}`)}
                          className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all text-sm font-semibold border border-rose-200 flex items-center gap-1">
                          <Edit size={14} />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">Project Expenses (Vehicle & Accommodation)</h2>
                <button
                  onClick={() => alert('Full expense report will be generated and downloaded')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:from-indigo-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg active:scale-95">
                  <Receipt size={18} />
                  View Full Report
                </button>
              </div>

              {/* Expense Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Vehicle Expenses', value: 0, icon: Car, color: 'from-blue-500 to-sky-600' },
                  { label: 'Accommodation', value: 0, icon: Home, color: 'from-rose-500 to-pink-600' },
                  { label: 'Total This Month', value: 0, icon: Receipt, color: 'from-indigo-500 to-purple-600' }
                ].map((stat, i) => (
                  <div key={i} className="card-modern p-4">
                    <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-gray-900">
                        LKR {stat.value.toLocaleString()}
                      </h3>
                      <div className={`bg-gradient-to-br ${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                        <stat.icon className="text-white" size={24} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expense by Project */}
              <h3 className="font-bold text-gray-900 mb-3">Expenses by Project</h3>
              <div className="space-y-3">
                {[].map((project) => {
                  const budgetUsed = (project.totalExpenses / project.budget) * 100;
                  return (
                    <div key={project.id} className="card-modern p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{project.projectName}</h3>
                          <p className="text-sm text-gray-600">{project.transactions} transactions this month</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Budget Used</p>
                          <p className={`text-lg font-bold ${
                            budgetUsed > 80 ? 'text-red-600' : budgetUsed > 60 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {budgetUsed.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                          <p className="text-sm font-bold text-blue-600">
                            LKR {project.vehicleExpenses.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Accommodation</p>
                          <p className="text-sm font-bold text-rose-600">
                            LKR {project.accommodationExpenses.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
                          <p className="text-sm font-bold text-indigo-600">
                            LKR {project.totalExpenses.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Budget</p>
                          <p className="text-sm font-bold text-gray-900">
                            LKR {project.budget.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Budget Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Budget Utilization</span>
                          <span>
                            LKR {project.totalExpenses.toLocaleString()} / {project.budget.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              budgetUsed > 80 ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                              budgetUsed > 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                              'bg-gradient-to-r from-green-500 to-emerald-600'
                            }`}
                            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <button
                        onClick={() => alert(`Viewing detailed expense breakdown for ${project.projectName}\n\nVehicle: LKR ${project.vehicleExpenses.toLocaleString()}\nAccommodation: LKR ${project.accommodationExpenses.toLocaleString()}\nTotal: LKR ${project.totalExpenses.toLocaleString()}`)}
                        className="w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all text-sm font-semibold border border-indigo-200 flex items-center justify-center gap-1">
                        <Eye size={14} />
                        View Detailed Breakdown
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-orange-600" size={18} />
                Weekly Attendance Trend
              </h3>
              <p className="text-xs text-gray-600 mt-1">Last 7 days</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">{weeklyAttendanceTrend.averageRate}%</div>
              <div className={`text-xs flex items-center gap-1 ${weeklyAttendanceTrend.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {weeklyAttendanceTrend.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {weeklyAttendanceTrend.trend >= 0 ? '+' : ''}{weeklyAttendanceTrend.trend}% vs last week
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {weeklyAttendanceTrend.days.map((item, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{item.day}</span>
                  <span className="text-gray-600">{item.count}/{stats.totalStaff}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{item.percent}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="text-purple-600" size={18} />
                Department Distribution
              </h3>
              <p className="text-xs text-gray-600 mt-1">Staff by department</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">{departmentDistribution.length}</div>
              <div className="text-xs text-gray-600">Departments</div>
            </div>
          </div>
          <div className="space-y-3">
            {departmentDistribution.map((item, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.color}`}></div>
                    <span className="font-medium text-gray-700">{item.dept}</span>
                  </div>
                  <span className="text-gray-600">{item.count} staff</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${item.color} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{item.percent}% of total</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-blue-600" size={18} />
                Leave Statistics
              </h3>
              <p className="text-xs text-gray-600 mt-1">Current month</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">{leaveStatistics.total}</div>
              <div className="text-xs text-gray-600">Total leaves</div>
            </div>
          </div>
          <div className="space-y-4">
            {leaveStatistics.types.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="font-medium text-gray-700 text-sm">{item.type}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{item.count}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-600" />
                    <span className="text-gray-600">{item.approved} approved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-orange-600" />
                    <span className="text-gray-600">{item.pending} pending</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Activity className="text-green-600" size={18} />
                Performance Metrics
              </h3>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-600">0%</div>
              <div className="text-xs text-gray-600">Overall</div>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { metric: 'Attendance Rate', value: 0, target: 0, status: 'neutral' },
              { metric: 'Leave Approval Time', value: 0, target: 0, status: 'neutral' },
              { metric: 'GPS Verification', value: 0, target: 0, status: 'neutral' },
              { metric: 'Asset Return Rate', value: 0, target: 0, status: 'neutral' },
              { metric: 'Vehicle Utilization', value: 0, target: 0, status: 'neutral' },
              { metric: 'Staff Satisfaction', value: 0, target: 0, status: 'neutral' }
            ].map((item, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-gray-700">{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Target: {item.target}%</span>
                    {item.status === 'above' ? (
                      <TrendingUp size={14} className="text-green-600" />
                    ) : (
                      <TrendingDown size={14} className="text-red-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        item.value >= item.target
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-gradient-to-r from-orange-500 to-red-600'
                      }`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-bold ${
                    item.value >= item.target ? 'text-green-600' : 'text-orange-600'
                  }`}>{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-amber-700 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add New Staff Member</h2>
                    <p className="text-orange-100 text-sm mt-1">Fill in the staff details below</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddStaffModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffForm.fullName}
                      onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="+94 77 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={staffForm.department}
                      onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={staffForm.position}
                      onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select Position</option>
                      {positions.map(position => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={staffForm.joiningDate}
                      onChange={(e) => setStaffForm({ ...staffForm, joiningDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monthly Salary (LKR)
                    </label>
                    <input
                      type="number"
                      value={staffForm.salary}
                      onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="75000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Annual Leave Balance (Days)
                    </label>
                    <input
                      type="number"
                      value={staffForm.leaveBalance}
                      onChange={(e) => setStaffForm({ ...staffForm, leaveBalance: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="21"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={staffForm.status}
                      onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* User Account Settings Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserPlus size={18} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">User Account Settings</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Create login credentials for this staff member to access the system
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={staffForm.username}
                        onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="john.doe"
                      />
                      <p className="text-xs text-gray-500 mt-1">This will be used for logging in</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        User Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={staffForm.userRole}
                        onChange={(e) => setStaffForm({ ...staffForm, userRole: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Determines system access level based on position</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Account Status
                      </label>
                      <select
                        value={staffForm.userStatus}
                        onChange={(e) => setStaffForm({ ...staffForm, userStatus: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Can be changed later</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-700 text-white rounded-lg hover:from-orange-700 hover:to-amber-800 font-semibold shadow-md"
              >
                <UserPlus className="inline mr-2" size={18} />
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Edit size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Edit Staff Member</h2>
                    <p className="text-blue-100 text-sm mt-1">Update staff member details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditStaffModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editStaffForm.fullName}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={editStaffForm.email}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editStaffForm.phone}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={editStaffForm.employeeId}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, employeeId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editStaffForm.dateOfBirth}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={editStaffForm.gender}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, gender: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={editStaffForm.address}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, address: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="2"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={editStaffForm.bio}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, bio: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Brief professional biography..."
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Employment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department
                      </label>
                      <select
                        value={editStaffForm.department}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, department: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Department</option>
                        <option value="Governance">Governance</option>
                        <option value="Executive">Executive</option>
                        <option value="Programmes">Programmes</option>
                        <option value="Finance">Finance</option>
                        <option value="Fundraising">Fundraising</option>
                        <option value="HR">HR</option>
                        <option value="MEAL">MEAL</option>
                        <option value="IT">IT</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={editStaffForm.position}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, position: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        value={editStaffForm.joiningDate}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, joiningDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contract Type
                      </label>
                      <select
                        value={editStaffForm.contractType}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, contractType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Contract Type</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Work Hours
                      </label>
                      <input
                        type="text"
                        value={editStaffForm.workHours}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, workHours: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="9:00 AM - 5:00 PM"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Salary (LKR)
                      </label>
                      <input
                        type="number"
                        value={editStaffForm.salary}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, salary: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Leave Balance (days)
                      </label>
                      <input
                        type="number"
                        value={editStaffForm.leaveBalance}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, leaveBalance: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={editStaffForm.status}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, status: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={editStaffForm.emergencyContact}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, emergencyContact: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Name: Contact Number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await API.put(`/users/${editStaffForm.id}`, editStaffForm);
                      if (response.data.success) {
                        alert('✅ Staff member updated successfully!');
                        setShowEditStaffModal(false);
                        // Refresh the staff list or update locally
                        window.location.reload();
                      } else {
                        alert('❌ Error: ' + response.data.message);
                      }
                    } catch (error) {
                      console.error('Error updating staff:', error);
                      alert('❌ Error updating staff member: ' + (error.response?.data?.message || error.message));
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditStaffModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Onboarding Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Clipboard size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">New Onboarding</h2>
                    <p className="text-green-100 text-sm mt-1">Start employee onboarding process</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOnboardingModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={onboardingForm.employeeId}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, employeeId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select an employee</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} - {s.position}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={onboardingForm.startDate}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mentor (Optional)
                </label>
                <input
                  type="text"
                  value={onboardingForm.mentor}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, mentor: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="John Doe"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowOnboardingModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOnboarding}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-800 transition shadow-md"
                >
                  Create Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Appraisal Modal */}
      {showAppraisalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Award size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">New Appraisal</h2>
                    <p className="text-purple-100 text-sm mt-1">Create performance appraisal</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAppraisalModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  value={appraisalForm.employeeId}
                  onChange={(e) => setAppraisalForm({ ...appraisalForm, employeeId: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select an employee</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} - {s.position}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Review Period <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={appraisalForm.period}
                    onChange={(e) => setAppraisalForm({ ...appraisalForm, period: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Q4 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={appraisalForm.dueDate}
                    onChange={(e) => setAppraisalForm({ ...appraisalForm, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reviewer
                </label>
                <input
                  type="text"
                  value={appraisalForm.reviewer}
                  onChange={(e) => setAppraisalForm({ ...appraisalForm, reviewer: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rating (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={appraisalForm.rating}
                  onChange={(e) => setAppraisalForm({ ...appraisalForm, rating: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="4.5"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAppraisalModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAppraisal}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-800 transition shadow-md"
                >
                  Create Appraisal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Apply for Leave</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
                  <select
                    value={leaveForm.employeeId}
                    onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {staff.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.employeeId}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type *</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="Annual">Annual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Emergency">Emergency Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Days</label>
                  <input
                    type="number"
                    value={leaveForm.days}
                    onChange={(e) => setLeaveForm({ ...leaveForm, days: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter reason for leave..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleApplyLeave}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-800 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Submit Application
                </button>
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Checkout Modal */}
      {showAssetCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Checkout Asset</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Asset Name *</label>
                  <input
                    type="text"
                    value={assetCheckoutForm.assetName}
                    onChange={(e) => setAssetCheckoutForm({ ...assetCheckoutForm, assetName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g., Laptop, Projector, Vehicle"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Asset Code</label>
                    <input
                      type="text"
                      value={assetCheckoutForm.assetCode}
                      onChange={(e) => setAssetCheckoutForm({ ...assetCheckoutForm, assetCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={assetCheckoutForm.category}
                      onChange={(e) => setAssetCheckoutForm({ ...assetCheckoutForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Vehicles">Vehicles</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Furniture">Furniture</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Checked Out To *</label>
                  <select
                    value={assetCheckoutForm.checkedOutTo}
                    onChange={(e) => setAssetCheckoutForm({ ...assetCheckoutForm, checkedOutTo: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {staff.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.employeeId}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Checkout Date *</label>
                    <input
                      type="date"
                      value={assetCheckoutForm.checkedOutDate}
                      onChange={(e) => setAssetCheckoutForm({ ...assetCheckoutForm, checkedOutDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Return</label>
                    <input
                      type="date"
                      value={assetCheckoutForm.expectedReturn}
                      onChange={(e) => setAssetCheckoutForm({ ...assetCheckoutForm, expectedReturn: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
                  <textarea
                    value={assetCheckoutForm.purpose}
                    onChange={(e) => setAssetCheckoutForm({ ...assetCheckoutForm, purpose: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter purpose of checkout..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCheckoutAsset}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-800 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Checkout Asset
                </button>
                <button
                  onClick={() => setShowAssetCheckoutModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Request Modal */}
      {showVehicleRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-sky-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Request Vehicle</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Requested By *</label>
                  <select
                    value={vehicleRequestForm.requestedBy}
                    onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, requestedBy: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {staff.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.employeeId}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project</label>
                    <input
                      type="text"
                      value={vehicleRequestForm.project}
                      onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, project: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Health Program"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Activity</label>
                    <input
                      type="text"
                      value={vehicleRequestForm.activity}
                      onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, activity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Field Visit"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type *</label>
                  <select
                    value={vehicleRequestForm.vehicleType}
                    onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, vehicleType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Van">Van</option>
                    <option value="Pickup">Pickup Truck</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={vehicleRequestForm.date}
                      onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={vehicleRequestForm.startTime}
                      onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={vehicleRequestForm.endTime}
                      onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Passengers</label>
                    <input
                      type="number"
                      value={vehicleRequestForm.passengers}
                      onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, passengers: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Destination *</label>
                    <input
                      type="text"
                      value={vehicleRequestForm.destination}
                      onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, destination: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Nairobi CBD"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Purpose</label>
                  <textarea
                    value={vehicleRequestForm.purpose}
                    onChange={(e) => setVehicleRequestForm({ ...vehicleRequestForm, purpose: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter purpose of travel..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRequestVehicle}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-sky-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-sky-800 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => setShowVehicleRequestModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accommodation Request Modal */}
      {showAccommodationRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-rose-600 to-pink-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Request Accommodation</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Requested By *</label>
                  <select
                    value={accommodationRequestForm.requestedBy}
                    onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, requestedBy: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {staff.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.employeeId}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project</label>
                    <input
                      type="text"
                      value={accommodationRequestForm.project}
                      onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, project: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="e.g., Education Program"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Activity</label>
                    <input
                      type="text"
                      value={accommodationRequestForm.activity}
                      onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, activity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="e.g., Training Workshop"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    value={accommodationRequestForm.location}
                    onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="e.g., Mombasa"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Check In *</label>
                    <input
                      type="date"
                      value={accommodationRequestForm.checkIn}
                      onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, checkIn: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Check Out *</label>
                    <input
                      type="date"
                      value={accommodationRequestForm.checkOut}
                      onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, checkOut: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Rooms</label>
                    <input
                      type="number"
                      value={accommodationRequestForm.rooms}
                      onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, rooms: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="e.g., 2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Guests</label>
                    <input
                      type="number"
                      value={accommodationRequestForm.guests}
                      onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, guests: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      placeholder="e.g., 4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Accommodation Type</label>
                  <select
                    value={accommodationRequestForm.accommodationType}
                    onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, accommodationType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Guest House">Guest House</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Serviced Apartment">Serviced Apartment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requirements</label>
                  <textarea
                    value={accommodationRequestForm.specialRequirements}
                    onChange={(e) => setAccommodationRequestForm({ ...accommodationRequestForm, specialRequirements: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    rows="3"
                    placeholder="Enter any special requirements..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRequestAccommodation}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-pink-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-700 hover:to-pink-800 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Submit Request
                </button>
                <button
                  onClick={() => setShowAccommodationRequestModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Profile Modal */}
      {showStaffProfileModal && selectedStaff && (
        <StaffProfileModal
          staff={selectedStaff}
          onClose={() => {
            setShowStaffProfileModal(false);
            setSelectedStaff(null);
          }}
          onEdit={(staff) => {
            setEditStaffForm({
              id: staff.id,
              fullName: staff.fullName || '',
              email: staff.email || '',
              phone: staff.phone || '',
              department: staff.department || '',
              position: staff.position || '',
              joiningDate: staff.joiningDate || '',
              salary: staff.salary || '',
              leaveBalance: staff.leaveBalance || 21,
              status: staff.status || 'Active',
              employeeId: staff.employeeId || '',
              dateOfBirth: staff.dateOfBirth || '',
              gender: staff.gender || '',
              address: staff.address || '',
              bio: staff.bio || '',
              contractType: staff.contractType || '',
              workHours: staff.workHours || '',
              emergencyContact: staff.emergencyContact || ''
            });
            setShowStaffProfileModal(false);
            setShowEditStaffModal(true);
          }}
          onDelete={(staff) => {
            // TODO: Implement delete functionality
            if (window.confirm(`Are you sure you want to remove ${staff.fullName}?`)) {
              console.log('Delete staff:', staff);
            }
          }}
        />
      )}
    </div>
  );
};

export default HRPage;
