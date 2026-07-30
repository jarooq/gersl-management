import React, { useState, useEffect } from 'react';
import { useOrphans } from '../../../contexts/OrphanContext';
import { useHR } from '../../../contexts/HRContext';
import {
  X,
  User,
  MapPin,
  School,
  Heart,
  AlertCircle,
  Save,
  Hash,
  Upload,
  FileText
} from 'lucide-react';
import { getDSDivisionsByDistrict, getGNDivisionsByDSDivision, getAllDistricts } from '../../../data/sriLankanDivisions';

const AddOrphanForm = ({ isOpen, onClose, orphanToEdit = null }) => {
  const { addOrphan, updateOrphan, orphans } = useOrphans();
  const { staff } = useHR();
  const isEditMode = !!orphanToEdit;
  const [formData, setFormData] = useState({
    // Personal Information
    orphanId: '',
    fullName: '',
    dateOfBirth: '',
    age: '',
    gender: 'Male',

    // Location Information
    district: '',
    address: '',
    gnDivision: '',
    dsDivision: '',
    latitude: '',
    longitude: '',

    // Coordinator Assignment
    coordinatorId: '',

    // Guardian Information
    guardianName: '',
    guardianNIC: '',
    contactNumber: '',

    // Parent Information
    orphanType: 'Both Parents',
    // Mother Information
    motherName: '',
    motherNIC: '',
    motherOccupation: '',
    motherMonthlyIncome: '',
    motherCauseOfDeath: '',
    motherDateOfDeath: '',
    motherPlaceOfDeath: '',
    motherDCNo: '',
    // Father Information
    fatherName: '',
    fatherCauseOfDeath: '',
    fatherDateOfDeath: '',
    fatherPlaceOfDeath: '',
    fatherDCNo: '',
    fatherPreviousOccupation: '',

    // Education Information
    educationLevel: 'Primary',
    schoolName: '',
    schoolAddress: '',
    currentGrade: '',
    schoolContact: '',
    favouriteSubjects: '',
    childDreamAmbition: '',
    academicPerformance: 'Good',

    // Social & Living Conditions
    levelOfLife: 'Fair',
    houseType: 'Owned',
    houseStatus: 'Good',
    socialConcerns: '',

    // Health Information
    generalHealthStatus: 'Good',
    existingIllness: '',
    treatmentCost: '',
    treatmentPayer: '',
    hasDisabilities: 'No',
    disabilityDetails: '',
    immunizationStatus: 'Up to Date',

    // Document Uploads
    birthCertificate: null,
    deathCertificate: null,
    profilePhoto: null,
    guardianNICDoc: null,
    schoolLetter: null,
    drawingLetter: null,
    otherDoc1: null,
    otherDoc2: null
  });

  const [errors, setErrors] = useState({});
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [divisions, setDivisions] = useState([]);
  const [gnDivisions, setGNDivisions] = useState([]);

  // Filter staff for coordinators - using role from users table
  const coordinators = (staff || []).filter(s =>
    s.status === 'Active' && s.role === 'Orphan Coordinator'
  );

  // Auto-generate Orphan ID when form opens (for add mode) or populate data (for edit mode)
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && orphanToEdit) {
        // Populate form with existing orphan data
        setFormData({
          orphanId: orphanToEdit.orphanId || '',
          fullName: orphanToEdit.fullName || '',
          dateOfBirth: orphanToEdit.dateOfBirth || '',
          age: orphanToEdit.age?.toString() || '',
          district: orphanToEdit.district || '',
          address: orphanToEdit.address || '',
          gnDivision: orphanToEdit.gnDivision || '',
          dsDivision: orphanToEdit.dsDivision || '',
          latitude: orphanToEdit.latitude?.toString() || '',
          longitude: orphanToEdit.longitude?.toString() || '',
          coordinatorId: orphanToEdit.coordinatorId?.toString() || '',
          guardianName: orphanToEdit.guardianName || '',
          guardianNIC: orphanToEdit.guardianNIC || '',
          contactNumber: orphanToEdit.contactNumber || '',
          orphanType: orphanToEdit.orphanType || 'Both Parents',
          motherName: orphanToEdit.motherName || '',
          motherNIC: orphanToEdit.motherNIC || '',
          motherOccupation: orphanToEdit.motherOccupation || '',
          motherMonthlyIncome: orphanToEdit.motherMonthlyIncome || '',
          motherCauseOfDeath: orphanToEdit.motherCauseOfDeath || '',
          motherDateOfDeath: orphanToEdit.motherDateOfDeath || '',
          motherPlaceOfDeath: orphanToEdit.motherPlaceOfDeath || '',
          motherDCNo: orphanToEdit.motherDCNo || '',
          fatherName: orphanToEdit.fatherName || '',
          fatherCauseOfDeath: orphanToEdit.fatherCauseOfDeath || '',
          fatherDateOfDeath: orphanToEdit.fatherDateOfDeath || '',
          fatherPlaceOfDeath: orphanToEdit.fatherPlaceOfDeath || '',
          fatherDCNo: orphanToEdit.fatherDCNo || '',
          fatherPreviousOccupation: orphanToEdit.fatherPreviousOccupation || '',
          educationLevel: orphanToEdit.educationLevel || 'Primary',
          schoolName: orphanToEdit.schoolName || '',
          schoolAddress: orphanToEdit.schoolAddress || '',
          currentGrade: orphanToEdit.currentGrade || '',
          schoolContact: orphanToEdit.schoolContact || '',
          favouriteSubjects: orphanToEdit.favouriteSubjects || '',
          childDreamAmbition: orphanToEdit.childDreamAmbition || '',
          academicPerformance: orphanToEdit.academicPerformance || 'Good',
          levelOfLife: orphanToEdit.levelOfLife || 'Fair',
          houseType: orphanToEdit.houseType || 'Owned',
          houseStatus: orphanToEdit.houseStatus || 'Good',
          socialConcerns: orphanToEdit.socialConcerns || '',
          generalHealthStatus: orphanToEdit.generalHealthStatus || 'Good',
          existingIllness: orphanToEdit.existingIllness || '',
          treatmentCost: orphanToEdit.treatmentCost || '',
          treatmentPayer: orphanToEdit.treatmentPayer || '',
          hasDisabilities: orphanToEdit.hasDisabilities || 'No',
          disabilityDetails: orphanToEdit.disabilityDetails || '',
          immunizationStatus: orphanToEdit.immunizationStatus || 'Up to Date',
          birthCertificate: null,
          deathCertificate: null,
          profilePhoto: null,
          guardianNICDoc: null,
          schoolLetter: null,
          drawingLetter: null,
          otherDoc1: null,
          otherDoc2: null
        });
      } else if (orphans.length > 0) {
        // Generate new Orphan ID for add mode
        const maxId = Math.max(...orphans.map(o => o.id || 0));
        const newId = maxId + 1;
        const orphanId = `GER-ORP-${String(newId).padStart(3, '0')}`;
        setFormData(prev => ({ ...prev, orphanId }));
      } else {
        setFormData(prev => ({ ...prev, orphanId: 'GER-ORP-001' }));
      }
    }
  }, [isOpen, orphans, isEditMode, orphanToEdit]);

  const districts = getAllDistricts();

  const grades = [
    'Pre-School', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11',
    'Grade 12', 'Grade 13', 'O/L', 'A/L', 'Completed'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate age from date of birth
    if (name === 'dateOfBirth' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      setFormData(prev => ({ ...prev, age: age.toString() }));
    }

    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setFormData({
      ...formData,
      district,
      dsDivision: '',
      gnDivision: ''
    });
    const dsDivisionList = getDSDivisionsByDistrict(district);
    setDivisions(dsDivisionList);
    setGNDivisions([]);

    // Clear error when field is updated
    if (errors.district) {
      setErrors(prev => ({ ...prev, district: '' }));
    }
  };

  const handleDSDivisionChange = (e) => {
    const dsDivision = e.target.value;
    setFormData({
      ...formData,
      dsDivision,
      gnDivision: ''
    });
    const gnDivisionList = getGNDivisionsByDSDivision(formData.district, dsDivision);
    setGNDivisions(gnDivisionList);

    // Clear error when field is updated
    if (errors.dsDivision) {
      setErrors(prev => ({ ...prev, dsDivision: '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));

      // Create preview for profile photo
      if (name === 'profilePhoto') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.guardianName.trim()) newErrors.guardianName = 'Guardian name is required';
    if (!formData.guardianNIC.trim()) newErrors.guardianNIC = 'Guardian NIC is required';
    if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
    if (!formData.schoolName.trim()) newErrors.schoolName = 'School name is required';
    if (!formData.currentGrade) newErrors.currentGrade = 'Current grade is required';

    // Document validation (only required for new orphans, not when editing)
    if (!isEditMode) {
      if (!formData.birthCertificate) newErrors.birthCertificate = 'Birth certificate is required';
      if (!formData.deathCertificate) newErrors.deathCertificate = 'Death certificate is required';
      if (!formData.profilePhoto) newErrors.profilePhoto = 'Profile photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create FormData for file upload support (both create and update)
    const formDataToSend = new FormData();

    // Add all text fields to FormData
    Object.keys(formData).forEach(key => {
      const value = formData[key];

      // Skip file fields (they'll be added separately)
      const fileFields = ['profilePhoto', 'birthCertificate', 'deathCertificate', 'guardianNICDoc', 'schoolLetter', 'drawingLetter', 'otherDoc1', 'otherDoc2'];
      if (fileFields.includes(key)) {
        // Add file if it exists
        if (value && value instanceof File) {
          formDataToSend.append(key, value);
        }
        return;
      }

      // Add non-null, non-file values to FormData
      if (value !== null && value !== '') {
        formDataToSend.append(key, value);
      }
    });

    // Add numeric fields with proper conversion - only add if they have values
    if (formData.age) {
      formDataToSend.set('age', parseInt(formData.age) || 0);
    }
    if (formData.latitude) {
      formDataToSend.set('latitude', parseFloat(formData.latitude));
    }
    if (formData.longitude) {
      formDataToSend.set('longitude', parseFloat(formData.longitude));
    }
    if (formData.motherMonthlyIncome) {
      formDataToSend.set('motherMonthlyIncome', parseFloat(formData.motherMonthlyIncome));
    }
    if (formData.treatmentCost) {
      formDataToSend.set('treatmentCost', parseFloat(formData.treatmentCost));
    }

    if (isEditMode) {
      // Update existing orphan
      updateOrphan(orphanToEdit.id, formDataToSend);
    } else {
      // Add default values for new orphan
      formDataToSend.set('stipendAmount', 5000);
      formDataToSend.set('coordinator', 'Not Assigned');
      formDataToSend.set('status', 'Active');
      formDataToSend.set('approvalStatus', 'Pending');
      formDataToSend.set('healthStatus', 'Good');
      formDataToSend.set('registrationDate', new Date().toISOString().split('T')[0]);
      formDataToSend.set('totalStipendPaid', 0);

      addOrphan(formDataToSend);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg2 shadow-pop w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">
              {isEditMode ? 'Edit Orphan' : 'Add New Orphan'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-600 border-b-2 border-pink-200 pb-2">
                <User className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Orphan ID
                  </label>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-pink-500" />
                    <input
                      type="text"
                      name="orphanId"
                      value={formData.orphanId}
                      className="input-modern bg-pink-50 font-semibold text-pink-700"
                      readOnly
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`input-modern ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`input-modern ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.dateOfBirth}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="input-modern bg-ink-50"
                    placeholder="Auto-calculated"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input-modern"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-600 border-b-2 border-pink-200 pb-2">
                <MapPin className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Location Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    className={`input-modern ${errors.district ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.district}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`input-modern ${errors.address ? 'border-red-500' : ''}`}
                    placeholder="Enter address"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.address}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">DS Division</label>
                  <select
                    name="dsDivision"
                    value={formData.dsDivision}
                    onChange={handleDSDivisionChange}
                    disabled={!formData.district}
                    className="input-modern disabled:bg-ink-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select DS Division</option>
                    {divisions.map(division => (
                      <option key={division} value={division}>{division}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">GN Division</label>
                  <select
                    name="gnDivision"
                    value={formData.gnDivision}
                    onChange={handleChange}
                    disabled={!formData.dsDivision}
                    className="input-modern disabled:bg-ink-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select GN Division</option>
                    {gnDivisions.map(gnDivision => (
                      <option key={gnDivision} value={gnDivision}>{gnDivision}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="e.g., 6.9271"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="e.g., 79.8612"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Assign Coordinator
                  </label>
                  <select
                    name="coordinatorId"
                    value={formData.coordinatorId}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="">Select Coordinator (Optional)</option>
                    {coordinators.map(coordinator => (
                      <option key={coordinator.id} value={coordinator.id}>
                        {coordinator.fullName} - {coordinator.position}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-500 mt-1">
                    Assign a field coordinator to this orphan for regular visits and monitoring
                  </p>
                </div>
              </div>
            </div>

            {/* Guardian Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-600 border-b-2 border-pink-200 pb-2">
                <User className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Guardian Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Guardian Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleChange}
                    className={`input-modern ${errors.guardianName ? 'border-red-500' : ''}`}
                    placeholder="Enter guardian name"
                  />
                  {errors.guardianName && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.guardianName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Guardian NIC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="guardianNIC"
                    value={formData.guardianNIC}
                    onChange={handleChange}
                    className={`input-modern ${errors.guardianNIC ? 'border-red-500' : ''}`}
                    placeholder="e.g., 856789012V"
                  />
                  {errors.guardianNIC && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.guardianNIC}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={`input-modern ${errors.contactNumber ? 'border-red-500' : ''}`}
                    placeholder="+94-77-1234567"
                  />
                  {errors.contactNumber && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.contactNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Parent Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-600 border-b-2 border-pink-200 pb-2">
                <Heart className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Parent Information</h3>
              </div>

              {/* Orphan Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink-700 mb-1">Orphan Type</label>
                  <select
                    name="orphanType"
                    value={formData.orphanType}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="Both Parents">Both Parents (Father & Mother Deceased)</option>
                    <option value="Father Only">Father Only (Father Deceased)</option>
                    <option value="Mother Only">Mother Only (Mother Deceased)</option>
                  </select>
                </div>
              </div>

              {/* Mother Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-ink-700 mt-4">Mother's Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Mother's Name</label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="Enter mother's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Mother's NIC No.</label>
                    <input
                      type="text"
                      name="motherNIC"
                      value={formData.motherNIC}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., 856789012V"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Mother's Occupation</label>
                    <input
                      type="text"
                      name="motherOccupation"
                      value={formData.motherOccupation}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="Enter occupation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Mother's Monthly Income (LKR)</label>
                    <input
                      type="number"
                      name="motherMonthlyIncome"
                      value={formData.motherMonthlyIncome}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="e.g., 50000"
                    />
                  </div>
                </div>

                {/* Mother Death Details - Show if Mother is deceased */}
                {(formData.orphanType === 'Both Parents' || formData.orphanType === 'Mother Only') && (
                  <div className="bg-red-50 p-4 rounded-lg space-y-4">
                    <h5 className="text-sm font-semibold text-red-900">Mother's Death Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Cause of Death</label>
                        <input
                          type="text"
                          name="motherCauseOfDeath"
                          value={formData.motherCauseOfDeath}
                          onChange={handleChange}
                          className="input-modern"
                          placeholder="Enter cause of death"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Date of Death</label>
                        <input
                          type="date"
                          name="motherDateOfDeath"
                          value={formData.motherDateOfDeath}
                          onChange={handleChange}
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Place of Death</label>
                        <input
                          type="text"
                          name="motherPlaceOfDeath"
                          value={formData.motherPlaceOfDeath}
                          onChange={handleChange}
                          className="input-modern"
                          placeholder="Enter place of death"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">DC No.</label>
                        <input
                          type="text"
                          name="motherDCNo"
                          value={formData.motherDCNo}
                          onChange={handleChange}
                          className="input-modern"
                          placeholder="Death Certificate Number"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Father Information */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-ink-700 mt-4">Father's Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Father's Name</label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="Enter father's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Father's Previous Occupation</label>
                    <input
                      type="text"
                      name="fatherPreviousOccupation"
                      value={formData.fatherPreviousOccupation}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="Enter previous occupation"
                    />
                  </div>
                </div>

                {/* Father Death Details - Show if Father is deceased */}
                {(formData.orphanType === 'Both Parents' || formData.orphanType === 'Father Only') && (
                  <div className="bg-red-50 p-4 rounded-lg space-y-4">
                    <h5 className="text-sm font-semibold text-red-900">Father's Death Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Cause of Death</label>
                        <input
                          type="text"
                          name="fatherCauseOfDeath"
                          value={formData.fatherCauseOfDeath}
                          onChange={handleChange}
                          className="input-modern"
                          placeholder="Enter cause of death"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Date of Death</label>
                        <input
                          type="date"
                          name="fatherDateOfDeath"
                          value={formData.fatherDateOfDeath}
                          onChange={handleChange}
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Place of Death</label>
                        <input
                          type="text"
                          name="fatherPlaceOfDeath"
                          value={formData.fatherPlaceOfDeath}
                          onChange={handleChange}
                          className="input-modern"
                          placeholder="Enter place of death"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">DC No.</label>
                        <input
                          type="text"
                          name="fatherDCNo"
                          value={formData.fatherDCNo}
                          onChange={handleChange}
                          className="input-modern"
                          placeholder="Death Certificate Number"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Education Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-600 border-b-2 border-pink-200 pb-2">
                <School className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Education Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Education Level</label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="Pre-School">Pre-School</option>
                    <option value="Primary">Primary (Grade 1-5)</option>
                    <option value="Secondary">Secondary (Grade 6-11)</option>
                    <option value="Advanced Level">Advanced Level (Grade 12-13)</option>
                    <option value="Vocational">Vocational Training</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    Class/Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="currentGrade"
                    value={formData.currentGrade}
                    onChange={handleChange}
                    className={`input-modern ${errors.currentGrade ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                  {errors.currentGrade && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.currentGrade}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    School / Madrasa Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    className={`input-modern ${errors.schoolName ? 'border-red-500' : ''}`}
                    placeholder="Enter school or madrasa name"
                  />
                  {errors.schoolName && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.schoolName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">School/Madrasa Address</label>
                  <input
                    type="text"
                    name="schoolAddress"
                    value={formData.schoolAddress}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="Enter school/madrasa address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">School Contact</label>
                  <input
                    type="text"
                    name="schoolContact"
                    value={formData.schoolContact}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="School contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Favourite Subjects</label>
                  <input
                    type="text"
                    name="favouriteSubjects"
                    value={formData.favouriteSubjects}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="e.g., Mathematics, Science, English"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink-700 mb-1">Child's Dream / Ambition</label>
                  <input
                    type="text"
                    name="childDreamAmbition"
                    value={formData.childDreamAmbition}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="What does the child want to become?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Academic Performance</label>
                  <select
                    name="academicPerformance"
                    value={formData.academicPerformance}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Below Average">Below Average</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Social & Living Conditions Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-600 border-b-2 border-pink-200 pb-2">
                <Heart className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Social & Living Conditions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Level of Life</label>
                  <select
                    name="levelOfLife"
                    value={formData.levelOfLife}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="Bad">Bad</option>
                    <option value="Fair">Fair</option>
                    <option value="Good">Good</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">House Type</label>
                  <select
                    name="houseType"
                    value={formData.houseType}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="Owned">Owned</option>
                    <option value="Rented">Rented</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">House Status</label>
                  <select
                    name="houseStatus"
                    value={formData.houseStatus}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="Bad">Bad</option>
                    <option value="Fair">Fair</option>
                    <option value="Good">Good</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Any Other Social Concerns</label>
                  <input
                    type="text"
                    name="socialConcerns"
                    value={formData.socialConcerns}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="Enter any social concerns"
                  />
                </div>
              </div>
            </div>

            {/* Health Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-600 border-b-2 border-pink-200 pb-2">
                <Heart className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Health Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">General Health Status</label>
                  <select
                    name="generalHealthStatus"
                    value={formData.generalHealthStatus}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Medical Attention">Needs Medical Attention</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Existing Illness / Medical Condition</label>
                  <input
                    type="text"
                    name="existingIllness"
                    value={formData.existingIllness}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="Enter any medical conditions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Cost of Treatment (LKR)</label>
                  <input
                    type="number"
                    name="treatmentCost"
                    value={formData.treatmentCost}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="Enter treatment cost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Who Pays for the Treatment?</label>
                  <input
                    type="text"
                    name="treatmentPayer"
                    value={formData.treatmentPayer}
                    onChange={handleChange}
                    className="input-modern"
                    placeholder="e.g., Family, NGO, Government"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Disabilities / Special Needs</label>
                  <select
                    name="hasDisabilities"
                    value={formData.hasDisabilities}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {formData.hasDisabilities === 'Yes' && (
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">If Yes, Specify</label>
                    <input
                      type="text"
                      name="disabilityDetails"
                      value={formData.disabilityDetails}
                      onChange={handleChange}
                      className="input-modern"
                      placeholder="Please specify the disability"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">Immunization Card Status</label>
                  <select
                    name="immunizationStatus"
                    value={formData.immunizationStatus}
                    onChange={handleChange}
                    className="input-modern"
                  >
                    <option value="Up to Date">Up to Date</option>
                    <option value="Missing">Missing</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-pink-600 border-b-2 border-pink-200 pb-2">
                <Upload className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Documents Upload</h3>
              </div>

              {/* Profile Photo with Preview */}
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-ink-700 mb-1">
                      3. Profile Photo (PP Size) <span className="text-pink-500">*</span>
                    </label>
                    <input
                      type="file"
                      name="profilePhoto"
                      onChange={handleFileChange}
                      accept="image/*"
                      className={`input-modern ${errors.profilePhoto ? 'border-red-500' : ''}`}
                    />
                    {errors.profilePhoto ? (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.profilePhoto}
                      </p>
                    ) : (
                      <p className="text-xs text-ink-500 mt-1">Passport size photo (JPEG, PNG)</p>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    {profilePhotoPreview ? (
                      <div className="relative">
                        <img
                          src={profilePhotoPreview}
                          alt="Profile Preview"
                          className="w-24 h-32 object-cover rounded-lg border-2 border-pink-300 shadow-md"
                        />
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                          <FileText size={12} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-32 bg-ink-200 rounded-lg border-2 border-dashed border-ink-300 flex items-center justify-center">
                        <User className="w-8 h-8 text-ink-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Other Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    1. Birth Certificate (BC) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="birthCertificate"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className={`input-modern ${errors.birthCertificate ? 'border-red-500' : ''}`}
                  />
                  {errors.birthCertificate ? (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.birthCertificate}
                    </p>
                  ) : formData.birthCertificate ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <FileText size={12} /> {formData.birthCertificate.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    2. Death Certificate (DC) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="deathCertificate"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className={`input-modern ${errors.deathCertificate ? 'border-red-500' : ''}`}
                  />
                  {errors.deathCertificate ? (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.deathCertificate}
                    </p>
                  ) : formData.deathCertificate ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <FileText size={12} /> {formData.deathCertificate.name}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    4. Guardian NIC
                  </label>
                  <input
                    type="file"
                    name="guardianNICDoc"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="input-modern"
                  />
                  {formData.guardianNICDoc && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <FileText size={12} /> {formData.guardianNICDoc.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    5. School/Madrasa Letter
                  </label>
                  <input
                    type="file"
                    name="schoolLetter"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="input-modern"
                  />
                  {formData.schoolLetter && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <FileText size={12} /> {formData.schoolLetter.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    6. Drawing/Letter from Child
                  </label>
                  <input
                    type="file"
                    name="drawingLetter"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="input-modern"
                  />
                  {formData.drawingLetter && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <FileText size={12} /> {formData.drawingLetter.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    7. Other Document 1
                  </label>
                  <input
                    type="file"
                    name="otherDoc1"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="input-modern"
                  />
                  {formData.otherDoc1 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <FileText size={12} /> {formData.otherDoc1.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">
                    8. Other Document 2
                  </label>
                  <input
                    type="file"
                    name="otherDoc2"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="input-modern"
                  />
                  {formData.otherDoc2 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <FileText size={12} /> {formData.otherDoc2.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* Footer - Fixed at bottom */}
        <div className="bg-ink-50 px-6 py-4 border-t border-ink-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-primary bg-orange-500 text-white flex items-center gap-2"
          >
            <Save size={18} />
            {isEditMode ? 'Update Orphan' : 'Save Orphan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddOrphanForm;
