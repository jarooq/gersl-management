import React, { useState } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft, Check, Plus, Trash2 } from 'lucide-react';
import { useMEAL } from '../../contexts/MEALContext';

const AddEvaluationWizard = ({ projects, onClose }) => {
  const { addEvaluation } = useMEAL();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    type: 'Midterm',
    projectId: '',
    evaluator: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: '',
    status: 'Planned',

    // Step 2: Methodology & Objectives
    methodology: '',
    objectives: [],

    // Step 3: Reporting (optional)
    findings: '',
    recommendations: '',
    reportStatus: 'Pending',
    reportUrl: ''
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

Sampling: Stratified random sampling ensuring gender balance and geographic representation`;
          break;

        case 'Midterm':
          methodologyText = `Participatory midterm review using:

1. Progress Assessment: Review of indicators against targets
2. Stakeholder Consultations: Interviews with project team, beneficiaries, and partners
3. Data Analysis: Comparison of baseline vs current data
4. Challenges & Lessons: Documentation of implementation issues
5. Course Correction: Recommendations for remaining project period

Mixed methods combining quantitative indicator tracking and qualitative stakeholder feedback`;
          break;

        case 'Endline':
          methodologyText = `Comprehensive endline evaluation:

1. Impact Survey: Structured questionnaires measuring all project indicators
2. Outcome Harvesting: Collection of evidence of project outcomes and impacts
3. Most Significant Change (MSC): Stories of change from beneficiaries
4. Cost-Benefit Analysis: Assessment of project value for money
5. Sustainability Assessment: Evaluation of long-term viability

Comparison with baseline data to measure change`;
          break;

        case 'Impact':
          methodologyText = `Rigorous impact assessment:

1. Quasi-Experimental Design: Comparison of treatment vs control groups
2. Theory of Change Verification: Testing assumptions and causal pathways
3. Longitudinal Data Analysis: Tracking changes over extended period
4. Attribution Analysis: Isolating project effects from external factors
5. Unintended Consequences: Documentation of positive/negative side effects

Integration of quantitative econometric analysis with qualitative case studies`;
          break;
      }

      setFormData(prev => ({ ...prev, methodology: methodologyText }));
      setAiLoading(false);
    }, 1200);
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
      await addEvaluation({
        ...formData,
        projectId: parseInt(formData.projectId),
        projectName: project?.name || '',
        budget: formData.budget ? parseFloat(formData.budget) : null
      });
      onClose();
    } catch (error) {
      console.error('Error adding evaluation:', error);
      alert('Failed to add evaluation. Please try again.');
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
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold">Add New Evaluation</h3>
              <p className="text-blue-100 text-sm mt-1">AI-Assisted Evaluation Planning</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className={`flex items-center gap-3 ${currentStep >= step.num ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    currentStep > step.num
                      ? 'bg-green-500'
                      : currentStep === step.num
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20'
                  }`}>
                    {currentStep > step.num ? <Check size={20} /> : step.num}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-semibold text-sm">{step.title}</div>
                    <div className="text-xs text-blue-100">{step.desc}</div>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="hidden sm:block text-blue-200" size={20} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-5 ">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Evaluation Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="e.g., Midterm Evaluation - Education Project 2024"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Evaluation Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  >
                    <option value="Baseline">Baseline</option>
                    <option value="Midterm">Midterm</option>
                    <option value="Endline">Endline</option>
                    <option value="Impact">Impact</option>
                  </select>
                  <p className="text-xs text-ink-500 mt-1">
                    {formData.type === 'Baseline' && '📋 Initial assessment before project starts'}
                    {formData.type === 'Midterm' && '📊 Progress review at project mid-point'}
                    {formData.type === 'Endline' && '✅ Final assessment at project completion'}
                    {formData.type === 'Impact' && '🎯 Long-term impact measurement'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Project *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  >
                    <option value="">Select project...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Lead Evaluator *
                  </label>
                  <input
                    type="text"
                    value={formData.evaluator}
                    onChange={(e) => setFormData({ ...formData, evaluator: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="MEAL Officer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Budget (LKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="e.g., 150000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-sm"
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
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This section is optional and can be filled in later when evaluation is completed.
                  You can create the evaluation now and update these fields later.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Key Findings (Optional)
                </label>
                <textarea
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
              {submitting ? 'Creating...' : 'Create Evaluation'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEvaluationWizard;
