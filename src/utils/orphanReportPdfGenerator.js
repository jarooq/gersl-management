import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a professional PDF for an orphan progress report
 * @param {Object} report - The report object
 * @param {Object} orphan - The orphan object
 */
export const generateOrphanReportPDF = async (report, orphan) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Colors
  const primaryColor = [236, 72, 153]; // Pink
  const secondaryColor = [59, 130, 246]; // Blue
  const textColor = [33, 33, 33];
  const grayColor = [128, 128, 128];

  // Helper function to add page if needed
  const checkPageBreak = (neededSpace = 20) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper to add section title
  const addSectionTitle = (title) => {
    checkPageBreak(15);
    doc.setFillColor(...primaryColor);
    doc.rect(10, yPosition, pageWidth - 20, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, yPosition + 7);
    yPosition += 15;
    doc.setTextColor(...textColor);
  };

  // ======================================
  // COVER PAGE
  // ======================================

  // Add Logo at the top center
  try {
    const logoDataUrl = await new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (err) => {
        reject(new Error('Logo not found'));
      };

      img.src = '/Logo 10.jpeg';
    });

    doc.addImage(logoDataUrl, 'JPEG', pageWidth / 2 - 15, 15, 30, 30);
    yPosition = 50;
  } catch (error) {
    console.log('⚠️ Logo not loaded, continuing without logo:', error.message);
    yPosition = 20;
  }

  // Header with gradient effect
  doc.setFillColor(...primaryColor);
  doc.rect(0, yPosition, pageWidth, 60, 'F');

  // Organization name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Global Ehsan Relief - Sri Lanka', pageWidth / 2, yPosition + 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('65 Abdul Majeed Road, Kinniya-04, Trincomalee, Sri Lanka', pageWidth / 2, yPosition + 25, { align: 'center' });

  // Document title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ORPHAN PROGRESS REPORT', pageWidth / 2, yPosition + 40, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const reportTypeLabel = report.reportType === 'monthly' ? 'Monthly Report' :
                         report.reportType === 'quarterly' ? 'Quarterly Report' :
                         report.reportType === 'annual' ? 'Annual Report' : 'Progress Report';
  doc.text(reportTypeLabel, pageWidth / 2, yPosition + 50, { align: 'center' });

  // Report details box
  yPosition += 70;
  doc.setTextColor(...textColor);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, yPosition, pageWidth - 30, 70, 3, 3, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const orphanName = `${orphan.firstName || ''} ${orphan.middleName || ''} ${orphan.lastName || ''}`.trim() || 'Orphan';
  doc.text(orphanName, pageWidth / 2, yPosition + 12, { align: 'center' });

  yPosition += 25;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const infoLines = [
    `Orphan Code: ${orphan.orphanCode || 'N/A'}`,
    `Age: ${orphan.age || 'N/A'} years`,
    `Report Period: ${formatDate(report.reportPeriodStart)} - ${formatDate(report.reportPeriodEnd)}`,
    `Generated: ${formatDate(report.createdAt)}`,
    `Status: ${report.status || 'Completed'}`
  ];

  infoLines.forEach(line => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  });

  // Partner info if available
  if (report.partner) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Recipient: ${report.partner.name}`, pageWidth / 2, yPosition, { align: 'center' });
  }

  // Date footer on cover
  yPosition = pageHeight - 30;
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  // ======================================
  // START NEW PAGE - ORPHAN INFORMATION
  // ======================================
  doc.addPage();
  yPosition = 20;

  addSectionTitle('ORPHAN INFORMATION');

  const orphanInfoTable = [
    ['Full Name', orphanName],
    ['Orphan Code', orphan.orphanCode || 'N/A'],
    ['Date of Birth', formatDate(orphan.dateOfBirth)],
    ['Age', `${orphan.age || 'N/A'} years`],
    ['Gender', orphan.gender || 'N/A'],
    ['Current Location', orphan.currentLocation || orphan.address || 'N/A'],
    ['Education Level', orphan.educationLevel || 'N/A'],
    ['Health Status', orphan.healthStatus || 'Good']
  ];

  autoTable(doc, {
    startY: yPosition,
    body: orphanInfoTable,
    theme: 'grid',
    headStyles: { fillColor: primaryColor },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // ======================================
  // AI GENERATED SUMMARY
  // ======================================
  if (report.aiGeneratedSummary) {
    checkPageBreak(40);
    addSectionTitle('PROGRESS SUMMARY');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(report.aiGeneratedSummary, pageWidth - 30);
    doc.text(summaryLines, 15, yPosition);
    yPosition += summaryLines.length * 5 + 15;
  }

  // ======================================
  // EDUCATION PROGRESS
  // ======================================
  if (orphan.education || report.educationProgress) {
    checkPageBreak(40);
    addSectionTitle('EDUCATION PROGRESS');

    const educationData = [
      ['Current Grade/Level', orphan.educationLevel || orphan.education?.currentGrade || 'N/A'],
      ['School Name', orphan.education?.schoolName || 'N/A'],
      ['Academic Performance', report.educationProgress?.performance || orphan.education?.performance || 'Good'],
      ['Attendance Rate', report.educationProgress?.attendanceRate || orphan.education?.attendanceRate || 'N/A']
    ];

    autoTable(doc, {
      startY: yPosition,
      body: educationData,
      theme: 'striped',
      headStyles: { fillColor: secondaryColor },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // ======================================
  // HEALTH UPDATE
  // ======================================
  if (report.healthUpdate || orphan.healthStatus) {
    checkPageBreak(40);
    addSectionTitle('HEALTH & WELLBEING');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const healthInfo = report.healthUpdate || `Health Status: ${orphan.healthStatus || 'Good'}`;
    const healthLines = doc.splitTextToSize(healthInfo, pageWidth - 30);
    doc.text(healthLines, 15, yPosition);
    yPosition += healthLines.length * 5 + 15;
  }

  // ======================================
  // ACTIVITIES & ACHIEVEMENTS
  // ======================================
  if (report.activities || report.achievements) {
    checkPageBreak(40);
    addSectionTitle('ACTIVITIES & ACHIEVEMENTS');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const activitiesText = report.activities || report.achievements || 'The child participated in regular activities and continues to develop positively.';
    const activitiesLines = doc.splitTextToSize(activitiesText, pageWidth - 30);
    doc.text(activitiesLines, 15, yPosition);
    yPosition += activitiesLines.length * 5 + 15;
  }

  // ======================================
  // MEDIA ATTACHMENTS INFO
  // ======================================
  if (report.selectedPhotos?.length > 0 || report.selectedDrawings?.length > 0 || report.selectedLetters?.length > 0) {
    checkPageBreak(40);
    addSectionTitle('ATTACHMENTS');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const attachments = [];
    if (report.selectedPhotos?.length > 0) {
      attachments.push(`• ${report.selectedPhotos.length} photograph(s) included`);
    }
    if (report.selectedDrawings?.length > 0) {
      attachments.push(`• ${report.selectedDrawings.length} drawing(s) included`);
    }
    if (report.selectedLetters?.length > 0) {
      attachments.push(`• ${report.selectedLetters.length} letter(s) included`);
    }

    attachments.forEach(item => {
      doc.text(item, 20, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
  }

  // ======================================
  // NOTES & OBSERVATIONS
  // ======================================
  if (report.notes || report.observations) {
    checkPageBreak(40);
    addSectionTitle('ADDITIONAL NOTES');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const notesText = report.notes || report.observations || '';
    const notesLines = doc.splitTextToSize(notesText, pageWidth - 30);
    doc.text(notesLines, 15, yPosition);
    yPosition += notesLines.length * 5 + 15;
  }

  // ======================================
  // SIGNATURES
  // ======================================
  checkPageBreak(60);
  addSectionTitle('VERIFICATION');

  const signatureY = yPosition + 30;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by:', 20, yPosition + 10);
  doc.line(20, signatureY, 90, signatureY);
  doc.setFontSize(9);
  const generatorName = report.generator?.fullName || report.generator?.username || 'System';
  doc.text(generatorName, 20, signatureY + 5);
  doc.text(`Date: ${formatDate(report.createdAt)}`, 20, signatureY + 12);

  doc.setFontSize(10);
  doc.text('Approved by:', pageWidth / 2 + 10, yPosition + 10);
  doc.line(pageWidth / 2 + 10, signatureY, pageWidth / 2 + 80, signatureY);
  doc.setFontSize(9);
  doc.text('Programme Coordinator', pageWidth / 2 + 10, signatureY + 5);
  doc.text('Date: ______________', pageWidth / 2 + 10, signatureY + 12);

  // Footer on each page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(
      `${orphan.orphanCode || 'Report'} - Confidential`,
      15,
      pageHeight - 10
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Save the PDF
  const fileName = `${orphan.orphanCode || 'Orphan'}_${reportTypeLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return fileName;
};
