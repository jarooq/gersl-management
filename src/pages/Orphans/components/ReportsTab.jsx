import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, Download, Eye, Trash2, Loader, TrendingUp, Image as ImageIcon, Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import OrphanReportWizard from './OrphanReportWizard';
import { OrphanReportAPI } from '../../../services/api';
import { generateOrphanReportPDF } from '../../../utils/orphanReportPdfGenerator';

const ReportsTab = ({ orphan }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);

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
      // Find the report in the list
      const report = reports.find(r => r.id === reportId);
      if (!report) {
        alert('Report not found');
        return;
      }

      // Generate and download PDF
      await generateOrphanReportPDF(report, orphan);
      console.log('✅ PDF generated successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-8 h-8 text-pink-600 animate-spin" />
        <span className="ml-3 text-ink-600">Loading reports...</span>
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
            <h3 className="text-lg font-bold text-ink-900">Progress Reports</h3>
            <p className="text-sm text-ink-600">{reports.length} report{reports.length !== 1 ? 's' : ''} generated</p>
          </div>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg transition text-sm font-semibold shadow-md"
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
              onPreview={setPreviewReport}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300">
          <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <p className="text-ink-900 font-semibold mb-1 text-lg">No reports generated yet</p>
          <p className="text-ink-600 text-sm mb-6">Create progress reports to share with partners and sponsors</p>
          <button
            onClick={() => setShowWizard(true)}
            className="px-6 py-3 bg-navy-900 text-white rounded-lg transition text-sm font-semibold shadow-md"
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

      {/* Preview Modal */}
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          orphan={orphan}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  );
};

const ReportCard = ({ report, onDelete, onDownload, onPreview }) => {
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
    <div className="bg-white border-2 border-ink-100 rounded-xl p-5 hover:shadow-card transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-ink-900">{getReportTypeLabel(report.reportType)}</h4>
            {getStatusBadge(report.status)}
          </div>
          <p className="text-sm text-ink-600">
            Period: {formatDate(report.reportPeriodStart)} - {formatDate(report.reportPeriodEnd)}
          </p>
        </div>
      </div>

      {/* Partner Info */}
      {report.partner && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900">Recipient Partner</p>
          <p className="text-sm text-ink-700">{report.partner.name}</p>
        </div>
      )}

      {/* Media Count */}
      <div className="flex items-center gap-3 mb-4 text-sm text-ink-600">
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
          <p className="text-sm text-ink-700 line-clamp-2">{report.aiGeneratedSummary}</p>
        </div>
      )}

      {/* Generated Info */}
      <div className="mb-4 text-xs text-ink-500">
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
          onClick={() => onPreview(report)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition text-sm font-medium"
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

const ReportPreviewModal = ({ report, orphan, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const orphanName = `${orphan.firstName || ''} ${orphan.middleName || ''} ${orphan.lastName || ''}`.trim() || 'Orphan';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-pop">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{getReportTypeLabel(report.reportType)}</h2>
              <p className="text-pink-100">Preview - {orphanName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Orphan Information */}
          <div className="bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl p-5 border-2 border-pink-200">
            <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-8 bg-pink-600 rounded"></div>
              Orphan Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-ink-600">Full Name</p>
                <p className="font-semibold text-ink-900">{orphanName}</p>
              </div>
              <div>
                <p className="text-sm text-ink-600">Orphan Code</p>
                <p className="font-semibold text-ink-900">{orphan.orphanCode || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-ink-600">Age</p>
                <p className="font-semibold text-ink-900">{orphan.age || 'N/A'} years</p>
              </div>
              <div>
                <p className="text-sm text-ink-600">Gender</p>
                <p className="font-semibold text-ink-900">{orphan.gender || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Report Period */}
          <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Report Period
            </h3>
            <p className="text-ink-700">
              {formatDate(report.reportPeriodStart)} - {formatDate(report.reportPeriodEnd)}
            </p>
          </div>

          {/* Partner Info */}
          {report.partner && (
            <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
              <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Mail className="text-green-600" size={20} />
                Recipient Partner
              </h3>
              <p className="font-semibold text-ink-900">{report.partner.name}</p>
              {report.partner.email && (
                <p className="text-sm text-ink-600">{report.partner.email}</p>
              )}
            </div>
          )}

          {/* AI Summary */}
          {report.aiGeneratedSummary && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                <TrendingUp className="text-purple-600" size={20} />
                Progress Summary
              </h3>
              <p className="text-ink-700 leading-relaxed">{report.aiGeneratedSummary}</p>
            </div>
          )}

          {/* Media Attachments */}
          {(report.selectedPhotos?.length > 0 || report.selectedDrawings?.length > 0 || report.selectedLetters?.length > 0) && (
            <div className="bg-ink-50 rounded-xl p-5 border-2 border-ink-100">
              <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                <ImageIcon className="text-ink-600" size={20} />
                Attachments
              </h3>
              <div className="space-y-2">
                {report.selectedPhotos?.length > 0 && (
                  <div className="flex items-center gap-2 text-ink-700">
                    <ImageIcon size={16} className="text-blue-600" />
                    <span>{report.selectedPhotos.length} photograph(s)</span>
                  </div>
                )}
                {report.selectedDrawings?.length > 0 && (
                  <div className="flex items-center gap-2 text-ink-700">
                    <ImageIcon size={16} className="text-purple-600" />
                    <span>{report.selectedDrawings.length} drawing(s)</span>
                  </div>
                )}
                {report.selectedLetters?.length > 0 && (
                  <div className="flex items-center gap-2 text-ink-700">
                    <Mail size={16} className="text-green-600" />
                    <span>{report.selectedLetters.length} letter(s)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {report.notes && (
            <div className="bg-yellow-50 rounded-xl p-5 border-2 border-yellow-200">
              <h3 className="text-lg font-bold text-ink-900 mb-4">Additional Notes</h3>
              <p className="text-ink-700 leading-relaxed whitespace-pre-wrap">{report.notes}</p>
            </div>
          )}

          {/* Report Metadata */}
          <div className="bg-ink-100 rounded-xl p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ink-600">Generated by</p>
                <p className="font-semibold text-ink-900">
                  {report.generator?.fullName || report.generator?.username || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-ink-600">Created on</p>
                <p className="font-semibold text-ink-900">{formatDate(report.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-ink-50 p-6 rounded-b-xl border-t-2 border-ink-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
