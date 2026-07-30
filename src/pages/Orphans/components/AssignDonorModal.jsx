import React, { useState, useEffect } from 'react';
import { X, DollarSign, Building2, Briefcase, Heart, ChevronDown } from 'lucide-react';
import { usePartners } from '../../../contexts/PartnersContext';
import { useProposals } from '../../../contexts/ProposalsContext';

const AssignDonorModal = ({ isOpen, onClose, orphan, onAssign }) => {
  const [selectedPartner, setSelectedPartner] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [supportType, setSupportType] = useState('');

  // Get partners and proposals from contexts
  const { partners: allPartners, fetchPartners } = usePartners();
  const { proposals } = useProposals();

  // Fetch partners when modal opens
  useEffect(() => {
    if (isOpen && fetchPartners) {
      fetchPartners();
    }
  }, [isOpen, fetchPartners]);

  // Filter active partners only
  const partners = allPartners.filter(p => p.status === 'Active');

  // Determine support type based on proposal details
  const determineSupportType = (proposal) => {
    const title = proposal.projectTitle?.toLowerCase() || '';
    const area = proposal.programmeArea?.toLowerCase() || '';
    const objectives = proposal.projectObjectives?.toLowerCase() || '';

    if (title.includes('education') || area.includes('education') || objectives.includes('education')) {
      return 'Educational Support';
    } else if (title.includes('health') || area.includes('health') || objectives.includes('health')) {
      return 'Medical Support';
    } else if (title.includes('stipend') || title.includes('financial') || objectives.includes('stipend')) {
      return 'Financial Support';
    } else if (title.includes('food') || title.includes('nutrition') || area.includes('nutrition')) {
      return 'Nutritional Support';
    } else if (title.includes('sponsorship') || title.includes('comprehensive')) {
      return 'Full Sponsorship';
    } else if (title.includes('emergency') || title.includes('relief')) {
      return 'Emergency Support';
    } else if (title.includes('orphan') || area.includes('child protection')) {
      return 'Comprehensive Support';
    } else {
      return 'General Support';
    }
  };

  // Map proposals to projects with partner information and support types
  const getProjectsForPartner = (partnerId) => {
    return proposals
      .filter(proposal => {
        // Match proposals that are for orphan care or related programs
        const orphanCategories = ['orphan', 'child', 'education', 'health', 'protection'];
        const matchesCategory = orphanCategories.some(cat =>
          proposal.programmeArea?.toLowerCase().includes(cat) ||
          proposal.projectTitle?.toLowerCase().includes(cat) ||
          proposal.projectObjectives?.toLowerCase().includes(cat)
        );

        return proposal.partnerId === partnerId &&
               proposal.status === 'Approved' &&
               matchesCategory;
      })
      .map(proposal => ({
        id: proposal.id,
        name: proposal.projectTitle,
        supportType: determineSupportType(proposal),
        category: 'orphan',
        proposalId: proposal.id,
        programmeArea: proposal.programmeArea,
        budget: proposal.totalBudget
      }));
  };

  // Get selected partner object
  const partnerObj = partners.find(p => p.id === parseInt(selectedPartner));

  // Ensure focusAreas is an array
  if (partnerObj && partnerObj.focusAreas) {
    if (typeof partnerObj.focusAreas === 'string') {
      try {
        partnerObj.focusAreas = JSON.parse(partnerObj.focusAreas);
      } catch {
        partnerObj.focusAreas = partnerObj.focusAreas.split(',').map(s => s.trim());
      }
    }
    if (!Array.isArray(partnerObj.focusAreas)) {
      partnerObj.focusAreas = [];
    }
  }

  // Get orphan projects for selected partner
  const availableProjects = partnerObj ? getProjectsForPartner(partnerObj.id) : [];

  // Auto-populate support type when project is selected
  useEffect(() => {
    if (selectedProject && availableProjects.length > 0) {
      const projectObj = availableProjects.find(p => p.id === parseInt(selectedProject));
      if (projectObj) {
        setSupportType(projectObj.supportType);
      }
    } else {
      setSupportType('');
    }
  }, [selectedProject, availableProjects]);

  // Reset project and support type when partner changes
  useEffect(() => {
    setSelectedProject('');
    setSupportType('');
  }, [selectedPartner]);

  const handleAssign = () => {
    if (selectedPartner && selectedProject && supportType) {
      const projectObj = availableProjects.find(p => p.id === parseInt(selectedProject));

      const assignmentData = {
        partner: partnerObj,
        project: projectObj,
        supportType: supportType
      };

      onAssign(orphan.id, assignmentData);
      onClose();

      // Reset form
      setSelectedPartner('');
      setSelectedProject('');
      setSupportType('');
    }
  };

  const handleClose = () => {
    // Reset form
    setSelectedPartner('');
    setSelectedProject('');
    setSupportType('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg2 shadow-pop w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-orange-500 text-white p-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Assign Partner</h2>
              </div>
              <p className="text-green-100 mt-2">Select a partner and project for {orphan.fullName}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-green-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Partner Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-ink-700 mb-2">
              <Building2 size={16} className="text-green-600" />
              Select Partner *
            </label>
            <div className="relative">
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
              >
                <option value="">-- Choose a Partner --</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} ({partner.type} - {partner.country})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 pointer-events-none" size={20} />
            </div>
            {partnerObj && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 size={14} className="text-green-600" />
                  <span className="font-semibold text-ink-700">{partnerObj.type}</span>
                  <span className="text-ink-500">•</span>
                  <span className="text-ink-600">{partnerObj.country}</span>
                  <span className="text-ink-500">•</span>
                  <span className="text-green-600 font-semibold">{availableProjects.length} Available Project{availableProjects.length !== 1 ? 's' : ''}</span>
                </div>
                {partnerObj.focusAreas && partnerObj.focusAreas.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-ink-600">Focus Areas:</span>
                    {partnerObj.focusAreas.map((area, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Project Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-ink-700 mb-2">
              <Briefcase size={16} className="text-blue-600" />
              Select Project *
            </label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={!selectedPartner}
                className={`w-full px-4 py-3 pr-10 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none ${
                  !selectedPartner ? 'bg-ink-100 cursor-not-allowed' : 'bg-white'
                }`}
              >
                <option value="">
                  {!selectedPartner ? '-- Select a Partner First --' : '-- Choose a Project --'}
                </option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 pointer-events-none" size={20} />
            </div>
            {!selectedPartner && (
              <p className="mt-2 text-xs text-ink-500">Please select a partner first to view available projects</p>
            )}
            {selectedPartner && availableProjects.length === 0 && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-700 font-medium">
                  No orphan-related approved projects found for this partner.
                  Projects must be approved and related to orphan care, child protection, education, or health.
                </p>
              </div>
            )}
            {selectedProject && availableProjects.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {(() => {
                  const project = availableProjects.find(p => p.id === parseInt(selectedProject));
                  return project ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-ink-600 font-semibold">Programme Area:</span>
                        <span className="text-ink-900">{project.programmeArea || 'N/A'}</span>
                      </div>
                      {project.budget && (
                        <div className="flex items-center gap-2">
                          <span className="text-ink-600 font-semibold">Project Budget:</span>
                          <span className="text-ink-900">LKR {project.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Support Type (Auto-populated) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-ink-700 mb-2">
              <Heart size={16} className="text-pink-600" />
              Support Type
            </label>
            <div className="relative">
              <input
                type="text"
                value={supportType}
                readOnly
                placeholder="Automatically filled based on project"
                className="w-full px-4 py-3 border border-ink-200 rounded-lg bg-ink-50 text-ink-700 font-semibold cursor-not-allowed"
              />
              {supportType && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-500">This field is automatically populated when you select a project</p>
          </div>

          {/* Summary Card */}
          {selectedPartner && selectedProject && supportType && (
            <div className="p-4 bg-ink-50 border-2 border-green-300 rounded-xl">
              <h3 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
                <DollarSign size={16} className="text-green-600" />
                Assignment Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-ink-600 font-semibold min-w-[80px]">Orphan:</span>
                  <span className="text-ink-900 font-bold">{orphan.fullName}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-ink-600 font-semibold min-w-[80px]">Partner:</span>
                  <span className="text-ink-900">{partnerObj.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-ink-600 font-semibold min-w-[80px]">Project:</span>
                  <span className="text-ink-900">
                    {availableProjects.find(p => p.id === parseInt(selectedProject))?.name}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-ink-600 font-semibold min-w-[80px]">Support:</span>
                  <span className="text-green-600 font-bold">{supportType}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-ink-50 px-6 py-4 border-t border-ink-100 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedPartner || !selectedProject || !supportType}
              className={`flex-1 px-6 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2 ${
                selectedPartner && selectedProject && supportType
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-card'
                  : 'bg-ink-300 text-ink-500 cursor-not-allowed'
              }`}
            >
              <DollarSign size={18} />
              Assign Partner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignDonorModal;
