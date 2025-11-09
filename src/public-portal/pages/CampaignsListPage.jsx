import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Target, Clock, TrendingUp, Search, Filter } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';

const CampaignsListPage = () => {
  const { campaigns } = useCampaign();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter only active campaigns for public view
  const publicCampaigns = campaigns.filter(c => c.status === 'Active');

  // Get unique categories
  const categories = ['All', ...new Set(publicCampaigns.map(c => c.category))];

  // Filter campaigns
  const filteredCampaigns = publicCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const stats = {
    activeCampaigns: publicCampaigns.length,
    totalRaised: publicCampaigns.reduce((sum, c) => sum + c.raisedAmount, 0),
    totalTarget: publicCampaigns.reduce((sum, c) => sum + c.targetAmount, 0),
    averageProgress: publicCampaigns.length > 0
      ? (publicCampaigns.reduce((sum, c) => sum + (c.raisedAmount / c.targetAmount) * 100, 0) / publicCampaigns.length)
      : 0
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Education': 'bg-blue-100 text-blue-600',
      'Health': 'bg-green-100 text-green-600',
      'Emergency Relief': 'bg-red-100 text-red-600',
      'Infrastructure': 'bg-orange-100 text-orange-600',
      'Community Development': 'bg-purple-100 text-purple-600',
      'Orphan Care': 'bg-pink-100 text-pink-600'
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Heart size={16} className="animate-pulse" />
              <span className="text-sm font-medium">Support Our Causes</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">Active Campaigns</h1>
            <p className="text-lg text-blue-100 mb-8">
              Explore our fundraising initiatives and make a difference in the lives of those in need
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">{stats.activeCampaigns}</p>
                <p className="text-sm text-blue-100">Active Campaigns</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">${(stats.totalRaised / 1000).toFixed(0)}K</p>
                <p className="text-sm text-blue-100">Total Raised</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">${(stats.totalTarget / 1000).toFixed(0)}K</p>
                <p className="text-sm text-blue-100">Target Goal</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">{stats.averageProgress.toFixed(0)}%</p>
                <p className="text-sm text-blue-100">Avg Progress</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredCampaigns.length} of {publicCampaigns.length} campaigns
          </div>
        </div>
      </section>

      {/* Campaigns Grid */}
      <section className="container mx-auto px-4 pb-16">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No campaigns found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => {
              const progress = (campaign.raisedAmount / campaign.targetAmount) * 100;
              const daysLeft = Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div key={campaign.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group">
                  {/* Image */}
                  <div className="h-56 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target className="text-white" size={64} />
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-blue-900 text-xs font-bold px-3 py-2 rounded-full">
                        {campaign.category}
                      </span>
                    </div>

                    {/* Days Left Badge */}
                    {daysLeft > 0 && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                        <Clock size={14} className="text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600">{daysLeft} days left</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {campaign.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{campaign.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-full transition-all duration-500"
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
                    <div className="bg-blue-50 border-l-4 border-blue-600 rounded p-3 mb-4">
                      <p className="text-xs text-gray-600">Still needed</p>
                      <p className="text-lg font-bold text-blue-900">${(campaign.targetAmount - campaign.raisedAmount).toLocaleString()}</p>
                    </div>

                    {/* CTA Button */}
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                    >
                      Donate Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Want to Start Your Own Campaign?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Have a project idea that can make a difference? Contact us to discuss how we can help bring it to life.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CampaignsListPage;
