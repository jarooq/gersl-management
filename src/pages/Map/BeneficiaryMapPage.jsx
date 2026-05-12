import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import BeneficiaryMap from '../../components/map/BeneficiaryMap';

const BeneficiaryMapPage = () => {
  const [filters, setFilters] = useState({ district: '', stage: '' });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Geo · All programmes</p>
        <h1 className="text-h2 font-bold leading-tight inline-flex items-center gap-2">
          <MapPin size={24} /> Beneficiary Map
        </h1>
        <p className="text-sm text-ink-300 mt-1">
          WASH installations, IGP deliveries, orphan locations, and registered households — toggle layers and filter to focus.
        </p>
      </div>

      <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-3 flex flex-wrap gap-2 items-center">
        <label className="text-xs font-semibold text-ink-600">District:</label>
        <input
          value={filters.district}
          onChange={e => setFilters({ ...filters, district: e.target.value })}
          placeholder="e.g. Trincomalee"
          className="border border-ink-200 rounded px-2 py-1 text-sm w-44"
        />
        <label className="text-xs font-semibold text-ink-600 ml-3">Stage:</label>
        <input
          value={filters.stage}
          onChange={e => setFilters({ ...filters, stage: e.target.value })}
          placeholder="e.g. HandedOver"
          className="border border-ink-200 rounded px-2 py-1 text-sm w-44"
        />
        {(filters.district || filters.stage) && (
          <button
            onClick={() => setFilters({ district: '', stage: '' })}
            className="ml-2 text-xs text-blue-700 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <BeneficiaryMap
        district={filters.district || undefined}
        stage={filters.stage || undefined}
        height={620}
      />
    </div>
  );
};

export default BeneficiaryMapPage;
