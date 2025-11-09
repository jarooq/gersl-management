import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, DollarSign, MapPin, Search, Filter, Building, Package } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';

const TendersPage = () => {
  const { vendorCalls } = useCampaign();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter only active vendor calls for public view
  const activeTenders = vendorCalls.filter(tender => tender.status === 'Active');

  // Get unique categories
  const categories = ['All', ...new Set(activeTenders.map(tender => tender.category))];

  // Filter tenders
  const filteredTenders = activeTenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tender.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const benefits = [
    { icon: Building, title: 'Established Organization', description: '15+ years of successful operations' },
    { icon: Package, title: 'Diverse Opportunities', description: 'Wide range of procurement needs' },
    { icon: DollarSign, title: 'Fair Payment Terms', description: 'Timely and transparent payments' },
    { icon: FileText, title: 'Clear Process', description: 'Structured and fair evaluation' }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      'Construction': 'bg-orange-100 text-orange-600',
      'IT Equipment': 'bg-blue-100 text-blue-600',
      'Office Supplies': 'bg-green-100 text-green-600',
      'Services': 'bg-purple-100 text-purple-600',
      'Medical Equipment': 'bg-red-100 text-red-600',
      'Transportation': 'bg-yellow-100 text-yellow-600'
    };
    return colors[category] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <FileText size={16} className="animate-pulse" />
              <span className="text-sm font-medium">Partner With Us</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">Procurement Tenders</h1>
            <p className="text-lg text-blue-100 mb-8">
              Explore our procurement opportunities and submit your proposals to become a trusted vendor partner
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">{activeTenders.length}</p>
                <p className="text-sm text-blue-100">Active Tenders</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">{categories.length - 1}</p>
                <p className="text-sm text-blue-100">Categories</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 col-span-2 md:col-span-1">
                <p className="text-2xl font-bold mb-1">100+</p>
                <p className="text-sm text-blue-100">Vendor Partners</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Partner With GERSL?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our network of trusted vendors and contribute to meaningful social impact projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
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
                  placeholder="Search tenders by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredTenders.length} of {activeTenders.length} tenders
          </div>
        </div>
      </section>

      {/* Tender Listings */}
      <section className="container mx-auto px-4 pb-16">
        {filteredTenders.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No tenders found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTenders.map((tender) => {
              const deadline = new Date(tender.submissionDeadline);
              const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={tender.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="text-white" size={24} />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{tender.title}</h3>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getCategoryColor(tender.category)}`}>
                              {tender.category}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Package size={16} />
                              <span>Tender ID: {tender.referenceNumber}</span>
                            </div>
                            {tender.estimatedValue && (
                              <div className="flex items-center gap-1">
                                <DollarSign size={16} />
                                <span>Est. Value: ${tender.estimatedValue.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              <span>Posted: {new Date(tender.publishDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2">{tender.description}</p>

                          {/* Requirements Preview */}
                          {tender.requirements && tender.requirements.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Key Requirements:</p>
                              <div className="flex flex-wrap gap-2">
                                {tender.requirements.slice(0, 3).map((req, idx) => (
                                  <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                                    {req}
                                  </span>
                                ))}
                                {tender.requirements.length > 3 && (
                                  <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full">
                                    +{tender.requirements.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 md:min-w-[200px]">
                      {daysLeft > 0 ? (
                        <div className="bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg text-center">
                          <p className="text-xs text-orange-600 mb-1">Submission Deadline</p>
                          <p className="text-sm font-bold text-orange-700">{daysLeft} days left</p>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-center">
                          <p className="text-sm font-bold text-red-700">Closed</p>
                        </div>
                      )}

                      <Link
                        to={`/tenders/${tender.id}`}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all whitespace-nowrap"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How to Apply Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">How to Submit a Proposal</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Review Tender Details', description: 'Carefully read the tender requirements and specifications' },
                { step: 2, title: 'Prepare Documents', description: 'Gather all required documents and certifications' },
                { step: 3, title: 'Submit Proposal', description: 'Complete the online form with all necessary information' },
                { step: 4, title: 'Await Evaluation', description: 'Our team will review your proposal and contact you' }
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-xl p-6 flex items-start gap-4 shadow-md">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Have Questions About Our Procurement Process?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Our procurement team is here to help. Reach out to learn more about becoming a vendor partner.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Contact Procurement Team
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TendersPage;
