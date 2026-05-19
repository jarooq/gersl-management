import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Calendar, Users, Image, Sparkles, FileText, Check, Loader } from 'lucide-react';
import { OrphanReportAPI, VisitLogAPI } from '../../../services/api';

const OrphanReportWizard = ({ isOpen, onClose, orphan, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [visitLogs, setVisitLogs] = useState([]);

  // Get assigned partners from orphan object (partners already supporting this orphan)
  const assignedPartners = orphan?.assignedPartners || [];

  // Form data
  const [formData, setFormData] = useState({
    reportType: 'monthly',
    reportPeriodStart: '',
    reportPeriodEnd: '',
    partnerId: null,
    selectedPhotos: [],
    selectedDrawings: [],
    selectedLetters: [],
    includeNeedsAssessment: true,
    includeProgressRatings: true
  });

  const setDefaultDates = useCallback(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setFormData(prev => ({
      ...prev,
      reportPeriodStart: firstDayOfMonth.toISOString().split('T')[0],
      reportPeriodEnd: lastDayOfMonth.toISOString().split('T')[0]
    }));
  }, []);

  const fetchVisitLogs = useCallback(async () => {
    try {
      const data = await VisitLogAPI.getByOrphan(orphan.id);
      setVisitLogs(data.visitLogs || []);
    } catch (error) {
      console.error('Error fetching visit logs:', error);
    }
  }, [orphan?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchVisitLogs();
      setDefaultDates();
    }
  }, [isOpen, fetchVisitLogs, setDefaultDates]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const reportData = {
        orphanId: orphan.id,
        reportType: formData.reportType,
        reportPeriodStart: formData.reportPeriodStart,
        reportPeriodEnd: formData.reportPeriodEnd,
        partnerId: formData.partnerId,
        selectedPhotos: formData.selectedPhotos,
        selectedDrawings: formData.selectedDrawings,
        selectedLetters: formData.selectedLetters,
        includeNeedsAssessment: formData.includeNeedsAssessment,
        includeProgressRatings: formData.includeProgressRatings
      };

      await OrphanReportAPI.create(reportData);
      alert('Report generation started! You will be notified when it\'s ready.');
      onSuccess();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.reportType && formData.reportPeriodStart && formData.reportPeriodEnd;
      case 2:
        return formData.partnerId !== null;
      case 3:
        return true; // Media selection is optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-navy-900 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Generate Progress Report</h2>
            <p className="text-blue-100 text-sm mt-1">for {orphan?.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-ink-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <StepIndicator number={1} label="Report Type" active={currentStep === 1} completed={currentStep > 1} />
            <div className="flex-1 h-1 bg-ink-200 mx-2">
              <div className={`h-full transition-all ${currentStep > 1 ? 'bg-blue-600' : 'bg-ink-200'}`} />
            </div>
            <StepIndicator number={2} label="Partner" active={currentStep === 2} completed={currentStep > 2} />
            <div className="flex-1 h-1 bg-ink-200 mx-2">
              <div className={`h-full transition-all ${currentStep > 2 ? 'bg-blue-600' : 'bg-ink-200'}`} />
            </div>
            <StepIndicator number={3} label="Media" active={currentStep === 3} completed={currentStep > 3} />
            <div className="flex-1 h-1 bg-ink-200 mx-2">
              <div className={`h-full transition-all ${currentStep > 3 ? 'bg-blue-600' : 'bg-ink-200'}`} />
            </div>
            <StepIndicator number={4} label="Review" active={currentStep === 4} completed={false} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <Step1ReportType formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 2 && (
            <Step2Partner formData={formData} setFormData={setFormData} partners={assignedPartners} />
          )}
          {currentStep === 3 && (
            <Step3Media formData={formData} setFormData={setFormData} visitLogs={visitLogs} />
          )}
          {currentStep === 4 && (
            <Step4Review formData={formData} orphan={orphan} partners={assignedPartners} />
          )}
        </div>

        {/* Footer */}
        <div className="bg-ink-50 px-6 py-4 border-t flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-ink-700 hover:bg-ink-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <div className="text-sm text-ink-600">
            Step {currentStep} of 4
          </div>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Next
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-navy-900 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Report
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const StepIndicator = ({ number, label, active, completed }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
        completed ? 'bg-blue-600 text-white' :
        active ? 'bg-blue-600 text-white' :
        'bg-ink-200 text-ink-500'
      }`}>
        {completed ? <Check size={20} /> : number}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-ink-500'}`}>
        {label}
      </span>
    </div>
  );
};

