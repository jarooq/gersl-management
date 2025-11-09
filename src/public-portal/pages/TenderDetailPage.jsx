import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FileText, Calendar, DollarSign, ArrowLeft, CheckCircle, User, Mail, Phone, Upload, Building } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';

const TenderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vendorCalls } = useCampaign();

  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    proposedAmount: '',
    coverLetter: '',
    documents: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const tender = vendorCalls.find(t => t.id === parseInt(id));

  if (!tender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tender Not Found</h2>
          <p className="text-gray-600 mb-6">The tender you're looking for doesn't exist or has been closed.</p>
          <Link to="/tenders" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Tenders
          </Link>
        </div>
      </div>
    );
  }

  const deadline = new Date(tender.submissionDeadline);
  const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
  const isDeadlinePassed = daysLeft < 0;

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
      if (totalSize > 10 * 1024 * 1024) { // 10MB total limit
        alert('Total file size must be less than 10MB');
        return;
      }
      setProposalData({ ...proposalData, documents: files });
    }
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // In a real application, this would upload documents and submit the proposal
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Proposal submitted:', {
        tenderId: tender.id,
        tenderTitle: tender.title,
        ...proposalData
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate('/tenders');
      }, 3000);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Failed to submit proposal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Proposal Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for submitting your proposal for {tender.title}. Our procurement team will review it and contact you soon.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting you back to tenders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/tenders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Tenders
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="text-white" size={32} />
              </div>
              <div className="flex-1">
                <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-3">
                  {tender.category}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{tender.title}</h1>
                <p className="text-lg text-blue-100">Reference: {tender.referenceNumber}</p>
              </div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tender.estimatedValue && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <DollarSign size={20} className="mb-2" />
                  <p className="text-sm text-blue-100 mb-1">Est. Value</p>
                  <p className="font-semibold">${tender.estimatedValue.toLocaleString()}</p>
                </div>
              )}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Calendar size={20} className="mb-2" />
                <p className="text-sm text-blue-100 mb-1">Published</p>
                <p className="font-semibold">{new Date(tender.publishDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Calendar size={20} className="mb-2" />
                <p className="text-sm text-blue-100 mb-1">Deadline</p>
                <p className="font-semibold">{deadline.toLocaleDateString()}</p>
              </div>
              <div className={`backdrop-blur-sm rounded-xl p-4 border ${isDeadlinePassed ? 'bg-red-500/20 border-red-300' : 'bg-white/10 border-white/20'}`}>
                <Calendar size={20} className="mb-2" />
                <p className="text-sm text-blue-100 mb-1">Time Left</p>
                <p className="font-semibold">{daysLeft > 0 ? `${daysLeft} days` : 'Closed'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tender Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tender Description */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Tender Description</h3>
              <div className="prose max-w-none text-gray-600">
                <p>{tender.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {tender.requirements && tender.requirements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Requirements</h3>
                <ul className="space-y-3">
                  {tender.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-600">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {tender.specifications && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Technical Specifications</h3>
                <div className="prose max-w-none text-gray-600">
                  <p>{tender.specifications}</p>
                </div>
              </div>
            )}

            {/* Evaluation Criteria */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Evaluation Criteria</h3>
              <div className="space-y-3">
                {[
                  { criteria: 'Technical Capability', weight: '40%' },
                  { criteria: 'Pricing', weight: '30%' },
                  { criteria: 'Experience & References', weight: '20%' },
                  { criteria: 'Delivery Timeline', weight: '10%' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{item.criteria}</span>
                    <span className="font-semibold text-blue-600">{item.weight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Additional Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Reference Number</p>
                    <p className="text-gray-600">{tender.referenceNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Submission Deadline</p>
                    <p className="text-gray-600">{deadline.toLocaleDateString()} at {deadline.toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Category</p>
                    <p className="text-gray-600">{tender.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Proposal Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Submit Proposal</h3>
                  {isDeadlinePassed ? (
                    <p className="text-red-600 text-sm font-semibold">Submissions Closed</p>
                  ) : (
                    <p className="text-gray-600 text-sm">Respond to this tender</p>
                  )}
                </div>

                {!isDeadlinePassed && !showProposalForm ? (
                  <div>
                    <button
                      onClick={() => setShowProposalForm(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Start Proposal
                    </button>
                  </div>
                ) : !isDeadlinePassed ? (
                  <form onSubmit={handleProposalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={proposalData.companyName}
                          onChange={(e) => setProposalData({...proposalData, companyName: e.target.value})}
                          placeholder="ABC Corporation"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Person *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={proposalData.contactPerson}
                          onChange={(e) => setProposalData({...proposalData, contactPerson: e.target.value})}
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          value={proposalData.email}
                          onChange={(e) => setProposalData({...proposalData, email: e.target.value})}
                          placeholder="contact@company.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="tel"
                          value={proposalData.phone}
                          onChange={(e) => setProposalData({...proposalData, phone: e.target.value})}
                          placeholder="+94 71 234 5678"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Proposed Amount (USD) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="number"
                          value={proposalData.proposedAmount}
                          onChange={(e) => setProposalData({...proposalData, proposedAmount: e.target.value})}
                          placeholder="10000"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cover Letter *
                      </label>
                      <textarea
                        value={proposalData.coverLetter}
                        onChange={(e) => setProposalData({...proposalData, coverLetter: e.target.value})}
                        placeholder="Describe your approach and why you're the best fit..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Supporting Documents * (PDF, max 10MB total)
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          multiple
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          required
                        />
                        <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                        {proposalData.documents ? (
                          <p className="text-sm text-green-600 font-semibold">{proposalData.documents.length} file(s) selected</p>
                        ) : (
                          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Include company profile, certifications, and references</p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Proposal'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowProposalForm(false)}
                      className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-600">This tender is no longer accepting proposals.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TenderDetailPage;
