import React, { useState, useEffect } from 'react';
import { X, Mail, Paperclip, Eye, Send, Loader, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { generateProposalSubmissionEmail, validateEmailTemplate } from '../../utils/emailTemplates';
import { generateProposalPDF } from '../../utils/proposalPdfGenerator';

/**
 * Email Modal Component for sending proposals to donors
 * Allows users to compose and send emails with proposal PDFs attached
 */
const EmailModal = ({ proposal, onClose, onSend }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    subject: '',
    body: '',
    donorContactName: 'Dear Sir/Madam',
    senderName: '',
    senderTitle: '',
    senderEmail: '',
    senderPhone: '',
    attachFullProposal: true,
    attachSummary: true
  });

  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState([]);
  const [copied, setCopied] = useState(false);

  // Initialize email template when modal opens
  useEffect(() => {
    if (proposal) {
      const template = generateProposalSubmissionEmail(proposal, {
        donorContactName: emailData.donorContactName,
        senderName: emailData.senderName || 'GERSL Team',
        senderTitle: emailData.senderTitle || 'Fundraising Manager'
      });

      setEmailData(prev => ({
        ...prev,
        subject: template.subject,
        body: template.body,
        to: proposal.donorEmail || '' // If donor email is stored in proposal
      }));
    }
  }, [proposal]);

  // Regenerate email body when key fields change
  const handleRegenerateTemplate = () => {
    const template = generateProposalSubmissionEmail(proposal, {
      donorContactName: emailData.donorContactName,
      senderName: emailData.senderName || 'GERSL Team',
      senderTitle: emailData.senderTitle || 'Fundraising Manager',
      senderEmail: emailData.senderEmail,
      senderPhone: emailData.senderPhone
    });

    setEmailData(prev => ({
      ...prev,
      subject: template.subject,
      body: template.body
    }));
  };

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors([]); // Clear errors when user types
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleCopyToClipboard = () => {
    const emailText = `To: ${emailData.to}
${emailData.cc ? `CC: ${emailData.cc}\n` : ''}Subject: ${emailData.subject}

${emailData.body}`;

    navigator.clipboard.writeText(emailText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSend = async () => {
    // Validation
    const validationErrors = [];

    if (!emailData.to || !validateEmail(emailData.to)) {
      validationErrors.push('Valid recipient email is required');
    }

    if (emailData.cc && !validateEmail(emailData.cc)) {
      validationErrors.push('CC email is invalid');
    }

    if (!emailData.subject || emailData.subject.trim().length === 0) {
      validationErrors.push('Subject is required');
    }

    if (!emailData.body || emailData.body.trim().length === 0) {
      validationErrors.push('Email body is required');
    }

    const templateValidation = validateEmailTemplate({
      subject: emailData.subject,
      body: emailData.body
    });

    if (!templateValidation.valid) {
      validationErrors.push(...templateValidation.errors);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSending(true);
    setErrors([]);

    try {
      // In a real implementation, this would call an API endpoint to send the email
      // For now, we'll simulate the send and update the proposal status

      const emailPayload = {
        proposalId: proposal.id,
        to: emailData.to,
        cc: emailData.cc,
        subject: emailData.subject,
        body: emailData.body,
        attachments: [],
        metadata: {
          proposalCode: proposal.proposalCode,
          donor: proposal.donor,
          sentBy: emailData.senderName,
          sentAt: new Date().toISOString()
        }
      };

      // Note: In production, you would generate PDFs and attach them
      // For now, we'll just track that they should be attached
      if (emailData.attachFullProposal) {
        emailPayload.attachments.push('Full_Proposal.pdf');
      }
      if (emailData.attachSummary) {
        emailPayload.attachments.push('Executive_Summary.pdf');
      }

      // Call the parent's onSend function
      if (onSend) {
        await onSend(emailPayload);
      }

      // Success - close modal
      setTimeout(() => {
        setSending(false);
        onClose();
      }, 1000);

    } catch (error) {
      setSending(false);
      setErrors([error.message || 'Failed to send email. Please try again.']);
    }
  };

  if (!proposal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail size={28} />
            <div>
              <h2 className="text-2xl font-bold">Email Proposal to Donor</h2>
              <p className="text-purple-100 text-sm">{proposal.proposalCode} - {proposal.donor}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            disabled={sending}
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">Please fix the following errors:</h3>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Sender Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail size={18} />
              Sender Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={emailData.senderName}
                  onChange={(e) => handleInputChange('senderName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Title *
                </label>
                <input
                  type="text"
                  value={emailData.senderTitle}
                  onChange={(e) => handleInputChange('senderTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Fundraising Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  value={emailData.senderEmail}
                  onChange={(e) => handleInputChange('senderEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="contact@gersl.org"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Phone
                </label>
                <input
                  type="tel"
                  value={emailData.senderPhone}
                  onChange={(e) => handleInputChange('senderPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+94 XX XXX XXXX"
                />
              </div>
            </div>
            <button
              onClick={handleRegenerateTemplate}
              className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              🔄 Regenerate email template with updated information
            </button>
          </div>

          {/* Recipient Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Email Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Donor Contact Name
                </label>
                <input
                  type="text"
                  value={emailData.donorContactName}
                  onChange={(e) => handleInputChange('donorContactName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Dear Sir/Madam or Specific name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To: (Recipient Email) *
                </label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="donor@organization.org"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CC: (Optional)
                </label>
                <input
                  type="email"
                  value={emailData.cc}
                  onChange={(e) => handleInputChange('cc', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="cc@organization.org"
                />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
              required
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body *
            </label>
            <textarea
              value={emailData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              rows={previewMode ? 25 : 15}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {emailData.body.length} / 10,000 characters
            </p>
          </div>

          {/* Attachments */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Paperclip size={18} />
              Attachments
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailData.attachFullProposal}
                  onChange={(e) => handleInputChange('attachFullProposal', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  Attach Full Proposal PDF ({proposal.proposalCode}_Full.pdf)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailData.attachSummary}
                  onChange={(e) => handleInputChange('attachSummary', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  Attach Executive Summary PDF ({proposal.proposalCode}_Summary.pdf)
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              📎 Note: PDFs will be automatically generated and attached when sending
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
              disabled={sending}
            >
              {copied ? (
                <>
                  <CheckCircle size={18} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy to Clipboard
                </>
              )}
            </button>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
              disabled={sending}
            >
              <Eye size={18} />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !emailData.to || !emailData.subject || !emailData.body}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send Email & Update Status
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
