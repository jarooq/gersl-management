import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a professional PDF for a proposal
 * @param {Object} proposal - The proposal object
 * @param {String} type - 'full' or 'executive' for summary
 */
export const generateProposalPDF = async (proposal, type = 'full') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Colors
  const primaryColor = [63, 81, 181]; // Indigo
  const secondaryColor = [76, 175, 80]; // Green
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
    // Load logo image asynchronously
    const logoDataUrl = await new Promise((resolve, reject) => {
      const img = new Image();
      // Don't use crossOrigin for same-origin requests

      img.onload = () => {
        try {
          // Convert to data URL using canvas
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          console.log('✅ Logo loaded and converted to data URL');
          resolve(dataUrl);
        } catch (err) {
          console.error('❌ Canvas conversion error:', err);
          reject(err);
        }
      };

      img.onerror = (err) => {
        console.error('❌ Logo load error:', err);
        reject(new Error('Logo not found'));
      };

      // Use absolute path
      img.src = '/Logo 10.jpeg';
      console.log('🔍 Loading logo from:', img.src);
    });

    // Center the logo - 30mm width, 30mm height
    doc.addImage(logoDataUrl, 'JPEG', pageWidth / 2 - 15, 15, 30, 30);
    yPosition = 50;
    console.log('✅ Logo added to PDF successfully');
  } catch (error) {
    console.log('⚠️ Logo not loaded, continuing without logo:', error.message);
    yPosition = 20;
  }

  // Header with gradient effect (simulated with rectangles)
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
  doc.text('PROPOSAL DOCUMENT', pageWidth / 2, yPosition + 40, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(type === 'full' ? 'Complete Proposal' : 'Executive Summary', pageWidth / 2, yPosition + 50, { align: 'center' });

  // Proposal details box
  yPosition += 70;
  doc.setTextColor(...textColor);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, yPosition, pageWidth - 30, 60, 3, 3, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(proposal.title || 'Untitled Proposal', pageWidth - 40);
  doc.text(titleLines, pageWidth / 2, yPosition + 12, { align: 'center' });

  yPosition += titleLines.length * 7 + 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const infoLines = [
    `Proposal Code: ${proposal.proposalCode || 'N/A'}`,
    `Donor: ${proposal.donor || 'N/A'}`,
    `Programme Area: ${proposal.programmeArea || 'N/A'}`,
    `Status: ${proposal.status || 'Draft'}`
  ];

  infoLines.forEach(line => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;
  });

  // Date and page footer
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
  // START NEW PAGE - EXECUTIVE SUMMARY
  // ======================================
  doc.addPage();
  yPosition = 20;

  addSectionTitle('EXECUTIVE SUMMARY');

  // Summary table
  const summaryTable = [
    ['Proposal Code', proposal.proposalCode || 'N/A'],
    ['Donor Organization', proposal.donor || 'N/A'],
    ['Total Budget', `LKR ${(proposal.totalBudget || proposal.budgetRequested || 0).toLocaleString()}`],
    ['Target Beneficiaries', `${(proposal.targetBeneficiaries || 0).toLocaleString()} people`],
    ['Duration', `${proposal.duration || 'Not specified'}`],
    ['Start Date', proposal.startDate ? new Date(proposal.startDate).toLocaleDateString('en-GB') : 'Not specified'],
    ['End Date', proposal.endDate ? new Date(proposal.endDate).toLocaleDateString('en-GB') : 'Not specified'],
    ['Priority', proposal.priority || 'Medium']
  ];

  autoTable(doc, {
    startY: yPosition,
    body: summaryTable,
    theme: 'grid',
    headStyles: { fillColor: primaryColor },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // ======================================
  // PROPOSAL DETAILS (Full version only)
  // ======================================
  if (type === 'full') {

    // Project Description
    if (proposal.summary) {
      checkPageBreak(30);
      addSectionTitle('PROJECT SUMMARY');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(proposal.summary, pageWidth - 30);
      doc.text(summaryLines, 15, yPosition);
      yPosition += summaryLines.length * 5 + 10;
    }

    // Problem Statement
    if (proposal.problemStatement) {
      checkPageBreak(30);
      addSectionTitle('PROBLEM STATEMENT');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const problemLines = doc.splitTextToSize(proposal.problemStatement, pageWidth - 30);
      doc.text(problemLines, 15, yPosition);
      yPosition += problemLines.length * 5 + 10;
    }

    // Proposed Solution
    if (proposal.proposedSolution) {
      checkPageBreak(30);
      addSectionTitle('PROPOSED SOLUTION');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const solutionLines = doc.splitTextToSize(proposal.proposedSolution, pageWidth - 30);
      doc.text(solutionLines, 15, yPosition);
      yPosition += solutionLines.length * 5 + 10;
    }

    // Overall Goal
    if (proposal.overallGoal) {
      checkPageBreak(30);
      addSectionTitle('OVERALL GOAL');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const goalLines = doc.splitTextToSize(proposal.overallGoal, pageWidth - 30);
      doc.text(goalLines, 15, yPosition);
      yPosition += goalLines.length * 5 + 10;
    }

    // ======================================
    // OBJECTIVES
    // ======================================
    if (proposal.objectives && Array.isArray(proposal.objectives) && proposal.objectives.length > 0) {
      checkPageBreak(40);
      addSectionTitle('OBJECTIVES');

      proposal.objectives.forEach((obj, index) => {
        checkPageBreak(15);
        const objText = typeof obj === 'string' ? obj : obj.objective;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. `, 15, yPosition);

        doc.setFont('helvetica', 'normal');
        const objLines = doc.splitTextToSize(objText, pageWidth - 35);
        doc.text(objLines, 22, yPosition);
        yPosition += objLines.length * 5 + 5;
      });
      yPosition += 5;
    }

    // ======================================
    // KEY ACTIVITIES
    // ======================================
    if (proposal.keyActivities && Array.isArray(proposal.keyActivities) && proposal.keyActivities.length > 0) {
      checkPageBreak(40);
      addSectionTitle('KEY ACTIVITIES');

      proposal.keyActivities.forEach((activity, index) => {
        checkPageBreak(15);
        const actText = typeof activity === 'string' ? activity : activity.activity;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. `, 15, yPosition);

        doc.setFont('helvetica', 'normal');
        const actLines = doc.splitTextToSize(actText, pageWidth - 35);
        doc.text(actLines, 22, yPosition);
        yPosition += actLines.length * 5 + 5;
      });
      yPosition += 5;
    }

    // ======================================
    // BENEFICIARY BREAKDOWN
    // ======================================
    if (proposal.beneficiaryBreakdown) {
      checkPageBreak(50);
      addSectionTitle('BENEFICIARY BREAKDOWN');

      const beneficiaryData = [
        ['Direct Male', (proposal.beneficiaryBreakdown.directMale || 0).toLocaleString()],
        ['Direct Female', (proposal.beneficiaryBreakdown.directFemale || 0).toLocaleString()],
        ['Direct Children', (proposal.beneficiaryBreakdown.directChildren || 0).toLocaleString()],
        ['Persons with Disabilities', (proposal.beneficiaryBreakdown.directPWD || 0).toLocaleString()],
        ['Indirect Total', (proposal.beneficiaryBreakdown.indirectTotal || 0).toLocaleString()]
      ];

      autoTable(doc, {
        startY: yPosition,
        body: beneficiaryData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right', cellWidth: 'auto' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // ======================================
    // BUDGET BREAKDOWN
    // ======================================
    if (proposal.budgetBreakdown && Array.isArray(proposal.budgetBreakdown) && proposal.budgetBreakdown.length > 0) {
      checkPageBreak(60);
      addSectionTitle('BUDGET BREAKDOWN');

      const budgetTableData = proposal.budgetBreakdown.map(item => [
        item.category || item.budgetCategory || 'N/A',
        item.description || item.budgetDescription || '',
        `LKR ${(item.amount || item.totalCost || 0).toLocaleString()}`
      ]);

      // Add total row
      const totalBudget = proposal.budgetBreakdown.reduce((sum, item) =>
        sum + (item.amount || item.totalCost || 0), 0);
      budgetTableData.push(['TOTAL', '', `LKR ${totalBudget.toLocaleString()}`]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Category', 'Description', 'Amount']],
        body: budgetTableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontStyle: 'bold' },
        footStyles: { fillColor: secondaryColor, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 90 },
          2: { halign: 'right', cellWidth: 'auto' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // ======================================
    // MEAL RESULTS FRAMEWORK
    // ======================================
    if (proposal.resultsFramework && Array.isArray(proposal.resultsFramework) && proposal.resultsFramework.length > 0) {
      checkPageBreak(60);
      addSectionTitle('MEAL RESULTS FRAMEWORK');

      const mealTableData = proposal.resultsFramework.map(indicator => [
        indicator.name || indicator.indicator || 'Indicator',
        indicator.baseline || 0,
        indicator.target || 0,
        indicator.unit || 'Number'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Indicator', 'Baseline', 'Target', 'Unit']],
        body: mealTableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { halign: 'center', cellWidth: 30 },
          2: { halign: 'center', cellWidth: 30 },
          3: { halign: 'center', cellWidth: 'auto' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }
  }

  // ======================================
  // SIGNATURES & APPROVAL
  // ======================================
  checkPageBreak(60);
  addSectionTitle('APPROVALS & SIGNATURES');

  const signatureY = yPosition + 30;

  // Prepared by
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Prepared by:', 20, yPosition + 10);
  doc.line(20, signatureY, 90, signatureY);
  doc.setFontSize(9);
  doc.text('Fundraising Manager', 20, signatureY + 5);
  doc.text('Date: ______________', 20, signatureY + 12);

  // Approved by
  doc.setFontSize(10);
  doc.text('Approved by:', pageWidth / 2 + 10, yPosition + 10);
  doc.line(pageWidth / 2 + 10, signatureY, pageWidth / 2 + 80, signatureY);
  doc.setFontSize(9);
  doc.text('Executive Director / CEO', pageWidth / 2 + 10, signatureY + 5);
  doc.text('Date: ______________', pageWidth / 2 + 10, signatureY + 12);

  // Footer on each page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(
      `${proposal.proposalCode || 'Proposal'} - Confidential`,
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
  const fileName = `${proposal.proposalCode || 'Proposal'}_${type === 'full' ? 'Full' : 'Summary'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
