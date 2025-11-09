import React, { useState, useEffect } from 'react';
import { X, Briefcase, DollarSign, Users, Calendar, MapPin, Heart, Target } from 'lucide-react';

const EditProjectForm = ({ isOpen, onClose, project, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    programmeArea: '',
    budget: '',
    spent: '',
    targetBeneficiaries: '',
    beneficiaries: '',
    donor: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
    status: 'Planning',
    progress: 0
  });

  const programmeAreas = [
    'WASH',
    'Orphan Care',
    'Education',
    'Emergency Response',
    'Health',
    'Livelihood',
    'Community Development'
  ];

  // Populate form with project data when modal opens
  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        programmeArea: project.programmeArea || '',
        budget: project.budget || '',
        spent: project.spent || '',
        targetBeneficiaries: project.targetBeneficiaries || '',
        beneficiaries: project.beneficiaries || '',
        donor: project.donor || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        location: project.location || '',
        description: project.description || '',
        status: project.status || 'Planning',
        progress: project.progress || 0
      });
    }
  }, [project, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert string values to numbers
    const projectData = {
      ...formData,
      budget: parseFloat(formData.budget),
      spent: parseFloat(formData.spent) || 0,
      targetBeneficiaries: parseInt(formData.targetBeneficiaries),
      beneficiaries: parseInt(formData.beneficiaries) || 0,
      progress: parseInt(formData.progress) || 0
    };

    onSubmit(project.id, projectData);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !project) return null;

  const budgetUsed = formData.budget ? ((formData.spent / formData.budget) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Edit Project</h2>
              </div>
              <p className="text-purple-100 mt-2">Update project information</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-purple-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Enter project name"
              />
            </div>

            {/* Programme Area & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Programme Area</option>
                  {programmeAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Target size={16} className="text-green-600" />
                  Project Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="Planning">Planning</option>
                  <option value="Implementation">Implementation</option>
                  <option value="Closing">Closing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Budget & Spent */}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., 100000"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <DollarSign size={16} className="text-orange-600" />
                  Amount Spent (LKR)
                </label>
                <input
                  type="number"
                  name="spent"
                  value={formData.spent}
                  onChange={handleChange}
                  min="0"
                  max={formData.budget}
                  step="1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., 50000"
                />
                {formData.budget && formData.spent && (
                  <p className="text-xs text-gray-600 mt-2">
                    Budget utilized: <span className="font-bold">{budgetUsed}%</span>
                  </p>
                )}
              </div>
            </div>

            {/* Target Beneficiaries & Actual Beneficiaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                  <Users size={16} className="text-purple-600" />
                  Current Beneficiaries
                </label>
                <input
                  type="number"
                  name="beneficiaries"
                  value={formData.beneficiaries}
                  onChange={handleChange}
                  min="0"
                  max={formData.targetBeneficiaries}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., 250"
                />
              </div>
            </div>

            {/* Progress */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Target size={16} className="text-blue-600" />
                Project Progress (%)
              </label>
              <input
                type="number"
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="0-100"
              />
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${formData.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Donor */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Enter donor name"
              />
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <MapPin size={16} className="text-red-600" />
                Project Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Enter location/district"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Briefcase size={16} className="text-gray-600" />
                Project Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder="Describe the project objectives and activities"
              />
            </div>
          </div>
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:from-purple-700 hover:to-indigo-800 transition font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Briefcase size={18} />
              Update Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProjectForm;
