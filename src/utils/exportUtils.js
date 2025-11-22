/**
 * Export Utilities
 * Provides functions to export data in various formats (CSV, Excel, etc.)
 */

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Optional array of column definitions {key, label}
 * @returns {string} CSV formatted string
 */
export const convertToCSV = (data, columns = null) => {
  if (!data || data.length === 0) {
    return '';
  }

  // If columns not provided, use all keys from first object
  const headers = columns
    ? columns
    : Object.keys(data[0]).map(key => ({ key, label: key }));

  // Create CSV header row
  const headerRow = headers.map(col => `"${col.label}"`).join(',');

  // Create CSV data rows
  const dataRows = data.map(row => {
    return headers.map(col => {
      const value = row[col.key];

      // Handle different data types
      if (value === null || value === undefined) {
        return '""';
      }

      // Handle dates
      if (value instanceof Date) {
        return `"${value.toLocaleDateString()}"`;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        return `"${value.join(', ')}"`;
      }

      // Handle objects
      if (typeof value === 'object') {
        return `"${JSON.stringify(value)}"`;
      }

      // Handle strings with commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return `"${stringValue}"`;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename = 'export.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Export tasks to CSV
 * @param {Array} tasks - Array of task objects
 * @param {string} filename - Optional filename
 */
export const exportTasksToCSV = (tasks, filename = null) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'projectName', label: 'Project' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'estimatedTime', label: 'Estimated Time (hours)' },
    { key: 'actualTime', label: 'Actual Time (hours)' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' },
  ];

  // Format tasks data
  const formattedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assignedTo: task.AssignedUser?.name || task.assignedTo || 'Unassigned',
    projectName: task.Project?.name || 'No Project',
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
    estimatedTime: task.estimatedTime ? (task.estimatedTime / 60).toFixed(2) : '',
    actualTime: task.actualTime ? (task.actualTime / 60).toFixed(2) : '',
    createdAt: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '',
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : '',
  }));

  const csvContent = convertToCSV(formattedTasks, columns);
  const defaultFilename = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
};

/**
 * Export projects to CSV
 * @param {Array} projects - Array of project objects
 * @param {string} filename - Optional filename
 */
export const exportProjectsToCSV = (projects, filename = null) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Project Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'budget', label: 'Budget' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'donor', label: 'Donor' },
    { key: 'location', label: 'Location' },
    { key: 'createdAt', label: 'Created At' },
  ];

  // Format projects data
  const formattedProjects = projects.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description || '',
    status: project.status,
    budget: project.budget || '',
    startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : '',
    endDate: project.endDate ? new Date(project.endDate).toLocaleDateString() : '',
    donor: project.donor || '',
    location: project.location || '',
    createdAt: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '',
  }));

  const csvContent = convertToCSV(formattedProjects, columns);
  const defaultFilename = `projects_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
};

/**
 * Export orphans to CSV
 * @param {Array} orphans - Array of orphan objects
 * @param {string} filename - Optional filename
 */
export const exportOrphansToCSV = (orphans, filename = null) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'province', label: 'Province' },
    { key: 'district', label: 'District' },
    { key: 'guardianName', label: 'Guardian Name' },
    { key: 'guardianContact', label: 'Guardian Contact' },
    { key: 'enrollmentDate', label: 'Enrollment Date' },
    { key: 'status', label: 'Status' },
  ];

  // Format orphans data
  const formattedOrphans = orphans.map(orphan => ({
    id: orphan.id,
    fullName: orphan.fullName,
    dateOfBirth: orphan.dateOfBirth ? new Date(orphan.dateOfBirth).toLocaleDateString() : '',
    gender: orphan.gender,
    province: orphan.province || '',
    district: orphan.district || '',
    guardianName: orphan.guardianName || '',
    guardianContact: orphan.guardianContact || '',
    enrollmentDate: orphan.enrollmentDate ? new Date(orphan.enrollmentDate).toLocaleDateString() : '',
    status: orphan.status || 'Active',
  }));

  const csvContent = convertToCSV(formattedOrphans, columns);
  const defaultFilename = `orphans_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
};

/**
 * Export proposals to CSV
 * @param {Array} proposals - Array of proposal objects
 * @param {string} filename - Optional filename
 */
export const exportProposalsToCSV = (proposals, filename = null) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'donor', label: 'Donor' },
    { key: 'requestedAmount', label: 'Requested Amount' },
    { key: 'status', label: 'Status' },
    { key: 'submissionDate', label: 'Submission Date' },
    { key: 'decisionDate', label: 'Decision Date' },
    { key: 'createdAt', label: 'Created At' },
  ];

  // Format proposals data
  const formattedProposals = proposals.map(proposal => ({
    id: proposal.id,
    title: proposal.title,
    donor: proposal.donor || '',
    requestedAmount: proposal.requestedAmount || '',
    status: proposal.status,
    submissionDate: proposal.submissionDate ? new Date(proposal.submissionDate).toLocaleDateString() : '',
    decisionDate: proposal.decisionDate ? new Date(proposal.decisionDate).toLocaleDateString() : '',
    createdAt: proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : '',
  }));

  const csvContent = convertToCSV(formattedProposals, columns);
  const defaultFilename = `proposals_export_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(csvContent, filename || defaultFilename);
};

/**
 * Generic export function for any data
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions
 * @param {string} filename - Filename for export
 */
export const exportToCSV = (data, columns, filename = 'export.csv') => {
  const csvContent = convertToCSV(data, columns);
  downloadCSV(csvContent, filename);
};

export default {
  convertToCSV,
  downloadCSV,
  exportTasksToCSV,
  exportProjectsToCSV,
  exportOrphansToCSV,
  exportProposalsToCSV,
  exportToCSV,
};
