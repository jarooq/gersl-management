import React, { useState, useEffect } from 'react';
import { useBeneficiaries } from '../../contexts/BeneficiaryContext';
import { useAuth } from '../../contexts/AuthContext';
import { getDSDivisionsByDistrict, getGNDivisionsByDSDivision, getAllDistricts } from '../../data/sriLankanDivisions';
import {
  X,
  AlertTriangle,
  Check,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  Mail,
  FileText,
  Heart,
  Search
} from 'lucide-react';
import './BeneficiaryFormModal.css';

// Beneficiary Types for filtering and reporting
const BENEFICIARY_TYPES = [
  'Widow',
  'Disabled',
  'Poor Family',
  'Most Needy',
  'Zakat Eligible Family',
  'Orphan Family',
  'Elderly',
  'Single Parent',
  'Chronic Illness',
  'Other'
];

const BeneficiaryFormModal = ({ isOpen, onClose, beneficiary = null }) => {
  const { currentUser: user } = useAuth();
  const { addBeneficiary, updateBeneficiary, checkDuplicate } = useBeneficiaries();

  const [formData, setFormData] = useState({
    nic: '',
    full_name: '',
    date_of_birth: '',
    gender: '',
    beneficiary_type: '',
    primary_phone: '',
    secondary_phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    ds_division: '',
    gn_division: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    is_vulnerable: false,
    vulnerability_type: '',
    vulnerability_notes: '',
    household_size: '',
    monthly_income: '',
    occupation: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });

  const [divisions, setDivisions] = useState([]);
  const [gnDivisions, setGNDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [nicCheckStatus, setNicCheckStatus] = useState(null); // null, 'checking', 'available', 'duplicate'
  const [duplicateData, setDuplicateData] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const isEditMode = !!beneficiary;
  const allDistricts = getAllDistricts();

  useEffect(() => {
    if (isOpen) {
      if (beneficiary) {
        setFormData({
          nic: beneficiary.nic || '',
          full_name: beneficiary.full_name || '',
          date_of_birth: beneficiary.date_of_birth?.split('T')[0] || '',
          gender: beneficiary.gender || '',
          beneficiary_type: beneficiary.beneficiary_type || '',
          primary_phone: beneficiary.primary_phone || '',
          secondary_phone: beneficiary.secondary_phone || '',
          email: beneficiary.email || '',
          address_line1: beneficiary.address_line1 || '',
          address_line2: beneficiary.address_line2 || '',
          city: beneficiary.city || '',
          district: beneficiary.district || '',
          ds_division: beneficiary.ds_division || beneficiary.division || '',
          gn_division: beneficiary.gn_division || '',
          postal_code: beneficiary.postal_code || '',
          latitude: beneficiary.latitude || '',
          longitude: beneficiary.longitude || '',
          is_vulnerable: beneficiary.is_vulnerable || false,
          vulnerability_type: beneficiary.vulnerability_type || '',
          vulnerability_notes: beneficiary.vulnerability_notes || '',
          household_size: beneficiary.household_size || '',
          monthly_income: beneficiary.monthly_income || '',
          occupation: beneficiary.occupation || '',
          emergency_contact_name: beneficiary.emergency_contact_name || '',
          emergency_contact_phone: beneficiary.emergency_contact_phone || '',
          notes: beneficiary.notes || ''
        });
        // Load divisions from static data when editing
        if (beneficiary.district) {
          const dsDivisionList = getDSDivisionsByDistrict(beneficiary.district);
          setDivisions(dsDivisionList);
        }
        if (beneficiary.district && (beneficiary.ds_division || beneficiary.division)) {
          const gnDivisionList = getGNDivisionsByDSDivision(
            beneficiary.district,
            beneficiary.ds_division || beneficiary.division
          );
          setGNDivisions(gnDivisionList);
        }
      }
    }
  }, [isOpen, beneficiary]);

  const handleNICBlur = async () => {
    if (!formData.nic || isEditMode) return;

    setNicCheckStatus('checking');
    setShowDuplicateWarning(false);
    setDuplicateData(null);

    try {
      const result = await checkDuplicate(formData.nic);

      if (result.exists) {
        setNicCheckStatus('duplicate');
        setDuplicateData(result);
        setShowDuplicateWarning(true);
        setErrors({ ...errors, nic: 'This NIC already exists in the system' });
      } else {
        setNicCheckStatus('available');
        const newErrors = { ...errors };
        delete newErrors.nic;
        setErrors(newErrors);
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
      setNicCheckStatus(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error for this field
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setFormData({
      ...formData,
      district,
      ds_division: '', // Reset DS division when district changes
      gn_division: '' // Reset GN division when district changes
    });

    // Load DS divisions from static data
    const dsDivisionList = getDSDivisionsByDistrict(district);
    setDivisions(dsDivisionList);
    setGNDivisions([]); // Reset GN divisions when district changes
  };

  const handleDSDivisionChange = (e) => {
    const dsDivision = e.target.value;
    setFormData({
      ...formData,
      ds_division: dsDivision,
      gn_division: '' // Reset GN division when DS division changes
    });

    // Load GN divisions from static data
    console.log('Loading GN Divisions for:', { district: formData.district, dsDivision });
    const gnDivisionList = getGNDivisionsByDSDivision(formData.district, dsDivision);
    console.log('GN Division List:', gnDivisionList);
    setGNDivisions(gnDivisionList);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nic) newErrors.nic = 'NIC is required';
    if (!formData.full_name) newErrors.full_name = 'Full name is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.ds_division) newErrors.ds_division = 'DS Division is required';
    if (!formData.primary_phone) newErrors.primary_phone = 'Primary phone is required';

    // NIC validation - basic Sri Lankan NIC format
    if (formData.nic) {
      const nicPattern = /^([0-9]{9}[xXvV]|[0-9]{12})$/;
      if (!nicPattern.test(formData.nic)) {
        newErrors.nic = 'Invalid NIC format (e.g., 123456789V or 199012345678)';
      }
    }

    // Phone validation
    if (formData.primary_phone) {
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(formData.primary_phone.replace(/\s/g, ''))) {
        newErrors.primary_phone = 'Invalid phone number (10 digits required)';
      }
    }

    // Email validation
    if (formData.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!isEditMode && nicCheckStatus === 'duplicate' && !window.confirm('This beneficiary already exists. Do you want to add new support instead of creating a duplicate?')) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        registered_by: user.id,
        household_size: formData.household_size ? parseInt(formData.household_size) : null,
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (isEditMode) {
        await updateBeneficiary(beneficiary.id, submitData);
      } else {
        await addBeneficiary(submitData);
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving beneficiary:', error);
      setErrors({ submit: error.message || 'Failed to save beneficiary' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nic: '',
      full_name: '',
      date_of_birth: '',
      gender: '',
      beneficiary_type: '',
      primary_phone: '',
      secondary_phone: '',
      email: '',
      address_line1: '',
      address_line2: '',
      city: '',
      district: '',
      ds_division: '',
      gn_division: '',
      postal_code: '',
      latitude: '',
      longitude: '',
      is_vulnerable: false,
      vulnerability_type: '',
      vulnerability_notes: '',
      household_size: '',
      monthly_income: '',
      occupation: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      notes: ''
    });
    setErrors({});
    setNicCheckStatus(null);
    setDuplicateData(null);
    setShowDuplicateWarning(false);
  };

  const handleClose = () => {
    resetForm();
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
              {isEditMode ? 'Edit Beneficiary' : 'Register New Beneficiary'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Duplicate Warning */}
        {showDuplicateWarning && duplicateData && (
          <div className="duplicate-warning">
            <div className="warning-header">
              <AlertTriangle size={24} />
              <h3>Beneficiary Already Exists</h3>
            </div>
            <div className="warning-content">
              <div className="duplicate-info">
                <p><strong>Name:</strong> {duplicateData.beneficiary.full_name}</p>
                <p><strong>NIC:</strong> {duplicateData.beneficiary.nic}</p>
                <p><strong>Phone:</strong> {duplicateData.beneficiary.primary_phone}</p>
                <p><strong>Location:</strong> {duplicateData.beneficiary.ds_division || duplicateData.beneficiary.division}, {duplicateData.beneficiary.district}</p>
                <p><strong>Total Supports:</strong> {duplicateData.beneficiary.total_supports || 0} (LKR {(duplicateData.beneficiary.total_value || 0).toLocaleString()})</p>
              </div>
              {duplicateData.recentSupport && duplicateData.recentSupport.length > 0 && (
                <div className="recent-support">
                  <h4>Recent Support History:</h4>
                  <ul>
                    {duplicateData.recentSupport.map((support, index) => (
                      <li key={index}>
                        {support.support_type} - {support.support_description}
                        ({new Date(support.support_date).toLocaleDateString()})
                        {support.actual_value && ` - LKR ${support.actual_value.toLocaleString()}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="warning-actions">
                <button className="btn btn-outline" onClick={handleClose}>
                  Cancel Registration
                </button>
                <button className="btn btn-warning" onClick={() => setShowDuplicateWarning(false)}>
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-4">
          {/* Section 1: Basic Information */}
          <div className="form-section">
            <h3 className="section-title">
              <User size={18} />
              Basic Information
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>NIC Number *</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    name="nic"
                    value={formData.nic}
                    onChange={handleInputChange}
                    onBlur={handleNICBlur}
                    disabled={isEditMode}
                    placeholder="e.g., 123456789V or 199012345678"
                    className={errors.nic ? 'error' : ''}
                  />
                  {nicCheckStatus === 'checking' && <Search size={16} className="input-icon checking" />}
                  {nicCheckStatus === 'available' && <Check size={16} className="input-icon available" />}
                  {nicCheckStatus === 'duplicate' && <AlertTriangle size={16} className="input-icon duplicate" />}
                </div>
                {errors.nic && <span className="error-message">{errors.nic}</span>}
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className={errors.full_name ? 'error' : ''}
                />
                {errors.full_name && <span className="error-message">{errors.full_name}</span>}
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Beneficiary Type</label>
                <select
                  name="beneficiary_type"
                  value={formData.beneficiary_type}
                  onChange={handleInputChange}
                >
                  <option value="">Select Type</option>
                  {BENEFICIARY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="form-section">
            <h3 className="section-title">
              <Phone size={18} />
              Contact Information
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Primary Phone *</label>
                <input
                  type="tel"
                  name="primary_phone"
                  value={formData.primary_phone}
                  onChange={handleInputChange}
                  placeholder="0771234567"
                  className={errors.primary_phone ? 'error' : ''}
                />
                {errors.primary_phone && <span className="error-message">{errors.primary_phone}</span>}
              </div>

              <div className="form-group">
                <label>Secondary Phone</label>
                <input
                  type="tel"
                  name="secondary_phone"
                  value={formData.secondary_phone}
                  onChange={handleInputChange}
                  placeholder="0771234567"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>
          </div>

          {/* Section 3: Address */}
          <div className="form-section">
            <h3 className="section-title">
              <MapPin size={18} />
              Address Information
            </h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Address Line 1</label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="Street address"
                />
              </div>

              <div className="form-group full-width">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>

              <div className="form-group">
                <label>District *</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleDistrictChange}
                  className={errors.district ? 'error' : ''}
                >
                  <option value="">Select District</option>
                  {allDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                {errors.district && <span className="error-message">{errors.district}</span>}
              </div>

              <div className="form-group">
                <label>DS Division *</label>
                <select
                  name="ds_division"
                  value={formData.ds_division}
                  onChange={handleDSDivisionChange}
                  disabled={!formData.district}
                  className={errors.ds_division ? 'error' : ''}
                >
                  <option value="">Select DS Division</option>
                  {divisions.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
                {errors.ds_division && <span className="error-message">{errors.ds_division}</span>}
              </div>

              <div className="form-group">
                <label>GN Division</label>
                <select
                  name="gn_division"
                  value={formData.gn_division}
                  onChange={handleInputChange}
                  disabled={!formData.ds_division}
                >
                  <option value="">Select GN Division</option>
                  {gnDivisions.map((gnDivision) => (
                    <option key={gnDivision} value={gnDivision}>
                      {gnDivision}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="10000"
                />
              </div>

              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="6.9271"
                />
              </div>

              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="79.8612"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Vulnerability & Demographics */}
          <div className="form-section">
            <h3 className="section-title">
              <Heart size={18} />
              Vulnerability & Demographics
            </h3>
            <div className="form-grid">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_vulnerable"
                    checked={formData.is_vulnerable}
                    onChange={handleInputChange}
                  />
                  <span>Mark as Vulnerable</span>
                </label>
              </div>

              {formData.is_vulnerable && (
                <>
                  <div className="form-group">
                    <label>Vulnerability Type</label>
                    <select
                      name="vulnerability_type"
                      value={formData.vulnerability_type}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Type</option>
                      <option value="Elderly">Elderly</option>
                      <option value="Disabled">Disabled</option>
                      <option value="Single Parent">Single Parent</option>
                      <option value="Orphan">Orphan</option>
                      <option value="Chronic Illness">Chronic Illness</option>
                      <option value="Low Income">Low Income</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Vulnerability Notes</label>
                    <textarea
                      name="vulnerability_notes"
                      value={formData.vulnerability_notes}
                      onChange={handleInputChange}
                      placeholder="Additional details about vulnerability"
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Household Size</label>
                <input
                  type="number"
                  name="household_size"
                  value={formData.household_size}
                  onChange={handleInputChange}
                  placeholder="Number of family members"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Monthly Income (LKR)</label>
                <input
                  type="number"
                  name="monthly_income"
                  value={formData.monthly_income}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Occupation</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  placeholder="Current occupation"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Emergency Contact */}
          <div className="form-section">
            <h3 className="section-title">
              <Phone size={18} />
              Emergency Contact
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  placeholder="Contact person name"
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  placeholder="0771234567"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Notes */}
          <div className="form-section">
            <h3 className="section-title">
              <FileText size={18} />
              Additional Notes
            </h3>
            <div className="form-group full-width">
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional information..."
                rows={4}
              />
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="submit-error">
              <AlertTriangle size={16} />
              {errors.submit}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-ink-50 border-t border-ink-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2.5 text-ink-700 bg-white border border-ink-300 rounded-lg hover:bg-ink-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-white bg-navy-900 rounded-lg font-medium transition-all shadow-card disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  {isEditMode ? 'Update Beneficiary' : 'Register Beneficiary'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BeneficiaryFormModal;
