import React, { useState } from 'react';
import { X, FileText, Calendar, DollarSign, Users, Target, CheckCircle, TrendingUp, AlertCircle, Download } from 'lucide-react';

const ProjectCompletionReport = ({ isOpen, onClose, project, onSubmit }) => {
  const [formData, setFormData] = useState({
    completionDate: new Date().toISOString().split('T')[0],
    actualBeneficiaries: project?.beneficiaries || 0,
    actualSpent: project?.spent || 0,
    achievedObjectives: '',
    challenges: '',
    lessonsLearned: '',
    sustainability: '',
    recommendations: '',
    impactSummary: '',
    successStories: '',
    photosDocumentation: '',
    budgetVarianceExplanation: '',
    beneficiaryFeedback: '',
    partnerContribution: '',
    futureActions: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const reportData = {
      ...formData,
      projectId: project.id,
      projectName: project.name,
      programmeArea: project.programmeArea,
      donor: project.donor,
      startDate: project.startDate,
      endDate: project.endDate,
      plannedBudget: project.budget,
      targetBeneficiaries: project.targetBeneficiaries,
      location: project.location,
      generatedDate: new Date().toISOString(),
      reportStatus: 'Draft'
    };

    onSubmit(reportData);
    onClose();
  };

  const handleGeneratePDF = () => {
    // PDF generation logic will go here
    alert('PDF generation feature coming soon!');
  };

  if (!isOpen || !project) return null;

  const budgetUtilization = ((formData.actualSpent / project.budget) * 100).toFixed(1);
  const beneficiaryAchievement = ((formData.actualBeneficiaries / project.targetBeneficiaries) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Project Completion Report (Annex D)</h2>
              </div>
              <p className="text-green-100 mt-2">{project.name}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="bg-green-700 px-3 py-1 rounded-full">{project.programmeArea}</span>
                <span className="bg-green-700 px-3 py-1 rounded-full">{project.donor}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGeneratePDF}
                className="p-2 hover:bg-green-700 rounded-lg transition flex items-center gap-2"
                title="Download PDF"
              >
                <Download size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-green-700 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Section 1: Project Information Summary */}
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-green-600">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-green-600" />
                1. Project Information Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-gray-600 font-semibold">Project Name</label>
                  <p className="text-gray-900">{project.name}</p>
                </div>
                <div>
                  <label className="text-gray-600 font-semibold">Programme Area</label>
                  <p className="text-gray-900">{project.programmeArea}</p>
                </div>
                <div>
                  <label className="text-gray-600 font-semibold">Donor</label>
                  <p className="text-gray-900">{project.donor}</p>
                </div>
                <div>
                  <label className="text-gray-600 font-semibold">Start Date</label>
                  <p className="text-gray-900">{project.startDate}</p>
                </div>
                <div>
                  <label className="text-gray-600 font-semibold">Planned End Date</label>
                  <p className="text-gray-900">{project.endDate}</p>
                </div>
                <div>
                  <label className="text-gray-600 font-semibold">Location</label>
                  <p className="text-gray-900">{project.location}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Completion Details */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                2. Completion Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Calendar size={16} className="text-blue-600" />
                    Actual Completion Date *
                  </label>
                  <input
                    type="date"
                    name="completionDate"
                    value={formData.completionDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Financial Summary */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                3. Financial Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-semibold text-gray-600">Planned Budget</label>
                  <p className="text-2xl font-bold text-gray-900">LKR {project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <DollarSign size={16} className="text-orange-600" />
                    Actual Amount Spent *
                  </label>
                  <input
                    type="number"
                    name="actualSpent"
                    value={formData.actualSpent}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Budget utilization: <span className="font-bold">{budgetUtilization}%</span>
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <AlertCircle size={16} className="text-yellow-600" />
                    Budget Variance Explanation
                  </label>
                  <textarea
                    name="budgetVarianceExplanation"
                    value={formData.budgetVarianceExplanation}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Explain any significant variance between planned and actual budget"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Beneficiary Achievement */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-600" />
                4. Beneficiary Achievement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-semibold text-gray-600">Target Beneficiaries</label>
                  <p className="text-2xl font-bold text-gray-900">{project.targetBeneficiaries.toLocaleString()}</p>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Users size={16} className="text-purple-600" />
                    Actual Beneficiaries Reached *
                  </label>
                  <input
                    type="number"
                    name="actualBeneficiaries"
                    value={formData.actualBeneficiaries}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Achievement: <span className="font-bold">{beneficiaryAchievement}%</span>
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Users size={16} className="text-blue-600" />
                    Beneficiary Feedback & Testimonials
                  </label>
                  <textarea
                    name="beneficiaryFeedback"
                    value={formData.beneficiaryFeedback}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Share feedback and testimonials from beneficiaries"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Objectives Achievement */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={20} className="text-indigo-600" />
                5. Objectives & Outcomes Achievement
              </h3>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <CheckCircle size={16} className="text-green-600" />
                  Achieved Objectives *
                </label>
                <textarea
                  name="achievedObjectives"
                  value={formData.achievedObjectives}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  placeholder="List all project objectives and indicate achievement level for each"
                />
              </div>
            </div>

            {/* Section 6: Impact Summary */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-teal-600" />
                6. Impact Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <TrendingUp size={16} className="text-teal-600" />
                    Overall Impact & Results *
                  </label>
                  <textarea
                    name="impactSummary"
                    value={formData.impactSummary}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Describe the overall impact of the project on beneficiaries and communities"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <FileText size={16} className="text-blue-600" />
                    Success Stories
                  </label>
                  <textarea
                    name="successStories"
                    value={formData.successStories}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Share 2-3 success stories or case studies from the project"
                  />
                </div>
              </div>
            </div>

            {/* Section 7: Challenges & Lessons Learned */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-orange-600" />
                7. Challenges & Lessons Learned
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <AlertCircle size={16} className="text-red-600" />
                    Challenges Faced *
                  </label>
                  <textarea
                    name="challenges"
                    value={formData.challenges}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Describe major challenges encountered during implementation"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <CheckCircle size={16} className="text-blue-600" />
                    Lessons Learned *
                  </label>
                  <textarea
                    name="lessonsLearned"
                    value={formData.lessonsLearned}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="What were the key lessons learned from this project?"
                  />
                </div>
              </div>
            </div>

            {/* Section 8: Sustainability & Future Actions */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={20} className="text-green-600" />
                8. Sustainability & Future Actions
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Target size={16} className="text-green-600" />
                    Sustainability Plan *
                  </label>
                  <textarea
                    name="sustainability"
                    value={formData.sustainability}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="How will the project results be sustained after completion?"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <CheckCircle size={16} className="text-indigo-600" />
                    Recommendations & Future Actions *
                  </label>
                  <textarea
                    name="recommendations"
                    value={formData.recommendations}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="Recommendations for future similar projects"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Users size={16} className="text-purple-600" />
                    Follow-up Actions Required
                  </label>
                  <textarea
                    name="futureActions"
                    value={formData.futureActions}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    placeholder="List any follow-up actions or monitoring required post-completion"
                  />
                </div>
              </div>
            </div>

            {/* Section 9: Partner Contribution */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-red-600" />
                9. Partner & Stakeholder Contribution
              </h3>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Users size={16} className="text-red-600" />
                  Partner Contributions & Collaboration
                </label>
                <textarea
                  name="partnerContribution"
                  value={formData.partnerContribution}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  placeholder="Describe contributions from partners, donors, and stakeholders"
                />
              </div>
            </div>

            {/* Section 10: Documentation */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-gray-600" />
                10. Supporting Documentation
              </h3>
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <FileText size={16} className="text-gray-600" />
                  Photos & Documentation References
                </label>
                <textarea
                  name="photosDocumentation"
                  value={formData.photosDocumentation}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  placeholder="List attached photos, reports, and supporting documents"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Note: File upload feature will be added in future version
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGeneratePDF}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
            >
              <Download size={18} />
              Download PDF
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              Save Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCompletionReport;
