/**
 * Report Templates
 * Defines templates for different report types with AI prompts
 */

export const REPORT_TYPES = {
  DONOR_REPORT: 'DONOR_REPORT',
  PROGRESS_REPORT: 'PROGRESS_REPORT',
  COMPLETION_REPORT: 'COMPLETION_REPORT',
  FINANCIAL_REPORT: 'FINANCIAL_REPORT',
  IMPACT_REPORT: 'IMPACT_REPORT',
  QUARTERLY_REPORT: 'QUARTERLY_REPORT',
  ANNUAL_REPORT: 'ANNUAL_REPORT',
  PROPOSAL_NARRATIVE: 'PROPOSAL_NARRATIVE'
};

export const REPORT_TEMPLATES = {
  DONOR_REPORT: {
    name: 'Donor Report',
    description: 'Comprehensive report for donor reporting requirements',
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        prompt: 'Write an executive summary highlighting key achievements, challenges, and impact.',
        required: true
      },
      {
        id: 'project_overview',
        title: 'Project Overview',
        prompt: 'Provide a detailed overview of the project including objectives, target beneficiaries, and timeline.',
        required: true
      },
      {
        id: 'activities_implemented',
        title: 'Activities Implemented',
        prompt: 'Describe the activities completed during the reporting period with specific details and outcomes.',
        required: true
      },
      {
        id: 'beneficiary_data',
        title: 'Beneficiary Reach',
        prompt: 'Present beneficiary data with demographic breakdown and comparison to targets.',
        required: true
      },
      {
        id: 'financial_summary',
        title: 'Financial Summary',
        prompt: 'Provide budget utilization, expenditure breakdown, and financial variance analysis.',
        required: true
      },
      {
        id: 'challenges',
        title: 'Challenges & Mitigation',
        prompt: 'Discuss challenges faced and mitigation strategies employed.',
        required: false
      },
      {
        id: 'lessons_learned',
        title: 'Lessons Learned',
        prompt: 'Share key learnings and best practices from project implementation.',
        required: false
      },
      {
        id: 'next_steps',
        title: 'Next Steps',
        prompt: 'Outline planned activities for the next reporting period.',
        required: true
      }
    ]
  },

  PROGRESS_REPORT: {
    name: 'Progress Report',
    description: 'Monthly or quarterly progress update',
    sections: [
      {
        id: 'reporting_period',
        title: 'Reporting Period',
        prompt: 'Specify the reporting period and project status.',
        required: true
      },
      {
        id: 'progress_summary',
        title: 'Progress Summary',
        prompt: 'Summarize overall progress against project plan and timeline.',
        required: true
      },
      {
        id: 'activities_update',
        title: 'Activities Update',
        prompt: 'Detail activities completed, in progress, and planned.',
        required: true
      },
      {
        id: 'milestone_tracking',
        title: 'Milestone Achievement',
        prompt: 'Report on milestone achievement and any delays.',
        required: true
      },
      {
        id: 'budget_status',
        title: 'Budget Status',
        prompt: 'Provide current budget utilization and burn rate.',
        required: true
      },
      {
        id: 'risks_issues',
        title: 'Risks & Issues',
        prompt: 'Identify current risks and issues with mitigation plans.',
        required: false
      }
    ]
  },

  COMPLETION_REPORT: {
    name: 'Project Completion Report',
    description: 'Final report upon project completion',
    sections: [
      {
        id: 'project_summary',
        title: 'Project Summary',
        prompt: 'Provide comprehensive project summary including all objectives and outcomes.',
        required: true
      },
      {
        id: 'objectives_achieved',
        title: 'Objectives Achievement',
        prompt: 'Analyze achievement of project objectives with evidence.',
        required: true
      },
      {
        id: 'total_beneficiaries',
        title: 'Total Beneficiaries Reached',
        prompt: 'Present final beneficiary numbers with demographic breakdown and impact stories.',
        required: true
      },
      {
        id: 'final_financial',
        title: 'Final Financial Report',
        prompt: 'Provide final financial statement with complete budget vs actual analysis.',
        required: true
      },
      {
        id: 'impact_assessment',
        title: 'Impact Assessment',
        prompt: 'Assess the overall impact and sustainability of project outcomes.',
        required: true
      },
      {
        id: 'success_factors',
        title: 'Success Factors',
        prompt: 'Identify key success factors and enabling conditions.',
        required: false
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        prompt: 'Provide recommendations for future similar projects.',
        required: true
      }
    ]
  },

  FINANCIAL_REPORT: {
    name: 'Financial Report',
    description: 'Detailed financial analysis and budget tracking',
    sections: [
      {
        id: 'budget_overview',
        title: 'Budget Overview',
        prompt: 'Present total budget, expenditure, and remaining balance.',
        required: true
      },
      {
        id: 'expenditure_breakdown',
        title: 'Expenditure by Category',
        prompt: 'Break down expenditure by budget line items.',
        required: true
      },
      {
        id: 'variance_analysis',
        title: 'Variance Analysis',
        prompt: 'Analyze variances between budgeted and actual spending.',
        required: true
      },
      {
        id: 'co_funding',
        title: 'Co-funding & Leveraging',
        prompt: 'Report on co-funding secured and resource leveraging.',
        required: false
      },
      {
        id: 'financial_controls',
        title: 'Financial Controls',
        prompt: 'Describe financial management and control measures.',
        required: false
      }
    ]
  },

  IMPACT_REPORT: {
    name: 'Impact Report',
    description: 'Assessment of project impact and outcomes',
    sections: [
      {
        id: 'impact_overview',
        title: 'Impact Overview',
        prompt: 'Provide high-level summary of project impact.',
        required: true
      },
      {
        id: 'outcome_indicators',
        title: 'Outcome Indicators',
        prompt: 'Present data on outcome indicators with baseline and endline comparison.',
        required: true
      },
      {
        id: 'case_studies',
        title: 'Success Stories & Case Studies',
        prompt: 'Share compelling success stories and beneficiary testimonials.',
        required: true
      },
      {
        id: 'sustainability',
        title: 'Sustainability Assessment',
        prompt: 'Assess sustainability of project outcomes and interventions.',
        required: true
      },
      {
        id: 'unintended_outcomes',
        title: 'Unintended Outcomes',
        prompt: 'Report any positive or negative unintended outcomes.',
        required: false
      }
    ]
  },

  PROPOSAL_NARRATIVE: {
    name: 'Proposal Narrative',
    description: 'Project proposal narrative for funding applications',
    sections: [
      {
        id: 'problem_statement',
        title: 'Problem Statement',
        prompt: 'Articulate the problem or need being addressed with supporting data.',
        required: true
      },
      {
        id: 'proposed_solution',
        title: 'Proposed Solution',
        prompt: 'Describe the proposed intervention and approach.',
        required: true
      },
      {
        id: 'objectives_outcomes',
        title: 'Objectives & Expected Outcomes',
        prompt: 'Define clear objectives and expected outcomes with indicators.',
        required: true
      },
      {
        id: 'methodology',
        title: 'Methodology & Approach',
        prompt: 'Explain the methodology and implementation approach.',
        required: true
      },
      {
        id: 'target_beneficiaries',
        title: 'Target Beneficiaries',
        prompt: 'Describe target beneficiary groups with numbers and demographics.',
        required: true
      },
      {
        id: 'sustainability_plan',
        title: 'Sustainability Plan',
        prompt: 'Outline sustainability strategy and exit plan.',
        required: true
      },
      {
        id: 'organizational_capacity',
        title: 'Organizational Capacity',
        prompt: 'Demonstrate organizational capacity to implement the project.',
        required: false
      }
    ]
  }
};

