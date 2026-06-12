import React, { useState, useEffect } from 'react';
import { useProposals } from '../../contexts/ProposalsContext';
import { usePartners } from '../../contexts/PartnersContext';
import ProposalViewModal from './components/ProposalViewModal';
import AIProposalAssistant from '../../components/proposals/AIProposalAssistant';
import { getIndicatorsForProgramme, STANDARD_INDICATORS } from '../../utils/mealIndicators';
import { SRI_LANKAN_ADMINISTRATIVE_DIVISIONS } from '../../data/sriLankanDivisions';
import API from '../../services/api';
import { API_BASE_URL } from '../../config/apiBase';
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Eye,
  Trash2,
  ArrowRight,
  AlertCircle,
  Target,
  Calendar,
  User,
  Filter,
  BarChart3,
  FileEdit,
  Send,
  Shield,
  Users2,
  CheckSquare,
  Sparkles
} from 'lucide-react';

// AddProposalModal Component
// Sri Lankan Districts
const SRI_LANKAN_DISTRICTS = Object.keys(SRI_LANKAN_ADMINISTRATIVE_DIVISIONS).sort();

// Programme Areas
const PROGRAMME_AREAS = [
  'Education',
  'Health',
  'Livelihood',
  'WASH',
  'Protection',
  'Women Empowerment',
  'Youth Development',
  'Disability Inclusion',
  'Orphans Care',
  'Seasonal Projects',
  'Infrastructure',
  'General Projects'
];

// Currency options
const CURRENCIES = [
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' }
];

// Function to generate proposal code
const generateProposalCode = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `PROP-${year}-${timestamp}`;
};

