import React from 'react';
import { Search, Grid, List } from 'lucide-react';

const ProjectFilters = ({
  searchQuery,
  setSearchQuery,
  filterProgrammeArea,
  setFilterProgrammeArea,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
  programmeAreas
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Programme Area Filter */}
        <div>
          <select
            value={filterProgrammeArea}
            onChange={(e) => setFilterProgrammeArea(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="All">All Programme Areas</option>
            {programmeAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="All">All Status</option>
            <option value="Planning">Planning</option>
            <option value="Implementation">Implementation</option>
            <option value="Closing">Closing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mt-4 gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-2 rounded-lg transition ${
            viewMode === 'grid'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          <Grid size={20} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-lg transition ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          <List size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProjectFilters;
