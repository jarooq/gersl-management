import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';
import * as APIServices from '../services/api';

const HRContext = createContext();

export const useHR = () => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
};

export const HRProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [onboardingRecords, setOnboardingRecords] = useState([]);
  const [appraisalRecords, setAppraisalRecords] = useState([]);
  const [gpsAttendance, setGpsAttendance] = useState([]);
  const [assetCheckouts, setAssetCheckouts] = useState([]);
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [accommodationRequests, setAccommodationRequests] = useState([]);

  // Load HR data from backend - memoized with useCallback
  const loadHRData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        staffRes,
        attendanceRes,
        leaveRes,
        onboardingRes,
        appraisalRes
      ] = await Promise.allSettled([
        APIServices.HRAPI.getAll({ limit: 100 }), // Get all staff (API max limit is 100)
        API.Attendance.getAll(),
        API.LeaveRequest.getAll(),
        APIServices.HROnboardingAPI.getAll(),
        APIServices.HRAppraisalAPI.getAll()
      ]);

      // Set staff data
      if (staffRes.status === 'fulfilled') {
        // Handle different response structures
        // Backend returns { staff: [...], pagination: {...} }
        const staffData = staffRes.value?.staff || staffRes.value?.data || (Array.isArray(staffRes.value) ? staffRes.value : []);
        console.log('Staff data loaded:', staffData?.length || 0, 'staff members');
        setStaff(staffData);
      } else {
        console.error('Error loading staff:', staffRes.reason);
      }

      // Set attendance data
      if (attendanceRes.status === 'fulfilled') {
        setAttendance(attendanceRes.value.attendance || []);
      } else {
        console.error('Error loading attendance:', attendanceRes.reason);
      }

      // Set leave requests data
      if (leaveRes.status === 'fulfilled') {
        setLeaveRequests(leaveRes.value.leaveRequests || []);
      } else {
        console.error('Error loading leave requests:', leaveRes.reason);
      }

      // Set onboarding records data
      if (onboardingRes.status === 'fulfilled') {
        setOnboardingRecords(onboardingRes.value.records || []);
      } else {
        console.error('Error loading onboarding records:', onboardingRes.reason);
      }

      // Set appraisal records data
      if (appraisalRes.status === 'fulfilled') {
        setAppraisalRecords(appraisalRes.value.records || []);
      } else {
        console.error('Error loading appraisal records:', appraisalRes.reason);
      }

    } catch (err) {
      console.error('Error loading HR data:', err);
      setError(err.message || 'Failed to load HR data');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function never changes

  // Load data on mount
  useEffect(() => {
    loadHRData();
  }, [loadHRData]);

  // Staff CRUD operations
  const addStaff = async (staffData) => {
    try {
      // Call backend API to create staff and user account
      const createdStaff = await APIServices.HRAPI.create(staffData);

      // Update local state with the new staff member
      setStaff(prevStaff => [...prevStaff, createdStaff]);

      return {
        success: true,
        message: 'Staff member and user account created successfully',
        data: createdStaff
      };
    } catch (error) {
      console.error('Error creating staff:', error);
      return {
        success: false,
        message: error.message || 'Failed to create staff member'
      };
    }
  };

  const updateStaff = (id, updatedData) => {
    setStaff(staff.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const deleteStaff = (id) => {
    setStaff(staff.filter(s => s.id !== id));
  };

  // Attendance operations
  const checkIn = async (employeeId) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const existingAttendance = attendance.find(
        a => a.employeeId === employeeId && a.date === today
      );

      if (existingAttendance) {
        return { success: false, message: 'Already checked in today' };
      }

      const newAttendance = await API.Attendance.create({
        employeeId,
        status: 'Present'
      });

      setAttendance([...attendance, newAttendance]);
      return { success: true, message: 'Checked in successfully' };
    } catch (err) {
      console.error('Error checking in:', err);
      return { success: false, message: 'Failed to check in' };
    }
  };

  const checkOut = async (employeeId) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const todayAttendance = attendance.find(
        a => a.employeeId === employeeId && a.date === today && !a.checkOut
      );

      if (!todayAttendance) {
        return { success: false, message: 'No check-in found for today' };
      }

      const updated = await API.Attendance.update(todayAttendance.id, {
        checkOut: new Date().toTimeString().slice(0, 5)
      });

      setAttendance(attendance.map(a =>
        a.id === todayAttendance.id ? updated : a
      ));

      return { success: true, message: 'Checked out successfully' };
    } catch (err) {
      console.error('Error checking out:', err);
      return { success: false, message: 'Failed to check out' };
    }
  };

  // Leave operations
  const applyLeave = async (leaveData) => {
    try {
      const newLeave = await API.LeaveRequest.create({
        ...leaveData,
        status: 'Pending'
      });
      setLeaveRequests([...leaveRequests, newLeave]);
      return newLeave;
    } catch (err) {
      console.error('Error applying leave:', err);
      throw err;
    }
  };

  const approveLeave = async (id, approverName, remarks = '') => {
    try {
      const approved = await API.LeaveRequest.approve(id, 'Approved', remarks);
      setLeaveRequests(leaveRequests.map(l =>
        l.id === id ? approved : l
      ));
      return approved;
    } catch (err) {
      console.error('Error approving leave:', err);
      throw err;
    }
  };

  const rejectLeave = async (id, approverName, remarks = '') => {
    try {
      const rejected = await API.LeaveRequest.approve(id, 'Rejected', remarks);
      setLeaveRequests(leaveRequests.map(l =>
        l.id === id ? rejected : l
      ));
      return rejected;
    } catch (err) {
      console.error('Error rejecting leave:', err);
      throw err;
    }
  };

  // Onboarding operations
  const addOnboarding = async (onboardingData) => {
    try {
      const preparedData = {
        ...onboardingData,
        staffId: onboardingData.employeeId || onboardingData.staffId,
        onboardingDate: onboardingData.startDate || new Date().toISOString().split('T')[0],
        status: onboardingData.status || 'Not Started',
        progress: onboardingData.progress || 0
      };

      const newOnboarding = await APIServices.HROnboardingAPI.create(preparedData);
      setOnboardingRecords([...onboardingRecords, newOnboarding]);
      return newOnboarding;
    } catch (err) {
      console.error('Error adding onboarding record:', err);
      throw err;
    }
  };

  const updateOnboarding = async (id, updatedData) => {
    try {
      const updatedOnboarding = await APIServices.HROnboardingAPI.update(id, updatedData);
      setOnboardingRecords(onboardingRecords.map(o =>
        o.id === id ? updatedOnboarding : o
      ));
      return updatedOnboarding;
    } catch (err) {
      console.error('Error updating onboarding record:', err);
      throw err;
    }
  };

  const deleteOnboarding = async (id) => {
    try {
      await APIServices.HROnboardingAPI.delete(id);
      setOnboardingRecords(onboardingRecords.filter(o => o.id !== id));
    } catch (err) {
      console.error('Error deleting onboarding record:', err);
      throw err;
    }
  };

  // Appraisal operations
  const addAppraisal = async (appraisalData) => {
    try {
      const preparedData = {
        ...appraisalData,
        staffId: appraisalData.employeeId || appraisalData.staffId,
        appraisalDate: appraisalData.appraisalDate || new Date().toISOString().split('T')[0],
        status: appraisalData.status || 'Draft'
      };

      const newAppraisal = await APIServices.HRAppraisalAPI.create(preparedData);
      setAppraisalRecords([...appraisalRecords, newAppraisal]);
      return newAppraisal;
    } catch (err) {
      console.error('Error adding appraisal record:', err);
      throw err;
    }
  };

  const updateAppraisal = async (id, updatedData) => {
    try {
      const updatedAppraisal = await APIServices.HRAppraisalAPI.update(id, updatedData);
      setAppraisalRecords(appraisalRecords.map(a =>
        a.id === id ? updatedAppraisal : a
      ));
      return updatedAppraisal;
    } catch (err) {
      console.error('Error updating appraisal record:', err);
      throw err;
    }
  };

  const deleteAppraisal = async (id) => {
    try {
      await APIServices.HRAppraisalAPI.delete(id);
      setAppraisalRecords(appraisalRecords.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting appraisal record:', err);
      throw err;
    }
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
    loading,
    error,
    loadHRData, // Export loadHRData function
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
