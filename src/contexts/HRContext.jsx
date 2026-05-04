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
  const [attendancePunches, setAttendancePunches] = useState([]);
  const [assetCheckouts, setAssetCheckouts] = useState([]);
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [accommodationRequests, setAccommodationRequests] = useState([]);

  // Load HR data from backend - memoized with useCallback
  const loadHRData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mobile punches: pull the last 30 days so today's check-ins surface
      // immediately on the web AttendancePage.
      const punchesFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

      const [
        staffRes,
        attendanceRes,
        leaveRes,
        onboardingRes,
        appraisalRes,
        punchesRes
      ] = await Promise.allSettled([
        APIServices.HRAPI.getAll({ limit: 100 }), // Get all staff (API max limit is 100)
        API.Attendance.getAll(),
        API.LeaveRequest.getAll(),
        APIServices.HROnboardingAPI.getAll(),
        APIServices.HRAppraisalAPI.getAll(),
        API.Attendance.listAllPunches({ from: punchesFrom, limit: 1000 }),
      ]);

      // Set staff data
      if (staffRes.status === 'fulfilled') {
        console.log('📊 HR API Raw Response:', staffRes.value);
        // HRAPI.getAll() returns data.data, which gives us { staff: [...], pagination: {...} }
        const staffData = staffRes.value?.staff || staffRes.value?.data?.staff || staffRes.value?.data || (Array.isArray(staffRes.value) ? staffRes.value : []);
        console.log('📊 Extracted Staff Data:', staffData);
        console.log('📊 Staff Data Length:', staffData?.length);
        setStaff(staffData);
      } else {
        console.error('❌ Error loading staff:', staffRes.reason);
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

      // Set mobile punches (recent window) — these are the AttendancePunch
      // rows from the new mobile flow; the web AttendancePage merges them
      // with the legacy attendance list.
      if (punchesRes.status === 'fulfilled') {
        setAttendancePunches(punchesRes.value || []);
      } else {
        console.error('Error loading attendance punches:', punchesRes.reason);
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
    if (isLoggedIn) {
      loadHRData();
    }
  }, [isLoggedIn, loadHRData]);

  // Calculate HR stats
  const getStats = useCallback(() => {
    const activeStaff = staff.filter(s => s.status === 'Active' || !s.status);
    const onLeave = leaveRequests.filter(l => l.status === 'Approved' && new Date(l.endDate) >= new Date());
    const pendingLeave = leaveRequests.filter(l => l.status === 'Pending');

    return {
      totalStaff: staff.length,
      activeStaff: activeStaff.length,
      onLeave: onLeave.length,
      pendingLeaveRequests: pendingLeave.length,
      departments: [...new Set(staff.map(s => s.department).filter(Boolean))].length,
      onboarding: onboardingRecords.filter(r => r.status === 'In Progress').length,
      appraisalsDue: appraisalRecords.filter(r => r.status === 'Pending').length
    };
  }, [staff, leaveRequests, onboardingRecords, appraisalRecords]);

  const value = {
    staff,
    attendance,
    leaveRequests,
    loading,
    error,
    refreshHRData: loadHRData,
    onboardingRecords,
    appraisalRecords,
    gpsAttendance,
    setGpsAttendance,
    attendancePunches,
    setAttendancePunches,
    assetCheckouts,
    setAssetCheckouts,
    vehicleRequests,
    setVehicleRequests,
    accommodationRequests,
    setAccommodationRequests,
    getStats
  };

  return <HRContext.Provider value={value}>{children}</HRContext.Provider>;
};
