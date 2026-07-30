import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Plus, X, MapPin, ScanLine, ArrowLeft, Calendar
} from 'lucide-react';
import * as API from '../../../services/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import DistributionProgressCard from './DistributionProgressCard';

// The backend may return a bare array or a wrapped object.
const toEventArray = (response) => {
  if (Array.isArray(response)) return response;
  return response?.events || response?.distributionEvents || response?.rows || [];
};

const toScanArray = (response) => {
  if (Array.isArray(response)) return response;
  return response?.scans || response?.rows || [];
};

const eventStatusClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'open' || s === 'active' || s === 'scheduled') return 'bg-green-100 text-green-700';
  if (s === 'closed' || s === 'completed') return 'bg-ink-100 text-ink-700';
  return 'bg-hs-slate-100 text-hs-slate-700';
};

const DistributionEventsPanel = ({ projectId, projectName, showToast }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scans, setScans] = useState([]);
  const [scansLoading, setScansLoading] = useState(false);
  // Bumped whenever the events list changes so the progress card refetches
  // without having to lift its state.
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  // Per-event scan counts sourced from the stats endpoint's byEvent
  // aggregate. Keyed by event id → scanCount.
  const [scanCounts, setScanCounts] = useState({});

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.DistributionEventAPI.list({ projectId });
      setEvents(toEventArray(response));
    } catch (error) {
      console.error('Error fetching distribution events:', error);
      showToast('Failed to load distribution events', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Cheap side-fetch — the stats endpoint already computes per-event scan
  // counts, so we reuse it here instead of adding another endpoint.
  useEffect(() => {
    let cancelled = false;
    API.ProjectBeneficiaryAPI.stats(projectId)
      .then((data) => {
        if (cancelled) return;
        const map = {};
        for (const e of data?.byEvent || []) map[e.id] = e.scanCount;
        setScanCounts(map);
      })
      .catch(() => { /* silent — the table just shows dashes */ });
    return () => { cancelled = true; };
  }, [projectId, statsRefreshKey]);

  const openEvent = async (event) => {
    setSelectedEvent(event);
    setScans([]);
    setScansLoading(true);
    try {
      const response = await API.DistributionEventAPI.getScans(event.id);
      setScans(toScanArray(response));
    } catch (error) {
      console.error('Error fetching event scans:', error);
      showToast('Failed to load scans', 'error');
    } finally {
      setScansLoading(false);
    }
  };

  // ============ Scans detail view ============
  if (selectedEvent) {
    return (
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
        <div className="p-6 border-b border-ink-100">
          <button
            onClick={() => setSelectedEvent(null)}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium mb-3"
          >
            <ArrowLeft size={16} />
            Back to events
          </button>
          <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <ScanLine className="text-orange-600" size={22} />
            {selectedEvent.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-ink-600 mt-1 flex-wrap">
            {selectedEvent.scheduledDate && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(selectedEvent.scheduledDate).toLocaleDateString()}
              </span>
            )}
            {selectedEvent.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {selectedEvent.location}
              </span>
            )}
            <span className="font-semibold text-ink-900">
              {scans.length} scan{scans.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="p-6">
          {scansLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : scans.length === 0 ? (
            <div className="text-center py-12">
              <ScanLine size={48} className="mx-auto text-ink-400 mb-4" />
              <p className="text-ink-600">No scans recorded for this event yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-ink-50">
                    <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">Beneficiary</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">Scanned By</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => {
                    const ts = scan.scannedAt || scan.createdAt;
                    const enrolment = scan.projectBeneficiary || scan.enrolment;
                    const beneficiaryName =
                      scan.beneficiary?.fullName ||
                      enrolment?.beneficiary?.fullName || '—';
                    const scannerName =
                      scan.scanner?.fullName || scan.scannedBy?.fullName ||
                      scan.user?.fullName || '—';
                    return (
                      <tr key={scan.id} className="border-b border-ink-100 hover:bg-orange-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-ink-600">
                          {ts ? new Date(ts).toLocaleString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-ink-900">
                          {beneficiaryName}
                        </td>
                        <td className="py-3 px-4 text-sm text-ink-600">
                          {scannerName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ Events list view ============
  return (
    <>
    <DistributionProgressCard projectId={projectId} projectName={projectName} refreshKey={statsRefreshKey} />
    <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
      <div className="p-6 border-b border-ink-100 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <CalendarDays className="text-orange-600" size={22} />
            Distribution Events
          </h3>
          <p className="text-sm text-ink-600 mt-1">
            {events.length} event{events.length !== 1 ? 's' : ''} for this project
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="font-semibold">New Event</span>
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays size={48} className="mx-auto text-ink-400 mb-4" />
            <p className="text-ink-600 mb-4">No distribution events yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50">
                  <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">Event</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">Location</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-ink-700">Scans</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-ink-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-ink-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const count = scanCounts[event.id];
                  return (
                  <tr key={event.id} className="border-b border-ink-100 hover:bg-orange-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-semibold text-ink-900">{event.name}</td>
                    <td className="py-3 px-4 text-sm text-ink-600">
                      {event.scheduledDate ? new Date(event.scheduledDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-ink-600">{event.location || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      {count == null ? (
                        <span className="text-ink-400 text-xs">—</span>
                      ) : count === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                          <ScanLine size={12} />
                          0
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-xs font-semibold">
                          <ScanLine size={12} />
                          {count.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${eventStatusClass(event.status)}`}>
                        {event.status || 'Scheduled'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => openEvent(event)}
                          className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition text-xs font-semibold"
                        >
                          <ScanLine size={14} />
                          View Scans
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (form) => {
            try {
              await API.DistributionEventAPI.create({ projectId, ...form });
              setShowCreateModal(false);
              showToast('Distribution event created');
              await fetchEvents();
              setStatsRefreshKey((k) => k + 1);
            } catch (error) {
              console.error('Error creating distribution event:', error);
              showToast('Failed to create event', 'error');
            }
          }}
        />
      )}
    </div>
    </>
  );
};

const CreateEventModal = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name, scheduledDate, location, notes });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-ink-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-ink-900">New Distribution Event</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Event Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Dry Rations Round 3"
              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Scheduled Date *</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Akkaraipattu Community Hall"
              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any instructions for the distribution team…"
              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name || !scheduledDate}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistributionEventsPanel;