/**
 * Generate AI prompt for report section
 * @param {Object} project - Project data
 * @param {Object} proposal - Proposal data (optional)
 * @param {string} reportType - Report type
 * @param {string} sectionId - Section ID
 * @param {Object} additionalData - Additional context data
 * @returns {string} AI prompt
 */
export const generateSectionPrompt = (project, proposal, reportType, sectionId, additionalData = {}) => {
  const template = REPORT_TEMPLATES[reportType];
  if (!template) return '';

  const section = template.sections.find(s => s.id === sectionId);
  if (!section) return '';

  // Build context from project data
  const context = {
    projectName: project?.name || 'Project',
    donor: project?.donor || proposal?.donor || 'N/A',
    programmeArea: project?.programmeArea || proposal?.programmeArea || 'N/A',
    budget: project?.budget || proposal?.budgetRequested || 0,
    spent: project?.spent || 0,
    startDate: project?.startDate || proposal?.startDate || 'N/A',
    endDate: project?.endDate || proposal?.endDate || 'N/A',
    targetBeneficiaries: project?.targetBeneficiaries || proposal?.targetBeneficiaries || 0,
    actualBeneficiaries: project?.beneficiaries || 0,
    location: project?.location || proposal?.location || 'N/A',
    progress: project?.progress || 0,
    status: project?.status || 'Planning',
    tasks: project?.tasks || [],
    completedTasks: project?.tasks?.filter(t => t.status === 'Completed')?.length || 0,
    totalTasks: project?.tasks?.length || 0,
    ...additionalData
  };

  // Build comprehensive AI prompt
  const prompt = `You are writing the "${section.title}" section for a ${template.name}.

PROJECT CONTEXT:
- Project Name: ${context.projectName}
- Donor: ${context.donor}
- Programme Area: ${context.programmeArea}
- Budget: $${context.budget.toLocaleString()}
- Amount Spent: $${context.spent.toLocaleString()}
- Remaining: $${(context.budget - context.spent).toLocaleString()}
- Period: ${context.startDate} to ${context.endDate}
- Target Beneficiaries: ${context.targetBeneficiaries}
- Actual Beneficiaries Reached: ${context.actualBeneficiaries}
- Location: ${context.location}
- Progress: ${context.progress}%
- Status: ${context.status}
- Tasks Completed: ${context.completedTasks} of ${context.totalTasks}

SECTION REQUIREMENTS:
${section.prompt}

Please write a professional, compelling, and data-driven ${section.title} section that:
1. Uses specific numbers and evidence from the project data above
2. Follows donor reporting standards and best practices
3. Is clear, concise, and well-structured
4. Highlights achievements and impact where relevant
5. Addresses challenges honestly with solutions
6. Is written in professional third-person narrative style
7. Uses proper formatting with paragraphs and bullet points where appropriate

Write the content now:`;

  return prompt;
};

