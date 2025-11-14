import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, Download, Eye, Trash2, Loader, TrendingUp, Image as ImageIcon, Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import OrphanReportWizard from './OrphanReportWizard';
import { OrphanReportAPI } from '../../../services/api';

const ReportsTab = ({ orphan }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (orphan?.id) {
      fetchReports();
    }
  }, [orphan?.id]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await OrphanReportAPI.getByOrphan(orphan.id);
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await OrphanReportAPI.delete(reportId);
      alert('Report deleted successfully!');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const handleDownloadReport = async (reportId) => {
    try {
      // TODO: Implement PDF download
      alert('PDF download will be implemented');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-8 h-8 text-pink-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Progress Reports</h3>
            <p className="text-sm text-gray-600">{reports.length} report{reports.length !== 1 ? 's' : ''} generated</p>
          </div>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition text-sm font-semibold shadow-md"
        >
          <Plus size={18} />
          Generate New Report
        </button>
      </div>

      {reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onDelete={handleDeleteReport}
              onDownload={handleDownloadReport}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300">
          <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-1 text-lg">No reports generated yet</p>
          <p className="text-gray-600 text-sm mb-6">Create progress reports to share with partners and sponsors</p>
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm font-semibold shadow-md"
          >
            <Plus size={18} className="inline mr-2" />
            Generate First Report
          </button>
        </div>
      )}

      {/* Report Generation Wizard */}
      {showWizard && (
        <OrphanReportWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          orphan={orphan}
          onSuccess={() => {
            fetchReports();
            setShowWizard(false);
          }}
        />
      )}
    </div>
  );
};

const ReportCard = ({ report, onDelete, onDownload }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-yellow-100 text-yellow-700 border border-yellow-300">
            <Clock size={12} />
            Draft
          </span>
        );
      case 'generating':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-300">
            <Loader size={12} className="animate-spin" />
            Generating
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700 border border-green-300">
            <CheckCircle size={12} />
            Completed
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700 border border-red-300">
            <AlertCircle size={12} />
            Error
          </span>
        );
      default:
        return null;
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'monthly':
        return 'Monthly Report';
      case 'quarterly':
        return 'Quarterly Report';
      case 'annual':
        return 'Annual Report';
      case 'custom':
        return 'Custom Report';
      default:
        return 'Progress Report';
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-gray-900">{getReportTypeLabel(report.reportType)}</h4>
            {getStatusBadge(report.status)}
          </div>
          <p className="text-sm text-gray-600">
            Period: {formatDate(report.reportPeriodStart)} - {formatDate(report.reportPeriodEnd)}
          </p>
        </div>
      </div>

      {/* Partner Info */}
      {report.partner && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900">Recipient Partner</p>
          <p className="text-sm text-gray-700">{report.partner.name}</p>
        </div>
      )}

      {/* Media Count */}
      <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
        {report.selectedPhotos?.length > 0 && (
          <span className="flex items-center gap-1">
            <ImageIcon size={14} className="text-blue-600" />
            {report.selectedPhotos.length} photos
          </span>
        )}
        {report.selectedDrawings?.length > 0 && (
          <span className="flex items-center gap-1">
            <ImageIcon size={14} className="text-purple-600" />
            {report.selectedDrawings.length} drawings
          </span>
        )}
        {report.selectedLetters?.length > 0 && (
          <span className="flex items-center gap-1">
            <Mail size={14} className="text-green-600" />
            {report.selectedLetters.length} letters
          </span>
        )}
      </div>

      {/* AI Summary Preview */}
      {report.aiGeneratedSummary && (
        <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <p className="text-xs font-semibold text-purple-900 mb-1 flex items-center gap-1">
            <TrendingUp size={12} />
            AI Summary
          </p>
          <p className="text-sm text-gray-700 line-clamp-2">{report.aiGeneratedSummary}</p>
        </div>
      )}

      {/* Generated Info */}
      <div className="mb-4 text-xs text-gray-500">
        <p>Generated by: {report.generator?.fullName || report.generator?.username || 'N/A'}</p>
        <p>Created: {formatDate(report.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {report.pdfUrl && (
          <button
            onClick={() => onDownload(report.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Download size={14} />
            Download PDF
          </button>
        )}
        <button
          onClick={() => {/* TODO: Implement preview */}}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
        >
          <Eye size={14} />
          Preview
        </button>
        <button
          onClick={() => onDelete(report.id)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default ReportsTab;
