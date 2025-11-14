import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateCompleteReport } from '../utils/aiReportGenerator';
import { REPORT_TEMPLATES } from '../utils/reportTemplates';
import * as reportsAPI from '../services/reports.api';

const ReportContext = createContext(null);

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all reports from API
   */
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportsAPI.fetchReports({ limit: 100 });
      setReports(data.reports || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message);
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('gersl_reports');
      if (stored) {
        try {
          setReports(JSON.parse(stored));
        } catch (parseError) {
          console.error('Error parsing stored reports:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load reports on mount - disabled to prevent 401 errors when not logged in
  // Pages will call loadReports when they mount
  // useEffect(() => {
  //   loadReports();
  // }, [loadReports]);

  // Backup to localStorage (for offline support)
  useEffect(() => {
    if (reports.length > 0) {
      localStorage.setItem('gersl_reports', JSON.stringify(reports));
    }
  }, [reports]);

  /**
   * Generate a new report
   * @param {Object} params - Report generation parameters
   * @returns {Promise<Object>} Generated report
   */
  const generateReport = async (params) => {
    setGenerating(true);
    setProgress({ current: 0, total: params.sections.length });

    try {
      // Generate report content using AI
      const result = await generateCompleteReport({
        ...params,
        onProgress: setProgress
      });

      // Prepare report data for API
      const reportData = {
        title: result.metadata.projectName
          ? `${params.reportType} - ${result.metadata.projectName}`
          : `${params.reportType} - ${new Date().toLocaleDateString()}`,
        reportType: params.reportType,
        projectId: params.project?.id || null,
        projectName: params.project?.name || null,
        proposalId: params.proposal?.id || null,
        proposalTitle: params.proposal?.title || null,
        donor: result.metadata.donor || params.project?.donor || params.proposal?.donor || null,
        reportingPeriod: params.additionalData?.reportingPeriod || null,
        sections: result.sections,
        metadata: {
          preparedBy: params.additionalData?.preparedBy || null,
          donorRequirements: params.additionalData?.donorRequirements || null,
          ...params.additionalData
        },
        totalSections: result.sections.length,
        successfulSections: result.sections.filter(s => !s.error).length,
        generationStatus: result.sections.every(s => !s.error) ? 'Completed' :
                         result.sections.some(s => !s.error) ? 'Partial' : 'Failed',
        generationErrors: result.sections
          .filter(s => s.error)
          .map(s => ({ sectionId: s.id, title: s.title, error: s.error }))
      };

      // Save to backend
      const savedReport = await reportsAPI.createReport(reportData);

      // Update local state
      setReports(prev => [savedReport, ...prev]);

      console.log('✅ Report generated and saved:', savedReport.id);
      return savedReport;
    } catch (error) {
      console.error('❌ Error generating report:', error);
      setError(error.message);
      throw error;
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  };

  /**
   * Update an existing report
   * @param {number} reportId - Report ID
   * @param {Object} updates - Updates to apply
   */
  const updateReport = async (reportId, updates) => {
    try {
      const updatedReport = await reportsAPI.updateReport(reportId, updates);
      setReports(prev => prev.map(r =>
        r.id === reportId ? updatedReport : r
      ));
      console.log('✅ Report updated:', reportId);
      return updatedReport;
    } catch (error) {
      console.error('Error updating report:', error);
      setError(error.message);
      throw error;
    }
  };

  /**
   * Update a specific section in a report
   * @param {number} reportId - Report ID
   * @param {string} sectionId - Section ID
   * @param {string} content - New content
   */
  const updateSection = async (reportId, sectionId, content) => {
    try {
      const updatedReport = await reportsAPI.updateReportSection(reportId, sectionId, content);
      setReports(prev => prev.map(r =>
        r.id === reportId ? updatedReport : r
      ));
      console.log('✅ Section updated:', sectionId);
      return updatedReport;
    } catch (error) {
      console.error('Error updating section:', error);
      setError(error.message);
      throw error;
    }
  };

  /**
   * Delete a report
   * @param {number} reportId - Report ID
   */
  const deleteReport = async (reportId) => {
    try {
      await reportsAPI.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      console.log('✅ Report deleted:', reportId);
    } catch (error) {
      console.error('Error deleting report:', error);
      setError(error.message);
      throw error;
    }
  };

  /**
   * Get reports for a specific project
   * @param {number} projectId - Project ID
   * @returns {Array} Project reports
   */
  const getProjectReports = (projectId) => {
    return reports.filter(r => r.projectId === parseInt(projectId));
  };

  /**
   * Get reports for a specific proposal
   * @param {number} proposalId - Proposal ID
   * @returns {Array} Proposal reports
   */
  const getProposalReports = (proposalId) => {
    return reports.filter(r => r.proposalId === parseInt(proposalId));
  };

  /**
   * Get reports by type
   * @param {string} reportType - Report type
   * @returns {Array} Filtered reports
   */
  const getReportsByType = (reportType) => {
    return reports.filter(r => r.reportType === reportType);
  };

  /**
   * Get a single report by ID
   * @param {number} reportId - Report ID
   * @returns {Object|null} Report or null
   */
  const getReportById = (reportId) => {
    return reports.find(r => r.id === parseInt(reportId)) || null;
  };

  /**
   * Share a report with users
   * @param {number} reportId - Report ID
   * @param {Object} shareData - { userIds: Array<number>, isPublic: boolean }
   */
  const shareReport = async (reportId, shareData) => {
    try {
      const updatedReport = await reportsAPI.shareReport(reportId, shareData);
      setReports(prev => prev.map(r =>
        r.id === reportId ? updatedReport : r
      ));
      console.log('✅ Report sharing updated:', reportId);
      return updatedReport;
    } catch (error) {
      console.error('Error sharing report:', error);
      setError(error.message);
      throw error;
    }
  };

  /**
   * Reload reports from API
   */
  const refreshReports = async () => {
    await loadReports();
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    reports,
    generating,
    progress,
    loading,
    error,
    generateReport,
    updateReport,
    updateSection,
    deleteReport,
    getProjectReports,
    getProposalReports,
    getReportsByType,
    getReportById,
    shareReport,
    refreshReports,
    clearError
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};
