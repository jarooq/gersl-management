import React from 'react';
import { Briefcase, DollarSign, Users, TrendingUp, ArrowRight } from 'lucide-react';

const ProjectStats = ({ stats }) => {
  const statItems = [
    {
      title: 'Total Projects',
      value: stats.total,
      icon: Briefcase,
      gradient: 'from-purple-500 to-indigo-600',
      change: `${stats.active} active`,
      subtitle: 'projects managed'
    },
    {
      title: 'Total Budget',
      value: `${(stats.totalBudget / 1000).toFixed(0)}K`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      change: `${((stats.totalSpent / stats.totalBudget) * 100).toFixed(0)}% spent`,
      subtitle: 'LKR allocated'
    },
    {
      title: 'Beneficiaries',
      value: stats.totalBeneficiaries.toLocaleString(),
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600',
      change: 'Total reached',
      subtitle: 'lives impacted'
    },
    {
      title: 'Avg Progress',
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-amber-600',
      change: 'Overall completion',
      subtitle: 'on track'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="stat-card group cursor-pointer animate-slide-up"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2">{stat.title}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            </div>
            <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
              <stat.icon className="text-white" size={24} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-600">{stat.change}</span>
            <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectStats;
