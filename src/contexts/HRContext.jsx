import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';
import * as APIServices from '../services/api';

const HRContext = createContext();

// Normalise an Attendance row (with GPS coordinates) into the shape the
// GPS-attendance UI expects (employeeName / time / verified / distance / coordinates).
const toGpsRecord = (r) => ({
  ...r,
  employeeName: r.staff?.fullName || r.employeeName || 'Staff',
  time: r.checkInTime || r.time,
  verified: r.gpsVerified ?? r.verified ?? false,
  distance: r.distanceFromOffice || r.distance,
  coordinates: r.latitude != null ? `${r.latitude}, ${r.longitude}` : null,
});

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
        API.Attendance.getAll({ limit: 100 }),
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

      // Set attendance data — backend returns { attendanceRecords, pagination };
      // older mock returned { attendance }. Accept either.
      if (attendanceRes.status === 'fulfilled') {
        const v = attendanceRes.value;
        const records = v?.attendanceRecords || v?.attendance || [];
        setAttendance(records);
        // GPS attendance = attendance rows that carry GPS coordinates.
        setGpsAttendance(
          records.filter(r => r.latitude != null && r.latitude !== '').map(toGpsRecord)
        );
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

  // ============================================
  // HR MUTATIONS
  // Each mutation calls the matching backend API, then updates local
  // context state so the UI reflects the change without a full reload.
  // ============================================

  const addOnboarding = useCallback(async (formData) => {
    const record = await APIServices.HROnboardingAPI.create(formData);
    setOnboardingRecords(prev => [...prev, record]);
    return record;
  }, []);

  const addAppraisal = useCallback(async (formData) => {
    const record = await APIServices.HRAppraisalAPI.create(formData);
    setAppraisalRecords(prev => [...prev, record]);
    return record;
  }, []);

  // GPS attendance is persisted as an Attendance row carrying GPS coordinates.
  const addGpsAttendance = useCallback(async (formData) => {
    const created = await API.Attendance.create({
      staffId: formData.employeeId,
      attendanceDate: new Date().toISOString().slice(0, 10),
      checkInTime: new Date().toTimeString().slice(0, 8),
      status: 'Present',
      location: formData.location,
      latitude: formData.latitude,
      longitude: formData.longitude,
      distanceFromOffice: formData.distance,
      gpsVerified: formData.verified ?? false,
    });
    const member = staff.find(s => String(s.id) === String(formData.employeeId));
    const record = toGpsRecord({
      ...created,
      staff: created.staff || (member ? { fullName: member.fullName || member.name } : undefined),
    });
    setGpsAttendance(prev => [record, ...prev]);
    return record;
  }, [staff]);

  const deleteGpsAttendance = useCallback(async (id) => {
    await API.Attendance.delete(id);
    setGpsAttendance(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateGpsAttendance = useCallback(async (id, updates) => {
    // The UI sends `verified`; the backend column is `gpsVerified`.
    const payload = { ...updates };
    if ('verified' in payload) {
      payload.gpsVerified = payload.verified;
      delete payload.verified;
    }
    const updated = await API.Attendance.update(id, payload);
    setGpsAttendance(prev => prev.map(r => (
      r.id === id ? toGpsRecord({ ...r, ...updated }) : r
    )));
    return updated;
  }, []);

  const applyLeave = useCallback(async (formData) => {
    const leaveRequest = await API.LeaveRequest.create(formData);
    setLeaveRequests(prev => [...prev, leaveRequest]);
    return leaveRequest;
  }, []);

  // Asset checkout maps to the Asset assign endpoint.
  const addAssetCheckout = useCallback(async (formData) => {
    const record = await APIServices.AssetAPI.create(formData);
    setAssetCheckouts(prev => [...prev, record]);
    return record;
  }, []);

  const addVehicleRequest = useCallback(async (formData) => {
    const record = await APIServices.VehicleRequestAPI.create(formData);
    setVehicleRequests(prev => [...prev, record]);
    return record;
  }, []);

  const addAccommodationRequest = useCallback(async (formData) => {
    const record = await APIServices.AccommodationRequestAPI.create(formData);
    setAccommodationRequests(prev => [...prev, record]);
    return record;
  }, []);

  // Check-in / check-out create or update a legacy Attendance record.
  const checkIn = useCallback(async (employeeId) => {
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);
    const record = await API.Attendance.create({
      employeeId,
      date: today,
      checkIn: time,
      status: 'Present',
    });
    setAttendance(prev => [...prev, record]);
    return record;
  }, []);

  const checkOut = useCallback(async (employeeId) => {
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);
    const existing = attendance.find(a => a.employeeId === employeeId && a.date === today);
    if (!existing) return null;
    const record = await API.Attendance.update(existing.id, { checkOut: time });
    setAttendance(prev => prev.map(a => (a.id === existing.id ? { ...a, ...record, checkOut: time } : a)));
    return record;
  }, [attendance]);

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
    getStats,
    // Mutations
    addOnboarding,
    addAppraisal,
    addGpsAttendance,
    deleteGpsAttendance,
    updateGpsAttendance,
    applyLeave,
    addAssetCheckout,
    addVehicleRequest,
    addAccommodationRequest,
    checkIn,
    checkOut
  };

  return <HRContext.Provider value={value}>{children}</HRContext.Provider>;
};
