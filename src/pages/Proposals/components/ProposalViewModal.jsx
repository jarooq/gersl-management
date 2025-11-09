import React, { useState } from 'react';
import {
  X, Calendar, DollarSign, Users, Target, MapPin, Building2,
  CheckCircle, AlertCircle, BarChart3, Users2, Shield, FileText,
  TrendingUp, MessageSquare
} from 'lucide-react';

const ProposalViewModal = ({ proposal, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!proposal) return null;

  const totalDirectBeneficiaries = (
    (proposal.beneficiaryBreakdown?.directMale || 0) +
    (proposal.beneficiaryBreakdown?.directFemale || 0) +
    (proposal.beneficiaryBreakdown?.directChildren || 0)
  );

  const totalBudget = proposal.budgetBreakdown?.reduce((sum, item) => sum + (item.totalCost || 0), 0) || proposal.budgetRequested;

  const costPerBeneficiary = totalDirectBeneficiaries > 0
    ? (totalBudget / totalDirectBeneficiaries).toFixed(2)
    : 0;

  const getBudgetCategoryTotal = (category) => {
    if (!proposal.budgetBreakdown) return 0;
    return proposal.budgetBreakdown
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{proposal.title}</h2>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.proposalCode}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.donor}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.programmeArea}
                </span>
                <span className={`px-3 py-1 bg-white bg-opacity-30 rounded-full text-sm font-bold`}>
                  {proposal.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-indigo-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            {proposal.resultsFramework && proposal.resultsFramework.length > 0 && (
              <button
                onClick={() => setActiveTab('meal')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'meal'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 size={16} />
                MEAL Data
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {proposal.resultsFramework.length}
                </span>
              </button>
            )}
            {proposal.budgetBreakdown && proposal.budgetBreakdown.length > 0 && (
              <button
                onClick={() => setActiveTab('budget')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'budget'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <DollarSign size={16} />
                Budget Breakdown
                <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                  {proposal.budgetBreakdown.length}
                </span>
              </button>
            )}
            {proposal.safeguarding && proposal.safeguarding.length > 0 && (
              <button
                onClick={() => setActiveTab('safeguarding')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'safeguarding'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield size={16} />
                Safeguarding
                <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                  {proposal.safeguarding.length}
                </span>
              </button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="text-green-600" size={24} />
                    <span className="text-xs font-semibold text-green-700">BUDGET</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">LKR {(totalBudget / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-green-700 mt-1">Total Requested</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="text-blue-600" size={24} />
                    <span className="text-xs font-semibold text-blue-700">REACH</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{proposal.targetBeneficiaries?.toLocaleString() || 'N/A'}</p>
                  <p className="text-xs text-blue-700 mt-1">Target Beneficiaries</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="text-purple-600" size={24} />
                    <span className="text-xs font-semibold text-purple-700">DURATION</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{proposal.duration || 'N/A'}</p>
                  <p className="text-xs text-purple-700 mt-1">Months</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="text-orange-600" size={24} />
                    <span className="text-xs font-semibold text-orange-700">EFFICIENCY</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">LKR {costPerBeneficiary}</p>
                  <p className="text-xs text-orange-700 mt-1">Cost per Beneficiary</p>
                </div>
              </div>

              {/* Proposal Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  Proposal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Programme Area</p>
                    <p className="font-semibold text-gray-900">{proposal.programmeArea}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Lead Writer</p>
                    <p className="font-semibold text-gray-900">{proposal.leadWriter}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Submission Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(proposal.submissionDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Priority</p>
                    <p className={`font-semibold ${
                      proposal.priority === 'High' ? 'text-red-600' :
                      proposal.priority === 'Medium' ? 'text-orange-600' :
                      'text-blue-600'
                    }`}>
                      {proposal.priority}
                    </p>
                  </div>
                </div>
              </div>

              {/* Beneficiary Breakdown */}
              {proposal.beneficiaryBreakdown && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users2 size={20} className="text-green-600" />
                    Beneficiary Breakdown
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-900">{proposal.beneficiaryBreakdown.directMale?.toLocaleString() || 0}</p>
                      <p className="text-xs text-blue-700 font-semibold mt-1">Direct Male</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-pink-900">{proposal.beneficiaryBreakdown.directFemale?.toLocaleString() || 0}</p>
                      <p className="text-xs text-pink-700 font-semibold mt-1">Direct Female</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-900">{proposal.beneficiaryBreakdown.directChildren?.toLocaleString() || 0}</p>
                      <p className="text-xs text-purple-700 font-semibold mt-1">Children</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-900">{proposal.beneficiaryBreakdown.directPWD?.toLocaleString() || 0}</p>
                      <p className="text-xs text-orange-700 font-semibold mt-1">PWD</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-900">{proposal.beneficiaryBreakdown.indirectTotal?.toLocaleString() || 0}</p>
                      <p className="text-xs text-green-700 font-semibold mt-1">Indirect Total</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MEAL Data Tab */}
          {activeTab === 'meal' && proposal.resultsFramework && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target size={20} className="text-blue-600" />
                  Results Framework - Indicators
                </h3>
                <div className="space-y-3">
                  {proposal.resultsFramework.map((indicator, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-2">{indicator.indicator}</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-gray-500">Baseline</p>
                              <p className="font-bold text-gray-900">{indicator.baseline}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Target</p>
                              <p className="font-bold text-green-600">{indicator.target}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Means of Verification</p>
                              <p className="text-sm text-gray-700">{indicator.meansOfVerification}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Budget Breakdown Tab */}
          {activeTab === 'budget' && proposal.budgetBreakdown && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-purple-600" />
                  Budget Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-purple-200">
                        <th className="text-left p-3 text-sm font-bold text-gray-700">Category</th>
                        <th className="text-left p-3 text-sm font-bold text-gray-700">Item Description</th>
                        <th className="text-right p-3 text-sm font-bold text-gray-700">Unit Cost</th>
                        <th className="text-center p-3 text-sm font-bold text-gray-700">Quantity</th>
                        <th className="text-right p-3 text-sm font-bold text-gray-700">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.budgetBreakdown.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-purple-50">
                          <td className="p-3 text-sm font-semibold text-gray-900">{item.category}</td>
                          <td className="p-3 text-sm text-gray-700">{item.itemDescription}</td>
                          <td className="p-3 text-sm text-right text-gray-900">LKR {item.unitCost?.toLocaleString()}</td>
                          <td className="p-3 text-sm text-center text-gray-900">{item.quantity}</td>
                          <td className="p-3 text-sm text-right font-bold text-purple-900">LKR {item.totalCost?.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-purple-100 font-bold">
                        <td colSpan="4" className="p-3 text-right text-gray-900">TOTAL BUDGET:</td>
                        <td className="p-3 text-right text-purple-900">LKR {totalBudget.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Safeguarding Tab */}
          {activeTab === 'safeguarding' && proposal.safeguarding && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-orange-600" />
                  Safeguarding Compliance
                </h3>
                <div className="space-y-3">
                  {proposal.safeguarding.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-orange-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status === 'Yes' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {item.status === 'Yes' ? (
                            <CheckCircle className="text-green-600" size={20} />
                          ) : (
                            <AlertCircle className="text-red-600" size={20} />
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">{item.item}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        item.status === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalViewModal;
