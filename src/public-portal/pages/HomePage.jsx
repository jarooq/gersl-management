import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Users, TrendingUp, Award, ArrowRight, CheckCircle, Target, Globe,
  Briefcase, FileText, Phone, Mail, Sparkles, MapPin, DollarSign, Star,
  Zap, Shield, Baby, Droplet, BookOpen, Utensils, Calendar
} from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';
import { getImageUrl } from '../../services/api';

const HomePage = () => {
  const { campaigns } = useCampaign();
  const [selectedCategory, setSelectedCategory] = useState('All Appeals');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Hero images
  const heroImages = [
    '/IMG_8277.JPG',
    '/IMG_8278.JPG',
    '/IMG_8279.JPG',
    '/IMG_8280.JPG'
  ];

  // Auto-rotate images every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Get active campaigns for display
  const activeCampaigns = campaigns.filter(c => c.status === 'Active');

  // Get unique categories
  const categories = ['All Appeals', ...new Set(activeCampaigns.map(c => c.category))];

  // Filter campaigns based on selected category
  const filteredCampaigns = selectedCategory === 'All Appeals'
    ? activeCampaigns
    : activeCampaigns.filter(c => c.category === selectedCategory);

  const stats = [
    {
      icon: Users,
      label: 'Lives Impacted',
      sublabel: 'in 2024',
      value: '200,230',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Globe,
      label: 'International',
      sublabel: 'Partners',
      value: '17',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: MapPin,
      label: 'Districts',
      sublabel: 'Reached',
      value: '18',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: DollarSign,
      label: 'Total Funding',
      sublabel: 'LKR in 2024',
      value: '392M',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  const impactAreas = [
    {
      icon: Baby,
      title: 'Care for Orphans',
      description: 'Monthly sponsorships and comprehensive support',
      stat: '1,488',
      label: 'orphans supported',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      icon: Droplet,
      title: 'Care for WASH',
      description: 'Clean water wells and sanitation facilities',
      stat: '26,021',
      label: 'beneficiaries',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    },
    {
      icon: Utensils,
      title: 'Ramadan Relief',
      description: 'Zakat distribution and iftar meals',
      stat: '111,069',
      label: 'people served',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      icon: BookOpen,
      title: 'Care for Education',
      description: 'School supplies and bicycles for students',
      stat: '1,980',
      label: 'students reached',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="bg-white">
      {/* Urgent Appeal Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32 animate-pulse"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="animate-pulse" size={20} />
              <p className="font-semibold text-sm md:text-base">
                🚨 Emergency Relief Needed - Support Communities in Crisis
              </p>
            </div>
            <Link
              to="/campaigns"
              className="hidden md:inline-flex items-center gap-2 bg-white text-red-600 px-6 py-2 rounded-full font-bold hover:bg-yellow-300 hover:scale-105 transition-all text-sm shadow-lg"
            >
              Donate Now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section - Compact with Image Slider */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white py-12 md:py-16 overflow-hidden">
        {/* Background Image Slider */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-30' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt={`Hero ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/80 to-indigo-900/80"></div>
        </div>

        {/* Image Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex
                  ? 'bg-yellow-400 w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Column - Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-4 border border-white/30 shadow-lg">
                <Sparkles size={16} className="animate-pulse text-yellow-300" />
                <span className="text-xs font-semibold tracking-wide">Transforming Lives Since 2009</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Together We Build
                <span className="block text-yellow-300 mt-1">Better Futures</span>
              </h1>

              <p className="text-base md:text-lg text-blue-100 mb-6 leading-relaxed max-w-xl">
                Inspired by our Islamic values, we empower communities through education, relief services, and sustainable development across Sri Lanka.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/campaigns"
                  className="inline-flex items-center gap-2 bg-yellow-400 text-blue-900 px-6 py-3 rounded-full font-bold hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform text-sm md:text-base"
                >
                  <Heart size={20} />
                  Donate Now
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold hover:bg-white/30 transition-all border border-white/30 shadow-xl text-sm md:text-base"
                >
                  Learn More
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            {/* Right Column - Photo Gallery Widget */}
            <div className="relative lg:block hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl transform rotate-3 opacity-20"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border-2 border-white/20">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Our Impact in Action</h3>
                  <p className="text-sm text-blue-100">Real stories, real change</p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {heroImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/30 hover:border-yellow-300 transition-all group cursor-pointer shadow-lg"
                    >
                      <img
                        src={image}
                        alt={`Impact ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 bg-yellow-400 text-blue-900 px-6 py-3 rounded-full font-bold hover:bg-yellow-300 transition-all text-sm shadow-lg hover:scale-105 transform"
                  >
                    View Our Gallery
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Statistics - Compact Wide Cards Inside Hero */}
          <div className="mt-6 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`${stat.bgColor} rounded-lg p-3 text-center shadow-md hover:shadow-lg transition-all transform hover:scale-105 border border-white/50 group`}
                >
                  <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                    <stat.icon className="text-white" size={16} />
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-gray-800 mb-0.5">{stat.value}</p>
                  <p className="text-gray-700 font-medium text-xs leading-tight">{stat.label}</p>
                  <p className="text-gray-600 text-xs opacity-75">{stat.sublabel}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Active Campaigns Section with Enhanced Tabs */}
      {activeCampaigns.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4 font-semibold">
                <Zap size={18} />
                <span>Make an Impact</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Support Our Active Appeals</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Every contribution makes a real difference in the lives of those we serve
              </p>
            </div>

            {/* Enhanced Category Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-8 py-4 rounded-full font-bold transition-all transform ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 hover:scale-105'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {filteredCampaigns.slice(0, 8).map((campaign) => {
                const progress = (campaign.raisedAmount / campaign.targetAmount) * 100;
                const remaining = campaign.targetAmount - campaign.raisedAmount;

                return (
                  <div key={campaign.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group transform hover:-translate-y-2">
                    {/* Campaign Image with Enhanced Overlay */}
                    <div className="h-56 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
                      {campaign.imageUrl ? (
                        <>
                          <img
                            src={getImageUrl(campaign.imageUrl)}
                            alt={campaign.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
                          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500"></div>
                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/20 rounded-full -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-500"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Target className="text-white/80 group-hover:scale-110 transition-transform" size={72} />
                          </div>
                        </>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-white/95 backdrop-blur-sm text-blue-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                          {campaign.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[56px]">
                        {campaign.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{campaign.description}</p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3 shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-full transition-all duration-500 shadow-lg"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-sm">
                          <div>
                            <p className="text-gray-600 text-xs">Raised</p>
                            <p className="font-bold text-blue-600">${campaign.raisedAmount.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 text-xs">Progress</p>
                            <p className="font-bold text-gray-800">{progress.toFixed(0)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-600 text-xs">Goal</p>
                            <p className="font-bold text-gray-800">${campaign.targetAmount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Remaining Amount */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-600 mb-1">Still needed</p>
                        <p className="text-xl font-bold text-blue-900">${remaining.toLocaleString()}</p>
                      </div>

                      {/* CTA Button */}
                      <Link
                        to={`/campaigns/${campaign.id}`}
                        className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-xl transform hover:scale-105"
                      >
                        Donate Now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-full font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform text-lg"
              >
                View All Campaigns
                <ArrowRight size={24} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Impact Areas - Enhanced */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4 font-semibold">
              <Star size={18} />
              <span>Our Programs</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">2024 Impact Highlights</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Creating lasting positive change across Sri Lanka
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {impactAreas.map((area, index) => (
              <div
                key={index}
                className={`${area.bgColor} rounded-2xl p-8 border-3 ${area.borderColor} hover:shadow-2xl transition-all transform hover:-translate-y-2 group relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full -mr-16 -mt-16"></div>
                <div className={`w-16 h-16 bg-gradient-to-br ${area.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-xl relative z-10`}>
                  <area.icon className="text-white" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 relative z-10">{area.title}</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed relative z-10">{area.description}</p>
                <div className="pt-6 border-t-2 border-gray-200 relative z-10">
                  <p className="text-4xl font-bold text-gray-800 mb-1">{area.stat}</p>
                  <p className="text-sm text-gray-600 font-medium">{area.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Involved - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4 font-semibold">
              <Sparkles size={18} />
              <span>Join the Movement</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Get Involved</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              There are many ways to make a difference - find the one that's right for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Link
              to="/campaigns"
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl transform rotate-3 group-hover:rotate-6 transition-transform"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-2xl border-4 border-blue-100 hover:border-blue-200 transition-all">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-xl">
                  <Heart className="text-white" size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Support Campaigns</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">Make a financial contribution to our active humanitarian campaigns</p>
                <div className="flex items-center gap-2 text-blue-600 font-bold group-hover:gap-3 transition-all">
                  Donate Now
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>

            <Link
              to="/careers"
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700 rounded-3xl transform -rotate-3 group-hover:-rotate-6 transition-transform"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-2xl border-4 border-green-100 hover:border-green-200 transition-all">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-xl">
                  <Briefcase className="text-white" size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Join Our Team</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">Explore career opportunities and be part of our mission</p>
                <div className="flex items-center gap-2 text-green-600 font-bold group-hover:gap-3 transition-all">
                  View Positions
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>

            <Link
              to="/tenders"
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl transform rotate-3 group-hover:rotate-6 transition-transform"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-2xl border-4 border-purple-100 hover:border-purple-200 transition-all">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-xl">
                  <FileText className="text-white" size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Vendor Opportunities</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">Submit proposals for our procurement tenders and partnerships</p>
                <div className="flex items-center gap-2 text-purple-600 font-bold group-hover:gap-3 transition-all">
                  View Tenders
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-75"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Sparkles size={48} className="text-white mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-gray-800 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join us in transforming lives and building stronger communities across Sri Lanka
            </p>

            <div className="flex flex-wrap gap-6 justify-center">
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-3 bg-blue-600 text-white px-12 py-6 rounded-full font-bold hover:bg-blue-700 transition-all shadow-2xl hover:shadow-3xl hover:scale-110 transform text-lg"
              >
                <Heart size={28} />
                Start Donating Today
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-3 bg-white text-gray-900 px-12 py-6 rounded-full font-bold hover:bg-gray-100 transition-all shadow-2xl hover:scale-110 transform text-lg"
              >
                Learn About Our Work
                <ArrowRight size={28} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
