import React, { useState } from 'react';
import {
  X, Save, Calendar, User, Home, Heart, GraduationCap,
  Activity, Package, Camera, FileText, AlertCircle, CheckCircle, ClipboardList
} from 'lucide-react';

const VisitForm = ({ orphan, onClose, onSubmit }) => {
  const [activeSection, setActiveSection] = useState('visit-details');
  const [formData, setFormData] = useState({
    // Visit Details
    visitDate: new Date().toISOString().split('T')[0],
    coordinator: orphan?.assignedCoordinator?.name || '',
    visitType: 'Regular Monthly Visit',
    visitPurpose: '',

    // Orphan Condition Assessment
    physicalCondition: 'Good',
    mentalCondition: 'Good',
    emotionalState: 'Good',
    appearanceHygiene: 'Good',
    behaviorObservation: '',

    // Family & Household Situation
    guardianPresent: 'Yes',
    guardianCondition: 'Good',
    householdCondition: 'Good',
    familyConcerns: '',
    householdMembers: '',
    householdIncome: '',

    // Academic Progress
    academic: 'Good',
    attendance: '',
    schoolBehavior: 'Good',
    homeworkCompletion: 'Regular',
    teacherFeedback: '',
    examResults: '',
    academicChallenges: '',

    // Spiritual Development
    spiritual: 'Good',
    religiousEducation: 'Regular',
    moralDevelopment: 'Good',
    characterProgress: '',

    // Health Status
    health: 'Good',
    weightHeight: '',
    medicalIssues: '',
    medicationRequired: 'No',
    medicationDetails: '',
    lastCheckup: '',
    healthConcerns: '',

    // Support Distribution
    supportDistributed: [],
    monthlyStipend: false,
    stipendAmount: '',
    foodPack: false,
    ramadanPack: false,
    qurbanMeat: false,
    schoolSupplies: false,
    bicycle: false,
    otherSupport: '',
    distributionReceipt: '',

    // Photos & Documentation
    photos: 0,
    photoDescription: '',
    documentsCollected: '',

    // Coordinator Observations
    remarks: '',
    recommendations: '',
    urgentActions: '',
    followUpRequired: 'No',

    // Next Visit Planning
    nextVisitDate: '',
    nextVisitPurpose: '',
    actionItems: '',

    // Current Needs Identified
    currentNeeds: []
  });

  const sections = [
    { id: 'visit-details', label: 'Visit Details', icon: Calendar },
    { id: 'orphan-condition', label: 'Orphan Condition', icon: User },
    { id: 'family-household', label: 'Family & Household', icon: Home },
    { id: 'academic-progress', label: 'Academic Progress', icon: GraduationCap },
    { id: 'spiritual-dev', label: 'Spiritual Development', icon: Heart },
    { id: 'health-status', label: 'Health Status', icon: Activity },
    { id: 'current-needs', label: 'Current Needs', icon: ClipboardList },
    { id: 'support-distribution', label: 'Support Distributed', icon: Package },
    { id: 'photos-docs', label: 'Photos & Docs', icon: Camera },
    { id: 'observations', label: 'Observations', icon: FileText }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(orphan.id, formData);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSupportChange = (supportType) => {
    setFormData(prev => ({
      ...prev,
      supportDistributed: prev.supportDistributed.includes(supportType)
        ? prev.supportDistributed.filter(s => s !== supportType)
        : [...prev.supportDistributed, supportType]
    }));
  };

  const [newNeed, setNewNeed] = useState({
    needType: '',
    needCategory: 'Education',
    description: '',
    quantity: 1,
    estimatedCost: '',
    urgency: 'Medium'
  });

  const addNeed = () => {
    if (!newNeed.needType) {
      alert('Please enter a need type');
      return;
    }

    setFormData(prev => ({
      ...prev,
      currentNeeds: [...prev.currentNeeds, { ...newNeed, id: Date.now() }]
    }));

    setNewNeed({
      needType: '',
      needCategory: 'Education',
      description: '',
      quantity: 1,
      estimatedCost: '',
      urgency: 'Medium'
    });
  };

  const removeNeed = (needId) => {
    setFormData(prev => ({
      ...prev,
      currentNeeds: prev.currentNeeds.filter(n => n.id !== needId)
    }));
  };

  const renderSection = () => {
    switch(activeSection) {
      case 'visit-details':
        return (
          <div className="space-y-4">
            <SectionTitle icon={Calendar} title="Visit Information" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Visit Date *
                </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Coordinator Name *
                </label>
                <input
                  type="text"
                  name="coordinator"
                  value={formData.coordinator}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter coordinator name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Visit Type *
              </label>
              <select
                name="visitType"
                value={formData.visitType}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="Regular Monthly Visit">Regular Monthly Visit</option>
                <option value="Emergency Visit">Emergency Visit</option>
                <option value="Follow-up Visit">Follow-up Visit</option>
                <option value="Support Distribution">Support Distribution</option>
                <option value="Health Check">Health Check</option>
                <option value="School Visit">School Visit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Visit Purpose
              </label>
              <textarea
                name="visitPurpose"
                value={formData.visitPurpose}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Describe the main purpose of this visit..."
              ></textarea>
            </div>
          </div>
        );

      case 'orphan-condition':
        return (
          <div className="space-y-4">
            <SectionTitle icon={User} title="Orphan Condition Assessment" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Physical Condition *
                </label>
                <select
                  name="physicalCondition"
                  value={formData.physicalCondition}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Mental/Emotional Condition *
                </label>
                <select
                  name="mentalCondition"
                  value={formData.mentalCondition}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Excellent">Excellent - Happy & Stable</option>
                  <option value="Good">Good - Generally Positive</option>
                  <option value="Fair">Fair - Some Concerns</option>
                  <option value="Poor">Poor - Needs Support</option>
                  <option value="Critical">Critical - Urgent Attention</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Emotional State *
                </label>
                <select
                  name="emotionalState"
                  value={formData.emotionalState}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Good">Happy & Positive</option>
                  <option value="Stable">Stable</option>
                  <option value="Anxious">Anxious/Worried</option>
                  <option value="Sad">Sad/Withdrawn</option>
                  <option value="Distressed">Distressed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Appearance & Hygiene *
                </label>
                <select
                  name="appearanceHygiene"
                  value={formData.appearanceHygiene}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Good">Clean & Well Groomed</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Needs Improvement</option>
                  <option value="Concerning">Concerning</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Behavior Observation
              </label>
              <textarea
                name="behaviorObservation"
                value={formData.behaviorObservation}
                onChange={handleChange}
                rows="4"
                className="input-field"
                placeholder="Describe the child's behavior, demeanor, and interaction during visit..."
              ></textarea>
            </div>
          </div>
        );

      case 'family-household':
        return (
          <div className="space-y-4">
            <SectionTitle icon={Home} title="Family & Household Situation" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Guardian Present During Visit *
                </label>
                <select
                  name="guardianPresent"
                  value={formData.guardianPresent}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Partially">Partially</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Guardian Condition *
                </label>
                <select
                  name="guardianCondition"
                  value={formData.guardianCondition}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Good">Good - Capable</option>
                  <option value="Fair">Fair - Managing</option>
                  <option value="Poor">Poor - Struggling</option>
                  <option value="Critical">Critical - Unable to Cope</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Household Condition *
                </label>
                <select
                  name="householdCondition"
                  value={formData.householdCondition}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Good">Good - Clean & Safe</option>
                  <option value="Average">Average - Acceptable</option>
                  <option value="Poor">Poor - Needs Improvement</option>
                  <option value="Unsafe">Unsafe/Hazardous</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Number of Household Members
                </label>
                <input
                  type="number"
                  name="householdMembers"
                  value={formData.householdMembers}
                  onChange={handleChange}
                  min="1"
                  className="input-field"
                  placeholder="Total people in household"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Estimated Monthly Household Income (LKR)
              </label>
              <input
                type="number"
                name="householdIncome"
                value={formData.householdIncome}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter approximate monthly income"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Family Concerns / Issues
              </label>
              <textarea
                name="familyConcerns"
                value={formData.familyConcerns}
                onChange={handleChange}
                rows="4"
                className="input-field"
                placeholder="Document any family issues, concerns, or changes in situation..."
              ></textarea>
            </div>
          </div>
        );

      case 'academic-progress':
        return (
          <div className="space-y-4">
            <SectionTitle icon={GraduationCap} title="Academic Progress" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Academic Performance *
                </label>
                <select
                  name="academic"
                  value={formData.academic}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Excellent">Excellent (Top 10%)</option>
                  <option value="Good">Good (Above Average)</option>
                  <option value="Average">Average</option>
                  <option value="Below Average">Below Average</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  School Attendance (%) *
                </label>
                <input
                  type="number"
                  name="attendance"
                  value={formData.attendance}
                  onChange={handleChange}
                  required
                  min="0"
                  max="100"
                  className="input-field"
                  placeholder="Enter attendance percentage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  School Behavior *
                </label>
                <select
                  name="schoolBehavior"
                  value={formData.schoolBehavior}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Good">Excellent Behavior</option>
                  <option value="Average">Good Behavior</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Problematic">Problematic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Homework Completion *
                </label>
                <select
                  name="homeworkCompletion"
                  value={formData.homeworkCompletion}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Regular">Always Completed</option>
                  <option value="Mostly">Mostly Completed</option>
                  <option value="Sometimes">Sometimes Completed</option>
                  <option value="Rarely">Rarely Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Recent Exam Results
              </label>
              <textarea
                name="examResults"
                value={formData.examResults}
                onChange={handleChange}
                rows="2"
                className="input-field"
                placeholder="Enter recent test scores or exam results..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Teacher Feedback
              </label>
              <textarea
                name="teacherFeedback"
                value={formData.teacherFeedback}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Enter feedback from teachers if collected during visit..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Academic Challenges
              </label>
              <textarea
                name="academicChallenges"
                value={formData.academicChallenges}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Document any academic challenges or learning difficulties..."
              ></textarea>
            </div>
          </div>
        );

      case 'spiritual-dev':
        return (
          <div className="space-y-4">
            <SectionTitle icon={Heart} title="Spiritual Development" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Spiritual Progress *
                </label>
                <select
                  name="spiritual"
                  value={formData.spiritual}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Religious Education *
                </label>
                <select
                  name="religiousEducation"
                  value={formData.religiousEducation}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Regular">Regular Attendance</option>
                  <option value="Occasional">Occasional Attendance</option>
                  <option value="Rarely">Rarely Attends</option>
                  <option value="Not Attending">Not Attending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Moral Development *
                </label>
                <select
                  name="moralDevelopment"
                  value={formData.moralDevelopment}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Good">Strong Moral Values</option>
                  <option value="Average">Developing Well</option>
                  <option value="Needs Guidance">Needs Guidance</option>
                  <option value="Concerning">Concerning</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Character Progress & Observations
              </label>
              <textarea
                name="characterProgress"
                value={formData.characterProgress}
                onChange={handleChange}
                rows="4"
                className="input-field"
                placeholder="Document spiritual activities, character development, and moral progress..."
              ></textarea>
            </div>
          </div>
        );

      case 'health-status':
        return (
          <div className="space-y-4">
            <SectionTitle icon={Activity} title="Health Status" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  General Health Status *
                </label>
                <select
                  name="health"
                  value={formData.health}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Needs Attention">Needs Urgent Attention</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Medication Required *
                </label>
                <select
                  name="medicationRequired"
                  value={formData.medicationRequired}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Weight & Height Measurements
              </label>
              <input
                type="text"
                name="weightHeight"
                value={formData.weightHeight}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Weight: 35kg, Height: 140cm"
              />
            </div>

            {formData.medicationRequired === 'Yes' && (
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Medication Details
                </label>
                <textarea
                  name="medicationDetails"
                  value={formData.medicationDetails}
                  onChange={handleChange}
                  rows="3"
                  className="input-field"
                  placeholder="List medications, dosages, and treatment plan..."
                ></textarea>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Medical Issues / Illnesses
              </label>
              <textarea
                name="medicalIssues"
                value={formData.medicalIssues}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Document any current or recent medical issues..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Last Medical Checkup Date
              </label>
              <input
                type="date"
                name="lastCheckup"
                value={formData.lastCheckup}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Health Concerns
              </label>
              <textarea
                name="healthConcerns"
                value={formData.healthConcerns}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Document any health concerns or observations..."
              ></textarea>
            </div>
          </div>
        );

      case 'current-needs':
        return (
          <div className="space-y-4">
            <SectionTitle icon={ClipboardList} title="Current Needs Identified During Visit" />

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">Recording Orphan Needs</p>
                  <p className="text-sm text-yellow-700">
                    Document any needs or requirements identified during your visit (e.g., school supplies, medical items, clothing, household items). These will be saved for approval and tracking.
                  </p>
                </div>
              </div>
            </div>

            {/* Add New Need Form */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h4 className="font-semibold text-blue-900 mb-4">Add New Need</h4>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Need Type *
                    </label>
                    <input
                      type="text"
                      value={newNeed.needType}
                      onChange={(e) => setNewNeed(prev => ({ ...prev, needType: e.target.value }))}
                      className="input-field"
                      placeholder="e.g., School books, Uniform, Medicine"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={newNeed.needCategory}
                      onChange={(e) => setNewNeed(prev => ({ ...prev, needCategory: e.target.value }))}
                      className="input-field"
                    >
                      <option value="Education">Education</option>
                      <option value="Health">Health / Medical</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Food">Food / Nutrition</option>
                      <option value="Household">Household Items</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={newNeed.quantity}
                      onChange={(e) => setNewNeed(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      min="1"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Urgency *
                    </label>
                    <select
                      value={newNeed.urgency}
                      onChange={(e) => setNewNeed(prev => ({ ...prev, urgency: e.target.value }))}
                      className="input-field"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical / Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Estimated Cost (LKR)
                  </label>
                  <input
                    type="number"
                    value={newNeed.estimatedCost}
                    onChange={(e) => setNewNeed(prev => ({ ...prev, estimatedCost: e.target.value }))}
                    className="input-field"
                    placeholder="Approximate cost if known"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Description / Details
                  </label>
                  <textarea
                    value={newNeed.description}
                    onChange={(e) => setNewNeed(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="input-field"
                    placeholder="Provide additional details about this need..."
                  ></textarea>
                </div>

                <button
                  type="button"
                  onClick={addNeed}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  + Add Need to List
                </button>
              </div>
            </div>

            {/* Current Needs List */}
            {formData.currentNeeds.length > 0 && (
              <div className="bg-white border border-ink-100 rounded-lg p-4">
                <h4 className="font-semibold text-ink-900 mb-3">
                  Needs to be Recorded ({formData.currentNeeds.length})
                </h4>

                <div className="space-y-3">
                  {formData.currentNeeds.map((need) => (
                    <div
                      key={need.id}
                      className="flex items-start gap-3 p-3 bg-ink-50 rounded-lg border border-ink-100"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-ink-900">{need.needType}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            need.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                            need.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                            need.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-ink-100 text-ink-700'
                          }`}>
                            {need.urgency}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                            {need.needCategory}
                          </span>
                        </div>
                        <p className="text-sm text-ink-600">
                          Qty: {need.quantity}
                          {need.estimatedCost && ` • Est. Cost: LKR ${need.estimatedCost}`}
                        </p>
                        {need.description && (
                          <p className="text-sm text-ink-500 mt-1">{need.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNeed(need.id)}
                        className="text-red-600 hover:text-red-800 transition p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'support-distribution':
        return (
          <div className="space-y-4">
            <SectionTitle icon={Package} title="Support Distributed During Visit" />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium mb-3">
                Select all support items distributed during this visit:
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="checkbox"
                    checked={formData.monthlyStipend}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.checked) handleSupportChange('Monthly Stipend');
                      else setFormData(prev => ({
                        ...prev,
                        supportDistributed: prev.supportDistributed.filter(s => s !== 'Monthly Stipend')
                      }));
                    }}
                    name="monthlyStipend"
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-ink-900">Monthly Stipend</span>
                </label>

                {formData.monthlyStipend && (
                  <div className="ml-8">
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Stipend Amount (LKR)
                    </label>
                    <input
                      type="number"
                      name="stipendAmount"
                      value={formData.stipendAmount}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Enter amount"
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="checkbox"
                    checked={formData.foodPack}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.checked) handleSupportChange('Food Pack');
                      else setFormData(prev => ({
                        ...prev,
                        supportDistributed: prev.supportDistributed.filter(s => s !== 'Food Pack')
                      }));
                    }}
                    name="foodPack"
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-ink-900">Monthly Food Pack</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="checkbox"
                    checked={formData.ramadanPack}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.checked) handleSupportChange('Ramadan Food Pack');
                      else setFormData(prev => ({
                        ...prev,
                        supportDistributed: prev.supportDistributed.filter(s => s !== 'Ramadan Food Pack')
                      }));
                    }}
                    name="ramadanPack"
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-ink-900">Ramadan Food Pack (Seasonal)</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="checkbox"
                    checked={formData.qurbanMeat}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.checked) handleSupportChange('Qurban Meat');
                      else setFormData(prev => ({
                        ...prev,
                        supportDistributed: prev.supportDistributed.filter(s => s !== 'Qurban Meat')
                      }));
                    }}
                    name="qurbanMeat"
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-ink-900">Qurban Meat (Seasonal)</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="checkbox"
                    checked={formData.schoolSupplies}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.checked) handleSupportChange('School Supplies/Bag');
                      else setFormData(prev => ({
                        ...prev,
                        supportDistributed: prev.supportDistributed.filter(s => s !== 'School Supplies/Bag')
                      }));
                    }}
                    name="schoolSupplies"
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-ink-900">School Supplies / School Bag</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-50 transition">
                  <input
                    type="checkbox"
                    checked={formData.bicycle}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.checked) handleSupportChange('Bicycle');
                      else setFormData(prev => ({
                        ...prev,
                        supportDistributed: prev.supportDistributed.filter(s => s !== 'Bicycle')
                      }));
                    }}
                    name="bicycle"
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="font-medium text-ink-900">Bicycle</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Other Support Items
              </label>
              <textarea
                name="otherSupport"
                value={formData.otherSupport}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="List any other support items distributed..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Distribution Receipt Number
              </label>
              <input
                type="text"
                name="distributionReceipt"
                value={formData.distributionReceipt}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter receipt/tracking number"
              />
            </div>
          </div>
        );

      case 'photos-docs':
        return (
          <div className="space-y-4">
            <SectionTitle icon={Camera} title="Photos & Documentation" />

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Number of Photos Taken *
              </label>
              <input
                type="number"
                name="photos"
                value={formData.photos}
                onChange={handleChange}
                min="0"
                required
                className="input-field"
                placeholder="Enter number of photos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Photo Description
              </label>
              <textarea
                name="photoDescription"
                value={formData.photoDescription}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Describe what photos were taken (e.g., child with family, home exterior, support distribution)..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Documents Collected
              </label>
              <textarea
                name="documentsCollected"
                value={formData.documentsCollected}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="List any documents collected during visit (e.g., report cards, medical reports, receipts)..."
              ></textarea>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">Photo Guidelines</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Take at least 2 photos per visit (child & home/family)</li>
                    <li>• Ensure child's face is clearly visible</li>
                    <li>• Include photos of support items being distributed</li>
                    <li>• Store photos with visit date and orphan ID</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'observations':
        return (
          <div className="space-y-4">
            <SectionTitle icon={FileText} title="Coordinator Observations & Recommendations" />

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                General Remarks / Visit Summary *
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                required
                rows="5"
                className="input-field"
                placeholder="Provide a comprehensive summary of the visit, overall observations, and any significant findings..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Recommendations & Action Plan
              </label>
              <textarea
                name="recommendations"
                value={formData.recommendations}
                onChange={handleChange}
                rows="4"
                className="input-field"
                placeholder="List recommendations for improving the orphan's situation, required interventions, or action items..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Urgent Actions Required
              </label>
              <textarea
                name="urgentActions"
                value={formData.urgentActions}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Document any urgent actions that need immediate attention..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Follow-up Required? *
              </label>
              <select
                name="followUpRequired"
                value={formData.followUpRequired}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="No">No Follow-up Needed</option>
                <option value="Yes">Yes - Follow-up Required</option>
                <option value="Urgent">Yes - Urgent Follow-up</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Next Visit Planning
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Next Visit Date
                  </label>
                  <input
                    type="date"
                    name="nextVisitDate"
                    value={formData.nextVisitDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Next Visit Purpose
                  </label>
                  <input
                    type="text"
                    name="nextVisitPurpose"
                    value={formData.nextVisitPurpose}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Follow-up on health issue, Distribute school supplies"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Action Items for Next Visit
                  </label>
                  <textarea
                    name="actionItems"
                    value={formData.actionItems}
                    onChange={handleChange}
                    rows="3"
                    className="input-field"
                    placeholder="List specific action items to address during next visit..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl flex-shrink-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Record Visit Log</h2>
              <p className="text-blue-100 text-sm">Orphan: {orphan?.fullName} • ID: {orphan?.orphanId}</p>
              <p className="text-blue-200 text-xs mt-1">District: {orphan?.district}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-ink-50 border-b border-ink-100 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 flex-shrink-0">
          <div className="flex min-w-max p-2 gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-ink-700 hover:bg-ink-100 border border-ink-100'
                  }`}
                >
                  <Icon size={16} />
                  {section.label}
                  {activeSection === section.id && (
                    <CheckCircle size={14} className="ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderSection()}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t border-ink-100 p-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-ink-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-md"
            >
              <Save size={20} />
              Save Visit Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper Components
const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 pb-3 mb-4 border-b-2 border-blue-200">
    <div className="bg-blue-100 p-2 rounded-lg">
      <Icon className="w-5 h-5 text-blue-600" />
    </div>
    <h3 className="text-lg font-bold text-ink-900">{title}</h3>
  </div>
);

export default VisitForm;
