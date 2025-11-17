import React, { useState } from 'react';
import { X, Briefcase, DollarSign, Users, Calendar, MapPin, Heart, Target, FileText, CheckSquare, TrendingUp, Shield, AlertCircle } from 'lucide-react';

const AddProjectForm = ({ isOpen, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Basic Information
    projectCode: '',
    name: '',
    donor: '',
    programmeArea: 'Education',
    location: 'Colombo',
    startDate: '',
    endDate: '',
    budget: '',
    targetBeneficiaries: '',
    description: '',
    status: 'Planning',
    phase: 'Design',

    // GER Enhanced Fields
    projectTier: 'Tier 1',
    sectorTheme: 'Education',
    problemStatement: '',
    proposedSolution: '',
    overallGoal: '',
    strategicAlignment: '',

    // Objectives & Activities
    objectives: ['', '', ''],
    keyActivities: ['', '', ''],

    // MEAL Fields
    resultsFramework: [],
    beneficiaryBreakdown: {
      directMale: '',
      directFemale: '',
      directChildren: '',
      directPWD: '',
      indirectTotal: ''
    },

    // Theory of Change
    theoryOfChange: {
      inputs: ['', ''],
      activities: ['', ''],
      outputs: ['', ''],
      outcomes: ['', ''],
      impact: '',
      assumptions: ['', ''],
      risks: ['', '']
    },

    // Budget Breakdown
    budgetBreakdown: [],

    // Safeguarding Compliance
    safeguarding: {
      dataProtection: false,
      informedConsent: false,
      childSafeguarding: false,
      incidentReporting: false,
      backgroundChecks: false,
      codeOfConduct: false,
      safeguardingFocalPerson: '',
      cfmChannels: []
    }
  });

  const programmeAreas = [
    'WASH',
    'Orphan Care',
    'Education',
    'Emergency Response',
    'Health',
    'Livelihood',
    'Community Development',
    'Protection',
    'Nutrition'
  ];

  const districts = [
    'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
    'Mullaitivu', 'Vavuniya', 'Puttalam', 'Kurunegala', 'Anuradhapura',
    'Polonnaruwa', 'Badulla', 'Moneragala', 'Ratnapura', 'Kegalle',
    'Ampara', 'Trincomalee', 'Batticaloa'
  ];

  const projectTiers = ['Tier 1', 'Tier 2', 'Tier 3'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('objectives.')) {
      const index = parseInt(name.split('.')[1]);
      const newObjectives = [...formData.objectives];
      newObjectives[index] = value;
      setFormData(prev => ({ ...prev, objectives: newObjectives }));
    } else if (name.startsWith('keyActivities.')) {
      const index = parseInt(name.split('.')[1]);
      const newActivities = [...formData.keyActivities];
      newActivities[index] = value;
      setFormData(prev => ({ ...prev, keyActivities: newActivities }));
    } else if (name.startsWith('beneficiaryBreakdown.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        beneficiaryBreakdown: {
          ...prev.beneficiaryBreakdown,
          [field]: value
        }
      }));
    } else if (name.startsWith('theoryOfChange.')) {
      const parts = name.split('.');
      const field = parts[1];
      if (parts.length === 3) {
        const index = parseInt(parts[2]);
        const newArray = [...formData.theoryOfChange[field]];
        newArray[index] = value;
        setFormData(prev => ({
          ...prev,
          theoryOfChange: {
            ...prev.theoryOfChange,
            [field]: newArray
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          theoryOfChange: {
            ...prev.theoryOfChange,
            [field]: value
          }
        }));
      }
    } else if (name.startsWith('safeguarding.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        safeguarding: {
          ...prev.safeguarding,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert and prepare data for submission
    const projectData = {
      ...formData,
      totalBudget: parseFloat(formData.budget) || 0,
      targetBeneficiaries: parseInt(formData.targetBeneficiaries) || 0,
      beneficiaryBreakdown: {
        directMale: parseInt(formData.beneficiaryBreakdown.directMale) || 0,
        directFemale: parseInt(formData.beneficiaryBreakdown.directFemale) || 0,
        directChildren: parseInt(formData.beneficiaryBreakdown.directChildren) || 0,
        directPWD: parseInt(formData.beneficiaryBreakdown.directPWD) || 0,
        indirectTotal: parseInt(formData.beneficiaryBreakdown.indirectTotal) || 0
      },
      // Filter out empty objectives and activities
      objectives: formData.objectives.filter(obj => obj.trim() !== ''),
      keyActivities: formData.keyActivities.filter(act => act.trim() !== ''),
      // Filter out empty Theory of Change fields
      theoryOfChange: {
        ...formData.theoryOfChange,
        inputs: formData.theoryOfChange.inputs.filter(i => i.trim() !== ''),
        activities: formData.theoryOfChange.activities.filter(a => a.trim() !== ''),
        outputs: formData.theoryOfChange.outputs.filter(o => o.trim() !== ''),
        outcomes: formData.theoryOfChange.outcomes.filter(o => o.trim() !== ''),
        assumptions: formData.theoryOfChange.assumptions.filter(a => a.trim() !== ''),
        risks: formData.theoryOfChange.risks.filter(r => r.trim() !== '')
      }
    };

    onSubmit(projectData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      projectCode: '',
      name: '',
      donor: '',
      programmeArea: 'Education',
      location: 'Colombo',
      startDate: '',
      endDate: '',
      budget: '',
      targetBeneficiaries: '',
      description: '',
      status: 'Planning',
      phase: 'Design',
      projectTier: 'Tier 1',
      sectorTheme: 'Education',
      problemStatement: '',
      proposedSolution: '',
      overallGoal: '',
      strategicAlignment: '',
      objectives: ['', '', ''],
      keyActivities: ['', '', ''],
      resultsFramework: [],
      beneficiaryBreakdown: {
        directMale: '',
        directFemale: '',
        directChildren: '',
        directPWD: '',
        indirectTotal: ''
      },
      theoryOfChange: {
        inputs: ['', ''],
        activities: ['', ''],
        outputs: ['', ''],
        outcomes: ['', ''],
        impact: '',
        assumptions: ['', ''],
        risks: ['', '']
      },
      budgetBreakdown: [],
      safeguarding: {
        dataProtection: false,
        informedConsent: false,
        childSafeguarding: false,
        incidentReporting: false,
        backgroundChecks: false,
        codeOfConduct: false,
        safeguardingFocalPerson: '',
        cfmChannels: []
      }
    });
    setActiveTab('basic');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Add New Project</h2>
              </div>
              <p className="text-blue-100 mt-2">Create a comprehensive GER-compliant project</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === 'basic'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              Basic Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('objectives')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === 'objectives'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              Objectives & Activities
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('beneficiaries')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === 'beneficiaries'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              Beneficiaries
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('toc')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === 'toc'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              Theory of Change
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('safeguarding')}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === 'safeguarding'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              Safeguarding
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This form matches the proposal structure for consistency. All projects will have comprehensive GER-compliant data.
                </p>
              </div>

              {/* Project Code */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <FileText size={16} className="text-blue-600" />
                  Project Code
                </label>
                <input
                  type="text"
                  name="projectCode"
                  value={formData.projectCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., PROJ-2025-001 (optional, will be auto-generated if empty)"
                />
              </div>

              {/* Project Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Briefcase size={16} className="text-blue-600" />
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter project name"
                />
              </div>

              {/* Donor & Programme Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Heart size={16} className="text-red-600" />
                    Donor/Funding Partner *
                  </label>
                  <input
                    type="text"
                    name="donor"
                    value={formData.donor}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter donor name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Target size={16} className="text-purple-600" />
                    Programme Area *
                  </label>
                  <select
                    name="programmeArea"
                    value={formData.programmeArea}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {programmeAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* District & Project Tier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <MapPin size={16} className="text-red-600" />
                    District *
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <TrendingUp size={16} className="text-green-600" />
                    Project Tier *
                  </label>
                  <select
                    name="projectTier"
                    value={formData.projectTier}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {projectTiers.map(tier => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Calendar size={16} className="text-blue-600" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Calendar size={16} className="text-orange-600" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    min={formData.startDate}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Budget & Target Beneficiaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <DollarSign size={16} className="text-green-600" />
                    Total Budget (LKR) *
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., 1000000"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Users size={16} className="text-blue-600" />
                    Target Beneficiaries *
                  </label>
                  <input
                    type="number"
                    name="targetBeneficiaries"
                    value={formData.targetBeneficiaries}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., 500"
                  />
                </div>
              </div>

              {/* Problem Statement */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <AlertCircle size={16} className="text-red-600" />
                  Problem Statement *
                </label>
                <textarea
                  name="problemStatement"
                  value={formData.problemStatement}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Describe the problem this project addresses"
                />
              </div>

              {/* Proposed Solution */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Target size={16} className="text-green-600" />
                  Proposed Solution *
                </label>
                <textarea
                  name="proposedSolution"
                  value={formData.proposedSolution}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Describe the proposed solution"
                />
              </div>

              {/* Overall Goal */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Target size={16} className="text-purple-600" />
                  Overall Goal *
                </label>
                <textarea
                  name="overallGoal"
                  value={formData.overallGoal}
                  onChange={handleChange}
                  required
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="What is the overall goal of this project?"
                />
              </div>

              {/* Strategic Alignment */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  Strategic Alignment
                </label>
                <textarea
                  name="strategicAlignment"
                  value={formData.strategicAlignment}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="How does this align with organizational strategy?"
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <FileText size={16} className="text-gray-600" />
                  Project Description/Summary *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Provide a comprehensive project summary"
                />
              </div>
            </div>
          )}

          {/* Objectives & Activities Tab */}
          {activeTab === 'objectives' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                <p className="text-sm text-purple-800">
                  <strong>Project Objectives & Key Activities:</strong> Define what you want to achieve and how you'll do it.
                </p>
              </div>

              {/* Objectives */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Project Objectives (At least 1 required)</h3>
                {formData.objectives.map((objective, index) => (
                  <div key={index} className="mb-3">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Objective {index + 1} {index === 0 && '*'}
                    </label>
                    <textarea
                      name={`objectives.${index}`}
                      value={objective}
                      onChange={handleChange}
                      required={index === 0}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                      placeholder={`Enter objective ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Key Activities */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Key Activities (At least 1 required)</h3>
                {formData.keyActivities.map((activity, index) => (
                  <div key={index} className="mb-3">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Activity {index + 1} {index === 0 && '*'}
                    </label>
                    <textarea
                      name={`keyActivities.${index}`}
                      value={activity}
                      onChange={handleChange}
                      required={index === 0}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                      placeholder={`Enter key activity ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Beneficiaries Tab */}
          {activeTab === 'beneficiaries' && (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <p className="text-sm text-green-800">
                  <strong>Beneficiary Breakdown:</strong> Provide disaggregated data for MEAL reporting.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Direct Male Beneficiaries
                  </label>
                  <input
                    type="number"
                    name="beneficiaryBreakdown.directMale"
                    value={formData.beneficiaryBreakdown.directMale}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Direct Female Beneficiaries
                  </label>
                  <input
                    type="number"
                    name="beneficiaryBreakdown.directFemale"
                    value={formData.beneficiaryBreakdown.directFemale}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Direct Children (Under 18)
                  </label>
                  <input
                    type="number"
                    name="beneficiaryBreakdown.directChildren"
                    value={formData.beneficiaryBreakdown.directChildren}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Persons with Disabilities (PWD)
                  </label>
                  <input
                    type="number"
                    name="beneficiaryBreakdown.directPWD"
                    value={formData.beneficiaryBreakdown.directPWD}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    Indirect Beneficiaries (Total)
                  </label>
                  <input
                    type="number"
                    name="beneficiaryBreakdown.indirectTotal"
                    value={formData.beneficiaryBreakdown.indirectTotal}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Theory of Change Tab */}
          {activeTab === 'toc' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4">
                <p className="text-sm text-indigo-800">
                  <strong>Theory of Change:</strong> Map out the logical chain from inputs to impact.
                </p>
              </div>

              {/* Inputs */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Inputs</h3>
                {formData.theoryOfChange.inputs.map((input, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      name={`theoryOfChange.inputs.${index}`}
                      value={input}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder={`Input ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Activities */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Activities</h3>
                {formData.theoryOfChange.activities.map((activity, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      name={`theoryOfChange.activities.${index}`}
                      value={activity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder={`Activity ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Outputs */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Outputs</h3>
                {formData.theoryOfChange.outputs.map((output, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      name={`theoryOfChange.outputs.${index}`}
                      value={output}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder={`Output ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Outcomes */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Outcomes</h3>
                {formData.theoryOfChange.outcomes.map((outcome, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      name={`theoryOfChange.outcomes.${index}`}
                      value={outcome}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder={`Outcome ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Impact */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Impact (Long-term)</h3>
                <textarea
                  name="theoryOfChange.impact"
                  value={formData.theoryOfChange.impact}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  placeholder="Describe the long-term impact"
                />
              </div>

              {/* Assumptions */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Assumptions</h3>
                {formData.theoryOfChange.assumptions.map((assumption, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      name={`theoryOfChange.assumptions.${index}`}
                      value={assumption}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder={`Assumption ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              {/* Risks */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Risks</h3>
                {formData.theoryOfChange.risks.map((risk, index) => (
                  <div key={index} className="mb-3">
                    <input
                      type="text"
                      name={`theoryOfChange.risks.${index}`}
                      value={risk}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder={`Risk ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safeguarding Tab */}
          {activeTab === 'safeguarding' && (
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-sm text-red-800">
                  <strong>Safeguarding Compliance:</strong> Ensure all safeguarding measures are in place.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="safeguarding.dataProtection"
                    checked={formData.safeguarding.dataProtection}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm text-gray-700">
                    <strong>Data Protection:</strong> All beneficiary data will be handled in compliance with data protection regulations
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="safeguarding.informedConsent"
                    checked={formData.safeguarding.informedConsent}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm text-gray-700">
                    <strong>Informed Consent:</strong> Informed consent will be obtained from all participants
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="safeguarding.childSafeguarding"
                    checked={formData.safeguarding.childSafeguarding}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm text-gray-700">
                    <strong>Child Safeguarding:</strong> Child safeguarding policies will be strictly followed
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="safeguarding.incidentReporting"
                    checked={formData.safeguarding.incidentReporting}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm text-gray-700">
                    <strong>Incident Reporting:</strong> Clear incident reporting mechanisms are in place
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="safeguarding.backgroundChecks"
                    checked={formData.safeguarding.backgroundChecks}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm text-gray-700">
                    <strong>Background Checks:</strong> All staff and volunteers have completed background checks
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="safeguarding.codeOfConduct"
                    checked={formData.safeguarding.codeOfConduct}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm text-gray-700">
                    <strong>Code of Conduct:</strong> All team members have signed the code of conduct
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">
                  Safeguarding Focal Person
                </label>
                <input
                  type="text"
                  name="safeguarding.safeguardingFocalPerson"
                  value={formData.safeguarding.safeguardingFocalPerson}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Name of safeguarding focal person"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Briefcase size={18} />
              Create GER-Compliant Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProjectForm;