/**
 * Extract data for report from project
 * @param {Object} project - Project object
 * @returns {Object} Extracted report data
 */
export const extractReportData = (project) => {
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const overdueTasks = tasks.filter(t => {
    const today = new Date().toISOString().split('T')[0];
    return t.deadline && t.deadline < today && t.status !== 'Completed' && t.status !== 'Cancelled';
  });

  return {
    projectInfo: {
      name: project.name,
      code: project.code,
      donor: project.donor,
      programmeArea: project.programmeArea,
      location: project.location,
      budget: project.budget,
      spent: project.spent,
      remaining: project.budget - project.spent,
      utilizationRate: ((project.spent / project.budget) * 100).toFixed(1),
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      progress: project.progress
    },
    beneficiaryData: {
      target: project.targetBeneficiaries,
      reached: project.beneficiaries,
      percentageReached: project.targetBeneficiaries ?
        ((project.beneficiaries / project.targetBeneficiaries) * 100).toFixed(1) : 0,
      breakdown: project.beneficiaryBreakdown || {}
    },
    taskMetrics: {
      total: tasks.length,
      completed: completedTasks.length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      overdue: overdueTasks.length,
      completionRate: tasks.length ? ((completedTasks.length / tasks.length) * 100).toFixed(1) : 0
    },
    budgetBreakdown: {
      total: project.budget,
      spent: project.spent,
      remaining: project.budget - project.spent,
      utilizationPercentage: ((project.spent / project.budget) * 100).toFixed(1),
      budgetChanges: project.budgetChangeRequests || []
    },
    mealData: {
      resultsFramework: project.resultsFramework || [],
      indicatorProgress: project.indicatorProgress || [],
      cfmLog: project.cfmLog || [],
      fieldMonitoring: project.fieldMonitoring || [],
      learningLog: project.learningLog || []
    },
    completionData: project.completionDocumentation || null
  };
};

/**
 * Format report data for display/export
 * @param {Object} reportData - Report data with sections
 * @param {string} format - Output format ('html', 'markdown', 'plain')
 * @returns {string} Formatted report
 */
export const formatReport = (reportData, format = 'html') => {
  const { metadata, sections } = reportData;

  if (format === 'markdown') {
    let output = `# ${metadata.title}\n\n`;
    output += `**Report Type:** ${metadata.reportType}\n`;
    output += `**Project:** ${metadata.projectName}\n`;
    output += `**Generated:** ${new Date(metadata.generatedDate).toLocaleDateString()}\n`;
    output += `**Generated By:** ${metadata.generatedBy}\n\n`;
    output += `---\n\n`;

    sections.forEach(section => {
      output += `## ${section.title}\n\n`;
      output += `${section.content}\n\n`;
    });

    return output;
  }

  if (format === 'html') {
    let output = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${metadata.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
    .metadata { background: #f1f5f9; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
    .metadata p { margin: 5px 0; }
    .section { margin-bottom: 25px; }
    ul, ol { margin: 10px 0; padding-left: 25px; }
    @media print { body { margin: 0; padding: 20px; } }
  </style>
</head>
<body>
  <h1>${metadata.title}</h1>
  <div class="metadata">
    <p><strong>Report Type:</strong> ${metadata.reportType}</p>
    <p><strong>Project:</strong> ${metadata.projectName}</p>
    <p><strong>Donor:</strong> ${metadata.donor || 'N/A'}</p>
    <p><strong>Reporting Period:</strong> ${metadata.reportingPeriod || 'N/A'}</p>
    <p><strong>Generated:</strong> ${new Date(metadata.generatedDate).toLocaleDateString()}</p>
    <p><strong>Generated By:</strong> ${metadata.generatedBy}</p>
  </div>
`;

    sections.forEach(section => {
      output += `  <div class="section">
    <h2>${section.title}</h2>
    ${section.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('\n')}
  </div>
`;
    });

    output += `</body>\n</html>`;
    return output;
  }

  // Plain text format
  let output = `${metadata.title}\n${'='.repeat(metadata.title.length)}\n\n`;
  output += `Report Type: ${metadata.reportType}\n`;
  output += `Project: ${metadata.projectName}\n`;
  output += `Generated: ${new Date(metadata.generatedDate).toLocaleDateString()}\n`;
  output += `Generated By: ${metadata.generatedBy}\n\n`;
  output += `${'-'.repeat(50)}\n\n`;

  sections.forEach(section => {
    output += `${section.title}\n${'-'.repeat(section.title.length)}\n\n`;
    output += `${section.content}\n\n`;
  });

  return output;
};

export default {
  REPORT_TYPES,
  REPORT_TEMPLATES,
  generateSectionPrompt,
  extractReportData,
  formatReport
};
