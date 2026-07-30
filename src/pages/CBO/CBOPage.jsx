import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCBO } from '../../contexts/CBOContext';
import { API_BASE_URL } from '../../config/apiBase';
import { getIndicatorsForProgramme, STANDARD_INDICATORS } from '../../utils/mealIndicators';
import ProposalDetailModal from './components/ProposalDetailModal';
import {
  Users2,
  UserPlus,
  Building2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Award,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Activity,
  ClipboardCheck,
  Briefcase,
  BarChart3,
  Target,
  DollarSign,
  AlertTriangle,
  CheckSquare,
  Trash2,
  MessageSquare,
  Send
} from 'lucide-react';

const CBOPage = () => {
  const {
    cboPartners,
    volunteers,
    activities,
    dueDiligence,
    cboProposals,
    cboProjects,
    getStats,
    addCBOProposal,
    addCFMFeedback,
    resolveCFMFeedback,
  } = useCBO();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('section') || 'cbos';
  const setActiveTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', id);
    setSearchParams(next, { replace: false });
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const stats = getStats();

  const tabs = [
    { id: 'cbos', name: 'CBO Partners', icon: Building2, count: stats.totalCBOs },
    { id: 'volunteers', name: 'Volunteers', icon: Users2, count: stats.totalVolunteers },
    { id: 'activities', name: 'Activities', icon: Activity, count: stats.totalActivities },
    { id: 'duediligence', name: 'Due Diligence', icon: ClipboardCheck, count: dueDiligence.length },
    { id: 'proposals', name: 'CBO Proposals', icon: FileText, count: cboProposals.length },
    { id: 'projects', name: 'CBO Projects', icon: Briefcase, count: cboProjects.length }
  ];

  const districts = ['All', 'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Anuradhapura'];

  const handleAddClick = () => {
    setShowAddModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Users2 className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h2 font-bold leading-tight">CBO Partners & Volunteers</h1>
              <p className="text-ink-200 text-sm mt-0.5">Community-Based Organizations and Volunteer Management</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Building2}
          label="Total CBOs"
          value={stats.totalCBOs}
          subValue={`${stats.activeCBOs} Active`}
          color="purple"
        />
        <StatCard
          icon={Users2}
          label="Total Volunteers"
          value={stats.totalVolunteers}
          subValue={`${stats.activeVolunteers} Active`}
          color="indigo"
        />
        <StatCard
          icon={Activity}
          label="Total Activities"
          value={stats.totalActivities}
          subValue="This Year"
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Hours Logged"
          value={stats.totalHoursLogged}
          subValue={`Avg Rating: ${stats.avgVolunteerRating}`}
          color="green"
        />
      </div>

      {/* Section header (tabs live in the console sidebar now) */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-orange-600 font-semibold">CBO Partners</p>
        <h2 className="text-h2 text-ink-900">
          {tabs.find(t => t.id === activeTab)?.name || 'CBO'}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-ink-100 mb-6">
        {/* Search and Filters */}
        <div className="p-4 bg-ink-50 border-b border-ink-100">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={18} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'cbos' ? 'CBOs' : activeTab === 'volunteers' ? 'volunteers' : 'activities'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              <button
                onClick={handleAddClick}
                className="px-4 py-2 bg-navy-900 text-white rounded-lg transition font-semibold flex items-center gap-2 shadow-md"
              >
                <Plus size={18} />
                Add {
                  activeTab === 'cbos' ? 'CBO' :
                  activeTab === 'volunteers' ? 'Volunteer' :
                  activeTab === 'activities' ? 'Activity' :
                  activeTab === 'duediligence' ? 'Assessment' :
                  activeTab === 'proposals' ? 'Proposal' :
                  activeTab === 'projects' ? 'Project' : 'New'
                }
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'cbos' && <CBOsTab cbos={cboPartners} searchTerm={searchTerm} filterDistrict={filterDistrict} />}
          {activeTab === 'volunteers' && <VolunteersTab volunteers={volunteers} searchTerm={searchTerm} filterDistrict={filterDistrict} />}
          {activeTab === 'activities' && <ActivitiesTab activities={activities} searchTerm={searchTerm} />}
          {activeTab === 'duediligence' && <DueDiligenceTab assessments={dueDiligence} searchTerm={searchTerm} />}
          {activeTab === 'proposals' && <ProposalsTab proposals={cboProposals} searchTerm={searchTerm} />}
          {activeTab === 'projects' && <ProjectsTab projects={cboProjects} searchTerm={searchTerm} addCFMFeedback={addCFMFeedback} resolveCFMFeedback={resolveCFMFeedback} />}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && activeTab === 'proposals' && (
        <AddProposalModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(proposalData) => {
            addCBOProposal(proposalData);
            setShowAddModal(false);
          }}
          cboPartners={cboPartners}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subValue, color }) => {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-md`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
      <p className="text-2xl font-bold text-ink-800 mb-1">{value}</p>
      <p className="text-sm text-ink-600 font-medium">{label}</p>
      <p className="text-xs text-ink-500 mt-1">{subValue}</p>
    </div>
  );
};

// CBOs Tab Component
const CBOsTab = ({ cbos, searchTerm, filterDistrict }) => {
  const filteredCBOs = cbos.filter(cbo => {
    const matchesSearch = cbo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cbo.acronym.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = filterDistrict === 'All' || cbo.district === filterDistrict;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredCBOs.map(cbo => (
        <CBOCard key={cbo.id} cbo={cbo} />
      ))}
      {filteredCBOs.length === 0 && (
        <div className="col-span-2 text-center py-12 text-ink-500">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">No CBOs found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

// CBO Card Component
const CBOCard = ({ cbo }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Inactive': return 'bg-ink-100 text-ink-700 border-ink-100';
      default: return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  const getCapacityColor = (capacity) => {
    switch (capacity) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-ink-600';
    }
  };

  const isMOUExpiringSoon = () => {
    if (!cbo.mou || !cbo.mouExpiryDate) return false;
    const today = new Date();
    const expiryDate = new Date(cbo.mouExpiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 60 && daysUntilExpiry > 0;
  };

  return (
    <div className="bg-white rounded-xl border border-ink-100 p-5 hover:shadow-card transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-ink-800">{cbo.name}</h3>
          </div>
          <p className="text-sm text-purple-600 font-semibold">{cbo.acronym}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(cbo.status)}`}>
          {cbo.status}
        </span>
      </div>

      {/* Type and Registration */}
      <div className="mb-4 pb-4 border-b border-ink-100">
        <p className="text-sm text-ink-600 mb-1">{cbo.type}</p>
        <p className="text-xs text-ink-500">Reg: {cbo.registrationNumber}</p>
      </div>

      {/* Contact Person */}
      <div className="mb-4">
        <p className="text-xs text-ink-500 mb-2 font-semibold">Contact Person</p>
        <p className="text-sm font-semibold text-ink-800 mb-1">{cbo.contactPerson}</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <Mail size={12} />
            <span>{cbo.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <Phone size={12} />
            <span>{cbo.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <MapPin size={12} />
            <span>{cbo.district}</span>
          </div>
        </div>
      </div>

      {/* Focus Areas */}
      <div className="mb-4">
        <p className="text-xs text-ink-500 mb-2 font-semibold">Focus Areas</p>
        <div className="flex flex-wrap gap-1">
          {cbo.focusAreas.map((area, index) => (
            <span key={index} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-ink-100">
        <div className="text-center">
          <p className="text-lg font-bold text-purple-600">{cbo.projectsCount}</p>
          <p className="text-xs text-ink-500">Projects</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-indigo-600">{cbo.volunteersCount}</p>
          <p className="text-xs text-ink-500">Volunteers</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold ${getCapacityColor(cbo.capacity)}`}>{cbo.capacity}</p>
          <p className="text-xs text-ink-500">Capacity</p>
        </div>
      </div>

      {/* MOU Status */}
      <div className="mb-3">
        {cbo.mou ? (
          <div className={`p-3 rounded-lg ${isMOUExpiringSoon() ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              {isMOUExpiringSoon() ? (
                <AlertCircle size={16} className="text-yellow-600" />
              ) : (
                <CheckCircle size={16} className="text-green-600" />
              )}
              <p className={`text-xs font-semibold ${isMOUExpiringSoon() ? 'text-yellow-700' : 'text-green-700'}`}>
                MOU {isMOUExpiringSoon() ? 'Expiring Soon' : 'Active'}
              </p>
            </div>
            <p className="text-xs text-ink-600">Expires: {cbo.mouExpiryDate}</p>
          </div>
        ) : (
          <div className="p-3 bg-ink-50 border border-ink-100 rounded-lg">
            <p className="text-xs text-ink-600">No MOU in place</p>
          </div>
        )}
      </div>

      {/* Partnership Since */}
      <p className="text-xs text-ink-500">
        Partner since: <span className="font-semibold text-ink-700">{cbo.partnershipDate}</span>
      </p>
    </div>
  );
};

// Volunteers Tab Component
const VolunteersTab = ({ volunteers, searchTerm, filterDistrict }) => {
  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = filterDistrict === 'All' || volunteer.district === filterDistrict;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredVolunteers.map(volunteer => (
        <VolunteerCard key={volunteer.id} volunteer={volunteer} />
      ))}
      {filteredVolunteers.length === 0 && (
        <div className="col-span-3 text-center py-12 text-ink-500">
          <Users2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">No volunteers found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

// Volunteer Card Component
const VolunteerCard = ({ volunteer }) => {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive': return 'bg-ink-100 text-ink-700 border-ink-100';
      default: return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" size={14} className="fill-yellow-200 text-yellow-400" />);
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl border border-ink-100 p-5 hover:shadow-card transition">
      {/* Avatar and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-navy-9000 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            {getInitials(volunteer.fullName)}
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-800">{volunteer.fullName}</h3>
            <div className="flex gap-1 mt-1">
              {renderStars(volunteer.rating)}
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(volunteer.status)}`}>
          {volunteer.status}
        </span>
      </div>

      {/* Contact Info */}
      <div className="mb-4 pb-4 border-b border-ink-100">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <Mail size={12} />
            <span className="truncate">{volunteer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <Phone size={12} />
            <span>{volunteer.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-600">
            <MapPin size={12} />
            <span>{volunteer.district}</span>
          </div>
        </div>
      </div>

      {/* CBO Affiliation */}
      <div className="mb-3">
        <p className="text-xs text-ink-500 mb-1 font-semibold">CBO Affiliation</p>
        <p className="text-xs text-ink-700 font-medium">{volunteer.cboAffiliation}</p>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <p className="text-xs text-ink-500 mb-2 font-semibold">Skills</p>
        <div className="flex flex-wrap gap-1">
          {volunteer.skills.map((skill, index) => (
            <span key={index} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="mb-4 p-2 bg-purple-50 rounded-lg border border-purple-100">
        <p className="text-xs text-purple-700 font-semibold">
          <Clock size={12} className="inline mr-1" />
          {volunteer.availability}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center p-2 bg-ink-50 rounded-lg">
          <p className="text-lg font-bold text-purple-600">{volunteer.hoursContributed}</p>
          <p className="text-xs text-ink-500">Hours</p>
        </div>
        <div className="text-center p-2 bg-ink-50 rounded-lg">
          <p className="text-lg font-bold text-indigo-600">{volunteer.projectsParticipated}</p>
          <p className="text-xs text-ink-500">Projects</p>
        </div>
      </div>

      {/* Background Check */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-500">Background Check:</span>
        <span className={`font-semibold ${volunteer.backgroundCheck === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>
          {volunteer.backgroundCheck}
        </span>
      </div>

      {/* Joined Date */}
      <p className="text-xs text-ink-500 mt-2">
        Joined: <span className="font-semibold text-ink-700">{volunteer.joinedDate}</span>
      </p>
    </div>
  );
};

// Activities Tab Component
const ActivitiesTab = ({ activities, searchTerm }) => {
  const filteredActivities = activities.filter(activity =>
    activity.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.cbo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Ongoing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Planned': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  return (
    <div className="space-y-4">
      {filteredActivities.map(activity => (
        <div key={activity.id} className="bg-white rounded-xl border border-ink-100 p-5 hover:shadow-card transition">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-ink-800 mb-1">{activity.activityName}</h3>
              <div className="flex items-center gap-2 text-sm text-ink-600">
                <Calendar size={14} />
                <span>{activity.date}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(activity.status)}`}>
              {activity.status}
            </span>
          </div>

          {/* CBO */}
          <div className="mb-4 pb-4 border-b border-ink-100">
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-purple-600" />
              <span className="font-semibold text-ink-700">{activity.cbo}</span>
            </div>
          </div>

          {/* Volunteers */}
          <div className="mb-4">
            <p className="text-xs text-ink-500 mb-2 font-semibold">Volunteers Participated</p>
            <div className="flex flex-wrap gap-2">
              {activity.volunteers.map((volunteer, index) => (
                <span key={index} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium flex items-center gap-1">
                  <UserPlus size={12} />
                  {volunteer}
                </span>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-ink-600">
              <Clock size={16} className="text-green-600" />
              <span className="font-semibold">{activity.hoursLogged} hours logged</span>
            </div>
            <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1">
              View Details
              <TrendingUp size={14} />
            </button>
          </div>
        </div>
      ))}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12 text-ink-500">
          <Activity size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">No activities found</p>
          <p className="text-sm">Try adjusting your search</p>
        </div>
      )}
    </div>
  );
};

// Due Diligence Tab Component
const DueDiligenceTab = ({ assessments, searchTerm }) => {
  const filteredAssessments = assessments.filter(assessment =>
    assessment.cboName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.assessor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Satisfactory': return 'text-yellow-600';
      case 'Needs Improvement': return 'text-red-600';
      default: return 'text-ink-600';
    }
  };

  return (
    <div className="space-y-4">
      {filteredAssessments.map(assessment => (
        <div key={assessment.id} className="bg-white rounded-xl border border-ink-100 p-6 hover:shadow-card transition">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-ink-800 mb-2">{assessment.cboName}</h3>
              <div className="flex items-center gap-4 text-sm text-ink-600">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Assessed: {assessment.assessmentDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserPlus size={14} />
                  <span>By: {assessment.assessor}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(assessment.status)}`}>
                {assessment.status}
              </span>
              <div className="text-center">
                <p className={`text-3xl font-bold ${getScoreColor(assessment.overallScore)}`}>
                  {assessment.overallScore}
                </p>
                <p className="text-xs text-ink-500">Overall Score</p>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="mb-5 pb-5 border-b border-ink-100">
            <p className="text-sm font-semibold text-ink-700 mb-3">Category Assessments</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {Object.entries(assessment.categories).map(([category, data]) => (
                <div key={category} className="p-3 bg-ink-50 rounded-lg">
                  <p className="text-xs text-ink-500 capitalize mb-1">{category}</p>
                  <p className={`text-2xl font-bold ${getScoreColor(data.score)}`}>{data.score}</p>
                  <p className={`text-xs font-semibold ${getCategoryStatusColor(data.status)}`}>
                    {data.status}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">Recommendations</p>
            <p className="text-sm text-ink-700">{assessment.recommendations}</p>
          </div>

          {/* Documents & Validity */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-500 mb-1">Documents Submitted</p>
              <div className="flex flex-wrap gap-1">
                {assessment.documents.map((doc, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-500">Valid Until</p>
              <p className="text-sm font-semibold text-ink-700">{assessment.validUntil}</p>
            </div>
          </div>
        </div>
      ))}
      {filteredAssessments.length === 0 && (
        <div className="text-center py-12 text-ink-500">
          <ClipboardCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">No assessments found</p>
          <p className="text-sm">Try adjusting your search</p>
        </div>
      )}
    </div>
  );
};

// CBO Proposals Tab Component
const ProposalsTab = ({ proposals, searchTerm }) => {
  const {
    fundraisingApproveProposal,
    fundraisingRejectProposal,
    ceoApproveProposal,
    ceoRejectProposal,
  } = useCBO();
  const [selectedProposal, setSelectedProposal] = React.useState(null);
  const [showProposalDetail, setShowProposalDetail] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [formData, setFormData] = React.useState({
    proposalCode: '',
    title: '',
    donor: '',
    programmeArea: '',
    budgetRequested: '',
    targetBeneficiaries: '',
    duration: '',
    priority: 'Medium',
    status: 'Draft',
    leadWriter: ''
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const filteredProposals = proposals.filter(proposal =>
    proposal.proposalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.cboName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (proposalId, approvalData = {}) => {
    try {
      const stage = approvalData.stage || 'fundraising';
      const reviewer = approvalData.reviewer || 'Admin';
      if (stage === 'ceo') {
        await ceoApproveProposal(
          proposalId,
          approvalData.comments || '',
          approvalData.approver || reviewer,
          approvalData.approvedBudget,
        );
      } else {
        await fundraisingApproveProposal(
          proposalId,
          approvalData.score ?? 0,
          approvalData.comments || '',
          reviewer,
        );
      }
      setShowProposalDetail(false);
    } catch (e) {
      alert(e?.message || 'Failed to approve proposal');
    }
  };

  const handleReject = async (proposalId, approvalData = {}) => {
    try {
      const stage = approvalData.stage || 'fundraising';
      const reviewer = approvalData.reviewer || 'Admin';
      if (stage === 'ceo') {
        await ceoRejectProposal(
          proposalId,
          approvalData.comments || '',
          approvalData.approver || reviewer,
        );
      } else {
        await fundraisingRejectProposal(
          proposalId,
          approvalData.score ?? 0,
          approvalData.comments || '',
          reviewer,
        );
      }
      setShowProposalDetail(false);
    } catch (e) {
      alert(e?.message || 'Failed to reject proposal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',  // Include cookies for authentication
        body: JSON.stringify({
          ...formData,
          budgetRequested: parseFloat(formData.budgetRequested),
          targetBeneficiaries: parseInt(formData.targetBeneficiaries),
          duration: parseInt(formData.duration),
          submissionDate: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Proposal created successfully!');
        setFormData({
          proposalCode: '',
          title: '',
          donor: '',
          programmeArea: '',
          budgetRequested: '',
          targetBeneficiaries: '',
          duration: '',
          priority: 'Medium',
          status: 'Draft',
          leadWriter: ''
        });
        setTimeout(() => {
          setShowAddModal(false);
          setSuccess('');
          window.location.reload();
        }, 1500);
      } else {
        setError(data.message || 'Failed to create proposal');
      }
    } catch (err) {
      setError(err.message || 'Failed to create proposal');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status?.includes('Rejected')) return 'bg-red-100 text-red-700 border-red-200';
    if (status?.includes('Converted')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (status?.includes('Donor Approved')) return 'bg-green-100 text-green-700 border-green-200';
    if (status?.includes('CEO')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status?.includes('Fundraising')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (status?.includes('Donor Pending')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-ink-100 text-ink-700 border-ink-100';
  };

  const getWorkflowStageIcon = (stage, stepStage) => {
    if (stage === stepStage) return <div className="w-3 h-3 bg-blue-600 rounded-full"></div>;
    const proposal = filteredProposals[0]; // For checking completion
    if (stepStage === 'fundraising' && proposal?.fundraisingStatus === 'Approved') return <CheckCircle size={16} className="text-green-600" />;
    if (stepStage === 'fundraising' && proposal?.fundraisingStatus === 'Rejected') return <AlertCircle size={16} className="text-red-600" />;
    if (stepStage === 'ceo' && proposal?.ceoStatus === 'Approved') return <CheckCircle size={16} className="text-green-600" />;
    if (stepStage === 'ceo' && proposal?.ceoStatus === 'Rejected') return <AlertCircle size={16} className="text-red-600" />;
    if (stepStage === 'donor' && proposal?.donorStatus === 'Approved') return <CheckCircle size={16} className="text-green-600" />;
    if (stepStage === 'donor' && proposal?.donorStatus === 'Rejected') return <AlertCircle size={16} className="text-red-600" />;
    if (stepStage === 'converted' && proposal?.convertedToProject) return <CheckCircle size={16} className="text-purple-600" />;
    return <div className="w-3 h-3 bg-ink-300 rounded-full"></div>;
  };

  return (
    <div className="space-y-4">
      {filteredProposals.map(proposal => (
        <div key={proposal.id} className="bg-white rounded-xl border border-ink-100 p-6 hover:shadow-card transition">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-ink-800 mb-1">{proposal.proposalTitle}</h3>
              <p className="text-sm text-purple-600 font-semibold mb-2">{proposal.cboName}</p>

              {/* MEAL Badges - NEW */}
              <div className="flex items-center gap-2 mb-2">
                {proposal.resultsFramework && proposal.resultsFramework.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Target size={12} />
                    {proposal.resultsFramework.length} Indicators
                  </span>
                )}
                {proposal.beneficiaryBreakdown && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Users size={12} />
                    {(proposal.beneficiaryBreakdown.directMale || 0) +
                     (proposal.beneficiaryBreakdown.directFemale || 0) +
                     (proposal.beneficiaryBreakdown.directChildren || 0)} Beneficiaries
                  </span>
                )}
                {proposal.budgetBreakdown && proposal.budgetBreakdown.length > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold flex items-center gap-1">
                    <DollarSign size={12} />
                    {proposal.budgetBreakdown.length} Budget Lines
                  </span>
                )}
                {proposal.safeguarding && proposal.safeguarding.length > 0 && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Shield size={12} />
                    Safeguarding ✓
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-ink-600">
                <div className="flex items-center gap-1">
                  <Building2 size={14} />
                  <span>{proposal.programmeArea}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{proposal.district}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Submitted: {proposal.submissionDate}</span>
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(proposal.status)}`}>
              {proposal.status}
            </span>
          </div>

          {/* Summary */}
          <div className="mb-4 p-3 bg-ink-50 rounded-lg">
            <p className="text-sm text-ink-700">{proposal.summary}</p>
          </div>

          {/* GER Form Enhanced Fields */}
          {proposal.projectTier && (
            <div className="mb-4 p-4 bg-ink-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-ink-700 mb-3">📋 GER Proposal Details</p>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-ink-500 mb-1">Project Tier</p>
                  <p className="text-sm font-semibold text-ink-800">{proposal.projectTier}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500 mb-1">Sector/Theme</p>
                  <p className="text-sm font-semibold text-ink-800">{proposal.sectorTheme}</p>
                </div>
                {proposal.startDate && (
                  <div>
                    <p className="text-xs text-ink-500 mb-1">Project Period</p>
                    <p className="text-sm font-semibold text-ink-800">{proposal.startDate} to {proposal.endDate}</p>
                  </div>
                )}
                {proposal.mealFocalPoint && (
                  <div>
                    <p className="text-xs text-ink-500 mb-1">MEAL Focal Point</p>
                    <p className="text-sm font-semibold text-ink-800">{proposal.mealFocalPoint}</p>
                  </div>
                )}
              </div>

              {proposal.overallGoal && (
                <div className="mb-3">
                  <p className="text-xs text-ink-500 mb-1">Overall Goal</p>
                  <p className="text-sm text-ink-700 italic">"{proposal.overallGoal}"</p>
                </div>
              )}

              {proposal.problemStatement && (
                <div className="mb-3">
                  <p className="text-xs text-ink-500 mb-1">Problem Statement</p>
                  <p className="text-sm text-ink-700">{proposal.problemStatement}</p>
                </div>
              )}

              {proposal.proposedSolution && (
                <div className="mb-3">
                  <p className="text-xs text-ink-500 mb-1">Proposed Solution</p>
                  <p className="text-sm text-ink-700">{proposal.proposedSolution}</p>
                </div>
              )}

              {proposal.keyBeneficiariesDescription && (
                <div className="mb-3">
                  <p className="text-xs text-ink-500 mb-1">Target Beneficiaries Description</p>
                  <p className="text-sm text-ink-700">{proposal.keyBeneficiariesDescription}</p>
                </div>
              )}

              {proposal.needsAssessmentData && (
                <div className="mb-3">
                  <p className="text-xs text-ink-500 mb-1">Needs Assessment</p>
                  <p className="text-sm text-ink-700">{proposal.needsAssessmentData}</p>
                </div>
              )}

              {proposal.strategicAlignment && (
                <div>
                  <p className="text-xs text-ink-500 mb-1">Strategic Alignment</p>
                  <p className="text-sm text-ink-700">{proposal.strategicAlignment}</p>
                </div>
              )}
            </div>
          )}

          {/* Budget & Beneficiaries */}
          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-ink-100">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-ink-500 mb-1">Requested Budget</p>
              <p className="text-lg font-bold text-green-600">
                LKR {proposal.requestedBudget.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-ink-500 mb-1">Duration</p>
              <p className="text-lg font-bold text-blue-600">{proposal.duration}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-ink-500 mb-1">Target Beneficiaries</p>
              <p className="text-lg font-bold text-purple-600">{proposal.targetBeneficiaries}</p>
            </div>
          </div>

          {/* Objectives */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-ink-700 mb-2">Objectives</p>
            <div className="space-y-1">
              {proposal.objectives.map((objective, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-ink-700">
                  <Target size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Activities */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-ink-700 mb-2">Key Activities</p>
            <div className="flex flex-wrap gap-1">
              {proposal.keyActivities.map((activity, index) => (
                <span key={index} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                  {activity}
                </span>
              ))}
            </div>
          </div>

          {/* Approval Workflow Visualization */}
          <div className="mb-4 p-4 bg-ink-50 rounded-lg border border-ink-100">
            <p className="text-xs font-semibold text-ink-700 mb-3">Approval Workflow</p>

            {/* Workflow Steps */}
            <div className="flex items-center justify-between mb-4">
              {/* Step 1: Fundraising */}
              <div className="flex flex-col items-center flex-1">
                {getWorkflowStageIcon(proposal.workflowStage, 'fundraising')}
                <p className="text-xs font-medium text-ink-600 mt-1">Fundraising</p>
                <p className={`text-xs mt-0.5 ${proposal.fundraisingStatus === 'Approved' ? 'text-green-600' : proposal.fundraisingStatus === 'Rejected' ? 'text-red-600' : 'text-ink-400'}`}>
                  {proposal.fundraisingStatus}
                </p>
              </div>

              <div className={`h-0.5 flex-1 ${proposal.fundraisingStatus === 'Approved' ? 'bg-green-300' : 'bg-ink-300'}`}></div>

              {/* Step 2: CEO */}
              <div className="flex flex-col items-center flex-1">
                {getWorkflowStageIcon(proposal.workflowStage, 'ceo')}
                <p className="text-xs font-medium text-ink-600 mt-1">CEO</p>
                <p className={`text-xs mt-0.5 ${proposal.ceoStatus === 'Approved' ? 'text-green-600' : proposal.ceoStatus === 'Rejected' ? 'text-red-600' : 'text-ink-400'}`}>
                  {proposal.ceoStatus}
                </p>
              </div>

              <div className={`h-0.5 flex-1 ${proposal.ceoStatus === 'Approved' ? 'bg-green-300' : 'bg-ink-300'}`}></div>

              {/* Step 3: Donor */}
              <div className="flex flex-col items-center flex-1">
                {getWorkflowStageIcon(proposal.workflowStage, 'donor')}
                <p className="text-xs font-medium text-ink-600 mt-1">Donor</p>
                <p className={`text-xs mt-0.5 ${proposal.donorStatus === 'Approved' ? 'text-green-600' : proposal.donorStatus === 'Rejected' ? 'text-red-600' : 'text-ink-400'}`}>
                  {proposal.donorStatus}
                </p>
              </div>

              <div className={`h-0.5 flex-1 ${proposal.donorStatus === 'Approved' ? 'bg-purple-300' : 'bg-ink-300'}`}></div>

              {/* Step 4: Converted */}
              <div className="flex flex-col items-center flex-1">
                {getWorkflowStageIcon(proposal.workflowStage, 'converted')}
                <p className="text-xs font-medium text-ink-600 mt-1">Project</p>
                <p className={`text-xs mt-0.5 ${proposal.convertedToProject ? 'text-purple-600' : 'text-ink-400'}`}>
                  {proposal.convertedToProject ? 'Converted' : 'Pending'}
                </p>
              </div>
            </div>

            {/* Approval Details */}
            <div className="space-y-2">
              {/* Fundraising Details */}
              {proposal.fundraisingStatus !== 'Pending' && (
                <div className={`p-2 rounded ${proposal.fundraisingStatus === 'Approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-ink-700">Fundraising Review</p>
                    <p className="text-xs text-ink-600">{proposal.fundraisingReviewDate}</p>
                  </div>
                  <p className="text-xs text-ink-600">Reviewer: {proposal.fundraisingReviewer}</p>
                  {proposal.fundraisingScore && (
                    <p className="text-xs text-ink-600">Score: {proposal.fundraisingScore}/100</p>
                  )}
                  {proposal.fundraisingComments && (
                    <p className="text-xs text-ink-700 mt-1 italic">"{proposal.fundraisingComments}"</p>
                  )}
                </div>
              )}

              {/* CEO Details */}
              {proposal.ceoStatus !== 'Pending' && (
                <div className={`p-2 rounded ${proposal.ceoStatus === 'Approved' ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-ink-700">CEO Approval</p>
                    <p className="text-xs text-ink-600">{proposal.ceoApprovalDate}</p>
                  </div>
                  <p className="text-xs text-ink-600">Approver: {proposal.ceoApprover}</p>
                  {proposal.approvedBudget && (
                    <p className="text-xs text-ink-600">Approved Budget: LKR {proposal.approvedBudget.toLocaleString()}</p>
                  )}
                  {proposal.ceoComments && (
                    <p className="text-xs text-ink-700 mt-1 italic">"{proposal.ceoComments}"</p>
                  )}
                </div>
              )}

              {/* Donor Details */}
              {proposal.donorStatus !== 'Pending' && (
                <div className={`p-2 rounded ${proposal.donorStatus === 'Approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-ink-700">Donor Decision</p>
                    <p className="text-xs text-ink-600">{proposal.donorApprovalDate}</p>
                  </div>
                  <p className="text-xs text-ink-600">Donor: {proposal.donorName}</p>
                  {proposal.donorStatus === 'Approved' && proposal.approvedBudget && (
                    <p className="text-xs font-semibold text-green-700">Final Budget: LKR {proposal.approvedBudget.toLocaleString()}</p>
                  )}
                </div>
              )}

              {/* Conversion Status */}
              {proposal.convertedToProject && (
                <div className="p-2 rounded bg-purple-50 border border-purple-200">
                  <p className="text-xs font-semibold text-purple-700">✓ Converted to Project #{proposal.projectId}</p>
                  <p className="text-xs text-ink-600">Start Date: {proposal.projectStartDate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-ink-100">
            <button
              onClick={() => {
                setSelectedProposal(proposal);
                setShowProposalDetail(true);
              }}
              className="w-full px-4 py-2 bg-navy-900 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              View Full Details & MEAL Data
            </button>
          </div>

          {/* Submitted By */}
          <div className="flex items-center justify-between text-xs text-ink-600 mt-3">
            <span>Submitted by: <span className="font-semibold">{proposal.submittedBy}</span> ({proposal.submitterRole})</span>
            <span>Date: {proposal.submissionDate}</span>
          </div>
        </div>
      ))}
      {filteredProposals.length === 0 && (
        <div className="text-center py-12 text-ink-500">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">No proposals found</p>
          <p className="text-sm">Try adjusting your search</p>
        </div>
      )}

      {/* Proposal Detail Modal */}
      {showProposalDetail && selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          onClose={() => setShowProposalDetail(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Add Proposal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-ink-100 bg-navy-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Add New Proposal</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:text-ink-200 transition"
                >
                  <AlertCircle size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Proposal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.proposalCode}
                    onChange={(e) => setFormData({ ...formData, proposalCode: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="PROP-2024-001"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Lead Writer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.leadWriter}
                    onChange={(e) => setFormData({ ...formData, leadWriter: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Proposal Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Enter proposal title"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Donor Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.donor}
                    onChange={(e) => setFormData({ ...formData, donor: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="UNICEF, World Bank, etc."
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Programme Area <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.programmeArea}
                    onChange={(e) => setFormData({ ...formData, programmeArea: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select Programme Area</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="WASH">WASH</option>
                    <option value="Child Protection">Child Protection</option>
                    <option value="Livelihoods">Livelihoods</option>
                    <option value="Emergency Response">Emergency Response</option>
                    <option value="Community Development">Community Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Budget Requested (LKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.budgetRequested}
                    onChange={(e) => setFormData({ ...formData, budgetRequested: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="5000000"
                    required
                    disabled={isLoading}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Target Beneficiaries <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.targetBeneficiaries}
                    onChange={(e) => setFormData({ ...formData, targetBeneficiaries: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="500"
                    required
                    disabled={isLoading}
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Duration (Months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="12"
                    required
                    disabled={isLoading}
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-navy-900 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-card"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// CBO Projects Tab Component
const ProjectsTab = ({ projects, searchTerm, addCFMFeedback, resolveCFMFeedback }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCFMModal, setShowCFMModal] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.cboName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCFM = (project) => {
    setSelectedProject(project);
    setShowCFMModal(true);
  };

  const handleCloseCFM = () => {
    setShowCFMModal(false);
    setSelectedProject(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Closing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'On Hold': return 'bg-ink-100 text-ink-700 border-ink-100';
      default: return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-600';
      case 'In Progress': return 'text-blue-600';
      case 'Pending': return 'text-ink-400';
      default: return 'text-ink-400';
    }
  };

  return (
    <div className="space-y-4">
      {filteredProjects.map(project => {
        const budgetUsed = ((project.spent / project.budget) * 100).toFixed(1);
        const beneficiaryProgress = ((project.actualBeneficiaries / project.targetBeneficiaries) * 100).toFixed(1);

        return (
          <div key={project.id} className="bg-white rounded-xl border border-ink-100 p-6 hover:shadow-card transition">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-ink-800 mb-1">{project.projectTitle}</h3>
                <p className="text-sm text-purple-600 font-semibold mb-2">{project.cboName}</p>
                <div className="flex items-center gap-4 text-sm text-ink-600">
                  <div className="flex items-center gap-1">
                    <Building2 size={14} />
                    <span>{project.programmeArea}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{project.district}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{project.startDate} to {project.endDate}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-ink-700">Project Progress</p>
                <p className="text-xs font-bold text-purple-600">{project.progress}%</p>
              </div>
              <div className="w-full bg-ink-200 rounded-full h-2.5">
                <div
                  className="bg-navy-900 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Budget & Beneficiaries */}
            <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b border-ink-100">
              <div className="text-center p-2 bg-ink-50 rounded-lg">
                <p className="text-xs text-ink-500 mb-1">Budget</p>
                <p className="text-sm font-bold text-ink-700">
                  {(project.budget / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-ink-500 mb-1">Spent</p>
                <p className="text-sm font-bold text-green-600">
                  {(project.spent / 1000000).toFixed(1)}M ({budgetUsed}%)
                </p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-ink-500 mb-1">Target</p>
                <p className="text-sm font-bold text-blue-600">
                  {project.targetBeneficiaries}
                </p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <p className="text-xs text-ink-500 mb-1">Reached</p>
                <p className="text-sm font-bold text-purple-600">
                  {project.actualBeneficiaries} ({beneficiaryProgress}%)
                </p>
              </div>
            </div>

            {/* Team */}
            <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-ink-100">
              <div className="flex items-center gap-2">
                <UserPlus size={14} className="text-purple-600" />
                <div>
                  <p className="text-xs text-ink-500">Project Manager</p>
                  <p className="text-sm font-semibold text-ink-700">{project.projectManager}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-green-600" />
                <div>
                  <p className="text-xs text-ink-500">GERSL Focal Person</p>
                  <p className="text-sm font-semibold text-ink-700">{project.gerslFocalPerson}</p>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-ink-700 mb-2">Milestones</p>
              <div className="space-y-2">
                {project.milestones.map(milestone => (
                  <div key={milestone.id} className="flex items-center gap-3 text-sm">
                    <div className={`p-1 rounded ${milestone.status === 'Completed' ? 'bg-green-100' : milestone.status === 'In Progress' ? 'bg-blue-100' : 'bg-ink-100'}`}>
                      <CheckSquare size={14} className={getMilestoneStatusColor(milestone.status)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-ink-700">{milestone.name}</p>
                    </div>
                    <span className="text-xs text-ink-500">{milestone.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            {project.issues && project.issues.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-800 mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Active Issues ({project.issues.length})
                </p>
                {project.issues.map(issue => (
                  <div key={issue.id} className="text-xs text-ink-700 mb-1">
                    • {issue.issue} <span className="font-semibold">({issue.severity})</span> - {issue.status}
                  </div>
                ))}
              </div>
            )}

            {/* Reporting */}
            <div className="flex items-center justify-between mt-4 text-xs text-ink-600">
              <span>Last Report: {project.lastReportDate}</span>
              <span className="font-semibold text-purple-600">Next Report Due: {project.nextReportDue}</span>
            </div>

            {/* CFM Tracking Button */}
            <div className="mt-4 pt-4 border-t border-ink-100">
              <button
                onClick={() => handleOpenCFM(project)}
                className="w-full px-4 py-2 bg-navy-900 text-white rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <MessageSquare size={16} />
                Community Feedback & Complaints ({project.cfmLog?.length || 0})
              </button>
            </div>
          </div>
        );
      })}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-ink-500">
          <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-semibold">No projects found</p>
          <p className="text-sm">Try adjusting your search</p>
        </div>
      )}

      {/* CFM Modal */}
      {showCFMModal && selectedProject && (
        <CFMModal
          project={selectedProject}
          onClose={handleCloseCFM}
          addCFMFeedback={addCFMFeedback}
          resolveCFMFeedback={resolveCFMFeedback}
        />
      )}
    </div>
  );
};

// CFM (Community Feedback Mechanism) Modal Component
const CFMModal = ({ project, onClose, addCFMFeedback, resolveCFMFeedback }) => {
  const [activeView, setActiveView] = useState('list'); // 'list' or 'add'
  const [formData, setFormData] = useState({
    feedbackType: 'Complaint',
    channel: 'Hotline',
    description: '',
    reportedBy: '',
    contactInfo: '',
    severity: 'Medium'
  });

  const cfmLog = project.cfmLog || [];
  const openFeedback = cfmLog.filter(fb => fb.status !== 'Resolved');
  const resolvedFeedback = cfmLog.filter(fb => fb.status === 'Resolved');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    addCFMFeedback(project.id, formData);
    setFormData({
      feedbackType: 'Complaint',
      channel: 'Hotline',
      description: '',
      reportedBy: '',
      contactInfo: '',
      severity: 'Medium'
    });
    setActiveView('list');
  };

  const handleResolve = (feedbackId) => {
    const actionTaken = prompt('Enter action taken to resolve this feedback:');
    const responsiblePerson = prompt('Enter name of person who resolved it:');

    if (actionTaken && responsiblePerson) {
      resolveCFMFeedback(project.id, feedbackId, { actionTaken, responsiblePerson });
    }
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case 'Complaint': return 'bg-red-100 text-red-700 border-red-200';
      case 'Suggestion': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Positive': return 'bg-green-100 text-green-700 border-green-200';
      case 'Query': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-ink-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare size={24} />
                Community Feedback Mechanism
              </h2>
              <p className="text-sm opacity-90 mt-1">{project.projectTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-ink-100">
          <button
            onClick={() => setActiveView('list')}
            className={`flex-1 px-4 py-3 font-semibold transition ${
              activeView === 'list'
                ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
            }`}
          >
            Feedback Log ({cfmLog.length})
          </button>
          <button
            onClick={() => setActiveView('add')}
            className={`flex-1 px-4 py-3 font-semibold transition ${
              activeView === 'add'
                ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
            }`}
          >
            Add New Feedback
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeView === 'list' ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-2xl font-bold text-orange-600">{cfmLog.length}</p>
                  <p className="text-xs text-ink-600">Total Feedback</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-2xl font-bold text-yellow-600">{openFeedback.length}</p>
                  <p className="text-xs text-ink-600">Open/Pending</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{resolvedFeedback.length}</p>
                  <p className="text-xs text-ink-600">Resolved</p>
                </div>
              </div>

              {/* Feedback List */}
              {cfmLog.length === 0 ? (
                <div className="text-center py-12 text-ink-500">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-semibold">No feedback recorded yet</p>
                  <p className="text-sm">Click "Add New Feedback" to start tracking community feedback</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cfmLog.map((feedback) => (
                    <div key={feedback.id} className="bg-ink-50 rounded-lg p-4 border border-ink-100">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getFeedbackTypeColor(feedback.feedbackType)}`}>
                            {feedback.feedbackType}
                          </span>
                          <span className="text-xs text-ink-500">via {feedback.channel}</span>
                          <span className={`text-xs font-semibold ${getSeverityColor(feedback.severity)}`}>
                            {feedback.severity} Severity
                          </span>
                        </div>
                        <span className="text-xs text-ink-500">{feedback.date}</span>
                      </div>

                      <p className="text-sm text-ink-700 mb-2">{feedback.description}</p>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-ink-500">Reported by: </span>
                          <span className="font-semibold text-ink-700">{feedback.reportedBy}</span>
                          <span className="text-ink-500 ml-3">Contact: </span>
                          <span className="text-ink-700">{feedback.contactInfo}</span>
                        </div>

                        {feedback.status === 'Resolved' ? (
                          <div className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
                            <span className="text-green-700 font-semibold">✓ Resolved</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleResolve(feedback.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                          >
                            Mark as Resolved
                          </button>
                        )}
                      </div>

                      {feedback.status === 'Resolved' && (
                        <div className="mt-3 pt-3 border-t border-ink-100">
                          <p className="text-xs text-ink-600 mb-1">
                            <span className="font-semibold">Action Taken:</span> {feedback.actionTaken}
                          </p>
                          <p className="text-xs text-ink-600">
                            <span className="font-semibold">Resolved By:</span> {feedback.responsiblePerson} on {feedback.dateResolved}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Add New Feedback Form
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Feedback Type *</label>
                  <select
                    name="feedbackType"
                    value={formData.feedbackType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Complaint">Complaint</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Positive">Positive Feedback</option>
                    <option value="Query">Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Channel *</label>
                  <select
                    name="channel"
                    value={formData.channel}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Hotline">Hotline</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Complaint Box">Complaint Box</option>
                    <option value="Email">Email</option>
                    <option value="In-Person">In-Person</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Severity *</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Detailed description of the feedback or complaint..."
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Reported By *</label>
                  <input
                    type="text"
                    name="reportedBy"
                    value={formData.reportedBy}
                    onChange={handleInputChange}
                    required
                    placeholder="Name of person reporting"
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Contact Info *</label>
                  <input
                    type="text"
                    name="contactInfo"
                    value={formData.contactInfo}
                    onChange={handleInputChange}
                    required
                    placeholder="Phone or email"
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-navy-900 text-white rounded-lg transition font-semibold shadow-md flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Submit Feedback
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Proposal Modal Component
const AddProposalModal = ({ onClose, onSubmit, cboPartners }) => {
  const [formData, setFormData] = useState({
    cboId: '',
    cboName: '',
    proposalTitle: '',
    programmeArea: 'Education',
    requestedBudget: '',
    duration: '12 months',
    targetBeneficiaries: '',
    district: 'Colombo',
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

  const handleCBOChange = (e) => {
    const cboId = parseInt(e.target.value);
    const selectedCBO = cboPartners.find(cbo => cbo.id === cboId);
    if (selectedCBO) {
      setFormData({
        ...formData,
        cboId: cboId,
        cboName: selectedCBO.name,
        district: selectedCBO.district
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clean up objectives and activities (remove empty ones)
    const cleanData = {
      ...formData,
      requestedBudget: parseFloat(formData.requestedBudget),
      targetBeneficiaries: parseInt(formData.targetBeneficiaries),
      objectives: formData.objectives.filter(obj => obj.trim() !== ''),
      keyActivities: formData.keyActivities.filter(act => act.trim() !== ''),
      submittedBy: 'System User', // This should come from auth context in production
      submitterRole: 'CBO Manager',
      // Convert beneficiary breakdown to numbers
      beneficiaryBreakdown: {
        directMale: parseInt(formData.beneficiaryBreakdown.directMale) || 0,
        directFemale: parseInt(formData.beneficiaryBreakdown.directFemale) || 0,
        directChildren: parseInt(formData.beneficiaryBreakdown.directChildren) || 0,
        directPWD: parseInt(formData.beneficiaryBreakdown.directPWD) || 0,
        indirectTotal: parseInt(formData.beneficiaryBreakdown.indirectTotal) || 0
      },
      // Clean up Theory of Change (remove empty entries)
      theoryOfChange: {
        inputs: formData.theoryOfChange.inputs.filter(item => item.trim() !== ''),
        activities: formData.theoryOfChange.activities.filter(item => item.trim() !== ''),
        outputs: formData.theoryOfChange.outputs.filter(item => item.trim() !== ''),
        outcomes: formData.theoryOfChange.outcomes.filter(item => item.trim() !== ''),
        impact: formData.theoryOfChange.impact,
        assumptions: formData.theoryOfChange.assumptions.filter(item => item.trim() !== ''),
        risks: formData.theoryOfChange.risks.filter(item => item.trim() !== '')
      }
    };

    onSubmit(cleanData);
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-800 border-b pb-2">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">CBO Partner *</label>
                <select
                  required
                  value={formData.cboId}
                  onChange={handleCBOChange}
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select CBO...</option>
                  {cboPartners.map(cbo => (
                    <option key={cbo.id} value={cbo.id}>{cbo.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-1">District</label>
                <input
                  type="text"
                  value={formData.district}
                  readOnly
                  className="w-full px-3 py-2 border border-ink-200 rounded-lg bg-ink-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Proposal Title *</label>
              <input
                type="text"
                name="proposalTitle"
                required
                value={formData.proposalTitle}
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
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Livelihood">Livelihood</option>
                  <option value="WASH">WASH</option>
                  <option value="Protection">Protection</option>
                  <option value="Women Empowerment">Women Empowerment</option>
                  <option value="Youth Development">Youth Development</option>
                  <option value="Disability Inclusion">Disability Inclusion</option>
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

          {/* Budget Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-bold text-ink-800">Detailed Budget Breakdown</h3>
              </div>
              <button
                type="button"
                onClick={addBudgetItem}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Line Item
              </button>
            </div>

            {formData.budgetBreakdown.length === 0 ? (
              <div className="text-center py-8 bg-ink-50 rounded-lg border-2 border-dashed border-ink-300">
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
                        <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Unit Cost (LKR)</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Total Cost (LKR)</th>
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink-700">Budget by Category:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {['Personnel', 'Equipment', 'Materials', 'Activities', 'Transport', 'Training', 'Monitoring', 'Administrative', 'Other'].map(category => {
                      const categoryTotal = formData.budgetBreakdown
                        .filter(item => item.category === category)
                        .reduce((sum, item) => sum + (item.totalCost || 0), 0);
                      if (categoryTotal > 0) {
                        return (
                          <div key={category} className="text-xs">
                            <span className="text-ink-600">{category}:</span>
                            <span className="font-semibold text-green-700 ml-1">
                              LKR {categoryTotal.toLocaleString()}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
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

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Target Beneficiaries Description</label>
              <textarea
                name="keyBeneficiariesDescription"
                rows="2"
                value={formData.keyBeneficiariesDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Detailed description of target beneficiaries..."
              />
            </div>
          </div>

          {/* Project Justification */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink-800 border-b pb-2">Project Justification</h3>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Needs Assessment Data</label>
              <textarea
                name="needsAssessmentData"
                rows="2"
                value={formData.needsAssessmentData}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Evidence from needs assessment..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Strategic Alignment</label>
              <textarea
                name="strategicAlignment"
                rows="2"
                value={formData.strategicAlignment}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Alignment with GER strategies, SDGs, etc..."
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

          {/* MEAL - Results Framework */}
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                <Target className="text-blue-600" size={20} />
                Results Framework (MEAL Indicators)
              </h3>
              <button
                type="button"
                onClick={addIndicator}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-1"
              >
                <Plus size={16} />
                Add Indicator
              </button>
            </div>

            {formData.resultsFramework.length === 0 ? (
              <div className="text-center py-6 text-ink-500">
                <Target size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No indicators added yet. Click "Add Indicator" to start building your results framework.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.resultsFramework.map((indicator) => {
                  const tierNum = formData.projectTier === 'Tier 1' ? 1 : formData.projectTier === 'Tier 2' ? 2 : 3;
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

          {/* MEAL - Beneficiary Disaggregation */}
          <div className="space-y-4 bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
              <Users2 className="text-green-600" size={20} />
              Beneficiary Disaggregation Matrix
            </h3>

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

            <div className="bg-white rounded p-3 border border-green-200">
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

          {/* Theory of Change */}
          <div className="space-y-4 bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={20} />
              Theory of Change
            </h3>
            <p className="text-xs text-ink-600 mb-3">
              Map how your inputs lead to activities, outputs, outcomes, and ultimately impact. Include key assumptions and risks.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Inputs */}
              <div className="bg-white rounded-lg p-3 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-indigo-700">1. Inputs (Resources)</label>
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
                      placeholder="e.g., Staff, budget, materials"
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
                  <label className="text-sm font-semibold text-indigo-700">2. Activities (What We Do)</label>
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
                      placeholder="e.g., Distribute school kits"
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
                  <label className="text-sm font-semibold text-indigo-700">3. Outputs (Direct Results)</label>
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
                  <label className="text-sm font-semibold text-indigo-700">4. Outcomes (Changes)</label>
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
                      placeholder="e.g., Improved school attendance"
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
              <label className="block text-sm font-semibold text-indigo-700 mb-2">5. Impact (Long-term Change)</label>
              <textarea
                value={formData.theoryOfChange.impact}
                onChange={(e) => handleToCImpactChange(e.target.value)}
                rows="2"
                placeholder="e.g., Reduced educational inequality and improved life outcomes for orphaned children"
                className="w-full px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Assumptions */}
              <div className="bg-white rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-yellow-700">Key Assumptions</label>
                  <button
                    type="button"
                    onClick={() => addToCItem('assumptions')}
                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                  >
                    + Add
                  </button>
                </div>
                {formData.theoryOfChange.assumptions.map((assumption, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={assumption}
                      onChange={(e) => handleToCArrayChange('assumptions', index, e.target.value)}
                      placeholder="e.g., Parents support education"
                      className="flex-1 px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-yellow-500"
                    />
                    {formData.theoryOfChange.assumptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeToCItem('assumptions', index)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Risks */}
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-red-700">Key Risks</label>
                  <button
                    type="button"
                    onClick={() => addToCItem('risks')}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    + Add
                  </button>
                </div>
                {formData.theoryOfChange.risks.map((risk, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={risk}
                      onChange={(e) => handleToCArrayChange('risks', index, e.target.value)}
                      placeholder="e.g., Supply chain delays"
                      className="flex-1 px-2 py-1 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-red-500"
                    />
                    {formData.theoryOfChange.risks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeToCItem('risks', index)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Flow Indicator */}
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-700">
                <span className="px-2 py-1 bg-indigo-100 rounded">Inputs</span>
                <span>→</span>
                <span className="px-2 py-1 bg-indigo-100 rounded">Activities</span>
                <span>→</span>
                <span className="px-2 py-1 bg-indigo-100 rounded">Outputs</span>
                <span>→</span>
                <span className="px-2 py-1 bg-indigo-100 rounded">Outcomes</span>
                <span>→</span>
                <span className="px-2 py-1 bg-indigo-100 rounded">Impact</span>
              </div>
            </div>
          </div>

          {/* Safeguarding Compliance Checklist */}
          <div className="space-y-4 bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
              <CheckSquare className="text-red-600" size={20} />
              Safeguarding Compliance Checklist
            </h3>
            <p className="text-xs text-ink-600 mb-3">
              Confirm that your project adheres to GER safeguarding standards. All items must be checked for comprehensive projects (Tier 1).
            </p>

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
                    <p className="text-xs text-ink-600">Personal data encrypted, stored securely, GDPR compliant</p>
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
                    <p className="text-xs text-ink-600">Written consent forms for all beneficiaries/guardians</p>
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
                    <p className="text-xs text-ink-600">Child protection policy in place, staff trained</p>
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
                    <p className="text-xs text-ink-600">Clear reporting mechanism for safeguarding concerns</p>
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
                    <p className="text-xs text-ink-600">All staff working with vulnerable groups screened</p>
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
                    <p className="text-xs text-ink-600">Staff signed code of conduct, zero tolerance policy</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Safeguarding Focal Person */}
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <label className="block text-sm font-semibold text-red-700 mb-2">Safeguarding Focal Person *</label>
              <input
                type="text"
                value={formData.safeguarding.safeguardingFocalPerson}
                onChange={(e) => handleSafeguardingFocalPerson(e.target.value)}
                placeholder="Name and contact of designated safeguarding officer"
                className="w-full px-3 py-2 text-sm border border-ink-200 rounded focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* CFM Channels */}
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <label className="block text-sm font-semibold text-red-700 mb-2">Community Feedback Channels *</label>
              <p className="text-xs text-ink-600 mb-2">Select all channels available for beneficiaries to provide feedback or report concerns:</p>
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

            {/* Compliance Summary */}
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-700">Compliance Status:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-ink-800">
                    {Object.values(formData.safeguarding).filter(v => v === true).length} / 6
                  </span>
                  <span className="text-xs text-ink-600">items checked</span>
                </div>
              </div>
              {formData.projectTier === 'Tier 1' && Object.values(formData.safeguarding).filter(v => v === true).length < 6 && (
                <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded mt-2">
                  ⚠️ Tier 1 projects require all safeguarding items to be checked
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-navy-900 text-white rounded-lg transition font-semibold shadow-md"
            >
              Submit Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CBOPage;
