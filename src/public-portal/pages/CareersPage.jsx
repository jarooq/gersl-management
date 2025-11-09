import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, DollarSign, Calendar, Search, Filter, Users, Award } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';

const CareersPage = () => {
  const { jobPostings } = useCampaign();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Filter only active job postings for public view
  const activeJobs = jobPostings.filter(job => job.status === 'Active');

  // Get unique departments and types
  const departments = ['All', ...new Set(activeJobs.map(job => job.department))];
  const jobTypes = ['All', ...new Set(activeJobs.map(job => job.employmentType))];

  // Filter jobs
  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || job.department === selectedDepartment;
    const matchesType = selectedType === 'All' || job.employmentType === selectedType;
    return matchesSearch && matchesDepartment && matchesType;
  });

  const benefits = [
    { icon: Award, title: 'Competitive Salary', description: 'Market-competitive compensation packages' },
    { icon: Users, title: 'Team Culture', description: 'Collaborative and supportive work environment' },
    { icon: Briefcase, title: 'Career Growth', description: 'Professional development opportunities' },
    { icon: Calendar, title: 'Work-Life Balance', description: 'Flexible working arrangements' }
  ];

  const getEmploymentTypeColor = (type) => {
    const colors = {
      'Full-time': 'bg-green-100 text-green-600',
      'Part-time': 'bg-blue-100 text-blue-600',
      'Contract': 'bg-orange-100 text-orange-600',
      'Internship': 'bg-purple-100 text-purple-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
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
              <Briefcase size={16} className="animate-pulse" />
              <span className="text-sm font-medium">Join Our Mission</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">Build Your Career with GERSL</h1>
            <p className="text-lg text-blue-100 mb-8">
              Join our team of passionate professionals making a real difference in communities across Sri Lanka
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">{activeJobs.length}</p>
                <p className="text-sm text-blue-100">Open Positions</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-2xl font-bold mb-1">{departments.length - 1}</p>
                <p className="text-sm text-blue-100">Departments</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 col-span-2 md:col-span-1">
                <p className="text-2xl font-bold mb-1">15+</p>
                <p className="text-sm text-blue-100">Years of Impact</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Work With Us?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer more than just a job - we provide an opportunity to make a meaningful impact
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search jobs by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredJobs.length} of {activeJobs.length} positions
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="container mx-auto px-4 pb-16">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No positions found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => {
              const deadline = new Date(job.applicationDeadline);
              const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Briefcase className="text-white" size={24} />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getEmploymentTypeColor(job.employmentType)}`}>
                              {job.employmentType}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Briefcase size={16} />
                              <span>{job.department}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={16} />
                              <span>{job.location}</span>
                            </div>
                            {job.salaryRange && (
                              <div className="flex items-center gap-1">
                                <DollarSign size={16} />
                                <span>{job.salaryRange}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                          {/* Requirements Preview */}
                          {job.requirements && job.requirements.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Key Requirements:</p>
                              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                {job.requirements.slice(0, 3).map((req, idx) => (
                                  <li key={idx}>{req}</li>
                                ))}
                                {job.requirements.length > 3 && (
                                  <li className="text-blue-600">+ {job.requirements.length - 3} more...</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 md:min-w-[200px]">
                      {daysLeft > 0 ? (
                        <div className="bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg text-center">
                          <p className="text-xs text-orange-600 mb-1">Application Deadline</p>
                          <p className="text-sm font-bold text-orange-700">{daysLeft} days left</p>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-center">
                          <p className="text-sm font-bold text-red-700">Deadline Passed</p>
                        </div>
                      )}

                      <Link
                        to={`/careers/${job.id}`}
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

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't See the Right Position?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
