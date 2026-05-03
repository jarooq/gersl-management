import React from 'react';
import { DollarSign, TrendingUp, CreditCard, FileText, ArrowRight } from 'lucide-react';

const FinanceStats = ({ stats, payrollData }) => {
  const statItems = [
    {
      title: 'Total Budget',
      value: `${(stats.totalBudget / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      gradient: 'from-blue-500 to-cyan-600',
      change: `${stats.budgetUtilization}% used`,
      subtitle: 'LKR allocated'
    },
    {
      title: 'Total Expenses',
      value: `${(stats.totalExpenses / 1000000).toFixed(2)}M`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-600',
      change: `${(stats.pendingExpenses / 1000).toFixed(0)}K pending`,
      subtitle: 'LKR spent'
    },
    {
      title: 'Payroll',
      value: `${(stats.totalPayroll / 1000).toFixed(0)}K`,
      icon: CreditCard,
      gradient: 'from-purple-500 to-indigo-600',
      change: `${payrollData.filter(p => p.status === 'Processed').length} processed`,
      subtitle: 'LKR monthly'
    },
    {
      title: 'Purchase Orders',
      value: stats.pendingPOs,
      icon: FileText,
      gradient: 'from-orange-500 to-amber-600',
      change: 'Pending approval',
      subtitle: 'Active POs'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {statItems.map((stat, index) => (
        <div
          key={index}
          className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">{stat.title}</p>
              <h3 className="text-3xl font-bold text-ink-900">{stat.value}</h3>
              <p className="text-xs text-ink-500 mt-1">{stat.subtitle}</p>
            </div>
            <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
              <stat.icon className="text-white" size={24} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-sm font-medium text-ink-600">{stat.change}</span>
            <ArrowRight size={16} className="text-ink-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinanceStats;
