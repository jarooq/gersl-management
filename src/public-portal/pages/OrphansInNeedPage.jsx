import React, { useState, useMemo } from 'react';
import { Heart, Users, MapPin, Calendar, DollarSign, Gift, ArrowRight, Filter, Search, Baby, X, Check, CreditCard, Building2 } from 'lucide-react';
import { useOrphans } from '../../contexts/OrphanContext';
import { useSponsorship } from '../../contexts/SponsorshipContext';

const OrphansInNeedPage = () => {
  const { orphans, getStats, updateOrphan } = useOrphans();
  const { createSponsorship } = useSponsorship();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [selectedOrphan, setSelectedOrphan] = useState(null);
  const [sponsorshipType, setSponsorshipType] = useState('Monthly');
  const [customAmount, setCustomAmount] = useState('');
  const [sponsorForm, setSponsorForm] = useState({
    sponsorName: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'Bank Transfer'
  });

  // Get stats from context
  const stats = getStats();

  // Filter to show only orphans without sponsors (status: "Active" and no sponsorshipStatus or sponsorshipStatus: "Not Sponsored")
  const orphansInNeed = useMemo(() => {
    return orphans.filter(orphan =>
      orphan.status === 'Active' &&
      (!orphan.sponsorshipStatus || orphan.sponsorshipStatus === 'Not Sponsored')
    );
  }, [orphans]);

  // If no orphans, show sample data for demonstration
  const displayOrphans = orphansInNeed.length > 0 ? orphansInNeed : [
    {
      id: 1,
      name: 'Ahmed',
      age: 8,
      gender: 'Male',
      location: 'Colombo',
      district: 'Colombo',
      story: 'Ahmed lost his parents in a tragic accident. He dreams of becoming a doctor to help others.',
      monthlyNeed: 5000,
      education: 'Grade 3',
      imageUrl: '/orphan-placeholder.jpg',
      urgency: 'High'
    },
    {
      id: 2,
      name: 'Fatima',
      age: 6,
      gender: 'Female',
      location: 'Galle',
      district: 'Galle',
      story: 'Fatima is a bright young girl who loves to read. She needs support to continue her education.',
      monthlyNeed: 4500,
      education: 'Grade 1',
      imageUrl: '/orphan-placeholder.jpg',
      urgency: 'Medium'
    },
    {
      id: 3,
      name: 'Hassan',
      age: 12,
      gender: 'Male',
      location: 'Kandy',
      district: 'Kandy',
      story: 'Hassan is a talented artist who lost his family. He needs sponsorship to pursue his education.',
      monthlyNeed: 6000,
      education: 'Grade 7',
      imageUrl: '/orphan-placeholder.jpg',
      urgency: 'High'
    },
    {
      id: 4,
      name: 'Aisha',
      age: 10,
      gender: 'Female',
      location: 'Jaffna',
      district: 'Jaffna',
      story: 'Aisha is an orphan who excels in mathematics. She dreams of becoming an engineer.',
      monthlyNeed: 5500,
      education: 'Grade 5',
      imageUrl: '/orphan-placeholder.jpg',
      urgency: 'Medium'
    },
    {
      id: 5,
      name: 'Ibrahim',
      age: 7,
      gender: 'Male',
      location: 'Batticaloa',
      district: 'Batticaloa',
      story: 'Ibrahim is a cheerful boy who loves sports. He needs support for his basic needs and education.',
      monthlyNeed: 4800,
      education: 'Grade 2',
      imageUrl: '/orphan-placeholder.jpg',
      urgency: 'High'
    },
    {
      id: 6,
      name: 'Zainab',
      age: 9,
      gender: 'Female',
      location: 'Ampara',
      district: 'Ampara',
      story: 'Zainab is a kind-hearted girl who helps care for younger children. She needs educational support.',
      monthlyNeed: 5200,
      education: 'Grade 4',
      imageUrl: '/orphan-placeholder.jpg',
      urgency: 'Medium'
    }
  ];

  const filterOptions = ['All', 'High Urgency', 'Male', 'Female', 'Age 5-8', 'Age 9-12'];

  // Filter orphans based on selected filter and search
  const filteredOrphans = useMemo(() => {
    return displayOrphans.filter(orphan => {
      // Map fullName to name for consistency
      const orphanName = orphan.fullName || orphan.name || '';
      const orphanLocation = orphan.district || orphan.location || '';

      const matchesSearch = orphanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           orphanLocation.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedFilter === 'All') return matchesSearch;
      if (selectedFilter === 'High Urgency') return matchesSearch && (orphan.urgency === 'High' || !orphan.lastVisitDate);
      if (selectedFilter === 'Male') return matchesSearch && orphan.gender === 'Male';
      if (selectedFilter === 'Female') return matchesSearch && orphan.gender === 'Female';

      // Calculate age from dateOfBirth if age not directly available
      const orphanAge = orphan.age || (orphan.dateOfBirth ? new Date().getFullYear() - new Date(orphan.dateOfBirth).getFullYear() : 0);
      if (selectedFilter === 'Age 5-8') return matchesSearch && orphanAge >= 5 && orphanAge <= 8;
      if (selectedFilter === 'Age 9-12') return matchesSearch && orphanAge >= 9 && orphanAge <= 12;

      return matchesSearch;
    });
  }, [displayOrphans, searchQuery, selectedFilter]);

  // Calculate sponsorship amount based on type
  const calculateAmount = () => {
    if (!selectedOrphan) return 0;
    const monthlyAmount = selectedOrphan.stipendAmount || 5000;

    switch (sponsorshipType) {
      case 'Monthly':
        return monthlyAmount;
      case 'Yearly':
        return monthlyAmount * 12;
      case 'Custom':
        return parseFloat(customAmount) || 0;
      default:
        return 0;
    }
  };

  // Handle sponsor now click
  const handleSponsorClick = (orphan) => {
    setSelectedOrphan(orphan);
    setShowSponsorModal(true);
    setSponsorshipType('Monthly');
    setCustomAmount('');
  };

  // Handle sponsorship submission
  const handleSubmitSponsorship = (e) => {
    e.preventDefault();

    if (!sponsorForm.sponsorName || !sponsorForm.email || !sponsorForm.phone) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = calculateAmount();
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Create sponsorship record
    const sponsorship = createSponsorship({
      orphanId: selectedOrphan.id,
      sponsorName: sponsorForm.sponsorName,
      email: sponsorForm.email,
      phone: sponsorForm.phone,
      address: sponsorForm.address,
      amount: amount,
      paymentFrequency: sponsorshipType,
      paymentMethod: sponsorForm.paymentMethod
    });

    // Update orphan with sponsorship info
    updateOrphan(selectedOrphan.id, {
      sponsorshipStatus: 'Sponsored',
      sponsorId: sponsorship.sponsorId,
      sponsorshipStartDate: new Date().toISOString(),
      monthlyStipend: selectedOrphan.stipendAmount || 5000
    });

    // Reset form
    setSponsorForm({
      sponsorName: '',
      email: '',
      phone: '',
      address: '',
      paymentMethod: 'Bank Transfer'
    });

    setShowSponsorModal(false);
    alert(`Thank you for sponsoring ${selectedOrphan.fullName || selectedOrphan.name}! Your sponsorship has been recorded.`);
  };

  const statsDisplay = [
    { label: 'Waiting for Sponsorship', value: orphansInNeed.length, icon: Baby, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Total Orphans Helped', value: stats.total.toString(), icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { label: 'Active Orphans', value: stats.active.toString(), icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Total Monthly Stipend', value: `LKR ${(stats.totalStipend || 0).toLocaleString()}`, icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-600 via-rose-600 to-red-700 text-white py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-75"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/30 shadow-lg">
              <Heart size={18} className="animate-pulse text-yellow-300" />
              <span className="text-sm font-semibold">Make a Lasting Difference</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Orphans in Need
              <span className="block text-yellow-300 mt-2">of Your Support</span>
            </h1>

            <p className="text-lg md:text-xl text-pink-100 mb-8 leading-relaxed max-w-3xl mx-auto">
              These precious children are waiting for someone like you to become their sponsor.
              Your monthly donation can provide them with education, healthcare, nutrition, and hope for a brighter future.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#orphans"
                className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-8 py-4 rounded-full font-bold hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
              >
                <Heart size={20} />
                Browse Orphans
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold hover:bg-white/30 transition-all border border-white/30 shadow-xl"
              >
                How It Works
                <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-12 bg-gradient-to-br from-gray-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {statsDisplay.map((stat, index) => (
              <div
                key={index}
                className={`${stat.bgColor} rounded-xl p-6 text-center hover:shadow-lg transition-all transform hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 ${stat.color} mx-auto mb-4 opacity-80`}>
                  <stat.icon size={48} />
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-2">{stat.value}</p>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter and Search */}
      <section id="orphans" className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedFilter === filter
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <p className="text-gray-600 mt-4 text-center md:text-left">
            Showing <span className="font-bold text-pink-600">{filteredOrphans.length}</span> orphan{filteredOrphans.length !== 1 ? 's' : ''} in need of sponsorship
          </p>
        </div>
      </section>

      {/* Orphan Profiles Grid */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredOrphans.map((orphan) => {
              const orphanName = orphan.fullName || orphan.name || 'Anonymous';
              const orphanAge = orphan.age || (orphan.dateOfBirth ? new Date().getFullYear() - new Date(orphan.dateOfBirth).getFullYear() : '?');
              const orphanLocation = orphan.district || orphan.location || 'Unknown';
              const orphanEducation = orphan.grade || orphan.education || orphan.schoolName || 'N/A';
              const orphanStory = orphan.remarks || orphan.story || orphan.healthInfo || `${orphanName} is waiting for a sponsor to help with education and daily needs.`;
              const monthlyStipend = orphan.stipendAmount || orphan.monthlyNeed || 5000;
              const isUrgent = orphan.urgency === 'High' || !orphan.lastVisitDate;

              return (
                <div
                  key={orphan.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group transform hover:-translate-y-2"
                >
                  {/* Profile Image */}
                  <div className="h-64 bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 mx-auto border-4 border-white/30">
                          <Baby size={64} className="text-white" />
                        </div>
                        <h3 className="text-3xl font-bold">{orphanName}</h3>
                        <p className="text-white/90 text-sm mt-1">{orphanAge} years old • {orphan.gender || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Urgency Badge */}
                    {isUrgent && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                          Urgent
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Profile Details */}
                  <div className="p-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-pink-600 flex-shrink-0" />
                        <span className="text-gray-700">{orphanLocation}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-pink-600 flex-shrink-0" />
                        <span className="text-gray-700">{orphanEducation}</span>
                      </div>
                    </div>

                    {/* Story */}
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">
                      {orphanStory}
                    </p>

                    {/* Monthly Need */}
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-pink-600 rounded-lg p-4 mb-4">
                      <p className="text-xs text-gray-600 mb-1">Monthly Sponsorship</p>
                      <p className="text-2xl font-bold text-pink-900">
                        LKR {monthlyStipend.toLocaleString()}
                        <span className="text-sm font-normal text-gray-600">/month</span>
                      </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSponsorClick(orphan)}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Heart className="inline-block mr-2 -mt-1" size={18} />
                        Sponsor Now
                      </button>
                      <button className="px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all">
                        <Gift size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOrphans.length === 0 && (
            <div className="text-center py-16">
              <Baby size={64} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orphans found matching your search criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">How Sponsorship Works</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Becoming a sponsor is simple and makes a profound impact on a child's life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '1',
                title: 'Choose a Child',
                description: 'Browse profiles and select a child whose story resonates with you',
                icon: Heart,
                color: 'pink'
              },
              {
                step: '2',
                title: 'Set Up Sponsorship',
                description: 'Complete a simple form and set up your monthly donation',
                icon: DollarSign,
                color: 'blue'
              },
              {
                step: '3',
                title: 'Receive Updates',
                description: 'Get regular updates, photos, and progress reports about your sponsored child',
                icon: Calendar,
                color: 'green'
              },
              {
                step: '4',
                title: 'Make an Impact',
                description: 'Watch as your support transforms a life and builds a brighter future',
                icon: Gift,
                color: 'purple'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-20 h-20 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl transform hover:scale-110 transition-transform`}>
                  <item.icon className="text-white" size={40} />
                </div>
                <div className={`text-4xl font-bold text-${item.color}-600 mb-3`}>{item.step}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stories */}
      <section className="py-20 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Success Stories</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              See the incredible transformation your sponsorship can make
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Nour',
                age: '16',
                achievement: 'Graduated High School with Honors',
                story: 'Thanks to sponsorship, Nour completed her education and is now studying medicine at university.',
                yearsSponsored: '8 years'
              },
              {
                name: 'Rashid',
                age: '14',
                achievement: 'Won Regional Science Competition',
                story: 'Rashid\'s sponsor provided him with books and materials. He\'s now pursuing his dream in technology.',
                yearsSponsored: '5 years'
              },
              {
                name: 'Layla',
                age: '12',
                achievement: 'Published First Story Book',
                story: 'With support from her sponsor, Layla developed her writing skills and published her first children\'s book.',
                yearsSponsored: '4 years'
              }
            ].map((story, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Heart className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{story.name}, {story.age}</h3>
                <p className="text-pink-600 font-semibold mb-4">{story.achievement}</p>
                <p className="text-gray-600 mb-4 leading-relaxed">{story.story}</p>
                <div className="bg-pink-50 rounded-lg px-4 py-2 inline-block">
                  <p className="text-sm font-semibold text-pink-700">Sponsored for {story.yearsSponsored}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-pink-600 via-rose-600 to-red-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-75"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <Heart size={64} className="mx-auto mb-6 animate-pulse text-yellow-300" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Change a Life?
          </h2>
          <p className="text-xl text-pink-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your monthly sponsorship provides food, education, healthcare, and hope to a child in need
          </p>

          <div className="flex flex-wrap gap-6 justify-center">
            <a
              href="#orphans"
              className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-10 py-5 rounded-full font-bold hover:bg-yellow-300 transition-all shadow-2xl hover:shadow-3xl hover:scale-110 transform text-lg"
            >
              <Heart size={24} />
              Start Sponsoring Today
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-10 py-5 rounded-full font-bold hover:bg-white/30 transition-all border border-white/30 shadow-2xl text-lg"
            >
              Contact Us
              <ArrowRight size={24} />
            </a>
          </div>
        </div>
      </section>

      {/* Sponsorship Modal */}
      {showSponsorModal && selectedOrphan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-rose-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Sponsor {selectedOrphan.fullName || selectedOrphan.name}</h2>
                  <p className="text-pink-100">Make a lasting difference in a child's life</p>
                </div>
                <button
                  onClick={() => setShowSponsorModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitSponsorship} className="p-6 space-y-6">
              {/* Sponsorship Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Choose Sponsorship Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Monthly Option */}
                  <button
                    type="button"
                    onClick={() => setSponsorshipType('Monthly')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      sponsorshipType === 'Monthly'
                        ? 'border-pink-600 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-center">
                      <Calendar className={`mx-auto mb-2 ${sponsorshipType === 'Monthly' ? 'text-pink-600' : 'text-gray-400'}`} size={32} />
                      <div className="font-bold text-gray-900 mb-1">Monthly</div>
                      <div className="text-2xl font-bold text-pink-600">
                        LKR {((selectedOrphan.stipendAmount || 5000)).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">per month</div>
                    </div>
                    {sponsorshipType === 'Monthly' && (
                      <div className="mt-3 flex items-center justify-center gap-1 text-pink-600 text-sm">
                        <Check size={16} />
                        <span>Selected</span>
                      </div>
                    )}
                  </button>

                  {/* Yearly Option */}
                  <button
                    type="button"
                    onClick={() => setSponsorshipType('Yearly')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      sponsorshipType === 'Yearly'
                        ? 'border-pink-600 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-center">
                      <Calendar className={`mx-auto mb-2 ${sponsorshipType === 'Yearly' ? 'text-pink-600' : 'text-gray-400'}`} size={32} />
                      <div className="font-bold text-gray-900 mb-1">Yearly</div>
                      <div className="text-2xl font-bold text-pink-600">
                        LKR {((selectedOrphan.stipendAmount || 5000) * 12).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">per year</div>
                      <div className="mt-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                        Save 1 month!
                      </div>
                    </div>
                    {sponsorshipType === 'Yearly' && (
                      <div className="mt-3 flex items-center justify-center gap-1 text-pink-600 text-sm">
                        <Check size={16} />
                        <span>Selected</span>
                      </div>
                    )}
                  </button>

                  {/* Custom Amount */}
                  <button
                    type="button"
                    onClick={() => setSponsorshipType('Custom')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      sponsorshipType === 'Custom'
                        ? 'border-pink-600 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-center">
                      <DollarSign className={`mx-auto mb-2 ${sponsorshipType === 'Custom' ? 'text-pink-600' : 'text-gray-400'}`} size={32} />
                      <div className="font-bold text-gray-900 mb-1">Custom</div>
                      <div className="text-sm text-gray-600 mb-2">Your Amount</div>
                      {sponsorshipType === 'Custom' && (
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 border border-pink-300 rounded-lg text-center font-bold text-pink-600"
                          min="1000"
                        />
                      )}
                    </div>
                    {sponsorshipType === 'Custom' && (
                      <div className="mt-3 flex items-center justify-center gap-1 text-pink-600 text-sm">
                        <Check size={16} />
                        <span>Selected</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Sponsor Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={sponsorForm.sponsorName}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, sponsorName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={sponsorForm.email}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={sponsorForm.phone}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="+94 77 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                    <select
                      required
                      value={sponsorForm.paymentMethod}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, paymentMethod: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Mobile Payment">Mobile Payment</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
                  <textarea
                    value={sponsorForm.address}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows="2"
                    placeholder="Your address"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
                <h3 className="font-bold text-gray-900 mb-4">Sponsorship Summary</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orphan:</span>
                    <span className="font-semibold">{selectedOrphan.fullName || selectedOrphan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold">{sponsorshipType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold">{sponsorForm.paymentMethod}</span>
                  </div>
                </div>
                <div className="border-t border-pink-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                    <span className="text-3xl font-bold text-pink-600">
                      LKR {calculateAmount().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSponsorModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Heart className="inline-block mr-2 -mt-1" size={20} />
                  Confirm Sponsorship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrphansInNeedPage;