const Step1ReportType = ({ formData, setFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Report Configuration
        </h3>
      </div>

      {/* Report Type */}
      <div>
        <label className="block text-sm font-semibold text-ink-700 mb-2">Report Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: 'monthly', label: 'Monthly', desc: 'Last 30 days' },
            { value: 'quarterly', label: 'Quarterly', desc: '3 months' },
            { value: 'annual', label: 'Annual', desc: '12 months' },
            { value: 'custom', label: 'Custom', desc: 'Choose dates' }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setFormData(prev => ({ ...prev, reportType: type.value }))}
              className={`p-4 border-2 rounded-lg text-left transition ${
                formData.reportType === type.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-ink-100 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-ink-900">{type.label}</div>
              <div className="text-xs text-ink-600 mt-1">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Start Date</label>
          <input
            type="date"
            value={formData.reportPeriodStart}
            onChange={(e) => setFormData(prev => ({ ...prev, reportPeriodStart: e.target.value }))}
            className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">End Date</label>
          <input
            type="date"
            value={formData.reportPeriodEnd}
            onChange={(e) => setFormData(prev => ({ ...prev, reportPeriodEnd: e.target.value }))}
            className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Include Options */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-3">Report Inclusions</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.includeProgressRatings}
              onChange={(e) => setFormData(prev => ({ ...prev, includeProgressRatings: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-ink-700">Include Progress Ratings</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.includeNeedsAssessment}
              onChange={(e) => setFormData(prev => ({ ...prev, includeNeedsAssessment: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-ink-700">Include Needs Assessment</span>
          </label>
        </div>
      </div>
    </div>
  );
};

const Step2Partner = ({ formData, setFormData, partners }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-ink-900 mb-2 flex items-center gap-2">
          <Users className="text-blue-600" />
          Select Recipient Partner
        </h3>
        <p className="text-sm text-ink-600">Choose which assigned partner/donor should receive this report</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {partners.map((assignment) => {
          const partner = assignment.partner;
          return (
            <button
              key={partner.id}
              onClick={() => setFormData(prev => ({ ...prev, partnerId: partner.id }))}
              className={`p-4 border-2 rounded-lg text-left transition ${
                formData.partnerId === partner.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-ink-100 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {partner.logo && (
                  <img src={partner.logo} alt={partner.name} className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-ink-900">{partner.name}</div>
                  <div className="text-xs text-ink-600 mt-1">{partner.country}</div>
                  <div className="mt-2 flex gap-2">
                    {partner.partnerType && (
                      <span className="inline-block px-2 py-1 text-xs bg-ink-100 text-ink-700 rounded">
                        {partner.partnerType}
                      </span>
                    )}
                    {assignment.supportType && (
                      <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        {assignment.supportType}
                      </span>
                    )}
                  </div>
                </div>
                {formData.partnerId === partner.id && (
                  <Check className="text-blue-600 flex-shrink-0" size={20} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {partners.length === 0 && (
        <div className="text-center py-12 bg-ink-50 rounded-lg">
          <Users className="w-12 h-12 text-ink-400 mx-auto mb-3" />
          <p className="text-ink-900 font-semibold mb-2">No partners assigned yet</p>
          <p className="text-ink-600 text-sm">This orphan must be assigned to a partner/donor first before generating reports</p>
        </div>
      )}
    </div>
  );
};

const Step3Media = ({ formData, setFormData, visitLogs }) => {
  const filterVisitsByDateRange = () => {
    return visitLogs.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      const startDate = new Date(formData.reportPeriodStart);
      const endDate = new Date(formData.reportPeriodEnd);
      return visitDate >= startDate && visitDate <= endDate;
    });
  };

  const filteredVisits = filterVisitsByDateRange();

  const togglePhoto = (photo) => {
    setFormData(prev => ({
      ...prev,
      selectedPhotos: prev.selectedPhotos.includes(photo)
        ? prev.selectedPhotos.filter(p => p !== photo)
        : [...prev.selectedPhotos, photo]
    }));
  };

  const toggleDrawing = (drawing) => {
    setFormData(prev => ({
      ...prev,
      selectedDrawings: prev.selectedDrawings.includes(drawing)
        ? prev.selectedDrawings.filter(d => d !== drawing)
        : [...prev.selectedDrawings, drawing]
    }));
  };

  const toggleLetter = (letter) => {
    setFormData(prev => ({
      ...prev,
      selectedLetters: prev.selectedLetters.includes(letter)
        ? prev.selectedLetters.filter(l => l !== letter)
        : [...prev.selectedLetters, letter]
    }));
  };

  const allPhotos = filteredVisits.flatMap(v => v.photos || []);
  const allDrawings = filteredVisits.flatMap(v => v.drawings || []);
  const allLetters = filteredVisits.flatMap(v => v.letters || []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-ink-900 mb-2 flex items-center gap-2">
          <Image className="text-blue-600" />
          Select Media for Report
        </h3>
        <p className="text-sm text-ink-600">Choose photos, drawings, and letters from visits during the report period</p>
      </div>

      {/* Photos */}
      {allPhotos.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink-900 mb-3">Photos ({formData.selectedPhotos.length} selected)</h4>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {allPhotos.map((photo, index) => (
              <div
                key={index}
                onClick={() => togglePhoto(photo)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                  formData.selectedPhotos.includes(photo) ? 'border-blue-600' : 'border-ink-100'
                }`}
              >
                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-20 object-cover" />
                {formData.selectedPhotos.includes(photo) && (
                  <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                    <div className="bg-blue-600 rounded-full p-1">
                      <Check size={16} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drawings */}
      {allDrawings.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink-900 mb-3">Drawings ({formData.selectedDrawings.length} selected)</h4>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {allDrawings.map((drawing, index) => (
              <div
                key={index}
                onClick={() => toggleDrawing(drawing)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                  formData.selectedDrawings.includes(drawing) ? 'border-purple-600' : 'border-ink-100'
                }`}
              >
                <img src={drawing} alt={`Drawing ${index + 1}`} className="w-full h-20 object-cover" />
                {formData.selectedDrawings.includes(drawing) && (
                  <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                    <div className="bg-purple-600 rounded-full p-1">
                      <Check size={16} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letters */}
      {allLetters.length > 0 && (
        <div>
          <h4 className="font-semibold text-ink-900 mb-3">Letters ({formData.selectedLetters.length} selected)</h4>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {allLetters.map((letter, index) => (
              <div
                key={index}
                onClick={() => toggleLetter(letter)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                  formData.selectedLetters.includes(letter) ? 'border-green-600' : 'border-ink-100'
                }`}
              >
                <img src={letter} alt={`Letter ${index + 1}`} className="w-full h-20 object-cover" />
                {formData.selectedLetters.includes(letter) && (
                  <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                    <div className="bg-green-600 rounded-full p-1">
                      <Check size={16} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredVisits.length === 0 && (
        <div className="text-center py-12 bg-ink-50 rounded-lg">
          <Calendar className="w-12 h-12 text-ink-400 mx-auto mb-3" />
          <p className="text-ink-600">No visits found in the selected date range</p>
        </div>
      )}
    </div>
  );
};

const Step4Review = ({ formData, orphan, partners }) => {
  const selectedAssignment = partners.find(assignment => assignment.partner.id === formData.partnerId);
  const selectedPartner = selectedAssignment?.partner;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      monthly: 'Monthly Report',
      quarterly: 'Quarterly Report',
      annual: 'Annual Report',
      custom: 'Custom Report'
    };
    return labels[type] || 'Progress Report';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-ink-900 mb-2 flex items-center gap-2">
          <FileText className="text-blue-600" />
          Review Report Details
        </h3>
        <p className="text-sm text-ink-600">Please review all information before generating the report</p>
      </div>

      <div className="space-y-4">
        {/* Report Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Report Information</h4>
          <div className="space-y-1 text-sm">
            <p><span className="text-ink-600">Type:</span> <span className="font-medium">{getReportTypeLabel(formData.reportType)}</span></p>
            <p><span className="text-ink-600">Period:</span> <span className="font-medium">{formatDate(formData.reportPeriodStart)} - {formatDate(formData.reportPeriodEnd)}</span></p>
            <p><span className="text-ink-600">Orphan:</span> <span className="font-medium">{orphan?.fullName}</span></p>
          </div>
        </div>

        {/* Partner */}
        {selectedPartner && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Recipient Partner</h4>
            <div className="flex items-center gap-3">
              {selectedPartner.logo && (
                <img src={selectedPartner.logo} alt={selectedPartner.name} className="w-12 h-12 rounded object-cover" />
              )}
              <div>
                <p className="font-medium">{selectedPartner.name}</p>
                <p className="text-xs text-ink-600">{selectedPartner.country}</p>
              </div>
            </div>
          </div>
        )}

        {/* Media Count */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">Selected Media</h4>
          <div className="flex gap-4 text-sm">
            <span><span className="text-ink-600">Photos:</span> <span className="font-medium">{formData.selectedPhotos.length}</span></span>
            <span><span className="text-ink-600">Drawings:</span> <span className="font-medium">{formData.selectedDrawings.length}</span></span>
            <span><span className="text-ink-600">Letters:</span> <span className="font-medium">{formData.selectedLetters.length}</span></span>
          </div>
        </div>

        {/* Inclusions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">Report Inclusions</h4>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              {formData.includeProgressRatings ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-red-600" />}
              Progress Ratings
            </p>
            <p className="flex items-center gap-2">
              {formData.includeNeedsAssessment ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-red-600" />}
              Needs Assessment
            </p>
          </div>
        </div>
      </div>

      <div className="bg-ink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="text-purple-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-purple-900 mb-1">AI-Powered Generation</h4>
            <p className="text-sm text-ink-700">
              This report will be automatically generated using AI to create a comprehensive narrative summary,
              progress analysis, and recommendations based on visit logs and rating data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrphanReportWizard;
