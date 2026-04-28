import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Plus, Trash2, Users, Calendar, MapPin } from 'lucide-react';
import { useMEAL } from '../../contexts/MEALContext';

const AddLearningEventWizard = ({ projects, evaluations, onClose }) => {
  const { createLearningEvent } = useMEAL();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Workshop',
    projectId: '',
    evaluationId: '',
    eventDate: '',
    facilitator: '',
    venue: '',
    duration: '',
    totalParticipants: '',
    description: '',
    keyLearnings: '',
    actionPoints: [],
    status: 'Scheduled',
    followUpRequired: false,
    followUpDate: '',
    materials: []
  });
  const [newActionPoint, setNewActionPoint] = useState('');
  const [newMaterial, setNewMaterial] = useState({ title: '', url: '' });
  const [submitting, setSubmitting] = useState(false);

  const eventTypes = [
    'Workshop',
    'Training',
    'Webinar',
    'Conference',
    'Community of Practice',
    'Lesson Learned Session'
  ];

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const project = projects.find(p => p.id === parseInt(formData.projectId));

      await createLearningEvent({
        ...formData,
        projectId: parseInt(formData.projectId),
        projectName: project?.name || '',
        evaluationId: formData.evaluationId ? parseInt(formData.evaluationId) : null,
        totalParticipants: formData.totalParticipants ? parseInt(formData.totalParticipants) : 0,
        duration: formData.duration ? parseInt(formData.duration) : null
      });
      onClose();
    } catch (error) {
      console.error('Error creating learning event:', error);
      alert('Failed to create learning event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const addActionPoint = () => {
    if (newActionPoint.trim() && !formData.actionPoints.includes(newActionPoint.trim())) {
      setFormData({
        ...formData,
        actionPoints: [...formData.actionPoints, newActionPoint.trim()]
      });
      setNewActionPoint('');
    }
  };

  const removeActionPoint = (index) => {
    setFormData({
      ...formData,
      actionPoints: formData.actionPoints.filter((_, i) => i !== index)
    });
  };

  const addMaterial = () => {
    if (newMaterial.title.trim() && newMaterial.url.trim()) {
      setFormData({
        ...formData,
        materials: [...formData.materials, { ...newMaterial }]
      });
      setNewMaterial({ title: '', url: '' });
    }
  };

  const removeMaterial = (index) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Add Learning Event</h2>
              <p className="text-indigo-100">Capture knowledge and share lessons learned</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all ${
                  currentStep >= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <div className="mt-2 text-sm text-indigo-100">
            Step {currentStep} of 3
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Event Details</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-modern w-full"
                  placeholder="e.g., M&E Workshop on Data Quality"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-modern w-full"
                  >
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="input-modern w-full"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Link to Evaluation (Optional)
                </label>
                <select
                  value={formData.evaluationId}
                  onChange={(e) => setFormData({ ...formData, evaluationId: e.target.value })}
                  className="input-modern w-full"
                >
                  <option value="">None - General learning event</option>
                  {evaluations && evaluations
                    .filter(evaluation => !formData.projectId || evaluation.projectId === parseInt(formData.projectId))
                    .map((evaluation) => (
                      <option key={evaluation.id} value={evaluation.id}>
                        {evaluation.title} ({evaluation.type})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Link this learning event to an evaluation to capture lessons from evaluation findings
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} />
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="input-modern w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="input-modern w-full"
                    placeholder="e.g., 4"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Facilitator
                  </label>
                  <input
                    type="text"
                    value={formData.facilitator}
                    onChange={(e) => setFormData({ ...formData, facilitator: e.target.value })}
                    className="input-modern w-full"
                    placeholder="Facilitator name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users size={16} />
                    Total Participants
                  </label>
                  <input
                    type="number"
                    value={formData.totalParticipants}
                    onChange={(e) => setFormData({ ...formData, totalParticipants: e.target.value })}
                    className="input-modern w-full"
                    placeholder="Number of attendees"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  Venue
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="input-modern w-full"
                  placeholder="e.g., Main Office, Conference Hall or Online"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-modern w-full"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern w-full"
                  rows={3}
                  placeholder="Brief description of the event objectives and agenda..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Key Learnings & Action Points */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Knowledge Capture</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Key Learnings
                </label>
                <textarea
                  value={formData.keyLearnings}
                  onChange={(e) => setFormData({ ...formData, keyLearnings: e.target.value })}
                  className="input-modern w-full"
                  rows={6}
                  placeholder="Capture the main insights, lessons learned, and knowledge gained from this event..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Document the key takeaways, best practices, and insights shared during the event
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Action Points
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newActionPoint}
                    onChange={(e) => setNewActionPoint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addActionPoint()}
                    className="input-modern flex-1"
                    placeholder="Add an action point..."
                  />
                  <button
                    onClick={addActionPoint}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.actionPoints.map((point, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-800">{point}</span>
                      <button
                        onClick={() => removeActionPoint(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.actionPoints.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No action points added yet. Add action items that need follow-up.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Follow-up & Materials */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Follow-up & Resources</h3>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Follow-up Required</p>
                    <p className="text-sm text-gray-600">
                      Check if this event requires a follow-up session
                    </p>
                  </div>
                </label>

                {formData.followUpRequired && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      className="input-modern w-full"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Training Materials & Resources
                </label>
                <div className="space-y-3 mb-3">
                  <input
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="input-modern w-full"
                    placeholder="Material title (e.g., Training Presentation)"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newMaterial.url}
                      onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                      className="input-modern flex-1"
                      placeholder="URL or file path"
                    />
                    <button
                      onClick={addMaterial}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.materials.map((material, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{material.title}</p>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {material.url}
                        </a>
                      </div>
                      <button
                        onClick={() => removeMaterial(index)}
                        className="text-red-600 hover:text-red-700 transition-colors ml-3"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.materials.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No materials added yet. Add links to presentations, handouts, or resources.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-800 transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.title || !formData.projectId || !formData.eventDate}
              className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                submitting || !formData.title || !formData.projectId || !formData.eventDate
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-teal-700 text-white hover:from-green-700 hover:to-teal-800'
              }`}
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddLearningEventWizard;
