import React, { useState } from 'react';
import { useReports } from '../../contexts/ReportContext';
import { REPORT_TYPES, REPORT_TEMPLATES } from '../../utils/reportTemplates';

/**
 * ReportGenerator Component
 * UI for generating new reports with AI
 */
const ReportGenerator = ({ project, proposal, onReportGenerated }) => {
  const [selectedType, setSelectedType] = useState('DONOR_REPORT');
  const [additionalData, setAdditionalData] = useState({
    reportingPeriod: '',
    preparedBy: '',
    donorRequirements: ''
  });
  const { generateReport, generating, progress } = useReports();

  const handleGenerate = async () => {
    if (!project && !proposal) {
      alert('Please select a project or proposal first');
      return;
    }

    try {
      const template = REPORT_TEMPLATES[selectedType];

      const report = await generateReport({
        project,
        proposal,
        reportType: selectedType,
        sections: template.sections,
        additionalData
      });

      alert(`Report "${template.name}" generated successfully!`);

      if (onReportGenerated) {
        onReportGenerated(report);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const currentTemplate = REPORT_TEMPLATES[selectedType];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-ink-800">Generate Report</h2>

      {/* Project/Proposal Info */}
      {(project || proposal) && (
        <div className="mb-6 p-4 bg-ink-50 rounded-lg">
          <h3 className="font-medium text-ink-700 mb-2">
            {project ? 'Project' : 'Proposal'}
          </h3>
          <p className="text-sm text-ink-600">
            <span className="font-medium">Name:</span> {project?.name || proposal?.title}
          </p>
          {(project?.donor || proposal?.donor) && (
            <p className="text-sm text-ink-600">
              <span className="font-medium">Donor:</span> {project?.donor || proposal?.donor}
            </p>
          )}
        </div>
      )}

      {/* Report Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-ink-700 mb-2">
          Report Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full border border-ink-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={generating}
        >
          {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
            <option key={key} value={key}>
              {template.name}
            </option>
          ))}
        </select>
        {currentTemplate && (
          <p className="text-sm text-ink-600 mt-1">
            {currentTemplate.description}
          </p>
        )}
      </div>

      {/* Template Sections Preview */}
      {currentTemplate && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Report Sections ({currentTemplate.sections.length})
          </label>
          <div className="bg-ink-50 rounded p-3 max-h-40 overflow-y-auto">
            <ul className="space-y-1">
              {currentTemplate.sections.map((section, index) => (
                <li key={section.id} className="text-sm text-ink-600 flex items-center">
                  <span className="text-ink-400 mr-2">{index + 1}.</span>
                  {section.title}
                  {section.required && (
                    <span className="ml-2 text-xs text-red-600">*</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            * Required sections
          </p>
        </div>
      )}

      {/* Additional Data */}
      <div className="mb-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">
            Reporting Period
          </label>
          <input
            type="text"
            value={additionalData.reportingPeriod}
            onChange={(e) => setAdditionalData({ ...additionalData, reportingPeriod: e.target.value })}
            placeholder="e.g., January - March 2025"
            className="w-full border border-ink-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={generating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">
            Prepared By
          </label>
          <input
            type="text"
            value={additionalData.preparedBy}
            onChange={(e) => setAdditionalData({ ...additionalData, preparedBy: e.target.value })}
            placeholder="e.g., Project Manager"
            className="w-full border border-ink-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={generating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">
            Additional Notes
          </label>
          <textarea
            value={additionalData.donorRequirements}
            onChange={(e) => setAdditionalData({ ...additionalData, donorRequirements: e.target.value })}
            placeholder="Any specific requirements or notes..."
            rows={3}
            className="w-full border border-ink-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={generating}
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || (!project && !proposal)}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-ink-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {generating ? 'Generating...' : 'Generate with AI'}
      </button>

      {/* Progress Bar */}
      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ink-700">
              {progress.sectionTitle || 'Generating...'}
            </span>
            <span className="text-ink-600 font-medium">
              {progress.current}/{progress.total} ({progress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-ink-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* AI Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-800">
          <span className="font-semibold">AI-Powered:</span> This report will be generated using AI based on your project data.
          You can edit any section after generation. If AI is not configured, template-based content will be used.
        </p>
      </div>
    </div>
  );
};

export default ReportGenerator;
