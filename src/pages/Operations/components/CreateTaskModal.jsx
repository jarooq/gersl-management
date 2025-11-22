import React, { useState, useEffect } from 'react';
import { useProjects } from '../../../contexts/ProjectContext';
import { useHR } from '../../../contexts/HRContext';
import { createTask } from '../../../services/taskService';
import {
  X,
  CheckCircle,
  Calendar,
  Users,
  DollarSign,
  Package,
  GraduationCap,
  Megaphone,
  ClipboardCheck,
  AlertCircle,
  Truck,
  Gift
} from 'lucide-react';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, defaultProjectId = null }) => {
  const { projects } = useProjects();
  const { staff } = useHR();

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form data
  const [formData, setFormData] = useState({
    // Basic fields
    projectId: defaultProjectId || '',
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Not Started',
    startDate: '',
    dueDate: '',
    assignedTo: '',

    // Task type fields
    taskType: 'Other',
    taskCategory: '',

    // Procurement fields
    requiresProcurement: false,
    procurementItems: '',
    estimatedBudget: '',

    // Beneficiary fields
    involvesBeneficiaries: false,
    beneficiaryTrackingMode: 'None',
    beneficiarySelectionMethod: '',
    selectionCriteria: '',
    targetBeneficiaries: '',

    // Distribution fields
    distributionType: 'None',
    distributionItems: '',
    cashAmount: '',
    distributionDate: '',
    distributionLocation: '',

    // Training fields
    trainingType: '',
    trainingDuration: '',
    certificateProvided: false,

    // Media team fields
    mediaCoverageRequired: false,
    mediaCoverageType: [],
    mediaTeamAssigned: []
  });

  // Task type options
  const taskTypes = [
    { value: 'Procurement', label: 'Procurement', icon: Package, color: 'purple' },
    { value: 'Beneficiary Selection', label: 'Beneficiary Selection', icon: Users, color: 'blue' },
    { value: 'Mass Distribution', label: 'Mass Distribution (Ifthar)', icon: Gift, color: 'green' },
    { value: 'Individual Distribution', label: 'Individual Distribution', icon: Truck, color: 'orange' },
    { value: 'Training', label: 'Training/Workshop', icon: GraduationCap, color: 'indigo' },
    { value: 'Meeting', label: 'Meeting', icon: Users, color: 'pink' },
    { value: 'Report', label: 'Report/Documentation', icon: ClipboardCheck, color: 'yellow' },
    { value: 'Social Media', label: 'Social Media Campaign', icon: Megaphone, color: 'cyan' },
    { value: 'Other', label: 'Other', icon: ClipboardCheck, color: 'gray' }
  ];

  const mediaTypes = ['Photos', 'Videos', 'Social Media Posts', 'Press Release', 'Testimonials'];

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      projectId: defaultProjectId || '',
      title: '',
      description: '',
      priority: 'Medium',
      status: 'Not Started',
      startDate: '',
      dueDate: '',
      assignedTo: '',
      taskType: 'Other',
      taskCategory: '',
      requiresProcurement: false,
      procurementItems: '',
      estimatedBudget: '',
      involvesBeneficiaries: false,
      beneficiaryTrackingMode: 'None',
      beneficiarySelectionMethod: '',
      selectionCriteria: '',
      targetBeneficiaries: '',
      distributionType: 'None',
      distributionItems: '',
      cashAmount: '',
      distributionDate: '',
      distributionLocation: '',
      trainingType: '',
      trainingDuration: '',
      certificateProvided: false,
      mediaCoverageRequired: false,
      mediaCoverageType: [],
      mediaTeamAssigned: []
    });
    setCurrentStep(1);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTaskTypeChange = (taskType) => {
    setFormData(prev => ({
      ...prev,
      taskType,
      // Auto-set flags based on task type
      requiresProcurement: taskType === 'Procurement',
      involvesBeneficiaries: ['Beneficiary Selection', 'Mass Distribution', 'Individual Distribution'].includes(taskType),
      beneficiaryTrackingMode: taskType === 'Mass Distribution' ? 'Aggregate' :
                               taskType === 'Individual Distribution' ? 'Individual' : 'None',
      distributionType: ['Mass Distribution', 'Individual Distribution'].includes(taskType) ? 'In-Kind' : 'None',
      mediaCoverageRequired: ['Mass Distribution', 'Individual Distribution', 'Social Media'].includes(taskType)
    }));
  };

  const handleMediaTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      mediaCoverageType: prev.mediaCoverageType.includes(type)
        ? prev.mediaCoverageType.filter(t => t !== type)
        : [...prev.mediaCoverageType, type]
    }));
  };

  const handleMediaTeamToggle = (staffId) => {
    setFormData(prev => ({
      ...prev,
      mediaTeamAssigned: prev.mediaTeamAssigned.includes(staffId)
        ? prev.mediaTeamAssigned.filter(id => id !== staffId)
        : [...prev.mediaTeamAssigned, staffId]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.projectId) newErrors.projectId = 'Project is required';
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    }

    if (step === 2) {
      // Task type specific validation
      if (formData.taskType === 'Procurement' && !formData.procurementItems.trim()) {
        newErrors.procurementItems = 'Procurement items are required';
      }

      if (formData.involvesBeneficiaries && !formData.targetBeneficiaries) {
        newErrors.targetBeneficiaries = 'Target number of beneficiaries is required';
      }

      if (formData.distributionType !== 'None' && !formData.distributionItems.trim()) {
        newErrors.distributionItems = 'Distribution items are required';
      }

      if (formData.taskType === 'Training' && !formData.trainingType.trim()) {
        newErrors.trainingType = 'Training type is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // Prepare data for API
      const taskData = {
        projectId: parseInt(formData.projectId),
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,

        taskType: formData.taskType,
        taskCategory: formData.taskCategory || null,

        requiresProcurement: formData.requiresProcurement,
        procurementItems: formData.procurementItems || null,
        estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : null,

        involvesBeneficiaries: formData.involvesBeneficiaries,
        beneficiaryTrackingMode: formData.beneficiaryTrackingMode,
        beneficiarySelectionMethod: formData.beneficiarySelectionMethod || null,
        selectionCriteria: formData.selectionCriteria || null,
        targetBeneficiaries: formData.targetBeneficiaries ? parseInt(formData.targetBeneficiaries) : null,

        distributionType: formData.distributionType,
        distributionItems: formData.distributionItems || null,
        cashAmount: formData.cashAmount ? parseFloat(formData.cashAmount) : null,
        distributionDate: formData.distributionDate || null,
        distributionLocation: formData.distributionLocation || null,

        trainingType: formData.trainingType || null,
        trainingDuration: formData.trainingDuration ? parseInt(formData.trainingDuration) : null,
        certificateProvided: formData.certificateProvided,

        mediaCoverageRequired: formData.mediaCoverageRequired,
        mediaCoverageType: formData.mediaCoverageType.length > 0 ? formData.mediaCoverageType : null,
        mediaTeamAssigned: formData.mediaTeamAssigned.length > 0 ? formData.mediaTeamAssigned : null
      };

      const response = await createTask(taskData);

      if (response.success) {
        onTaskCreated?.(response.data);
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setErrors({ submit: error.message || 'Failed to create task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Create New Task</h2>
              <p className="text-indigo-100">Step {currentStep} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-indigo-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all ${
                  step <= currentStep ? 'bg-white' : 'bg-indigo-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Basic Task Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.projectId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a project</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name || project.title}
                      </option>
                    ))}
                  </select>
                  {errors.projectId && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter task title"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter detailed task description"
                    rows="3"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.dueDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.dueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To</label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {staff?.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name || `${member.firstName} ${member.lastName}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Task Type & Specific Fields */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Task Type & Details</h3>

              {/* Task Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Task Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {taskTypes.map(type => {
                    const Icon = type.icon;
                    const isSelected = formData.taskType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleTaskTypeChange(type.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? `border-${type.color}-500 bg-${type.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`mb-2 ${isSelected ? `text-${type.color}-600` : 'text-gray-400'}`} size={24} />
                        <p className={`font-semibold text-sm ${isSelected ? `text-${type.color}-900` : 'text-gray-700'}`}>
                          {type.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Procurement Fields */}
              {formData.taskType === 'Procurement' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                    <Package size={18} />
                    Procurement Details
                  </h4>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Items to Procure <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="procurementItems"
                      value={formData.procurementItems}
                      onChange={handleInputChange}
                      placeholder="List items to procure (e.g., 500 food packs, Medical supplies)"
                      rows="2"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.procurementItems ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.procurementItems && (
                      <p className="mt-1 text-sm text-red-600">{errors.procurementItems}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Budget</label>
                    <input
                      type="number"
                      name="estimatedBudget"
                      value={formData.estimatedBudget}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Beneficiary Fields */}
              {formData.involvesBeneficiaries && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Users size={18} />
                    Beneficiary Details
                  </h4>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tracking Mode</label>
                    <select
                      name="beneficiaryTrackingMode"
                      value={formData.beneficiaryTrackingMode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="None">None</option>
                      <option value="Aggregate">Aggregate (Count only - Ifthar meals)</option>
                      <option value="Individual">Individual (Full tracking - Food packs)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Target Beneficiaries <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="targetBeneficiaries"
                      value={formData.targetBeneficiaries}
                      onChange={handleInputChange}
                      placeholder="Number of beneficiaries"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.targetBeneficiaries ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.targetBeneficiaries && (
                      <p className="mt-1 text-sm text-red-600">{errors.targetBeneficiaries}</p>
                    )}
                  </div>

                  {formData.beneficiaryTrackingMode === 'Individual' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Selection Method</label>
                        <select
                          name="beneficiarySelectionMethod"
                          value={formData.beneficiarySelectionMethod}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select method</option>
                          <option value="Needs-based">Needs-based Assessment</option>
                          <option value="Vulnerability">Vulnerability Score</option>
                          <option value="Geographic">Geographic Targeting</option>
                          <option value="Community">Community Nomination</option>
                          <option value="Random">Random Selection</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Selection Criteria</label>
                        <textarea
                          name="selectionCriteria"
                          value={formData.selectionCriteria}
                          onChange={handleInputChange}
                          placeholder="Describe criteria for selecting beneficiaries"
                          rows="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Distribution Fields */}
              {formData.distributionType !== 'None' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    <Gift size={18} />
                    Distribution Details
                  </h4>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Distribution Type</label>
                    <select
                      name="distributionType"
                      value={formData.distributionType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="None">None</option>
                      <option value="In-Kind">In-Kind (Food, supplies)</option>
                      <option value="Cash">Cash Assistance</option>
                      <option value="Voucher">Voucher</option>
                      <option value="Mixed">Mixed (Cash + In-Kind)</option>
                    </select>
                  </div>

                  {(formData.distributionType === 'In-Kind' || formData.distributionType === 'Mixed') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Items to Distribute <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="distributionItems"
                        value={formData.distributionItems}
                        onChange={handleInputChange}
                        placeholder="List items (e.g., 5kg rice, 1L oil, 1kg dhal)"
                        rows="2"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          errors.distributionItems ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.distributionItems && (
                        <p className="mt-1 text-sm text-red-600">{errors.distributionItems}</p>
                      )}
                    </div>
                  )}

                  {(formData.distributionType === 'Cash' || formData.distributionType === 'Mixed') && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cash Amount (per beneficiary)</label>
                      <input
                        type="number"
                        name="cashAmount"
                        value={formData.cashAmount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Distribution Date</label>
                    <input
                      type="date"
                      name="distributionDate"
                      value={formData.distributionDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Distribution Location</label>
                    <input
                      type="text"
                      name="distributionLocation"
                      value={formData.distributionLocation}
                      onChange={handleInputChange}
                      placeholder="Enter location"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Training Fields */}
              {formData.taskType === 'Training' && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-4">
                  <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <GraduationCap size={18} />
                    Training Details
                  </h4>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Training Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="trainingType"
                      value={formData.trainingType}
                      onChange={handleInputChange}
                      placeholder="e.g., Livelihood Skills, Child Protection"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.trainingType ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.trainingType && (
                      <p className="mt-1 text-sm text-red-600">{errors.trainingType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (hours)</label>
                    <input
                      type="number"
                      name="trainingDuration"
                      value={formData.trainingDuration}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="certificateProvided"
                      checked={formData.certificateProvided}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label className="text-sm font-semibold text-gray-700">Certificate Provided</label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Media Coverage */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Media Coverage (Optional)</h3>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="mediaCoverageRequired"
                  checked={formData.mediaCoverageRequired}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label className="text-sm font-semibold text-gray-700">Media Coverage Required</label>
              </div>

              {formData.mediaCoverageRequired && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Media Coverage Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {mediaTypes.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleMediaTypeToggle(type)}
                          className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                            formData.mediaCoverageType.includes(type)
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {formData.mediaCoverageType.includes(type) && (
                            <CheckCircle className="inline mr-2" size={16} />
                          )}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Assign Media Team</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {staff?.filter(member =>
                        member.department === 'Media' || member.role?.includes('Media')
                      ).map(member => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleMediaTeamToggle(member.id)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            formData.mediaTeamAssigned.includes(member.id)
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {formData.mediaTeamAssigned.includes(member.id) && (
                              <CheckCircle className="text-indigo-600" size={18} />
                            )}
                            <div>
                              <p className="font-semibold text-sm text-gray-900">
                                {member.name || `${member.firstName} ${member.lastName}`}
                              </p>
                              <p className="text-xs text-gray-600">{member.role || member.position}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {staff?.filter(member => member.department === 'Media').length === 0 && (
                      <p className="text-sm text-gray-500 italic">No media team members found</p>
                    )}
                  </div>
                </>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Ready to create!</strong> Review your task details and click Create Task to finalize.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-between">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Create Task
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
