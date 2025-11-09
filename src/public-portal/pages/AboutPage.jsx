import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Users, Target, Globe, Award, TrendingUp, CheckCircle, ArrowRight,
  Building, BookOpen, Handshake, Shield, Droplet, Baby, DollarSign, Utensils,
  MapPin, Calendar, Download, Sparkles, Star, Users2, Zap
} from 'lucide-react';

const AboutPage = () => {
  const milestones = [
    { year: '2018', title: 'Early Impact', description: '10,420 beneficiaries reached across Sri Lanka', icon: Sparkles },
    { year: '2020', title: 'Growth & COVID Response', description: '34,100 people supported during challenging times', icon: Heart },
    { year: '2022', title: 'Major Expansion', description: 'Scaled up to reach 125,410 beneficiaries nationwide', icon: TrendingUp },
    { year: '2024', title: 'Record Impact', description: '200,230 lives touched across 18 districts with 392M LKR in funding', icon: Star }
  ];

  const values = [
    {
      icon: Award,
      title: 'Ihsan | Excellence',
      description: 'To be excellent in all we say and do',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Heart,
      title: 'Ikhlas | Sincerity',
      description: 'To be excellent in all we say and do',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      icon: Shield,
      title: 'Adl | Justice',
      description: 'To be excellent in all we say and do',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  const programs = [
    {
      icon: Baby,
      title: 'Care for Orphans',
      description: 'Monthly sponsorships, food aid, and comprehensive support',
      impact: '1,488',
      label: 'orphans supported',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      icon: Droplet,
      title: 'Care for WASH',
      description: 'Clean water wells, hand pumps, and sanitation facilities',
      impact: '26,021',
      label: 'beneficiaries',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    },
    {
      icon: TrendingUp,
      title: 'Livelihood Development',
      description: 'Income generating equipment and entrepreneurship support',
      impact: '669',
      label: 'families empowered',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: Utensils,
      title: 'Ramadan Relief',
      description: 'Zakat distribution, iftar meals, and food aid packages',
      impact: '111,069',
      label: 'people served',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      icon: Heart,
      title: 'Eid-ul-Adha',
      description: 'Qurban meat distribution to vulnerable families',
      impact: '16,920',
      label: 'beneficiaries',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      icon: Handshake,
      title: 'Emergency Relief',
      description: 'Food aid, hygiene kits, and rapid disaster response',
      impact: '36,450',
      label: 'people assisted',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      icon: BookOpen,
      title: 'Care for Education',
      description: 'School supplies and bicycles for students',
      impact: '1,980',
      label: 'students reached',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Award,
      title: 'Medical Support',
      description: 'Surgeries, treatments, and medical equipment',
      impact: '1,133',
      label: 'patients helped',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    }
  ];

  const impactStats = [
    {
      value: '200,230',
      label: 'Lives Impacted',
      sublabel: 'in 2024',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      value: '17',
      label: 'International',
      sublabel: 'Partners',
      icon: Globe,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      value: '18',
      label: 'Districts',
      sublabel: 'Reached',
      icon: MapPin,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      value: '392M',
      label: 'Total Funding',
      sublabel: 'LKR in 2024',
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white py-24 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -mr-48 -mt-48 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl -ml-40 -mb-40 animate-pulse delay-75"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-150"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 border-2 border-white/20 rounded-full"></div>
          <div className="absolute top-40 right-20 w-32 h-32 border-2 border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 border-2 border-white/20 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full mb-8 border border-white/30 shadow-lg">
              <Sparkles size={20} className="animate-pulse text-yellow-300" />
              <span className="text-sm font-semibold tracking-wide">Transforming Lives Since 2009</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              About <span className="text-yellow-300">GERSL</span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed mb-12 max-w-4xl mx-auto">
              Inspired by our Islamic values, we work to serve those in need, empower communities and promote social justice across Sri Lanka
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-2 bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-bold hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
              >
                <Heart size={20} />
                Support Our Cause
              </Link>
              <a
                href="/Annual Report 2024 - Finale_compressed.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold hover:bg-white/30 transition-all border border-white/30 shadow-xl"
              >
                <Download size={20} />
                Annual Report 2024
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics - Enhanced */}
      <section className="py-16 -mt-16 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {impactStats.map((stat, index) => (
              <div
                key={index}
                className={`${stat.bgColor} rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-2 border-2 border-white relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  <stat.icon className="text-white" size={32} />
                </div>
                <p className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">{stat.value}</p>
                <p className="text-gray-700 font-bold text-lg">{stat.label}</p>
                <p className="text-gray-600 text-sm">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision - Enhanced Cards */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4 font-semibold">
              <Target size={18} />
              <span>Our Purpose</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Mission & Vision</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Mission Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl transform rotate-3 group-hover:rotate-6 transition-transform"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-2xl border-4 border-blue-100">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                  <Target className="text-white" size={40} />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Inspired by Our Islamic Values We Work to Serve Those in Need, Empower Communities and Promote Social Justice.
                </p>
              </div>
            </div>

            {/* Vision Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-700 rounded-3xl transform -rotate-3 group-hover:-rotate-6 transition-transform"></div>
              <div className="relative bg-white rounded-3xl p-10 shadow-2xl border-4 border-green-100">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                  <Globe className="text-white" size={40} />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">Our Vision</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To Make the World a Better Place
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values - Enhanced */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4 font-semibold">
              <Star size={18} />
              <span>What Drives Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Our Core Values</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Islamic principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div
                key={index}
                className={`${value.bgColor} rounded-3xl p-10 border-4 ${value.borderColor} hover:shadow-2xl transition-all group relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full -mr-16 -mt-16"></div>
                <div className={`w-20 h-20 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-xl relative z-10`}>
                  <value.icon className="text-white" size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 relative z-10">{value.title}</h3>
                <p className="text-gray-700 leading-relaxed relative z-10">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs - Enhanced Grid */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4 font-semibold">
              <Zap size={18} />
              <span>Our Impact Areas</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Programs in Action</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Comprehensive support across multiple sectors creating sustainable impact
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {programs.map((program, index) => (
              <div
                key={index}
                className={`${program.bgColor} rounded-2xl p-6 border-3 ${program.borderColor} hover:shadow-2xl transition-all transform hover:-translate-y-2 group`}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${program.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg`}>
                  <program.icon className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{program.title}</h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{program.description}</p>
                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-3xl font-bold text-gray-800">{program.impact}</p>
                  <p className="text-sm text-gray-600 font-medium">{program.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline - Enhanced */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full mb-4 font-semibold">
              <Calendar size={18} />
              <span>Our Story</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Journey of Impact</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Key milestones in our commitment to serving communities
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200"></div>

              {milestones.map((milestone, index) => (
                <div key={index} className={`relative mb-16 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className={`lg:w-1/2 ${index % 2 === 0 ? 'lg:ml-auto lg:pr-16' : 'lg:pl-16'}`}>
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-gray-100 group">
                      <div className={`inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-bold mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                        <milestone.icon size={20} />
                        <span className="text-lg">{milestone.year}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">{milestone.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>

                  {/* Timeline dot */}
                  <div className="hidden lg:block absolute top-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full border-4 border-white shadow-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accountability & Transparency - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full mb-4 font-semibold border border-white/30">
              <Shield size={18} />
              <span>Our Commitment</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Accountability & Transparency</h2>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              We maintain the highest standards of accountability to our donors and beneficiaries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border-2 border-white/20 hover:bg-white/20 transition-all group">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Award className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-3">MEAL Framework</h3>
              <p className="text-blue-100">
                Monitoring, Evaluation, Accountability & Learning systems ensure program quality
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border-2 border-white/20 hover:bg-white/20 transition-all group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Shield className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Safeguarding</h3>
              <p className="text-blue-100">
                Strict policies protect vulnerable beneficiaries and maintain ethical standards
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border-2 border-white/20 hover:bg-white/20 transition-all group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <CheckCircle className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Direct Impact</h3>
              <p className="text-blue-100">
                Your donations go directly to programs supporting communities in need
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-blue-100 text-lg mb-6">
              Download our latest reports to see our impact in detail
            </p>
            <a
              href="/Annual Report 2024 - Finale_compressed.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-bold hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
            >
              <Download size={24} />
              <span className="text-lg">Download Annual Report 2024</span>
            </a>
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
              Join Us in Making a Difference
            </h2>
            <p className="text-xl text-gray-800 mb-10 max-w-2xl mx-auto">
              Whether through donations, volunteering, or partnerships - there are many ways to support our mission
            </p>

            <div className="flex flex-wrap gap-6 justify-center">
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-full font-bold hover:bg-blue-700 transition-all shadow-2xl hover:shadow-3xl hover:scale-110 transform text-lg"
              >
                <Heart size={24} />
                Support Our Campaigns
              </Link>
              <Link
                to="/careers"
                className="inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 rounded-full font-bold hover:bg-gray-100 transition-all shadow-2xl hover:scale-110 transform text-lg"
              >
                Join Our Team
                <ArrowRight size={24} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
