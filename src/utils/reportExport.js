import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export report data to PDF format
 * @param {Object} reportData - The report data to export
 * @param {string} reportName - Name of the report
 * @param {Object} contextData - Additional context data from various modules
 */
export const exportToPDF = (reportData, reportName, contextData = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(79, 70, 229); // Indigo color
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('GERSL Management System', 15, 20);

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(reportName, 15, 30);

  // Report Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const generatedDate = new Date().toLocaleString();
  doc.text(`Generated: ${generatedDate}`, 15, 50);
  doc.text(`Date Range: ${reportData.dateRange?.start || 'N/A'} to ${reportData.dateRange?.end || 'N/A'}`, 15, 56);
  doc.text(`Format: ${reportData.format || 'PDF'}`, 15, 62);

  let yPos = 75;

  // Report Type Specific Content
  const reportContent = getReportContent(reportData.type, contextData);

  if (reportContent.summary) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 15, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    Object.entries(reportContent.summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 15, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  // Table Data
  if (reportContent.tableData && reportContent.tableData.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [reportContent.tableHeaders || ['Item', 'Value']],
      body: reportContent.tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      margin: { left: 15, right: 15 }
    });
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      '© GERSL - Global Education and Relief Services Lanka',
      15,
      pageHeight - 10
    );
  }

  // Save the PDF
  const fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
};

/**
 * Export report data to Excel format
 * @param {Object} reportData - The report data to export
 * @param {string} reportName - Name of the report
 * @param {Object} contextData - Additional context data from various modules
 */
