import React from 'react';
import { Search, Filter, Grid, List, Map } from 'lucide-react';

const OrphanFilters = ({
  searchQuery,
  setSearchQuery,
  filterDistrict,
  setFilterDistrict,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
  districts
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
            <input
              type="text"
              placeholder="Search orphans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* District Filter */}
        <div>
          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="All">All Districts</option>
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mt-4 gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            viewMode === 'grid'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-ink-200 text-ink-600 hover:bg-ink-300'
          }`}
        >
          <Grid size={20} />
          <span className="hidden sm:inline text-sm font-semibold">Grid</span>
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            viewMode === 'list'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-ink-200 text-ink-600 hover:bg-ink-300'
          }`}
        >
          <List size={20} />
          <span className="hidden sm:inline text-sm font-semibold">List</span>
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            viewMode === 'map'
              ? 'bg-pink-600 text-white shadow-md'
              : 'bg-ink-200 text-ink-600 hover:bg-ink-300'
          }`}
        >
          <Map size={20} />
          <span className="hidden sm:inline text-sm font-semibold">Map</span>
        </button>
      </div>
    </div>
  );
};

export default OrphanFilters;
