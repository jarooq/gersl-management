/**
 * Email Templates for Proposal Submission
 * Professional email templates for communicating with donors
 */

/**
 * Generate email template for proposal submission to donor
 * @param {Object} proposal - The proposal object
 * @param {Object} options - Additional options (cc, attachments, etc.)
 * @returns {Object} Email template with subject, body, and metadata
 */
export const generateProposalSubmissionEmail = (proposal, options = {}) => {
  const {
    donorContactName = 'Dear Sir/Madam',
    organizationName = 'Global Ehsan Relief - Sri Lanka',
    senderName = options.senderName || 'Global Ehsan Relief - Sri Lanka Team',
    senderTitle = options.senderTitle || 'Fundraising Manager',
    customMessage = ''
  } = options;

  // Format budget with commas
  const formattedBudget = (proposal.budgetRequested || 0).toLocaleString('en-US');

  // Format dates
  const startDate = proposal.startDate
    ? new Date(proposal.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'TBD';
  const endDate = proposal.endDate
    ? new Date(proposal.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'TBD';

  const subject = `Proposal Submission: ${proposal.title} (${proposal.proposalCode})`;

  const body = `
${donorContactName},

We hope this email finds you well.

On behalf of ${organizationName}, we are pleased to submit our proposal for your consideration. We believe this initiative aligns with your organization's mission and presents a valuable opportunity for partnership.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PROPOSAL OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project Title: ${proposal.title}
Proposal Code: ${proposal.proposalCode}
Programme Area: ${proposal.programmeArea || 'N/A'}

Funding Requested: LKR ${formattedBudget}
Target Beneficiaries: ${(proposal.targetBeneficiaries || 0).toLocaleString()} people
Project Duration: ${proposal.duration || 'N/A'}
Proposed Timeline: ${startDate} - ${endDate}

${proposal.district && Array.isArray(proposal.district) && proposal.district.length > 0
  ? `Target Districts: ${proposal.district.join(', ')}\n`
  : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${proposal.summary ? `
PROJECT SUMMARY:
${proposal.summary}
` : ''}

${customMessage ? `
${customMessage}

` : ''}
ATTACHED DOCUMENTS:
• Full Proposal Document (PDF)
• Executive Summary (PDF)
${options.additionalAttachments ? options.additionalAttachments.map(att => `• ${att}`).join('\n') : ''}

We would be delighted to discuss this proposal further at your convenience. Please do not hesitate to contact us if you require any additional information or clarification.

We look forward to the possibility of partnering with your esteemed organization to make a positive impact in the communities we serve.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Warm regards,

${senderName}
${senderTitle}
${organizationName}

Email: ${options.senderEmail || 'contact@gersl.org'}
Phone: ${options.senderPhone || '+94 XX XXX XXXX'}
Website: www.gersl.org

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This proposal is submitted in response to your organization's funding priorities.
Please refer to the attached documents for comprehensive details.

Confidential: This document contains proprietary information intended only for the recipient.
`;

  return {
    subject,
    body: body.trim(),
    metadata: {
      proposalId: proposal.id,
      proposalCode: proposal.proposalCode,
      donor: proposal.donor,
      submittedDate: new Date().toISOString(),
      priority: proposal.priority || 'Medium'
    }
  };
};

/**
 * Generate follow-up email template
 * @param {Object} proposal - The proposal object
 * @param {Object} options - Additional options
 * @returns {Object} Email template
 */
export const generateFollowUpEmail = (proposal, options = {}) => {
  const {
    donorContactName = 'Dear Sir/Madam',
    organizationName = 'Global Ehsan Relief - Sri Lanka',
    senderName = options.senderName || 'Global Ehsan Relief - Sri Lanka Team',
    daysSinceSubmission = 14
  } = options;

  const subject = `Follow-up: ${proposal.title} (${proposal.proposalCode})`;

  const body = `
${donorContactName},

We hope this message finds you well.

We are following up on our proposal submission for "${proposal.title}" (${proposal.proposalCode}), which we submitted ${daysSinceSubmission} days ago.

We understand that reviewing proposals takes time, and we appreciate your careful consideration. We wanted to check if you require any additional information or clarification that might assist in your review process.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROPOSAL HIGHLIGHTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Funding Requested: LKR ${(proposal.budgetRequested || 0).toLocaleString()}
• Target Beneficiaries: ${(proposal.targetBeneficiaries || 0).toLocaleString()} people
• Programme Area: ${proposal.programmeArea || 'N/A'}
• Priority: ${proposal.priority || 'Medium'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We remain committed to this initiative and are ready to address any questions or concerns you may have. We would be happy to schedule a call or meeting at your convenience to discuss the proposal in more detail.

Thank you for your time and consideration.

Warm regards,

${senderName}
${organizationName}

Email: ${options.senderEmail || 'contact@gersl.org'}
Phone: ${options.senderPhone || '+94 XX XXX XXXX'}
`;

  return {
    subject,
    body: body.trim(),
    metadata: {
      proposalId: proposal.id,
      proposalCode: proposal.proposalCode,
      emailType: 'follow_up',
      followUpNumber: options.followUpNumber || 1
    }
  };
};

/**
 * Generate thank you email after donor approval
 * @param {Object} proposal - The proposal object
 * @param {Object} options - Additional options
 * @returns {Object} Email template
 */
export const generateThankYouEmail = (proposal, options = {}) => {
  const {
    donorContactName = 'Dear Sir/Madam',
    organizationName = 'Global Ehsan Relief - Sri Lanka',
    senderName = options.senderName || 'Global Ehsan Relief - Sri Lanka Team',
    senderTitle = options.senderTitle || 'Executive Director'
  } = options;

  const subject = `Thank You: ${proposal.title} - Partnership Confirmation`;

  const body = `
${donorContactName},

On behalf of ${organizationName} and the communities we serve, we would like to express our heartfelt gratitude for approving our proposal "${proposal.title}" (${proposal.proposalCode}).

Your support will enable us to:
• Reach ${(proposal.targetBeneficiaries || 0).toLocaleString()} beneficiaries
• Implement meaningful change in ${proposal.programmeArea || 'our target communities'}
• Create sustainable impact through our programmes

We are committed to:
✓ Maintaining transparent communication throughout the project
✓ Providing regular progress updates and reports
✓ Ensuring effective utilization of resources
✓ Achieving the intended outcomes and impact

Our team will begin the project initiation process and will keep you informed of our progress. We will share a detailed implementation plan and reporting schedule within the next [X] days.

Once again, thank you for your trust and partnership. Together, we will make a significant difference in the lives of those we serve.

With sincere appreciation,

${senderName}
${senderTitle}
${organizationName}

Email: ${options.senderEmail || 'contact@gersl.org'}
Phone: ${options.senderPhone || '+94 XX XXX XXXX'}
`;

  return {
    subject,
    body: body.trim(),
    metadata: {
      proposalId: proposal.id,
      proposalCode: proposal.proposalCode,
      emailType: 'thank_you',
      donor: proposal.donor
    }
  };
};

/**
 * Preview email in plain text format
 * @param {Object} emailTemplate - Email template object
 * @returns {String} Formatted preview
 */
export const previewEmail = (emailTemplate) => {
  return `
Subject: ${emailTemplate.subject}

${emailTemplate.body}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Metadata: ${JSON.stringify(emailTemplate.metadata, null, 2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
};

/**
 * Validate email template
 * @param {Object} emailTemplate - Email template to validate
 * @returns {Object} Validation result
 */
export const validateEmailTemplate = (emailTemplate) => {
  const errors = [];

  if (!emailTemplate.subject || emailTemplate.subject.trim().length === 0) {
    errors.push('Subject is required');
  }

  if (!emailTemplate.body || emailTemplate.body.trim().length === 0) {
    errors.push('Email body is required');
  }

  if (emailTemplate.subject && emailTemplate.subject.length > 200) {
    errors.push('Subject is too long (max 200 characters)');
  }

  if (emailTemplate.body && emailTemplate.body.length > 10000) {
    errors.push('Email body is too long (max 10,000 characters)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  generateProposalSubmissionEmail,
  generateFollowUpEmail,
  generateThankYouEmail,
  previewEmail,
  validateEmailTemplate
};
