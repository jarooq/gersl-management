import React, { useState } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft, Check, Plus, Trash2 } from 'lucide-react';
import { useMEAL } from '../../contexts/MEALContext';

const EditEvaluationWizard = ({ evaluation, projects, onClose }) => {
  const { updateEvaluation } = useMEAL();
  const [currentStep, setCurrentStep] = useState(1);

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    title: evaluation.title || '',
    type: evaluation.type || 'Midterm',
    projectId: evaluation.projectId || '',
    evaluator: evaluation.evaluator || '',
    startDate: formatDateForInput(evaluation.startDate),
    endDate: formatDateForInput(evaluation.endDate),
    budget: evaluation.budget || '',
    status: evaluation.status || 'Planned',
    methodology: evaluation.methodology || '',
    objectives: Array.isArray(evaluation.objectives) ? evaluation.objectives : [],
    findings: evaluation.findings || '',
    recommendations: evaluation.recommendations || '',
    reportStatus: evaluation.reportStatus || 'Pending',
    reportUrl: evaluation.reportUrl || ''
  });
  const [newObjective, setNewObjective] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // AI Helper: Generate methodology suggestions
  const generateMethodologySuggestion = () => {
    setAiLoading(true);

    const project = projects.find(p => p.id === parseInt(formData.projectId));

    setTimeout(() => {
      let methodologyText = '';

      switch (formData.type) {
        case 'Baseline':
          methodologyText = `Mixed-methods baseline assessment combining:

1. Quantitative Survey: Pre-post questionnaires with ${project?.targetBeneficiaries || 'target'} beneficiaries
2. Qualitative Methods: Focus Group Discussions (FGDs) with community members, Key Informant Interviews (KIIs) with stakeholders
3. Document Review: Analysis of existing data and secondary sources
4. Site Observations: Physical verification of project area conditions

Sampling: Stratified random sampling ensuring representation across demographics
Timeline: 4-6 weeks data collection period
Ethics: Informed consent, confidentiality, and data protection measures`;
          break;

        case 'Midterm':
          methodologyText = `Midterm evaluation using participatory approach:

1. Progress Assessment: Review of indicator achievement against baseline
2. Stakeholder Consultations: In-depth interviews with project team, partners, beneficiaries
3. Financial Analysis: Budget utilization and cost-effectiveness review
4. Site Visits: Field verification of activities in ${project?.district?.join(', ') || 'project locations'}
5. Document Review: Activity reports, monitoring data, financial records

Data Collection: Mixed methods (surveys, interviews, FGDs)
Timeline: 3-4 weeks
Focus: Course correction and adaptive management recommendations`;
          break;

        case 'Endline':
          methodologyText = `Comprehensive endline evaluation methodology:

1. Outcome Measurement: Comparison with baseline data to measure change
2. Beneficiary Surveys: Structured questionnaires with ${project?.targetBeneficiaries || 'target'} participants
3. Impact Assessment: Analysis of project outcomes and contribution to goals
4. Sustainability Review: Assessment of lasting benefits and exit strategy
5. Lessons Learned: Workshops with stakeholders to capture best practices

Approach: Theory of Change verification
Analysis: Difference-in-difference, contribution analysis
Timeline: 6-8 weeks`;
          break;

        case 'Impact':
          methodologyText = `Long-term impact evaluation:

1. Longitudinal Data Analysis: Tracking changes 12-24 months post-project
2. Counterfactual Analysis: Comparison with control group (if available)
3. Cost-Benefit Analysis: ROI and value for money assessment
4. Unintended Effects: Documentation of positive and negative spillovers
5. Attribution Study: Determining project's contribution to observed changes

Methods: Surveys, in-depth interviews, case studies
Statistical Tools: Regression analysis, propensity score matching
Timeline: 8-12 weeks`;
          break;
      }

      setFormData(prev => ({ ...prev, methodology: methodologyText }));
      setAiLoading(false);
    }, 800);
  };

  // AI Helper: Generate objectives
  const generateObjectivesSuggestion = () => {
    setAiLoading(true);

    setTimeout(() => {
      let objectives = [];

      switch (formData.type) {
        case 'Baseline':
          objectives = [
            'Establish baseline values for all project indicators',
            'Understand current situation and needs of target beneficiaries',
            'Identify barriers and enabling factors for project success',
            'Document initial conditions for comparison at endline',
            'Validate project assumptions and Theory of Change'
          ];
          break;

        case 'Midterm':
          objectives = [
            'Assess progress towards project targets at mid-point',
            'Identify implementation challenges and success factors',
            'Evaluate relevance of project activities to beneficiary needs',
            'Document lessons learned for adaptive management',
            'Recommend course corrections for remaining period'
          ];
          break;

        case 'Endline':
          objectives = [
            'Measure achievement of project outputs and outcomes',
            'Compare endline data with baseline to determine change',
            'Assess effectiveness and efficiency of interventions',
            'Evaluate sustainability of project benefits',
            'Document best practices and lessons learned'
          ];
          break;

        case 'Impact':
          objectives = [
            'Determine long-term impact of project on beneficiaries',
            'Assess attribution of observed changes to project activities',
            'Evaluate cost-effectiveness and value for money',
            'Identify unintended positive and negative consequences',
            'Generate evidence for policy recommendations and scaling'
          ];
          break;
      }

      setFormData(prev => ({ ...prev, objectives }));
      setAiLoading(false);
    }, 800);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const project = projects.find(p => p.id === parseInt(formData.projectId));

      // Ensure dates are valid or null
      const startDate = formData.startDate || null;
      const endDate = formData.endDate || null;

      await updateEvaluation(evaluation.id, {
        ...formData,
        projectId: parseInt(formData.projectId),
        projectName: project?.name || '',
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate,
        endDate
      });
      onClose();
    } catch (error) {
      console.error('Error updating evaluation:', error);
      alert('Failed to update evaluation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const addObjective = () => {
    if (newObjective.trim() && !formData.objectives.includes(newObjective.trim())) {
      setFormData({
        ...formData,
        objectives: [...formData.objectives, newObjective.trim()]
      });
      setNewObjective('');
    }
  };

  const removeObjective = (index) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_, i) => i !== index)
    });
  };

  const steps = [
    { num: 1, title: 'Basic Information', desc: 'Project & Timeline' },
    { num: 2, title: 'Methodology', desc: 'Approach & Objectives' },
    { num: 3, title: 'Reporting', desc: 'Results & Documentation' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg2 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-pop flex flex-col">
        {/* Header */}
        <div className="bg-navy-900 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">Edit Evaluation</h3>
              <p className="text-blue-100 text-sm mt-1">Update evaluation details and progress</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-3 mt-6">
            {steps.map((step, idx) => (
              <React.Fragment key={step.num}>
                <div
                  className={`flex items-center gap-3 flex-1 p-3 rounded-lg transition-all ${
                    currentStep === step.num
                      ? 'bg-white/20 border-2 border-white'
                      : currentStep > step.num
                      ? 'bg-white/10'
                      : 'bg-white/5'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentStep > step.num
                        ? 'bg-green-500 text-white'
                        : currentStep === step.num
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {currentStep > step.num ? <Check size={16} /> : step.num}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-xs text-blue-100">{step.desc}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight size={20} className="text-blue-200 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-5 ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Evaluation Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., WASH Project Midterm Evaluation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Evaluation Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="Baseline">Baseline</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Endline">Endline</option>
                    <option value="Impact">Impact</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Project *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Evaluator Name *
                  </label>
                  <input
                    type="text"
                    value={formData.evaluator}
                    onChange={(e) => setFormData({ ...formData, evaluator: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Lead evaluator or firm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Budget (LKR)
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Methodology & Objectives */}
          {currentStep === 2 && (
            <div className="space-y-5 ">
              {/* AI Methodology Generator */}
              <div className="bg-ink-50 border border-ink-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-ink-900 mb-2">AI Methodology Assistant</h4>
                    <p className="text-sm text-ink-600 mb-3">
                      Get AI-generated methodology suggestions based on your evaluation type and project context.
                    </p>
                    <button
                      type="button"
                      onClick={generateMethodologySuggestion}
                      disabled={!formData.projectId || aiLoading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      {aiLoading ? 'Generating...' : 'Generate Methodology'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Evaluation Methodology
                </label>
                <textarea
                  value={formData.methodology}
                  onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                  placeholder="Describe your data collection methods, sampling approach, tools, and analysis techniques..."
                />
              </div>

              {/* AI Objectives Generator */}
              <div className="bg-ink-50 border border-ink-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-bold text-ink-900 mb-2">AI Objectives Generator</h4>
                    <p className="text-sm text-ink-600 mb-3">
                      Generate evaluation objectives tailored to your evaluation type.
                    </p>
                    <button
                      type="button"
                      onClick={generateObjectivesSuggestion}
                      disabled={aiLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      {aiLoading ? 'Generating...' : 'Generate Objectives'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Evaluation Objectives
                </label>

                {/* Add New Objective */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Type an objective and press Enter..."
                  />
                  <button
                    type="button"
                    onClick={addObjective}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>

                {/* Objectives List */}
                <div className="space-y-2">
                  {formData.objectives.map((objective, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="font-bold text-blue-600 flex-shrink-0">{index + 1}.</span>
                      <p className="flex-1 text-sm text-ink-800">{objective}</p>
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-all flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  {formData.objectives.length === 0 && (
                    <div className="text-center py-8 text-ink-400">
                      <p>No objectives added yet. Use AI generation or add manually.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Reporting */}
          {currentStep === 3 && (
            <div className="space-y-5 ">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Key Findings (Optional)
                </label>
                <textarea
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Document main findings and results from the evaluation..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Recommendations (Optional)
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="List key recommendations based on evaluation findings..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Report Status
                  </label>
                  <select
                    value={formData.reportStatus}
                    onChange={(e) => setFormData({ ...formData, reportStatus: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Draft">Draft</option>
                    <option value="Final">Final</option>
                    <option value="Published">Published</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Report URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.reportUrl}
                    onChange={(e) => setFormData({ ...formData, reportUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-ink-200 p-6 bg-ink-50 flex justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : prevStep}
            className="px-6 py-3 border-2 border-ink-300 text-ink-700 rounded-xl hover:bg-ink-100 transition-all font-semibold flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!formData.title || !formData.projectId || !formData.evaluator}
              className="px-6 py-3 bg-navy-900 text-white rounded-xl transition-all font-semibold shadow-card disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !formData.title || !formData.projectId || !formData.evaluator}
              className="px-6 py-3 bg-navy-900 text-white rounded-xl transition-all font-semibold shadow-card disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={18} />
              {submitting ? 'Updating...' : 'Update Evaluation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditEvaluationWizard;