const AddProposalModal = ({ onClose, onSubmit, error, success, isLoading, partners, initialData }) => {
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const defaultFormData = {
    proposalCode: generateProposalCode(),
    donor: '',
    cboId: '',
    cboName: '',
    title: '',
    programmeArea: 'Education',
    department: '',
    requestedBudget: '',
    duration: '12 months',
    targetBeneficiaries: '',
    district: [],
    summary: '',

    // GER Enhanced Fields
    projectTier: 'Tier 1',
    sectorTheme: 'Education',
    startDate: '',
    endDate: '',
    problemStatement: '',
    proposedSolution: '',
    keyBeneficiariesDescription: '',
    overallGoal: '',
    needsAssessmentData: '',
    strategicAlignment: '',

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
    budgetCurrency: 'LKR',

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
  };

  // Initialize formData with initialData if provided (from AI), otherwise use defaults
  const [formData, setFormData] = useState(initialData || defaultFormData);

  // Debug: Log partners data when component mounts or partners change
  React.useEffect(() => {
    console.log('=== ADD PROPOSAL MODAL - Partners Debug ===');
    console.log('Partners prop:', partners);
    console.log('Partners length:', partners ? partners.length : 0);
    console.log('Current donor value in form:', formData.donor);
  }, [partners, formData.donor]);

  // Fetch departments from database on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const response = await API.Departments.getAll();
        console.log('📋 Fetched departments:', response);
        setDepartments(response.departments || []);
      } catch (error) {
        console.error('❌ Failed to fetch departments:', error);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Form field changed: ${name} = ${value}`);
    setFormData({ ...formData, [name]: value });
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const handleActivityChange = (index, value) => {
    const newActivities = [...formData.keyActivities];
    newActivities[index] = value;
    setFormData({ ...formData, keyActivities: newActivities });
  };

  // Handle district multi-select
  const handleDistrictChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    console.log('Districts selected:', selected);
    setFormData({ ...formData, district: selected });
  };

  // MEAL - Results Framework handlers
  const addIndicator = () => {
    const newIndicator = {
      id: `IND-${Date.now()}`,
      level: 'Output',
      indicator: '',
      definition: '',
      baseline: '',
      target: '',
      meansOfVerification: '',
      disaggregation: []
    };
    setFormData({
      ...formData,
      resultsFramework: [...formData.resultsFramework, newIndicator]
    });
  };

  const removeIndicator = (id) => {
    setFormData({
      ...formData,
      resultsFramework: formData.resultsFramework.filter(ind => ind.id !== id)
    });
  };

  const updateIndicator = (id, field, value) => {
    setFormData({
      ...formData,
      resultsFramework: formData.resultsFramework.map(ind =>
        ind.id === id ? { ...ind, [field]: value } : ind
      )
    });
  };

  const selectStandardIndicator = (id, selectedIndicator) => {
    setFormData({
      ...formData,
      resultsFramework: formData.resultsFramework.map(ind =>
        ind.id === id ? {
          ...ind,
          indicator: selectedIndicator.indicator,
          definition: selectedIndicator.definition,
          disaggregation: selectedIndicator.disaggregation,
          meansOfVerification: selectedIndicator.mov
        } : ind
      )
    });
  };

  // Beneficiary breakdown handler
  const handleBeneficiaryChange = (field, value) => {
    setFormData({
      ...formData,
      beneficiaryBreakdown: {
        ...formData.beneficiaryBreakdown,
        [field]: value
      }
    });
  };

  // Theory of Change handlers
  const handleToCArrayChange = (category, index, value) => {
    const newArray = [...formData.theoryOfChange[category]];
    newArray[index] = value;
    setFormData({
      ...formData,
      theoryOfChange: {
        ...formData.theoryOfChange,
        [category]: newArray
      }
    });
  };

  const addToCItem = (category) => {
    setFormData({
      ...formData,
      theoryOfChange: {
        ...formData.theoryOfChange,
        [category]: [...formData.theoryOfChange[category], '']
      }
    });
  };

  const removeToCItem = (category, index) => {
    const newArray = formData.theoryOfChange[category].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      theoryOfChange: {
        ...formData.theoryOfChange,
        [category]: newArray
      }
    });
  };

  const handleToCImpactChange = (value) => {
    setFormData({
      ...formData,
      theoryOfChange: {
        ...formData.theoryOfChange,
        impact: value
      }
    });
  };

  // Safeguarding handlers
  const handleSafeguardingCheckbox = (field) => {
    setFormData({
      ...formData,
      safeguarding: {
        ...formData.safeguarding,
        [field]: !formData.safeguarding[field]
      }
    });
  };

  const handleSafeguardingFocalPerson = (value) => {
    setFormData({
      ...formData,
      safeguarding: {
        ...formData.safeguarding,
        safeguardingFocalPerson: value
      }
    });
  };

  const handleCFMChannelToggle = (channel) => {
    const currentChannels = formData.safeguarding.cfmChannels;
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel];

    setFormData({
      ...formData,
      safeguarding: {
        ...formData.safeguarding,
        cfmChannels: newChannels
      }
    });
  };

  // Budget Breakdown handlers
  const addBudgetItem = () => {
    const newItem = {
      id: `BUD-${Date.now()}`,
      category: 'Personnel',
      description: '',
      quantity: 1,
      unitCost: 0,
      totalCost: 0
    };
    setFormData({
      ...formData,
      budgetBreakdown: [...formData.budgetBreakdown, newItem]
    });
  };

  const removeBudgetItem = (id) => {
    setFormData({
      ...formData,
      budgetBreakdown: formData.budgetBreakdown.filter(item => item.id !== id)
    });
  };

  const updateBudgetItem = (id, field, value) => {
    const updatedItems = formData.budgetBreakdown.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto-calculate total cost
        if (field === 'quantity' || field === 'unitCost') {
          const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(item.quantity) || 0;
          const cost = field === 'unitCost' ? parseFloat(value) || 0 : parseFloat(item.unitCost) || 0;
          updated.totalCost = qty * cost;
        }
        return updated;
      }
      return item;
    });

    // Update total budget
    const newTotalBudget = updatedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    setFormData({
      ...formData,
      budgetBreakdown: updatedItems,
      requestedBudget: newTotalBudget.toString()
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add New Proposal</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
          >
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded flex items-center gap-2">
              <CheckCircle size={20} />
              {success}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-800 border-b pb-2">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Proposal Code *</label>
                <input
                  type="text"
                  name="proposalCode"
                  required
                  value={formData.proposalCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="PROP-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">
                  Districts *
                  <span className="ml-2 text-xs text-ink-500 font-normal">(Hold Ctrl/Cmd to select multiple)</span>
                </label>
                <select
                  name="district"
                  multiple
                  value={formData.district}
                  onChange={handleDistrictChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
                  required
                >
                  {SRI_LANKAN_DISTRICTS.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {formData.district && formData.district.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Selected ({formData.district.length}): {formData.district.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">
                  Donor Organization *
                  {partners && partners.length > 0 && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      ({partners.length} partners available)
                    </span>
                  )}
                </label>
                <select
                  name="donor"
                  required
                  value={formData.donor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a donor/partner...</option>
                  {partners && partners.length > 0 ? (
                    partners.map(partner => (
                      <option key={partner.id} value={partner.name}>
                        {partner.name} ({partner.category})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading partners...</option>
                  )}
                </select>
                {formData.donor && (
                  <p className="text-xs text-blue-600 mt-1">
                    Selected: <strong>{formData.donor}</strong>
                  </p>
                )}
                {partners && partners.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No partners available. Please add partners in the Partners & Donors module first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">CBO Partner</label>
                <input
                  type="text"
                  name="cboName"
                  value={formData.cboName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="CBO Name (Optional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Proposal Title *</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter proposal title..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Programme Area *</label>
                <select
                  name="programmeArea"
                  value={formData.programmeArea}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {PROGRAMME_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Project Tier</label>
                <select
                  name="projectTier"
                  value={formData.projectTier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Tier 1">Tier 1 (Comprehensive)</option>
                  <option value="Tier 2">Tier 2 (Moderate)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Sector/Theme</label>
                <input
                  type="text"
                  name="sectorTheme"
                  value={formData.sectorTheme}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Department Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-ink-700 mb-1">
                <span>📂</span>
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                disabled={loadingDepartments}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-ink-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingDepartments ? 'Loading departments...' : '-- Select Department --'}
                </option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              <p className="text-xs text-ink-600 mt-1">
                Project Officers will only see proposals in their assigned department
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Budget (LKR) *</label>
                <input
                  type="number"
                  name="requestedBudget"
                  required
                  value={formData.requestedBudget}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="2500000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Duration</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="6 months">6 months</option>
                  <option value="9 months">9 months</option>
                  <option value="12 months">12 months</option>
                  <option value="15 months">15 months</option>
                  <option value="18 months">18 months</option>
                  <option value="24 months">24 months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Target Beneficiaries *</label>
                <input
                  type="number"
                  name="targetBeneficiaries"
                  required
                  value={formData.targetBeneficiaries}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="150"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Budget Breakdown - Collapsed by default with toggle */}
          <details className="space-y-4 bg-ink-50 p-4 rounded-lg border border-ink-100">
            <summary className="cursor-pointer text-lg font-bold text-ink-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Detailed Budget Breakdown (Optional - Click to expand)
            </summary>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={addBudgetItem}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Add Line Item
                </button>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-ink-700">Currency:</label>
                  <select
                    name="budgetCurrency"
                    value={formData.budgetCurrency}
                    onChange={handleInputChange}
                    className="px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol}) - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.budgetBreakdown.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-ink-300">
                  <DollarSign className="h-12 w-12 text-ink-400 mx-auto mb-2" />
                  <p className="text-ink-500 text-sm">No budget items added yet.</p>
                  <p className="text-ink-400 text-xs mt-1">Click "Add Line Item" to start building your budget breakdown.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-ink-100 border-b border-ink-100">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Category</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Description</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Unit Cost ({formData.budgetCurrency})</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Total Cost ({formData.budgetCurrency})</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-ink-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.budgetBreakdown.map((item, index) => (
                          <tr key={item.id} className={`border-b border-ink-100 ${index % 2 === 0 ? 'bg-white' : 'bg-ink-50'}`}>
                            <td className="px-3 py-2">
                              <select
                                value={item.category}
                                onChange={(e) => updateBudgetItem(item.id, 'category', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                <option value="Personnel">Personnel</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Materials">Materials</option>
                                <option value="Activities">Activities</option>
                                <option value="Transport">Transport</option>
                                <option value="Training">Training</option>
                                <option value="Monitoring">Monitoring</option>
                                <option value="Administrative">Administrative</option>
                                <option value="Other">Other</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateBudgetItem(item.id, 'description', e.target.value)}
                                placeholder="Item description..."
                                className="w-full px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateBudgetItem(item.id, 'quantity', e.target.value)}
                                min="1"
                                className="w-full px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.unitCost}
                                onChange={(e) => updateBudgetItem(item.id, 'unitCost', e.target.value)}
                                min="0"
                                className="w-full px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-semibold text-green-700 text-sm">
                                {item.totalCost.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeBudgetItem(item.id)}
                                className="text-red-600 hover:text-red-800 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Budget Summary */}
                  <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="pt-3 border-t border-green-300">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-ink-800">Total Budget:</span>
                        <span className="text-2xl font-bold text-green-600">
                          LKR {parseFloat(formData.requestedBudget || 0).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 mt-1">
                        Cost per beneficiary: LKR {formData.targetBeneficiaries > 0
                          ? (parseFloat(formData.requestedBudget || 0) / parseInt(formData.targetBeneficiaries)).toLocaleString(undefined, {maximumFractionDigits: 2})
                          : '0'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </details>

          {/* Executive Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-800 border-b pb-2">Executive Summary</h3>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Summary (250 words) *</label>
              <textarea
                name="summary"
                required
                rows="3"
                value={formData.summary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Brief project summary..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Overall Goal</label>
              <input
                type="text"
                name="overallGoal"
                value={formData.overallGoal}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Main project goal..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Problem Statement</label>
              <textarea
                name="problemStatement"
                rows="3"
                value={formData.problemStatement}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe the problem this project addresses..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Proposed Solution</label>
              <textarea
                name="proposedSolution"
                rows="3"
                value={formData.proposedSolution}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe your proposed solution approach..."
              />
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-800 border-b pb-2">Objectives</h3>
            {[0, 1, 2].map(index => (
              <div key={index}>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Objective {index + 1}</label>
                <input
                  type="text"
                  value={formData.objectives[index]}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Enter objective ${index + 1}...`}
                />
              </div>
            ))}
          </div>

          {/* Key Activities */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-800 border-b pb-2">Key Activities</h3>
            {[0, 1, 2].map(index => (
              <div key={index}>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Activity {index + 1}</label>
                <input
                  type="text"
                  value={formData.keyActivities[index]}
                  onChange={(e) => handleActivityChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Enter activity ${index + 1}...`}
                />
              </div>
            ))}
          </div>

          {/* MEAL - Results Framework - Collapsed */}
          <details className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <summary className="cursor-pointer text-lg font-bold text-ink-800 flex items-center gap-2">
              <Target className="text-blue-600" size={20} />
              Results Framework (MEAL Indicators) - Optional
            </summary>
            <div className="mt-4">
              <button
                type="button"
                onClick={addIndicator}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-1"
              >
                <Plus size={16} />
                Add Indicator
              </button>

              {formData.resultsFramework.length === 0 ? (
                <div className="text-center py-6 text-ink-500 mt-4">
                  <Target size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No indicators added yet.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {formData.resultsFramework.map((indicator) => {
                    const tierNum = formData.projectTier === 'Tier 1' ? 1 : 2;
                    const programmeIndicators = getIndicatorsForProgramme(formData.programmeArea, tierNum, 'all');

                    return (
                      <div key={indicator.id} className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-ink-700 mb-1">Level</label>
                              <select
                                value={indicator.level}
                                onChange={(e) => updateIndicator(indicator.id, 'level', e.target.value)}
                                className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="Activity">Activity</option>
                                <option value="Output">Output</option>
                                <option value="Outcome">Outcome</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-ink-700 mb-1">Standard Indicator</label>
                              <select
                                onChange={(e) => {
                                  const selected = programmeIndicators.find(ind => ind.indicator === e.target.value);
                                  if (selected) selectStandardIndicator(indicator.id, selected);
                                }}
                                className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select from bank...</option>
                                {programmeIndicators
                                  .filter(ind => ind.category === indicator.level.toLowerCase() + 's')
                                  .map((ind, idx) => (
                                    <option key={idx} value={ind.indicator}>{ind.indicator}</option>
                                  ))}
                              </select>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeIndicator(indicator.id)}
                            className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-semibold text-ink-700 mb-1">Indicator Description</label>
                            <input
                              type="text"
                              value={indicator.indicator}
                              onChange={(e) => updateIndicator(indicator.id, 'indicator', e.target.value)}
                              placeholder="e.g., # children receiving school kits/support"
                              className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-ink-700 mb-1">Baseline</label>
                              <input
                                type="text"
                                value={indicator.baseline}
                                onChange={(e) => updateIndicator(indicator.id, 'baseline', e.target.value)}
                                placeholder="0"
                                className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-ink-700 mb-1">Target</label>
                              <input
                                type="text"
                                value={indicator.target}
                                onChange={(e) => updateIndicator(indicator.id, 'target', e.target.value)}
                                placeholder="100"
                                className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-ink-700 mb-1">Means of Verification</label>
                              <input
                                type="text"
                                value={indicator.meansOfVerification}
                                onChange={(e) => updateIndicator(indicator.id, 'meansOfVerification', e.target.value)}
                                placeholder="Distribution list"
                                className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </details>

          {/* MEAL - Beneficiary Disaggregation - Collapsed */}
          <details className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
            <summary className="cursor-pointer text-lg font-bold text-ink-800 flex items-center gap-2">
              <Users2 className="text-green-600" size={20} />
              Beneficiary Disaggregation Matrix - Optional
            </summary>
            <div className="mt-4">
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Direct Male</label>
                  <input
                    type="number"
                    value={formData.beneficiaryBreakdown.directMale}
                    onChange={(e) => handleBeneficiaryChange('directMale', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Direct Female</label>
                  <input
                    type="number"
                    value={formData.beneficiaryBreakdown.directFemale}
                    onChange={(e) => handleBeneficiaryChange('directFemale', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Direct Children</label>
                  <input
                    type="number"
                    value={formData.beneficiaryBreakdown.directChildren}
                    onChange={(e) => handleBeneficiaryChange('directChildren', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Direct PWD</label>
                  <input
                    type="number"
                    value={formData.beneficiaryBreakdown.directPWD}
                    onChange={(e) => handleBeneficiaryChange('directPWD', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">Indirect Total</label>
                  <input
                    type="number"
                    value={formData.beneficiaryBreakdown.indirectTotal}
                    onChange={(e) => handleBeneficiaryChange('indirectTotal', e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="bg-white rounded p-3 border border-green-200 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-ink-700">Total Direct Beneficiaries:</span>
                  <span className="font-bold text-green-700">
                    {(parseInt(formData.beneficiaryBreakdown.directMale) || 0) +
                     (parseInt(formData.beneficiaryBreakdown.directFemale) || 0) +
                     (parseInt(formData.beneficiaryBreakdown.directChildren) || 0)}
                  </span>
                </div>
              </div>
            </div>
          </details>

          {/* Theory of Change - Collapsed */}
          <details className="space-y-4 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <summary className="cursor-pointer text-lg font-bold text-ink-800 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={20} />
              Theory of Change - Optional
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-xs text-ink-600">
                Map how your inputs lead to activities, outputs, outcomes, and ultimately impact.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Inputs */}
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-indigo-700">1. Inputs</label>
                    <button
                      type="button"
                      onClick={() => addToCItem('inputs')}
                      className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.theoryOfChange.inputs.map((input, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => handleToCArrayChange('inputs', index, e.target.value)}
                        placeholder="e.g., Staff, budget"
                        className="flex-1 px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      {formData.theoryOfChange.inputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeToCItem('inputs', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Activities */}
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-indigo-700">2. Activities</label>
                    <button
                      type="button"
                      onClick={() => addToCItem('activities')}
                      className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.theoryOfChange.activities.map((activity, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={activity}
                        onChange={(e) => handleToCArrayChange('activities', index, e.target.value)}
                        placeholder="e.g., Distribute kits"
                        className="flex-1 px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      {formData.theoryOfChange.activities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeToCItem('activities', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Outputs */}
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-indigo-700">3. Outputs</label>
                    <button
                      type="button"
                      onClick={() => addToCItem('outputs')}
                      className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.theoryOfChange.outputs.map((output, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={output}
                        onChange={(e) => handleToCArrayChange('outputs', index, e.target.value)}
                        placeholder="e.g., 150 children equipped"
                        className="flex-1 px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      {formData.theoryOfChange.outputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeToCItem('outputs', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Outcomes */}
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-indigo-700">4. Outcomes</label>
                    <button
                      type="button"
                      onClick={() => addToCItem('outcomes')}
                      className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.theoryOfChange.outcomes.map((outcome, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={outcome}
                        onChange={(e) => handleToCArrayChange('outcomes', index, e.target.value)}
                        placeholder="e.g., Improved attendance"
                        className="flex-1 px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      {formData.theoryOfChange.outcomes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeToCItem('outcomes', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact */}
              <div className="bg-white rounded-lg p-3 border border-indigo-200">
                <label className="block text-sm font-semibold text-indigo-700 mb-2">5. Impact</label>
                <textarea
                  value={formData.theoryOfChange.impact}
                  onChange={(e) => handleToCImpactChange(e.target.value)}
                  rows="2"
                  placeholder="e.g., Reduced inequality and improved outcomes"
                  className="w-full px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </details>

          {/* Safeguarding Compliance - Collapsed */}
          <details className="space-y-4 bg-red-50 p-4 rounded-lg border border-red-200">
            <summary className="cursor-pointer text-lg font-bold text-ink-800 flex items-center gap-2">
              <CheckSquare className="text-red-600" size={20} />
              Safeguarding Compliance Checklist - Optional
            </summary>
            <div className="mt-4 space-y-4">
              {/* Compliance Checkboxes */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => handleSafeguardingCheckbox('dataProtection')}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    formData.safeguarding.dataProtection
                      ? 'border-green-500 bg-green-50'
                      : 'border-ink-200 bg-white hover:border-ink-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.safeguarding.dataProtection}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Data Protection</p>
                      <p className="text-xs text-ink-600">Personal data encrypted, stored securely</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleSafeguardingCheckbox('informedConsent')}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    formData.safeguarding.informedConsent
                      ? 'border-green-500 bg-green-50'
                      : 'border-ink-200 bg-white hover:border-ink-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.safeguarding.informedConsent}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Informed Consent</p>
                      <p className="text-xs text-ink-600">Written consent forms for beneficiaries</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleSafeguardingCheckbox('childSafeguarding')}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    formData.safeguarding.childSafeguarding
                      ? 'border-green-500 bg-green-50'
                      : 'border-ink-200 bg-white hover:border-ink-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.safeguarding.childSafeguarding}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Child Safeguarding</p>
                      <p className="text-xs text-ink-600">Child protection policy in place</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleSafeguardingCheckbox('incidentReporting')}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    formData.safeguarding.incidentReporting
                      ? 'border-green-500 bg-green-50'
                      : 'border-ink-200 bg-white hover:border-ink-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.safeguarding.incidentReporting}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Incident Reporting</p>
                      <p className="text-xs text-ink-600">Clear reporting mechanism</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleSafeguardingCheckbox('backgroundChecks')}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    formData.safeguarding.backgroundChecks
                      ? 'border-green-500 bg-green-50'
                      : 'border-ink-200 bg-white hover:border-ink-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.safeguarding.backgroundChecks}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Background Checks</p>
                      <p className="text-xs text-ink-600">All staff screened</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleSafeguardingCheckbox('codeOfConduct')}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    formData.safeguarding.codeOfConduct
                      ? 'border-green-500 bg-green-50'
                      : 'border-ink-200 bg-white hover:border-ink-400'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.safeguarding.codeOfConduct}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink-800">Code of Conduct</p>
                      <p className="text-xs text-ink-600">Staff signed code of conduct</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safeguarding Focal Person */}
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <label className="block text-sm font-semibold text-red-700 mb-2">Safeguarding Focal Person</label>
                <input
                  type="text"
                  value={formData.safeguarding.safeguardingFocalPerson}
                  onChange={(e) => handleSafeguardingFocalPerson(e.target.value)}
                  placeholder="Name and contact of designated officer"
                  className="w-full px-3 py-2 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* CFM Channels */}
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <label className="block text-sm font-semibold text-red-700 mb-2">Community Feedback Channels</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Hotline', 'WhatsApp', 'Email', 'Complaint Box', 'In-Person', 'SMS'].map(channel => (
                    <div
                      key={channel}
                      onClick={() => handleCFMChannelToggle(channel)}
                      className={`px-3 py-2 rounded-lg border-2 cursor-pointer transition text-center ${
                        formData.safeguarding.cfmChannels.includes(channel)
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-ink-400'
                      }`}
                    >
                      <p className="text-xs font-semibold">{channel}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-navy-900 text-white rounded-lg transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProposalsPage = () => {
  const {
    proposals,
    getStats,
    deleteProposal,
    loadProposals
  } = useProposals();

  const { partners } = usePartners();

  // Load proposals on mount
  React.useEffect(() => {
    loadProposals();
  }, []);

  // Debug: Log partners from context
  React.useEffect(() => {
    console.log('=== PROPOSALS PAGE - Partners from Context ===');
    console.log('Partners:', partners);
    console.log('Partners length:', partners ? partners.length : 0);
    if (partners && partners.length > 0) {
      console.log('Sample partner:', partners[0]);
    }
  }, [partners]);

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiGeneratedFormData, setAiGeneratedFormData] = useState(null); // Store AI-generated data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const stats = getStats();

  const handleAIProposalGenerated = (aiGeneratedData) => {
    console.log('=== AI PROPOSAL ACCEPTANCE ===');
    console.log('AI Generated Data:', aiGeneratedData);

    // Map AI-generated data to our form structure
    const mappedData = {
      proposalCode: generateProposalCode(),
      donor: aiGeneratedData.donor || '',
      cboId: '',
      cboName: '',
      title: aiGeneratedData.title || '',
      programmeArea: aiGeneratedData.programmeArea || 'Education',
      requestedBudget: aiGeneratedData.budgetRequested || '',
      duration: '12 months',
      targetBeneficiaries: aiGeneratedData.targetBeneficiaries || '',
      district: Array.isArray(aiGeneratedData.district) ? aiGeneratedData.district : (aiGeneratedData.district ? [aiGeneratedData.district] : []),
      summary: aiGeneratedData.summary || '',
      projectTier: aiGeneratedData.projectTier || 'Tier 1',
      sectorTheme: aiGeneratedData.sectorTheme || aiGeneratedData.programmeArea || 'Education',
      startDate: aiGeneratedData.startDate || '',
      endDate: aiGeneratedData.endDate || '',
      problemStatement: aiGeneratedData.problemStatement || '',
      proposedSolution: aiGeneratedData.proposedSolution || '',
      keyBeneficiariesDescription: '',
      overallGoal: aiGeneratedData.overallGoal || '',
      needsAssessmentData: '',
      strategicAlignment: aiGeneratedData.strategicAlignment || '',
      objectives: aiGeneratedData.objectives || ['', '', ''],
      keyActivities: aiGeneratedData.keyActivities || ['', '', ''],
      resultsFramework: (aiGeneratedData.resultsFramework || []).map((item, index) => ({
        id: `IND-${Date.now()}-${index}`,
        level: 'Output',
        indicator: item.indicator || '',
        definition: '',
        baseline: item.baseline || '',
        target: item.target || '',
        meansOfVerification: item.meansOfVerification || '',
        disaggregation: []
      })),
      beneficiaryBreakdown: aiGeneratedData.beneficiaryBreakdown || {
        directMale: '',
        directFemale: '',
        directChildren: '',
        directPWD: '',
        indirectTotal: ''
      },
      theoryOfChange: aiGeneratedData.theoryOfChange || {
        inputs: ['', ''],
        activities: ['', ''],
        outputs: ['', ''],
        outcomes: ['', ''],
        impact: '',
        assumptions: ['', ''],
        risks: ['', '']
      },
      budgetBreakdown: (aiGeneratedData.budgetBreakdown || []).map((item, index) => ({
        id: Date.now() + index,
        category: item.category || 'Other',
        description: item.description || item.justification || '',
        quantity: 1,
        unitCost: item.cost || 0,
        totalCost: item.cost || 0
      })),
      safeguarding: aiGeneratedData.safeguarding || {
        dataProtection: false,
        informedConsent: false,
        childSafeguarding: false,
        incidentReporting: false,
        backgroundChecks: false,
        codeOfConduct: false,
        safeguardingFocalPerson: '',
        cfmChannels: []
      }
    };

    console.log('Mapped Form Data:', mappedData);
    console.log('Populating form and opening Add Proposal modal...');

    // Close AI Assistant modal
    setShowAIAssistant(false);

    // Store the AI-generated data to pass to modal
    setAiGeneratedFormData(mappedData);

    // Open the Add Proposal modal so user can review and edit
    setShowAddModal(true);
  };

  const handleSubmit = async (formDataToSubmit) => {
    console.log('=== HANDLE SUBMIT CALLED ===');
    console.log('Form data received:', formDataToSubmit);

    setError('');
    setIsLoading(true);

    // Map frontend field names to backend field names and clean up data
    console.log('🔍 DEBUG - formDataToSubmit.title:', formDataToSubmit.title);
    console.log('🔍 DEBUG - formDataToSubmit.donor:', formDataToSubmit.donor);

    const cleanData = {
      // Map frontend field names to backend expected names
      proposalCode: formDataToSubmit.proposalCode || '',
      title: formDataToSubmit.title,  // Frontend: title → Backend: title
      donor: formDataToSubmit.donor,  // Frontend: donor → Backend: donor
      programmeArea: formDataToSubmit.programmeArea,
      district: formDataToSubmit.district,
      budgetRequested: parseFloat(formDataToSubmit.requestedBudget),  // Frontend: requestedBudget → Backend: budgetRequested
      duration: formDataToSubmit.duration,
      startDate: formDataToSubmit.startDate,
      endDate: formDataToSubmit.endDate,
      targetBeneficiaries: parseInt(formDataToSubmit.targetBeneficiaries),
      summary: formDataToSubmit.summary,
      projectTier: formDataToSubmit.projectTier,
      sectorTheme: formDataToSubmit.sectorTheme,
      problemStatement: formDataToSubmit.problemStatement,
      proposedSolution: formDataToSubmit.proposedSolution,
      overallGoal: formDataToSubmit.overallGoal,
      strategicAlignment: formDataToSubmit.strategicAlignment,
      needsAssessmentData: formDataToSubmit.needsAssessmentData || '',
      keyBeneficiariesDescription: formDataToSubmit.keyBeneficiariesDescription || '',
      objectives: formDataToSubmit.objectives.filter(obj => obj.trim() !== ''),
      keyActivities: formDataToSubmit.keyActivities.filter(act => act.trim() !== ''),
      resultsFramework: formDataToSubmit.resultsFramework || [],
      // submittedBy is set automatically by backend from authenticated user
      submitterRole: 'Proposal Manager',
      cboId: formDataToSubmit.cboId || null,
      cboName: formDataToSubmit.cboName || '',
      // Convert beneficiary breakdown to numbers
      beneficiaryBreakdown: {
        directMale: parseInt(formDataToSubmit.beneficiaryBreakdown.directMale) || 0,
        directFemale: parseInt(formDataToSubmit.beneficiaryBreakdown.directFemale) || 0,
        directChildren: parseInt(formDataToSubmit.beneficiaryBreakdown.directChildren) || 0,
        directPWD: parseInt(formDataToSubmit.beneficiaryBreakdown.directPWD) || 0,
        indirectTotal: parseInt(formDataToSubmit.beneficiaryBreakdown.indirectTotal) || 0
      },
      // Clean up Theory of Change (remove empty entries)
      theoryOfChange: {
        inputs: formDataToSubmit.theoryOfChange.inputs.filter(item => item.trim() !== ''),
        activities: formDataToSubmit.theoryOfChange.activities.filter(item => item.trim() !== ''),
        outputs: formDataToSubmit.theoryOfChange.outputs.filter(item => item.trim() !== ''),
        outcomes: formDataToSubmit.theoryOfChange.outcomes.filter(item => item.trim() !== ''),
        impact: formDataToSubmit.theoryOfChange.impact,
        assumptions: formDataToSubmit.theoryOfChange.assumptions.filter(item => item.trim() !== ''),
        risks: formDataToSubmit.theoryOfChange.risks.filter(item => item.trim() !== '')
      },
      budgetBreakdown: formDataToSubmit.budgetBreakdown || [],
      safeguarding: formDataToSubmit.safeguarding || {},
      submissionDate: new Date().toISOString()
    };

    console.log('Cleaned data to submit:', cleanData);

    try {
      // Check if we're updating an existing proposal or creating a new one
      const isEditMode = formDataToSubmit.id ? true : false;
      const url = isEditMode
        ? `${API_BASE_URL}/proposals/${formDataToSubmit.id}`
        : `${API_BASE_URL}/proposals`;
      const method = isEditMode ? 'PUT' : 'POST';

      console.log(`Sending ${method} to ${url}...`);

      // Get the authentication token
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: method,
        headers: headers,
        credentials: 'include',  // Include cookies for authentication
        body: JSON.stringify(cleanData)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        const successMessage = isEditMode ? 'Proposal updated successfully!' : 'Proposal created successfully!';
        console.log(`✅ ${successMessage}`);
        setSuccess(successMessage);
        setTimeout(() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSuccess('');
          console.log('Reloading page...');
          window.location.reload();
        }, 1500);
      } else {
        const errorMessage = isEditMode ? 'Failed to update proposal' : 'Failed to create proposal';
        console.error(`❌ ${errorMessage}:`, data.message);
        setError(data.message || errorMessage);
      }
    } catch (err) {
      const errorMessage = formDataToSubmit.id ? 'Failed to update proposal' : 'Failed to create proposal';
      console.error(`❌ Error submitting proposal:`, err);
      setError(err.message || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.proposalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.donor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || proposal.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || proposal.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Under Review': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Submitted': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Draft': return 'bg-ink-100 text-ink-700 border-ink-100';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={14} className="text-green-600" />;
      case 'Under Review': return <Clock size={14} className="text-blue-600" />;
      case 'Submitted': return <Send size={14} className="text-purple-600" />;
      case 'Draft': return <FileEdit size={14} className="text-ink-600" />;
      case 'Rejected': return <XCircle size={14} className="text-red-600" />;
      default: return <AlertCircle size={14} className="text-ink-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-600';
      case 'Low': return 'text-blue-600';
      default: return 'text-ink-600';
    }
  };

  const statItems = [
    {
      title: 'Total Proposals',
      value: stats.totalProposals,
      icon: FileText,
      gradient: 'from-indigo-500 to-purple-600',
      change: `${stats.approvedProposals} approved`,
      subtitle: 'proposals managed'
    },
    {
      title: 'Budget Requested',
      value: `${(stats.totalBudgetRequested / 1000000).toFixed(0)}M`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      change: `${(stats.approvedBudget / 1000000).toFixed(1)}M approved`,
      subtitle: 'LKR total'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-600',
      change: `${stats.approvedProposals}/${stats.approvedProposals + stats.rejectedProposals} approved`,
      subtitle: 'approval rate'
    },
    {
      title: 'Beneficiaries',
      value: stats.totalBeneficiaries.toLocaleString(),
      icon: Users,
      gradient: 'from-orange-500 to-amber-600',
      change: 'Projected reach',
      subtitle: 'lives to impact'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Fund Development · Proposals</p>
              <h1 className="text-h2 font-bold leading-tight">Proposal Management</h1>
              <p className="text-ink-200 text-sm mt-0.5">Managing {stats.totalProposals} proposals with {stats.successRate}% success rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <div
            key={index}
            className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer"
            
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-ink-600 mb-1">{stat.title}</p>
                <h3 className="text-h1 text-ink-900">{stat.value}</h3>
                <p className="text-xs text-ink-500 mt-0.5">{stat.subtitle}</p>
              </div>
              <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-lg shadow-sm transform group- transition-transform duration-200 flex-shrink-0`}>
                <stat.icon className="text-white" size={18} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-ink-100">
              <span className="text-xs font-medium text-ink-600">{stat.change}</span>
              <ArrowRight size={14} className="text-ink-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-ink-100">
        <div className="border-b border-ink-100">
          <div className="flex gap-1 p-1.5">
            {[
              { id: 'overview', label: 'All Proposals', icon: FileText },
              { id: 'pipeline', label: 'Pipeline', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-navy-900 text-white shadow-md'
                    : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* All Proposals Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
                <input
                  type="text"
                  placeholder="Search proposals by title, code, or donor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10 w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-modern"
                >
                  <option value="All">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="input-modern"
                >
                  <option value="All">All Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg transition-all shadow-card hover:shadow-lift font-semibold whitespace-nowrap group"
                >
                  <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                  AI Assistant
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg transition-all shadow-card hover:shadow-lift font-semibold whitespace-nowrap"
                >
                  <Plus size={18} />
                  Add Proposal
                </button>
              </div>
            </div>

            {/* Proposal Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="card-modern group p-5"
                  
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-ink-500 bg-ink-100 px-2 py-1 rounded">
                          {proposal.proposalCode}
                        </span>
                        <span className={`text-xs font-bold ${getPriorityColor(proposal.priority)}`}>
                          {proposal.priority} Priority
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-ink-900 leading-tight mb-1">{proposal.title}</h3>
                      <p className="text-sm text-ink-600 font-medium mb-2">{proposal.donor}</p>

                      {/* MEAL Badges - NEW */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {proposal.resultsFramework && proposal.resultsFramework.length > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold flex items-center gap-1">
                            <Target size={11} />
                            {proposal.resultsFramework.length} Indicators
                          </span>
                        )}
                        {proposal.beneficiaryBreakdown && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold flex items-center gap-1">
                            <Users size={11} />
                            {(proposal.beneficiaryBreakdown.directMale || 0) +
                             (proposal.beneficiaryBreakdown.directFemale || 0) +
                             (proposal.beneficiaryBreakdown.directChildren || 0)} Direct
                          </span>
                        )}
                        {proposal.budgetBreakdown && proposal.budgetBreakdown.length > 0 && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold flex items-center gap-1">
                            <DollarSign size={11} />
                            {proposal.budgetBreakdown.length} Budget Lines
                          </span>
                        )}
                        {proposal.safeguarding && proposal.safeguarding.length > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold flex items-center gap-1">
                            <Shield size={11} />
                            Safeguarding ✓
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(proposal.status)} flex items-center gap-1 flex-shrink-0`}>
                      {getStatusIcon(proposal.status)}
                      {proposal.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target size={12} className="text-purple-500" />
                      </div>
                      <span className="font-medium">{proposal.programmeArea}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign size={12} className="text-green-500" />
                      </div>
                      <span className="font-medium">LKR {(proposal.budgetRequested / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users size={12} className="text-blue-500" />
                      </div>
                      <span className="font-medium">{proposal.targetBeneficiaries.toLocaleString()} beneficiaries</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar size={12} className="text-orange-500" />
                      </div>
                      <span className="font-medium">{proposal.duration} months duration</span>
                    </div>
                  </div>

                  {/* Lead Writer */}
                  <div className="mb-4 p-3 bg-ink-50 border-l-4 border-indigo-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-indigo-600" />
                      <p className="text-xs font-semibold text-indigo-700">Lead Writer: {proposal.leadWriter}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-ink-100">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-ink-500 mb-1">Submitted</p>
                        <p className="font-bold text-xs text-ink-900">
                          {new Date(proposal.submissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-500 mb-1">Comments</p>
                        <p className="font-bold text-xs text-ink-900">{proposal.comments}</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-500 mb-1">Attachments</p>
                        <p className="font-bold text-xs text-ink-900">{proposal.attachments}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setShowViewModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-navy-900 text-white rounded-lg transition-all text-xs font-semibold shadow-md hover:shadow-card active:scale-95"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setShowEditModal(true);
                        }}
                        className="px-3 py-2 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-all border border-ink-100 hover:border-ink-200 active:scale-95"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteProposal(proposal.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 hover:border-red-300 active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProposals.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto text-ink-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-ink-900 mb-2">No proposals found</h3>
                <p className="text-ink-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { status: 'Draft', color: 'gray', icon: FileEdit },
                { status: 'Submitted', color: 'purple', icon: Send },
                { status: 'Under Review', color: 'blue', icon: Clock },
                { status: 'Approved', color: 'green', icon: CheckCircle },
                { status: 'Rejected', color: 'red', icon: XCircle }
              ].map((column) => {
                const columnProposals = proposals.filter(p => p.status === column.status);
                return (
                  <div
                    key={column.status}
                    className=""
                    
                  >
                    <div className={`bg-${column.color}-50 border border-${column.color}-200 rounded-lg p-3 mb-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <column.icon size={16} className={`text-${column.color}-600`} />
                        <h3 className={`font-bold text-sm text-${column.color}-900`}>{column.status}</h3>
                      </div>
                      <p className="text-xs text-ink-600">{columnProposals.length} proposals</p>
                    </div>
                    <div className="space-y-2">
                      {columnProposals.map((proposal) => (
                        <div
                          key={proposal.id}
                          className="bg-white border border-ink-100 rounded-lg2 shadow-card p-3"
                          
                        >
                          <h4 className="font-bold text-xs text-ink-900 mb-1 line-clamp-2">{proposal.title}</h4>
                          <p className="text-xs text-ink-600 mb-2">{proposal.donor}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-green-600">
                              LKR {(proposal.budgetRequested / 1000000).toFixed(1)}M
                            </span>
                            <span className={`text-xs font-bold ${getPriorityColor(proposal.priority)}`}>
                              {proposal.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                      {columnProposals.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-xs text-ink-400">No proposals</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Proposal View Modal */}
      {showViewModal && selectedProposal && (
        <ProposalViewModal
          proposal={selectedProposal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedProposal(null);
          }}
          onUpdate={(updatedProposal) => {
            // Update the selected proposal with new data
            setSelectedProposal(updatedProposal);
            // Optionally refresh the proposals list
            // The context should handle this automatically
          }}
        />
      )}

      {/* Add Proposal Modal */}
      {showAddModal && (
        <AddProposalModal
          onClose={() => {
            setShowAddModal(false);
            setAiGeneratedFormData(null); // Clear AI data when modal closes
          }}
          onSubmit={handleSubmit}
          error={error}
          success={success}
          isLoading={isLoading}
          partners={partners}
          initialData={aiGeneratedFormData} // Pass AI-generated data to modal
        />
      )}

      {/* Edit Proposal Modal */}
      {showEditModal && selectedProposal && (
        <AddProposalModal
          onClose={() => {
            setShowEditModal(false);
            setSelectedProposal(null);
          }}
          onSubmit={handleSubmit}
          error={error}
          success={success}
          isLoading={isLoading}
          partners={partners}
          initialData={selectedProposal} // Pass existing proposal data for editing
          isEditMode={true}
        />
      )}

      {/* AI Proposal Assistant Modal */}
      {showAIAssistant && (
        <AIProposalAssistant
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          onProposalGenerated={handleAIProposalGenerated}
          currentProposal={null}
        />
      )}
    </div>
  );
};

export default ProposalsPage;