export const exportToExcel = (reportData, reportName, contextData = {}) => {
  const wb = XLSX.utils.book_new();

  // Report Info Sheet
  const infoData = [
    ['GERSL Management System'],
    [''],
    ['Report Name:', reportName],
    ['Generated:', new Date().toLocaleString()],
    ['Date Range:', `${reportData.dateRange?.start || 'N/A'} to ${reportData.dateRange?.end || 'N/A'}`],
    ['Format:', reportData.format || 'Excel'],
    ['']
  ];

  const reportContent = getReportContent(reportData.type, contextData);

  // Add summary data
  if (reportContent.summary) {
    infoData.push(['Summary:']);
    Object.entries(reportContent.summary).forEach(([key, value]) => {
      infoData.push([key, value]);
    });
    infoData.push(['']);
  }

  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Report Info');

  // Data Sheet
  if (reportContent.tableData && reportContent.tableData.length > 0) {
    const dataWithHeaders = [
      reportContent.tableHeaders || ['Item', 'Value'],
      ...reportContent.tableData
    ];
    const wsData = XLSX.utils.aoa_to_sheet(dataWithHeaders);
    XLSX.utils.book_append_sheet(wb, wsData, 'Data');
  }

  // Generate file and trigger download
  const fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * Export report data to CSV format
 * @param {Object} reportData - The report data to export
 * @param {string} reportName - Name of the report
 * @param {Object} contextData - Additional context data from various modules
 */
export const exportToCSV = (reportData, reportName, contextData = {}) => {
  const reportContent = getReportContent(reportData.type, contextData);

  let csvContent = '';

  // Header
  csvContent += `GERSL Management System\n`;
  csvContent += `${reportName}\n`;
  csvContent += `Generated: ${new Date().toLocaleString()}\n`;
  csvContent += `Date Range: ${reportData.dateRange?.start || 'N/A'} to ${reportData.dateRange?.end || 'N/A'}\n`;
  csvContent += `\n`;

  // Summary
  if (reportContent.summary) {
    csvContent += `Summary\n`;
    Object.entries(reportContent.summary).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`;
    });
    csvContent += `\n`;
  }

  // Table Data
  if (reportContent.tableData && reportContent.tableData.length > 0) {
    // Headers
    const headers = reportContent.tableHeaders || ['Item', 'Value'];
    csvContent += headers.join(',') + '\n';

    // Data rows
    reportContent.tableData.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
  }

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
  saveAs(blob, fileName);
};

/**
 * Export to Word format (using HTML)
 * @param {Object} reportData - The report data to export
 * @param {string} reportName - Name of the report
 * @param {Object} contextData - Additional context data from various modules
 */
export const exportToWord = (reportData, reportName, contextData = {}) => {
  const reportContent = getReportContent(reportData.type, contextData);

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${reportName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; margin: -40px -40px 20px -40px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; font-size: 14px; }
        .info { margin-bottom: 20px; font-size: 12px; color: #666; }
        h2 { color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #4F46E5; color: white; padding: 10px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GERSL Management System</h1>
        <p>${reportName}</p>
      </div>

      <div class="info">
        <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
        <strong>Date Range:</strong> ${reportData.dateRange?.start || 'N/A'} to ${reportData.dateRange?.end || 'N/A'}<br>
        <strong>Format:</strong> ${reportData.format || 'Word'}
      </div>
  `;

  if (reportContent.summary) {
    htmlContent += `<h2>Summary</h2><table>`;
    Object.entries(reportContent.summary).forEach(([key, value]) => {
      htmlContent += `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>`;
    });
    htmlContent += `</table>`;
  }

  if (reportContent.tableData && reportContent.tableData.length > 0) {
    htmlContent += `<h2>Report Data</h2><table><thead><tr>`;
    (reportContent.tableHeaders || ['Item', 'Value']).forEach(header => {
      htmlContent += `<th>${header}</th>`;
    });
    htmlContent += `</tr></thead><tbody>`;
    reportContent.tableData.forEach(row => {
      htmlContent += `<tr>`;
      row.forEach(cell => {
        htmlContent += `<td>${cell}</td>`;
      });
      htmlContent += `</tr>`;
    });
    htmlContent += `</tbody></table>`;
  }

  htmlContent += `
      <div class="footer">
        © GERSL - Global Education and Relief Services Lanka
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const fileName = `${reportName.replace(/\s+/g, '_')}_${Date.now()}.doc`;
  saveAs(blob, fileName);
};

/**
 * Get report-specific content based on report type
 * @param {string} reportType - Type of report
 * @param {Object} contextData - Context data from all modules
 * @returns {Object} Report content with summary and tableData
 */
const getReportContent = (reportType, contextData) => {
  const content = {
    summary: {},
    tableHeaders: [],
    tableData: []
  };

  // Example implementations for different report types
  switch (reportType) {
    case 'financial-summary':
      content.summary = {
        'Total Revenue': `LKR ${(contextData.financeStats?.totalRevenue || 0).toLocaleString()}`,
        'Total Expenses': `LKR ${(contextData.financeStats?.totalExpenses || 0).toLocaleString()}`,
        'Net Income': `LKR ${((contextData.financeStats?.totalRevenue || 0) - (contextData.financeStats?.totalExpenses || 0)).toLocaleString()}`,
        'Budget Utilized': `${contextData.financeStats?.budgetUtilized || 0}%`
      };
      content.tableHeaders = ['Account', 'Type', 'Balance', 'Currency'];
      content.tableData = (contextData.chartOfAccounts || []).map(acc => [
        acc.name,
        acc.type,
        `LKR ${acc.balance.toLocaleString()}`,
        acc.currency || 'LKR'
      ]);
      break;

    case 'project-portfolio':
      content.summary = {
        'Total Projects': contextData.projectStats?.total || 0,
        'Active Projects': contextData.projectStats?.active || 0,
        'Completed Projects': contextData.projectStats?.completed || 0,
        'Total Budget': `LKR ${((contextData.projectStats?.totalBudget || 0) / 1000000).toFixed(1)}M`
      };
      content.tableHeaders = ['Project Name', 'Status', 'Budget', 'Progress', 'Start Date'];
      content.tableData = (contextData.projects || []).map(proj => [
        proj.name,
        proj.status,
        `LKR ${(proj.budget || 0).toLocaleString()}`,
        `${proj.progress || 0}%`,
        proj.startDate || 'N/A'
      ]);
      break;

    case 'orphan-registry':
      content.summary = {
        'Total Orphans': contextData.orphanStats?.total || 0,
        'Active Orphans': contextData.orphanStats?.active || 0,
        'Inactive Orphans': contextData.orphanStats?.inactive || 0,
        'Monthly Stipend Total': `LKR ${(contextData.orphanStats?.totalMonthlyStipend || 0).toLocaleString()}`
      };
      content.tableHeaders = ['Name', 'Age', 'Gender', 'Location', 'Stipend', 'Status'];
      content.tableData = (contextData.orphans || []).map(orphan => [
        orphan.name,
        orphan.age || 'N/A',
        orphan.gender,
        orphan.location || 'N/A',
        `LKR ${(orphan.stipend || 0).toLocaleString()}`,
        orphan.status
      ]);
      break;

    case 'staff-roster':
      content.summary = {
        'Total Staff': contextData.hrStats?.totalStaff || 0,
        'Active Staff': contextData.hrStats?.activeStaff || 0,
        'On Leave': contextData.hrStats?.onLeave || 0,
        'Departments': contextData.hrStats?.departments || 0
      };
      content.tableHeaders = ['Name', 'Position', 'Department', 'Join Date', 'Status'];
      content.tableData = (contextData.staff || []).map(staff => [
        staff.name,
        staff.position,
        staff.department,
        staff.joinDate || 'N/A',
        staff.status
      ]);
      break;

    case 'partner-portfolio':
      content.summary = {
        'Total Partners': contextData.partnerStats?.totalPartners || 0,
        'Active Partners': contextData.partnerStats?.activePartners || 0,
        'Total Contributions': `LKR ${((contextData.partnerStats?.totalContributions || 0) / 1000000).toFixed(1)}M`,
        'Average Retention': `${contextData.partnerStats?.retentionRate || 0}%`
      };
      content.tableHeaders = ['Partner Name', 'Type', 'Status', 'Contribution', 'Join Date'];
      content.tableData = (contextData.partners || []).map(partner => [
        partner.name,
        partner.type,
        partner.status,
        `LKR ${(partner.totalContribution || 0).toLocaleString()}`,
        partner.joinDate || 'N/A'
      ]);
      break;

    default:
      content.summary = {
        'Report Type': reportType,
        'Generated': new Date().toLocaleString(),
        'Status': 'Generated Successfully'
      };
      content.tableHeaders = ['Item', 'Value'];
      content.tableData = [
        ['Report Type', reportType],
        ['Generated Date', new Date().toLocaleDateString()],
        ['Status', 'Generated']
      ];
  }

  return content;
};

/**
 * Main export function that routes to appropriate format
 * @param {Object} reportData - The report data
 * @param {string} reportName - Name of the report
 * @param {string} format - Export format (PDF, Excel, CSV, Word)
 * @param {Object} contextData - Additional context data
 */
export const exportReport = (reportData, reportName, format, contextData = {}) => {
  switch (format.toUpperCase()) {
    case 'PDF':
      exportToPDF(reportData, reportName, contextData);
      break;
    case 'EXCEL':
      exportToExcel(reportData, reportName, contextData);
      break;
    case 'CSV':
      exportToCSV(reportData, reportName, contextData);
      break;
    case 'WORD':
      exportToWord(reportData, reportName, contextData);
      break;
    default:
      exportToPDF(reportData, reportName, contextData);
  }
};
