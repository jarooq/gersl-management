import React, { useState } from 'react';
import { useReports } from '../../contexts/ReportContext';
import ReportEditor from './ReportEditor';

/**
 * ReportsList Component
 * Display all generated reports with filtering and search
 */
const ReportsList = ({ projectId, proposalId }) => {
  const { reports, getProjectReports, getProposalReports, deleteReport } = useReports();
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Get filtered reports
  const getFilteredReports = () => {
    let filtered = reports;

    // Filter by project/proposal
    if (projectId) {
      filtered = getProjectReports(projectId);
    } else if (proposalId) {
      filtered = getProposalReports(proposalId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reportType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.donor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.reportType === filterType);
    }

    return filtered;
  };

  const filteredReports = getFilteredReports();

  // Get unique report types for filter
  const reportTypes = [...new Set(reports.map(r => r.reportType))];

  const handleDelete = (reportId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteReport(reportId);
    }
  };

  if (selectedReport) {
    return (
      <ReportEditor
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated Reports</h2>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {reportTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="p-6">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">No Reports Found</p>
            <p className="text-sm">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Generate your first report to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {report.projectName || 'Untitled Report'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {report.reportType.replace(/_/g, ' ')}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {report.donor && (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          {report.donor}
                        </span>
                      )}
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {report.totalSections} sections
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Status Badge */}
                    <span className={`px-2 py-1 text-xs rounded ${
                      report.successfulSections === report.totalSections
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.successfulSections}/{report.totalSections}
                    </span>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(report.id, e)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete report"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredReports.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          Showing {filteredReports.length} of {reports.length} reports
        </div>
      )}
    </div>
  );
};

export default ReportsList;
