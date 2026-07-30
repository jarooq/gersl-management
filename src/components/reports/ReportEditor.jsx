import React, { useState } from 'react';
import { useReports } from '../../contexts/ReportContext';
import { formatReport } from '../../utils/reportTemplates';

/**
 * ReportEditor Component
 * UI for viewing and editing generated reports
 */
const ReportEditor = ({ report, onClose }) => {
  const [sections, setSections] = useState(report.sections);
  const [exportFormat, setExportFormat] = useState('html');
  const [isEditing, setIsEditing] = useState(false);
  const { updateSection, deleteReport } = useReports();

  const handleSectionUpdate = (sectionId, newContent) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, content: newContent } : s
    );
    setSections(updated);
    updateSection(report.id, sectionId, newContent);
  };

  const handleExport = () => {
    try {
      const fileName = `${report.projectName || 'Report'}_${report.reportType}_${new Date().toISOString().split('T')[0]}`;

      if (exportFormat === 'pdf') {
        // Use browser's print functionality for PDF
        handlePrint();
        return;
      }

      if (exportFormat === 'docx') {
        // Export as Word-compatible HTML
        const formatted = formatReport(
          { metadata: report, sections },
          'html'
        );

        const docxContent = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office'
                xmlns:w='urn:schemas-microsoft-com:office:word'
                xmlns='http://www.w3.org/TR/REC-html40'>
          <head>
            <meta charset="utf-8">
            <title>${report.projectName || 'Report'}</title>
            <style>
              body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
                line-height: 1.6;
              }
              h1 { font-size: 18pt; font-weight: bold; margin-bottom: 12pt; }
              h2 { font-size: 16pt; font-weight: bold; margin-top: 16pt; margin-bottom: 8pt; }
              h3 { font-size: 14pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
              p { margin-bottom: 8pt; text-align: justify; }
            </style>
          </head>
          <body>
            ${formatted}
          </body>
          </html>
        `;

        const blob = new Blob(['\ufeff', docxContent], {
          type: 'application/msword'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.doc`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // Default exports (HTML, Markdown, Plain Text)
      const formatted = formatReport(
        { metadata: report, sections },
        exportFormat
      );

      const mimeTypes = {
        html: 'text/html',
        markdown: 'text/markdown',
        plain: 'text/plain'
      };

      const extensions = {
        html: 'html',
        markdown: 'md',
        plain: 'txt'
      };

      const blob = new Blob([formatted], {
        type: mimeTypes[exportFormat] || 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.${extensions[exportFormat] || 'txt'}`;

      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const formatted = formatReport(
      { metadata: report, sections },
      'html'
    );

    printWindow.document.write(formatted);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      deleteReport(report.id);
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-ink-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-ink-800">
              {report.projectName || 'Report'}
            </h2>
            <p className="text-sm text-ink-600 mt-1">
              {report.reportType.replace(/_/g, ' ')}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-ink-400 hover:text-ink-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Report Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-ink-500">Donor:</span>
            <p className="font-medium text-ink-800">{report.donor || 'N/A'}</p>
          </div>
          <div>
            <span className="text-ink-500">Created:</span>
            <p className="font-medium text-ink-800">
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-ink-500">Sections:</span>
            <p className="font-medium text-ink-800">{sections.length}</p>
          </div>
          <div>
            <span className="text-ink-500">Status:</span>
            <p className="font-medium text-green-600">
              {report.successfulSections}/{report.totalSections} Generated
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              isEditing
                ? 'bg-ink-200 text-ink-800'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditing ? 'View Mode' : 'Edit Mode'}
          </button>

          <div className="flex items-center gap-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="border border-ink-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
              <option value="plain">Plain Text</option>
              <option value="pdf">PDF (Print)</option>
              <option value="docx">DOCX (Word)</option>
            </select>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Export
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Print
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors ml-auto"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {sections.map((section, index) => (
          <div key={section.id} className="border-b border-ink-200 pb-6 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-ink-800">
                {index + 1}. {section.title}
              </h3>
              {section.editedAt && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Edited
                </span>
              )}
              {section.error && (
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  Error
                </span>
              )}
            </div>

            {isEditing ? (
              <textarea
                value={section.content}
                onChange={(e) => handleSectionUpdate(section.id, e.target.value)}
                className="w-full border border-ink-300 rounded p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                placeholder="Section content..."
              />
            ) : (
              <div className="prose max-w-none">
                <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">
                  {section.content}
                </p>
              </div>
            )}

            <div className="mt-2 text-xs text-ink-500">
              Generated: {new Date(section.generatedAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-ink-50 border-t border-ink-200 text-xs text-ink-600">
        <p>
          Report ID: {report.id} | Last Updated: {new Date(report.updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ReportEditor;
