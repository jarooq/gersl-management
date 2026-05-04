import React, { useState, useMemo } from 'react';
import { useHR } from '../../contexts/HRContext';
import { Clock, MapPin, CheckCircle, X, Calendar, User, TrendingUp, AlertCircle, Navigation, Search, Filter, Download, LogOut, LogIn, Camera, Smartphone } from 'lucide-react';
import { API_ORIGIN } from '../../config/apiBase';

const AttendancePage = () => {
  const {
    staff,
    attendance,
    gpsAttendance,
    attendancePunches,
    checkIn,
    checkOut,
    addGpsAttendance
  } = useHR();

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    employeeId: '',
    useGPS: false,
    latitude: '',
    longitude: '',
    location: ''
  });
  const [checkOutForm, setCheckOutForm] = useState({
    employeeId: '',
    useGPS: false,
    latitude: '',
    longitude: '',
    location: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, office, gps
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle GPS Check-in
  const handleGPSCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCheckInForm({
            ...checkInForm,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          });
          alert('Location captured successfully!');
        },
        (error) => {
          alert('Unable to get location. Please enable location services.');
          console.error(error);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Handle GPS Check-out
  const handleGPSCheckOut = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCheckOutForm({
            ...checkOutForm,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          });
          alert('Location captured successfully!');
        },
        (error) => {
          alert('Unable to get location. Please enable location services.');
          console.error(error);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Handle Check-in
  const handleCheckIn = () => {
    if (!checkInForm.employeeId) {
      alert('Please select an employee');
      return;
    }

    if (checkInForm.useGPS) {
      if (!checkInForm.latitude || !checkInForm.longitude) {
        alert('Please capture GPS location');
        return;
      }

      addGpsAttendance({
        employeeId: checkInForm.employeeId,
        latitude: checkInForm.latitude,
        longitude: checkInForm.longitude,
        location: checkInForm.location,
        type: 'Check In'
      });
    } else {
      checkIn(checkInForm.employeeId);
    }

    setCheckInForm({
      employeeId: '',
      useGPS: false,
      latitude: '',
      longitude: '',
      location: ''
    });

    setShowCheckInModal(false);
    alert('Checked in successfully!');
  };

  // Handle Check-out
  const handleCheckOut = () => {
    if (!checkOutForm.employeeId) {
      alert('Please select an employee');
      return;
    }

    if (checkOutForm.useGPS) {
      if (!checkOutForm.latitude || !checkOutForm.longitude) {
        alert('Please capture GPS location');
        return;
      }

      addGpsAttendance({
        employeeId: checkOutForm.employeeId,
        latitude: checkOutForm.latitude,
        longitude: checkOutForm.longitude,
        location: checkOutForm.location,
        type: 'Check Out'
      });
    } else {
      checkOut(checkOutForm.employeeId);
    }

    setCheckOutForm({
      employeeId: '',
      useGPS: false,
      latitude: '',
      longitude: '',
      location: ''
    });

    setShowCheckOutModal(false);
    alert('Checked out successfully!');
  };

  // Map mobile punches → the same row shape the table renders. One row per
  // punch event (In / Out / BreakIn / BreakOut), tagged as "Mobile" so HR
  // can tell where the record came from.
  const mobilePunchRows = useMemo(() => {
    return (attendancePunches || []).map(p => {
      const occurredAt = p.occurredAt ? new Date(p.occurredAt) : null;
      const date = occurredAt ? occurredAt.toISOString().slice(0, 10) : '';
      const time = occurredAt
        ? `${String(occurredAt.getHours()).padStart(2,'0')}:${String(occurredAt.getMinutes()).padStart(2,'0')}`
        : '';
      const isIn = p.punchType === 'In' || p.punchType === 'BreakIn';
      return {
        id: `punch-${p.id}`,
        type: 'Mobile',
        hasGPS: p.latitude != null,
        date,
        employeeId: p.userId,
        employeeName: p.user?.fullName || `Staff #${p.userId}`,
        department: '',
        checkIn:  isIn  ? time : '',
        checkOut: !isIn ? time : '',
        location: p.latitude != null
          ? `${Number(p.latitude).toFixed(5)}, ${Number(p.longitude).toFixed(5)}`
          : '',
        status: isIn ? 'Present' : 'Checked out',
        punchType: p.punchType,
        geofenceMatch: p.geofenceMatch,
        selfieUrl: p.selfieUrl,
      };
    });
  }, [attendancePunches]);

  // Combine all three streams (legacy office attendance, gps attendance,
  // and mobile-app punches) for the unified table.
  const allAttendance = useMemo(() => {
    const combined = [
      ...attendance.map(a => ({ ...a, type: 'Office', hasGPS: false })),
      ...gpsAttendance.map(g => ({ ...g, type: 'GPS', hasGPS: true, status: 'Present' })),
      ...mobilePunchRows,
    ];

    // Filter by date
    let filtered = combined.filter(a => a.date === filterDate);

    // Filter by type
    if (filterType === 'office') filtered = filtered.filter(a => a.type === 'Office');
    else if (filterType === 'gps')    filtered = filtered.filter(a => a.type === 'GPS');
    else if (filterType === 'mobile') filtered = filtered.filter(a => a.type === 'Mobile');

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employeeId?.toString().includes(searchTerm)
      );
    }

    return filtered;
  }, [attendance, gpsAttendance, mobilePunchRows, filterDate, filterType, searchTerm]);

  // Stats calculations
  const today = new Date().toISOString().split('T')[0];
  const todayPunches = mobilePunchRows.filter(p => p.date === today);
  const stats = {
    totalToday: [...attendance, ...gpsAttendance, ...todayPunches].filter(a => a.date === today).length,
    present: attendance.filter(a => a.date === today && a.status === 'Present').length
      + gpsAttendance.filter(g => g.date === today).length
      + todayPunches.filter(p => p.punchType === 'In' || p.punchType === 'BreakIn').length,
    gpsCheckIns: gpsAttendance.filter(g => g.date === today).length + todayPunches.filter(p => p.hasGPS).length,
    officeCheckIns: attendance.filter(a => a.date === today).length,
    mobileCheckIns: todayPunches.length,
    late: attendance.filter(a => {
      if (a.date !== today || !a.checkIn) return false;
      const checkInTime = a.checkIn.split(':');
      const hour = parseInt(checkInTime[0]);
      const minute = parseInt(checkInTime[1]);
      return hour > 9 || (hour === 9 && minute > 0); // Late if after 9:00 AM
    }).length
  };

  // Export attendance data
  const handleExport = () => {
    const csvContent = [
      ['Date', 'Employee Name', 'Employee ID', 'Department', 'Check In', 'Check Out', 'Type', 'Status', 'Location'],
      ...allAttendance.map(record => [
        record.date,
        record.employeeName,
        record.employeeId,
        record.department,
        record.checkIn || record.time || '',
        record.checkOut || '',
        record.type,
        record.status,
        record.location || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${filterDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-mission-300" />
          </div>
          <div className="min-w-0">
            <h1 className="text-h2 font-bold leading-tight">Attendance Management</h1>
            <p className="text-ink-200 text-sm mt-0.5">Track staff attendance with GPS location support</p>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-50 border border-primary-200 text-primary-700 rounded-md flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.totalToday}</h3>
          <p className="text-sm text-ink-600">Total Check-ins Today</p>
        </div>

        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-50 border border-success-600/20 text-success-700 rounded-md flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.present}</h3>
          <p className="text-sm text-ink-600">Present Staff</p>
        </div>

        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-violet-50 border border-violet-200 text-violet-700 rounded-md flex items-center justify-center">
              <MapPin size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.gpsCheckIns}</h3>
          <p className="text-sm text-ink-600">GPS Check-ins</p>
        </div>

        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-mission-100 border border-mission-200 text-mission-700 rounded-md flex items-center justify-center">
              <User size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.officeCheckIns}</h3>
          <p className="text-sm text-ink-600">Office Check-ins</p>
        </div>

        <div className="bg-white rounded-lg2 shadow-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-danger-50 border border-danger-600/20 text-danger-700 rounded-md flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
          </div>
          <h3 className="text-h1 text-ink-900 mb-1">{stats.late}</h3>
          <p className="text-sm text-ink-600">Late Arrivals</p>
        </div>
      </div>

      {/* Action Buttons and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => setShowCheckInModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-md font-medium shadow-card transition"
          >
            <LogIn size={20} />
            Check In
          </button>
          <button
            onClick={() => setShowCheckOutModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-md font-medium shadow-card transition"
          >
            <LogOut size={20} />
            Check Out
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-md font-medium shadow-card transition"
          >
            <Download size={20} />
            Export
          </button>
        </div>

        <div className="flex gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Date Filter */}
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="office">Office Only</option>
            <option value="gps">GPS Only</option>
            <option value="mobile">Mobile App Only</option>
          </select>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-lg2 shadow-sm border border-ink-100">
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Attendance Records ({allAttendance.length})</h2>
          <p className="text-sm text-ink-600">Showing results for {filterDate}</p>
        </div>

        <div className="p-6 space-y-4">
          {allAttendance.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-ink-400" />
              </div>
              <p className="text-ink-500 mb-4">No attendance records found</p>
              <button
                onClick={() => setShowCheckInModal(true)}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Record first check-in
              </button>
            </div>
          ) : (
            allAttendance.map((record, index) => (
              <div key={`${record.type}-${record.id || index}`} className="border border-ink-100 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-12 h-12 ${record.hasGPS ? 'bg-purple-50 border border-purple-200' : 'bg-primary-50 border border-primary-200 text-primary-700'} text-white rounded-xl flex items-center justify-center`}>
                      {record.hasGPS ? <MapPin size={24} /> : <User size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-900 text-lg">{record.employeeName}</h3>
                      <p className="text-sm text-ink-600">{record.department} • ID: {record.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.selfieUrl && (
                      <a
                        href={/^https?:\/\//.test(record.selfieUrl) ? record.selfieUrl : `${API_ORIGIN}${record.selfieUrl.startsWith('/') ? '' : '/'}${record.selfieUrl}`}
                        target="_blank" rel="noreferrer"
                        title="Open selfie"
                        className="w-9 h-9 rounded-md overflow-hidden border border-ink-200 hover:border-navy-700 transition shrink-0 bg-ink-50 flex items-center justify-center"
                      >
                        <img
                          src={/^https?:\/\//.test(record.selfieUrl) ? record.selfieUrl : `${API_ORIGIN}${record.selfieUrl.startsWith('/') ? '' : '/'}${record.selfieUrl}`}
                          alt="selfie"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement.innerHTML = '<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' viewBox=\'0 0 24 24\' class=\'text-ink-400\'><circle cx=\'12\' cy=\'13\' r=\'4\'/><path d=\'M9 3l-1 2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-4l-1-2z\'/></svg>'; }}
                        />
                      </a>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                      record.type === 'GPS' ? 'bg-purple-100 text-purple-700' :
                      record.type === 'Mobile' ? 'bg-mission-50 text-mission-700 border border-mission-200' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {record.type === 'Mobile' && <Smartphone size={12} />}
                      {record.type}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      {record.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-ink-400" />
                    <span className="text-ink-600">Date: {record.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <LogIn size={16} className="text-ink-400" />
                    <span className="text-ink-600">Check In: {record.checkIn || record.time || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <LogOut size={16} className="text-ink-400" />
                    <span className="text-ink-600">Check Out: {record.checkOut || 'N/A'}</span>
                  </div>
                </div>

                {record.hasGPS && (
                  <div className="mt-4 bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-700 mb-1">GPS Location</p>
                    {record.location && (
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Navigation size={14} className="text-purple-600" />
                        <span className="text-ink-700">{record.location}</span>
                      </div>
                    )}
                    {(record.latitude || record.longitude) && (
                      <p className="text-xs text-ink-600">Coordinates: {record.latitude}, {record.longitude}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Check In</h2>
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Employee *</label>
                  <select
                    value={checkInForm.employeeId}
                    onChange={(e) => setCheckInForm({ ...checkInForm, employeeId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {staff.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.employeeId}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useGPS"
                    checked={checkInForm.useGPS}
                    onChange={(e) => setCheckInForm({ ...checkInForm, useGPS: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="useGPS" className="text-sm font-semibold text-ink-700">
                    Use GPS Location (Field Staff)
                  </label>
                </div>

                {checkInForm.useGPS && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <button
                      onClick={handleGPSCheckIn}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
                    >
                      <MapPin size={18} />
                      Capture GPS Location
                    </button>

                    {checkInForm.latitude && checkInForm.longitude && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm font-semibold text-ink-700 mb-2">Location Captured</p>
                        <p className="text-xs text-ink-600">Latitude: {checkInForm.latitude}</p>
                        <p className="text-xs text-ink-600">Longitude: {checkInForm.longitude}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCheckIn}
                  className="flex-1 bg-navy-900 hover:bg-navy-800 text-white px-5 py-2.5 rounded-md font-medium shadow-card transition"
                >
                  Check In
                </button>
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1 bg-ink-100 text-ink-700 px-6 py-3 rounded-lg font-semibold hover:bg-ink-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-out Modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Check Out</h2>
                <button
                  onClick={() => setShowCheckOutModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Employee *</label>
                  <select
                    value={checkOutForm.employeeId}
                    onChange={(e) => setCheckOutForm({ ...checkOutForm, employeeId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {staff.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} - {emp.employeeId}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useGPSCheckOut"
                    checked={checkOutForm.useGPS}
                    onChange={(e) => setCheckOutForm({ ...checkOutForm, useGPS: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <label htmlFor="useGPSCheckOut" className="text-sm font-semibold text-ink-700">
                    Use GPS Location (Field Staff)
                  </label>
                </div>

                {checkOutForm.useGPS && (
                  <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                    <button
                      onClick={handleGPSCheckOut}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-semibold"
                    >
                      <MapPin size={18} />
                      Capture GPS Location
                    </button>

                    {checkOutForm.latitude && checkOutForm.longitude && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm font-semibold text-ink-700 mb-2">Location Captured</p>
                        <p className="text-xs text-ink-600">Latitude: {checkOutForm.latitude}</p>
                        <p className="text-xs text-ink-600">Longitude: {checkOutForm.longitude}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCheckOut}
                  className="flex-1 bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-card active:scale-95"
                >
                  Check Out
                </button>
                <button
                  onClick={() => setShowCheckOutModal(false)}
                  className="flex-1 bg-ink-100 text-ink-700 px-6 py-3 rounded-lg font-semibold hover:bg-ink-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
