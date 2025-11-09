import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Clock, DollarSign, Calendar, ArrowLeft, CheckCircle, User, Mail, Phone, FileText, Upload } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { jobPostings } = useCampaign();

  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resume: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const job = jobPostings.find(j => j.id === parseInt(id));

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Briefcase className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The position you're looking for doesn't exist or has been filled.</p>
          <Link to="/careers" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  const deadline = new Date(job.applicationDeadline);
  const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
  const isDeadlinePassed = daysLeft < 0;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      setApplicationData({ ...applicationData, resume: file });
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // In a real application, this would upload the resume and submit the application
      // For now, we'll just simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Application submitted:', {
        jobId: job.id,
        jobTitle: job.title,
        ...applicationData
      });

      setSubmitted(true);
      setTimeout(() => {
        navigate('/careers');
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
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
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying to {job.title}. We'll review your application and get back to you soon.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting you back to careers...
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
            to="/careers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Careers
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="text-white" size={32} />
              </div>
              <div className="flex-1">
                <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-3">
                  {job.department}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{job.title}</h1>
              </div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Clock size={20} className="mb-2" />
                <p className="text-sm text-blue-100 mb-1">Type</p>
                <p className="font-semibold">{job.employmentType}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <MapPin size={20} className="mb-2" />
                <p className="text-sm text-blue-100 mb-1">Location</p>
                <p className="font-semibold">{job.location}</p>
              </div>
              {job.salaryRange && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <DollarSign size={20} className="mb-2" />
                  <p className="text-sm text-blue-100 mb-1">Salary</p>
                  <p className="font-semibold">{job.salaryRange}</p>
                </div>
              )}
              <div className={`backdrop-blur-sm rounded-xl p-4 border ${isDeadlinePassed ? 'bg-red-500/20 border-red-300' : 'bg-white/10 border-white/20'}`}>
                <Calendar size={20} className="mb-2" />
                <p className="text-sm text-blue-100 mb-1">Deadline</p>
                <p className="font-semibold">{daysLeft > 0 ? `${daysLeft} days left` : 'Closed'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Job Description</h3>
              <div className="prose max-w-none text-gray-600">
                <p>{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Requirements</h3>
                <ul className="space-y-3">
                  {job.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-600">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Responsibilities</h3>
                <ul className="space-y-3">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-600">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Additional Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Posted Date</p>
                    <p className="text-gray-600">{new Date(job.postedDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Application Deadline</p>
                    <p className="text-gray-600">{deadline.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Department</p>
                    <p className="text-gray-600">{job.department}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Application Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Apply for This Position</h3>
                  {isDeadlinePassed ? (
                    <p className="text-red-600 text-sm font-semibold">Applications Closed</p>
                  ) : (
                    <p className="text-gray-600 text-sm">Submit your application today</p>
                  )}
                </div>

                {!isDeadlinePassed && !showApplicationForm ? (
                  <div>
                    <button
                      onClick={() => setShowApplicationForm(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Start Application
                    </button>
                  </div>
                ) : !isDeadlinePassed ? (
                  <form onSubmit={handleApplicationSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={applicationData.fullName}
                          onChange={(e) => setApplicationData({...applicationData, fullName: e.target.value})}
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
                          value={applicationData.email}
                          onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                          placeholder="john@example.com"
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
                          value={applicationData.phone}
                          onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                          placeholder="+94 71 234 5678"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cover Letter *
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                        <textarea
                          value={applicationData.coverLetter}
                          onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                          placeholder="Tell us why you're a great fit for this position..."
                          rows={6}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Resume/CV * (PDF, max 5MB)
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          required
                        />
                        <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                        {applicationData.resume ? (
                          <p className="text-sm text-green-600 font-semibold">{applicationData.resume.name}</p>
                        ) : (
                          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowApplicationForm(false)}
                      className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-600">This position is no longer accepting applications.</p>
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

export default JobDetailPage;
