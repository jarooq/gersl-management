import React, { useState, useMemo } from 'react';
import {
  X, Filter, Download, Printer, FileText, Users, MapPin,
  Calendar, Heart, CheckCircle, Search, FileSpreadsheet
} from 'lucide-react';
import { getAllDistricts } from '../../data/sriLankanDivisions';

const BENEFICIARY_TYPES = [
  'Widow',
  'Disabled Person',
  'Low-Income Family',
  'Zakat Eligible Family',
  'Orphan Family',
  'Elderly',
  'Single Parent',
  'Chronic Illness',
  'Other'
];

const AGE_RANGES = [
  { label: 'All Ages', min: 0, max: 150 },
  { label: '0-18 years', min: 0, max: 18 },
  { label: '19-35 years', min: 19, max: 35 },
  { label: '36-60 years', min: 36, max: 60 },
  { label: '60+ years', min: 61, max: 150 }
];

const BeneficiaryListGenerator = ({ beneficiaries, onClose }) => {
  const [filters, setFilters] = useState({
    district: '',
    beneficiaryType: '',
    ageRange: 'All Ages',
    supportStatus: 'all',
    searchQuery: ''
  });

  const [showPreview, setShowPreview] = useState(false);
  const allDistricts = getAllDistricts();

  // Filter beneficiaries based on selected criteria
  const filteredBeneficiaries = useMemo(() => {
    let result = [...beneficiaries];

    // District filter
    if (filters.district) {
      result = result.filter(b => b.district === filters.district);
    }

    // Type filter
    if (filters.beneficiaryType) {
      result = result.filter(b => b.beneficiary_type === filters.beneficiaryType);
    }

    // Age range filter
    if (filters.ageRange !== 'All Ages') {
      const ageRange = AGE_RANGES.find(r => r.label === filters.ageRange);
      if (ageRange) {
        result = result.filter(b => {
          const age = parseInt(b.age);
          return !isNaN(age) && age >= ageRange.min && age <= ageRange.max;
        });
      }
    }

    // Support status filter
    if (filters.supportStatus !== 'all') {
      if (filters.supportStatus === 'with_support') {
        result = result.filter(b => b.total_supports > 0);
      } else if (filters.supportStatus === 'no_support') {
        result = result.filter(b => !b.total_supports || b.total_supports === 0);
      } else if (filters.supportStatus === 'active') {
        result = result.filter(b => b.status === 'active');
      }
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(b =>
        b.full_name?.toLowerCase().includes(query) ||
        b.nic?.toLowerCase().includes(query) ||
        b.district?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [beneficiaries, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      district: '',
      beneficiaryType: '',
      ageRange: 'All Ages',
      supportStatus: 'all',
      searchQuery: ''
    });
  };

  const handleExportCSV = () => {
    const headers = ['NIC', 'Full Name', 'Age', 'Gender', 'District', 'DS Division', 'Type', 'Phone', 'Total Supports', 'Total Value'];
    const csvData = filteredBeneficiaries.map(b => [
      b.nic || '',
      b.full_name || '',
      b.age || '',
      b.gender || '',
      b.district || '',
      b.ds_division || '',
      b.beneficiary_type || '',
      b.primary_phone || '',
      b.total_supports || 0,
      b.total_value || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `beneficiaries_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const content = `
      <html>
        <head>
          <title>Beneficiaries List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .header { margin-bottom: 20px; }
            .filter-info { background: #eff6ff; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>GERSL - Beneficiaries List</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            <p>Total Beneficiaries: ${filteredBeneficiaries.length}</p>
          </div>
          ${filters.district || filters.beneficiaryType || filters.ageRange !== 'All Ages' ? `
            <div class="filter-info">
              <strong>Filters Applied:</strong>
              ${filters.district ? `<br/>District: ${filters.district}` : ''}
              ${filters.beneficiaryType ? `<br/>Type: ${filters.beneficiaryType}` : ''}
              ${filters.ageRange !== 'All Ages' ? `<br/>Age Range: ${filters.ageRange}` : ''}
            </div>
          ` : ''}
          <table>
            <thead>
              <tr>
                <th>NIC</th>
                <th>Full Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>District</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Supports</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBeneficiaries.map(b => `
                <tr>
                  <td>${b.nic || '-'}</td>
                  <td>${b.full_name || '-'}</td>
                  <td>${b.age || '-'}</td>
                  <td>${b.gender || '-'}</td>
                  <td>${b.district || '-'}</td>
                  <td>${b.beneficiary_type || '-'}</td>
                  <td>${b.primary_phone || '-'}</td>
                  <td>${b.total_supports || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Generate Beneficiary List</h2>
              <p className="text-blue-100 text-sm">Filter and export beneficiary data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Filters Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-gray-900">Filter Criteria</h3>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* District Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  District
                </label>
                <select
                  value={filters.district}
                  onChange={(e) => handleFilterChange('district', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Districts</option>
                  {allDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-1" />
                  Beneficiary Type
                </label>
                <select
                  value={filters.beneficiaryType}
                  onChange={(e) => handleFilterChange('beneficiaryType', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {BENEFICIARY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Age Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Age Range
                </label>
                <select
                  value={filters.ageRange}
                  onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {AGE_RANGES.map(range => (
                    <option key={range.label} value={range.label}>{range.label}</option>
                  ))}
                </select>
              </div>

              {/* Support Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Heart size={16} className="inline mr-1" />
                  Support Status
                </label>
                <select
                  value={filters.supportStatus}
                  onChange={(e) => handleFilterChange('supportStatus', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Beneficiaries</option>
                  <option value="with_support">With Support History</option>
                  <option value="no_support">No Support Yet</option>
                  <option value="active">Active Only</option>
                </select>
              </div>

              {/* Search Query */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search size={16} className="inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name, NIC, or district..."
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-white border-2 border-blue-100 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Results Summary</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    <span><strong>{filteredBeneficiaries.length}</strong> beneficiaries found</span>
                  </div>
                  {filters.district && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-blue-600" />
                      <span>{filters.district}</span>
                    </div>
                  )}
                  {filters.beneficiaryType && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-600" />
                      <span>{filters.beneficiaryType}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>

          {/* Preview Table */}
          {showPreview && filteredBeneficiaries.length > 0 && (
            <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NIC</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Age</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">District</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBeneficiaries.slice(0, 10).map((b, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{b.nic || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.full_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{b.age || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{b.district}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{b.beneficiary_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{b.total_supports || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredBeneficiaries.length > 10 && (
                <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600 text-center border-t">
                  Showing first 10 of {filteredBeneficiaries.length} results
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {filteredBeneficiaries.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No beneficiaries found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Close
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={filteredBeneficiaries.length === 0}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredBeneficiaries.length === 0}
              className="px-6 py-2.5 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FileSpreadsheet size={18} />
              Export to Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeneficiaryListGenerator;
