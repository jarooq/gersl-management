import React, { createContext, useContext, useState } from 'react';

const HRContext = createContext();

export const useHR = () => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
};

export const HRProvider = ({ children }) => {
  const [staff, setStaff] = useState([]);

  const [attendance, setAttendance] = useState([]);

  const [leaveRequests, setLeaveRequests] = useState([]);

  const [onboardingRecords, setOnboardingRecords] = useState([]);

  const [appraisalRecords, setAppraisalRecords] = useState([]);

  const [gpsAttendance, setGpsAttendance] = useState([]);

  const [assetCheckouts, setAssetCheckouts] = useState([]);

  const [vehicleRequests, setVehicleRequests] = useState([]);

  const [accommodationRequests, setAccommodationRequests] = useState([]);

  // Staff CRUD operations
  const addStaff = (staffData) => {
    const newStaff = {
      ...staffData,
      id: Math.max(...staff.map(s => s.id), 0) + 1,
      employeeId: `EMP${String(staff.length + 1).padStart(3, '0')}`
    };
    setStaff([...staff, newStaff]);
  };

  const updateStaff = (id, updatedData) => {
    setStaff(staff.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const deleteStaff = (id) => {
    setStaff(staff.filter(s => s.id !== id));
  };

  // Attendance operations
  const checkIn = (employeeId) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    const existingAttendance = attendance.find(
      a => a.employeeId === employeeId && a.date === today
    );

    if (existingAttendance) {
      return { success: false, message: 'Already checked in today' };
    }

    const newAttendance = {
      id: Math.max(...attendance.map(a => a.id), 0) + 1,
      employeeId,
      date: today,
      checkIn: now,
      checkOut: null,
      status: 'Present'
    };

    setAttendance([...attendance, newAttendance]);
    return { success: true, message: 'Checked in successfully' };
  };

  const checkOut = (employeeId) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    const updated = attendance.map(a =>
      a.employeeId === employeeId && a.date === today && !a.checkOut
        ? { ...a, checkOut: now }
        : a
    );

    setAttendance(updated);
    return { success: true, message: 'Checked out successfully' };
  };

  // Leave operations
  const applyLeave = (leaveData) => {
    const employee = staff.find(s => s.id === leaveData.employeeId);
    const newLeave = {
      ...leaveData,
      id: Math.max(...leaveRequests.map(l => l.id), 0) + 1,
      employeeName: employee.fullName,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
      approvedBy: null,
      approvedDate: null
    };
    setLeaveRequests([...leaveRequests, newLeave]);
  };

  const approveLeave = (id, approverName) => {
    setLeaveRequests(leaveRequests.map(l =>
      l.id === id
        ? { ...l, status: 'Approved', approvedBy: approverName, approvedDate: new Date().toISOString().split('T')[0] }
        : l
    ));

    // Deduct from leave balance
    const leave = leaveRequests.find(l => l.id === id);
    if (leave) {
      updateStaff(leave.employeeId, {
        leaveBalance: staff.find(s => s.id === leave.employeeId).leaveBalance - leave.days
      });
    }
  };

  const rejectLeave = (id, approverName) => {
    setLeaveRequests(leaveRequests.map(l =>
      l.id === id
        ? { ...l, status: 'Rejected', approvedBy: approverName, approvedDate: new Date().toISOString().split('T')[0] }
        : l
    ));
  };

  // Onboarding operations
  const addOnboarding = (onboardingData) => {
    const employee = staff.find(s => s.id === onboardingData.employeeId);
    const newOnboarding = {
      ...onboardingData,
      id: Math.max(...onboardingRecords.map(o => o.id), 0) + 1,
      employeeName: employee?.fullName || 'Unknown',
      department: employee?.department || 'Unknown',
      startDate: onboardingData.startDate || new Date().toISOString().split('T')[0],
      progress: 0,
      status: 'In Progress'
    };
    setOnboardingRecords([...onboardingRecords, newOnboarding]);
  };

  const updateOnboarding = (id, updatedData) => {
    setOnboardingRecords(onboardingRecords.map(o =>
      o.id === id ? { ...o, ...updatedData } : o
    ));
  };

  const deleteOnboarding = (id) => {
    setOnboardingRecords(onboardingRecords.filter(o => o.id !== id));
  };

  // Appraisal operations
  const addAppraisal = (appraisalData) => {
    const employee = staff.find(s => s.id === appraisalData.employeeId);
    const newAppraisal = {
      ...appraisalData,
      id: Math.max(...appraisalRecords.map(a => a.id), 0) + 1,
      employeeName: employee?.fullName || 'Unknown',
      department: employee?.department || 'Unknown',
      position: employee?.position || 'Unknown',
      status: 'Pending',
      createdDate: new Date().toISOString().split('T')[0]
    };
    setAppraisalRecords([...appraisalRecords, newAppraisal]);
  };

  const updateAppraisal = (id, updatedData) => {
    setAppraisalRecords(appraisalRecords.map(a =>
      a.id === id ? { ...a, ...updatedData } : a
    ));
  };

  const deleteAppraisal = (id) => {
    setAppraisalRecords(appraisalRecords.filter(a => a.id !== id));
  };

  // GPS Attendance operations
  const addGpsAttendance = (gpsData) => {
    const employee = staff.find(s => s.id === gpsData.employeeId);
    const newGpsAttendance = {
      ...gpsData,
      id: Math.max(...gpsAttendance.map(g => g.id), 0) + 1,
      employeeName: employee?.fullName || 'Unknown',
      department: employee?.department || 'Unknown',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5)
    };
    setGpsAttendance([...gpsAttendance, newGpsAttendance]);
  };

  const updateGpsAttendance = (id, updatedData) => {
    setGpsAttendance(gpsAttendance.map(g =>
      g.id === id ? { ...g, ...updatedData } : g
    ));
  };

  const deleteGpsAttendance = (id) => {
    setGpsAttendance(gpsAttendance.filter(g => g.id !== id));
  };

  // Asset Checkout operations
  const addAssetCheckout = (assetData) => {
    const employee = staff.find(s => s.id === assetData.checkedOutTo);
    const newAsset = {
      ...assetData,
      id: Math.max(...assetCheckouts.map(a => a.id), 0) + 1,
      assetCode: assetData.assetCode || `AST${String(assetCheckouts.length + 1).padStart(3, '0')}`,
      checkedOutToName: employee?.fullName || 'Unknown',
      status: 'Checked Out',
      checkedOutDate: assetData.checkedOutDate || new Date().toISOString().split('T')[0]
    };
    setAssetCheckouts([...assetCheckouts, newAsset]);
  };

  const updateAssetCheckout = (id, updatedData) => {
    setAssetCheckouts(assetCheckouts.map(a =>
      a.id === id ? { ...a, ...updatedData } : a
    ));
  };

  const deleteAssetCheckout = (id) => {
    setAssetCheckouts(assetCheckouts.filter(a => a.id !== id));
  };

  const returnAsset = (id) => {
    setAssetCheckouts(assetCheckouts.map(a =>
      a.id === id ? { ...a, status: 'Returned', returnedDate: new Date().toISOString().split('T')[0] } : a
    ));
  };

  // Vehicle Request operations
  const addVehicleRequest = (requestData) => {
    const employee = staff.find(s => s.id === requestData.requestedBy);
    const newRequest = {
      ...requestData,
      id: Math.max(...vehicleRequests.map(v => v.id), 0) + 1,
      requestNo: `VEH${String(vehicleRequests.length + 1).padStart(4, '0')}`,
      requestedByName: employee?.fullName || 'Unknown',
      status: 'Pending',
      requestedDate: new Date().toISOString().split('T')[0]
    };
    setVehicleRequests([...vehicleRequests, newRequest]);
  };

  const updateVehicleRequest = (id, updatedData) => {
    setVehicleRequests(vehicleRequests.map(v =>
      v.id === id ? { ...v, ...updatedData } : v
    ));
  };

  const deleteVehicleRequest = (id) => {
    setVehicleRequests(vehicleRequests.filter(v => v.id !== id));
  };

  const approveVehicleRequest = (id, approverName) => {
    setVehicleRequests(vehicleRequests.map(v =>
      v.id === id
        ? { ...v, status: 'Approved', approvedBy: approverName, approvedDate: new Date().toISOString().split('T')[0] }
        : v
    ));
  };

  const rejectVehicleRequest = (id, approverName) => {
    setVehicleRequests(vehicleRequests.map(v =>
      v.id === id
        ? { ...v, status: 'Rejected', rejectedBy: approverName, rejectedDate: new Date().toISOString().split('T')[0] }
        : v
    ));
  };

  // Accommodation Request operations
  const addAccommodationRequest = (requestData) => {
    const employee = staff.find(s => s.id === requestData.requestedBy);
    const newRequest = {
      ...requestData,
      id: Math.max(...accommodationRequests.map(a => a.id), 0) + 1,
      requestNo: `ACC${String(accommodationRequests.length + 1).padStart(4, '0')}`,
      requestedByName: employee?.fullName || 'Unknown',
      status: 'Pending',
      requestedDate: new Date().toISOString().split('T')[0]
    };
    setAccommodationRequests([...accommodationRequests, newRequest]);
  };

  const updateAccommodationRequest = (id, updatedData) => {
    setAccommodationRequests(accommodationRequests.map(a =>
      a.id === id ? { ...a, ...updatedData } : a
    ));
  };

  const deleteAccommodationRequest = (id) => {
    setAccommodationRequests(accommodationRequests.filter(a => a.id !== id));
  };

  const approveAccommodationRequest = (id, approverName) => {
    setAccommodationRequests(accommodationRequests.map(a =>
      a.id === id
        ? { ...a, status: 'Approved', approvedBy: approverName, approvedDate: new Date().toISOString().split('T')[0] }
        : a
    ));
  };

  const rejectAccommodationRequest = (id, approverName) => {
    setAccommodationRequests(accommodationRequests.map(a =>
      a.id === id
        ? { ...a, status: 'Rejected', rejectedBy: approverName, rejectedDate: new Date().toISOString().split('T')[0] }
        : a
    ));
  };

  // Stats
  const getStats = () => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.status === 'Active').length;
    const today = new Date().toISOString().split('T')[0];
    const presentToday = attendance.filter(a => a.date === today && a.status === 'Present').length;
    const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;

    return {
      totalStaff,
      activeStaff,
      presentToday,
      pendingLeaves,
      attendanceRate: totalStaff > 0 ? ((presentToday / totalStaff) * 100).toFixed(0) : 0
    };
  };

  const value = {
    staff,
    attendance,
    leaveRequests,
    onboardingRecords,
    appraisalRecords,
    gpsAttendance,
    assetCheckouts,
    vehicleRequests,
    accommodationRequests,
    addStaff,
    updateStaff,
    deleteStaff,
    checkIn,
    checkOut,
    applyLeave,
    approveLeave,
    rejectLeave,
    addOnboarding,
    updateOnboarding,
    deleteOnboarding,
    addAppraisal,
    updateAppraisal,
    deleteAppraisal,
    addGpsAttendance,
    updateGpsAttendance,
    deleteGpsAttendance,
    addAssetCheckout,
    updateAssetCheckout,
    deleteAssetCheckout,
    returnAsset,
    addVehicleRequest,
    updateVehicleRequest,
    deleteVehicleRequest,
    approveVehicleRequest,
    rejectVehicleRequest,
    addAccommodationRequest,
    updateAccommodationRequest,
    deleteAccommodationRequest,
    approveAccommodationRequest,
    rejectAccommodationRequest,
    getStats
  };

  return <HRContext.Provider value={value}>{children}</HRContext.Provider>;
};
