import React from 'react';
import { Users, CheckCircle, Clock, DollarSign, TrendingUp, Heart } from 'lucide-react';

const StatsCards = ({ stats }) => {
  const statItems = [
    {
      title: 'Total Orphans',
      value: stats.totalOrphans,
      icon: Heart,
      gradient: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      change: `${stats.activeOrphans} active`,
      trend: 'up'
    },
    {
      title: 'Visited This Month',
      value: stats.visitedThisMonth,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      change: `${stats.visitRate}% coverage`,
      trend: 'up'
    },
    {
      title: 'Needs Visit',
      value: stats.needsVisit,
      icon: Clock,
      gradient: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      change: 'Overdue >30 days',
      trend: 'neutral'
    },
    {
      title: 'Monthly Stipend',
      value: `${(stats.totalStipend / 1000).toFixed(0)}K`,
      icon: DollarSign,
      gradient: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: `LKR ${stats.totalStipend?.toLocaleString()}`,
      trend: 'up'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer"
          
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">{stat.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stat.value}</h3>
                {stat.trend === 'up' && (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                )}
              </div>
              <p className="text-xs text-ink-500 mt-1">{stat.change}</p>
            </div>
            <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-lg shadow-sm transform group- transition-transform duration-200 flex-shrink-0`}>
              <stat.icon className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  stat.trend === 'up' ? 'bg-green-500' :
                  stat.trend === 'down' ? 'bg-red-500' :
                  'bg-yellow-500'
                } `}></div>
                <span className={`text-xs font-semibold ${
                  stat.trend === 'up' ? 'text-green-600' :
                  stat.trend === 'down' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {stat.trend === 'up' ? 'Good' : stat.trend === 'down' ? 'Low' : 'Monitor'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
