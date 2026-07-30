import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  X, Calendar, DollarSign, Users, Target, MapPin, Building2,
  CheckCircle, AlertCircle, BarChart3, Users2, Shield, Lightbulb,
  FileText, TrendingUp, MessageSquare, ThumbsUp, ThumbsDown
} from 'lucide-react';

const ProposalDetailModal = ({ proposal, onClose, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalData, setApprovalData] = useState({
    decision: 'approve',
    score: '',
    comments: '',
    approvedBudget: proposal.requestedBudget
  });

  if (!proposal) return null;

  const totalDirectBeneficiaries = (
    (proposal.beneficiaryBreakdown?.directMale || 0) +
    (proposal.beneficiaryBreakdown?.directFemale || 0) +
    (proposal.beneficiaryBreakdown?.directChildren || 0)
  );

  const costPerBeneficiary = totalDirectBeneficiaries > 0
    ? (proposal.requestedBudget / totalDirectBeneficiaries).toFixed(2)
    : 0;

  const handleApprovalSubmit = (e) => {
    e.preventDefault();
    if (approvalData.decision === 'approve') {
      onApprove(proposal.id, approvalData);
    } else {
      onReject(proposal.id, approvalData);
    }
    setShowApprovalForm(false);
  };

  const getBudgetCategoryTotal = (category) => {
    if (!proposal.budgetBreakdown) return 0;
    return proposal.budgetBreakdown
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg2 shadow-pop max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{proposal.proposalTitle}</h2>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.cboName}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.programmeArea}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-purple-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-ink-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('meal')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'meal'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <BarChart3 size={16} />
              MEAL Data
              {proposal.resultsFramework?.length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {proposal.resultsFramework.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'budget'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <DollarSign size={16} />
              Budget Breakdown
            </button>
            <button
              onClick={() => setActiveTab('toc')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'toc'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <Lightbulb size={16} />
              Theory of Change
            </button>
            <button
              onClick={() => setActiveTab('safeguarding')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'safeguarding'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <Shield size={16} />
              Safeguarding
            </button>
            <button
              onClick={() => setActiveTab('approval')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'approval'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <FileText size={16} />
              Approval History
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-ink-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-3 rounded-lg">
                      <DollarSign className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 uppercase">Budget</p>
                      <p className="text-xl font-bold text-ink-900">
                        {(proposal.requestedBudget / 1000000).toFixed(2)}M
                      </p>
                      <p className="text-xs text-ink-500">LKR</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-ink-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <Users className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 uppercase">Beneficiaries</p>
                      <p className="text-xl font-bold text-ink-900">{totalDirectBeneficiaries}</p>
                      <p className="text-xs text-ink-500">Direct</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-ink-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-3 rounded-lg">
                      <TrendingUp className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 uppercase">Cost/Beneficiary</p>
                      <p className="text-xl font-bold text-ink-900">
                        {(costPerBeneficiary / 1000).toFixed(1)}k
                      </p>
                      <p className="text-xs text-ink-500">LKR</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-ink-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-3 rounded-lg">
                      <Calendar className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 uppercase">Duration</p>
                      <p className="text-xl font-bold text-ink-900">{proposal.duration}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Building2 size={18} className="text-purple-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-ink-500 uppercase">CBO Partner</p>
                        <p className="text-sm font-semibold text-ink-900">{proposal.cboName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-purple-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-ink-500 uppercase">District</p>
                        <p className="text-sm font-semibold text-ink-900">{proposal.district}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Target size={18} className="text-purple-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-ink-500 uppercase">Project Tier</p>
                        <p className="text-sm font-semibold text-ink-900">{proposal.projectTier}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar size={18} className="text-purple-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-ink-500 uppercase">Project Period</p>
                        <p className="text-sm font-semibold text-ink-900">
                          {proposal.startDate} to {proposal.endDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-ink-500 uppercase mb-2">Executive Summary</p>
                    <p className="text-sm text-ink-700">{proposal.summary}</p>
                  </div>

                  {/* Overall Goal */}
                  {proposal.overallGoal && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-ink-500 uppercase mb-2">Overall Goal</p>
                      <p className="text-sm text-ink-700 italic">"{proposal.overallGoal}"</p>
                    </div>
                  )}

                  {/* Problem Statement */}
                  {proposal.problemStatement && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-ink-500 uppercase mb-2">Problem Statement</p>
                      <p className="text-sm text-ink-700">{proposal.problemStatement}</p>
                    </div>
                  )}

                  {/* Proposed Solution */}
                  {proposal.proposedSolution && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-ink-500 uppercase mb-2">Proposed Solution</p>
                      <p className="text-sm text-ink-700">{proposal.proposedSolution}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Objectives & Activities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Objectives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {proposal.objectives?.map((objective, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Target size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-ink-700">{objective}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {proposal.keyActivities?.map((activity, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* MEAL Data Tab */}
          {activeTab === 'meal' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Results Framework</CardTitle>
                    <span className="text-sm text-ink-500">
                      {proposal.resultsFramework?.length || 0} indicators
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {proposal.resultsFramework && proposal.resultsFramework.length > 0 ? (
                    <div className="space-y-4">
                      {proposal.resultsFramework.map((indicator, index) => (
                        <div key={index} className="border border-ink-100 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                {indicator.level}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-semibold text-ink-900 mb-2">{indicator.indicator}</h4>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-ink-500">Baseline:</span>
                              <span className="font-semibold text-ink-900 ml-1">{indicator.baseline}</span>
                            </div>
                            <div>
                              <span className="text-ink-500">Target:</span>
                              <span className="font-semibold text-green-600 ml-1">{indicator.target}</span>
                            </div>
                            <div>
                              <span className="text-ink-500">MoV:</span>
                              <span className="text-ink-700 ml-1 text-xs">{indicator.meansOfVerification}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-ink-500 py-8">No indicators defined</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Beneficiary Disaggregation</CardTitle>
                </CardHeader>
                <CardContent>
                  {proposal.beneficiaryBreakdown ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {proposal.beneficiaryBreakdown.directMale || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">Direct Male</p>
                      </div>
                      <div className="text-center p-4 bg-pink-50 rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">
                          {proposal.beneficiaryBreakdown.directFemale || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">Direct Female</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {proposal.beneficiaryBreakdown.directChildren || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">Children</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {proposal.beneficiaryBreakdown.directPWD || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">PWD</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {proposal.beneficiaryBreakdown.indirectTotal || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">Indirect</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-ink-500 py-8">No beneficiary data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Budget Breakdown Tab */}
          {activeTab === 'budget' && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {proposal.budgetBreakdown && proposal.budgetBreakdown.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-ink-100 border-b border-ink-100">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Category</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-ink-700">Description</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-ink-700">Quantity</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-ink-700">Unit Cost</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-ink-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proposal.budgetBreakdown.map((item, index) => (
                            <tr key={item.id} className={`border-b border-ink-100 ${index % 2 === 0 ? 'bg-white' : 'bg-ink-50'}`}>
                              <td className="px-3 py-2 text-sm text-ink-700">{item.category}</td>
                              <td className="px-3 py-2 text-sm text-ink-700">{item.description}</td>
                              <td className="px-3 py-2 text-sm text-ink-700 text-right">{item.quantity}</td>
                              <td className="px-3 py-2 text-sm text-ink-700 text-right">
                                {item.unitCost.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-sm font-semibold text-green-700 text-right">
                                {item.totalCost.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {['Personnel', 'Equipment', 'Materials', 'Activities', 'Transport', 'Training', 'Monitoring', 'Administrative', 'Other'].map(category => {
                          const categoryTotal = getBudgetCategoryTotal(category);
                          if (categoryTotal > 0) {
                            return (
                              <div key={category} className="text-xs">
                                <span className="text-ink-600">{category}:</span>
                                <span className="font-semibold text-green-700 ml-1">
                                  LKR {categoryTotal.toLocaleString()}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <div className="pt-3 border-t border-green-300">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-ink-800">Total Budget:</span>
                          <span className="text-2xl font-bold text-green-600">
                            LKR {proposal.requestedBudget.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500 mt-1">
                          Cost per beneficiary: LKR {costPerBeneficiary}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-ink-500 py-8">No detailed budget breakdown available</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Theory of Change Tab */}
          {activeTab === 'toc' && (
            <Card>
              <CardHeader>
                <CardTitle>Theory of Change</CardTitle>
              </CardHeader>
              <CardContent>
                {proposal.theoryOfChange ? (
                  <div className="space-y-6">
                    {/* Impact */}
                    {proposal.theoryOfChange.impact && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs font-semibold text-ink-700 mb-2">IMPACT (Long-term change)</p>
                        <p className="text-sm text-ink-900 font-medium">{proposal.theoryOfChange.impact}</p>
                      </div>
                    )}

                    {/* Outcomes */}
                    {proposal.theoryOfChange.outcomes && proposal.theoryOfChange.outcomes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-700 mb-2">OUTCOMES (Medium-term results)</p>
                        <div className="space-y-2">
                          {proposal.theoryOfChange.outcomes.map((outcome, index) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-ink-900">{outcome}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outputs */}
                    {proposal.theoryOfChange.outputs && proposal.theoryOfChange.outputs.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-700 mb-2">OUTPUTS (Immediate deliverables)</p>
                        <div className="space-y-2">
                          {proposal.theoryOfChange.outputs.map((output, index) => (
                            <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm text-ink-900">{output}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {proposal.theoryOfChange.activities && proposal.theoryOfChange.activities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-700 mb-2">ACTIVITIES</p>
                        <div className="flex flex-wrap gap-2">
                          {proposal.theoryOfChange.activities.map((activity, index) => (
                            <span key={index} className="px-3 py-1 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200">
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inputs */}
                    {proposal.theoryOfChange.inputs && proposal.theoryOfChange.inputs.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-700 mb-2">INPUTS (Resources)</p>
                        <div className="flex flex-wrap gap-2">
                          {proposal.theoryOfChange.inputs.map((input, index) => (
                            <span key={index} className="px-3 py-1 bg-ink-100 text-ink-800 text-sm rounded-md border border-ink-100">
                              {input}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assumptions & Risks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {proposal.theoryOfChange.assumptions && proposal.theoryOfChange.assumptions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-ink-700 mb-2">ASSUMPTIONS</p>
                          <div className="space-y-1">
                            {proposal.theoryOfChange.assumptions.map((assumption, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-ink-700">{assumption}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {proposal.theoryOfChange.risks && proposal.theoryOfChange.risks.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-ink-700 mb-2">RISKS</p>
                          <div className="space-y-1">
                            {proposal.theoryOfChange.risks.map((risk, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-ink-700">{risk}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-ink-500 py-8">No Theory of Change available</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Safeguarding Tab */}
          {activeTab === 'safeguarding' && (
            <Card>
              <CardHeader>
                <CardTitle>Safeguarding Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                {proposal.safeguarding ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg border ${proposal.safeguarding.dataProtection ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {proposal.safeguarding.dataProtection ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <AlertCircle size={18} className="text-red-600" />
                          )}
                          <span className="text-sm font-semibold text-ink-900">Data Protection Policy</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${proposal.safeguarding.informedConsent ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {proposal.safeguarding.informedConsent ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <AlertCircle size={18} className="text-red-600" />
                          )}
                          <span className="text-sm font-semibold text-ink-900">Informed Consent Procedures</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${proposal.safeguarding.childSafeguarding ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {proposal.safeguarding.childSafeguarding ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <AlertCircle size={18} className="text-red-600" />
                          )}
                          <span className="text-sm font-semibold text-ink-900">Child Safeguarding Policy</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${proposal.safeguarding.incidentReporting ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {proposal.safeguarding.incidentReporting ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <AlertCircle size={18} className="text-red-600" />
                          )}
                          <span className="text-sm font-semibold text-ink-900">Incident Reporting Mechanism</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${proposal.safeguarding.backgroundChecks ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {proposal.safeguarding.backgroundChecks ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <AlertCircle size={18} className="text-red-600" />
                          )}
                          <span className="text-sm font-semibold text-ink-900">Background Checks for Staff</span>
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${proposal.safeguarding.trainingRecords ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {proposal.safeguarding.trainingRecords ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <AlertCircle size={18} className="text-red-600" />
                          )}
                          <span className="text-sm font-semibold text-ink-900">Staff Training Records</span>
                        </div>
                      </div>
                    </div>

                    {proposal.safeguarding.safeguardingFocalPerson && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-ink-700 mb-1">Safeguarding Focal Person</p>
                        <p className="text-sm font-medium text-ink-900">{proposal.safeguarding.safeguardingFocalPerson}</p>
                      </div>
                    )}

                    {proposal.safeguarding.cfmChannels && proposal.safeguarding.cfmChannels.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-ink-700 mb-2">CFM Channels Available</p>
                        <div className="flex flex-wrap gap-2">
                          {proposal.safeguarding.cfmChannels.map((channel, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-ink-500 py-8">No safeguarding information available</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Approval History Tab */}
          {activeTab === 'approval' && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflow & History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Workflow Visualization */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center flex-1">
                      {proposal.fundraisingStatus === 'Approved' ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : proposal.fundraisingStatus === 'Rejected' ? (
                        <AlertCircle size={20} className="text-red-600" />
                      ) : (
                        <div className="w-5 h-5 bg-ink-300 rounded-full"></div>
                      )}
                      <p className="text-xs font-medium text-ink-600 mt-1">Fundraising</p>
                      <p className={`text-xs mt-0.5 ${
                        proposal.fundraisingStatus === 'Approved' ? 'text-green-600' :
                        proposal.fundraisingStatus === 'Rejected' ? 'text-red-600' : 'text-ink-400'
                      }`}>
                        {proposal.fundraisingStatus}
                      </p>
                    </div>

                    <div className={`h-0.5 flex-1 ${proposal.fundraisingStatus === 'Approved' ? 'bg-green-300' : 'bg-ink-300'}`}></div>

                    <div className="flex flex-col items-center flex-1">
                      {proposal.ceoStatus === 'Approved' ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : proposal.ceoStatus === 'Rejected' ? (
                        <AlertCircle size={20} className="text-red-600" />
                      ) : (
                        <div className="w-5 h-5 bg-ink-300 rounded-full"></div>
                      )}
                      <p className="text-xs font-medium text-ink-600 mt-1">CEO</p>
                      <p className={`text-xs mt-0.5 ${
                        proposal.ceoStatus === 'Approved' ? 'text-green-600' :
                        proposal.ceoStatus === 'Rejected' ? 'text-red-600' : 'text-ink-400'
                      }`}>
                        {proposal.ceoStatus}
                      </p>
                    </div>

                    <div className={`h-0.5 flex-1 ${proposal.ceoStatus === 'Approved' ? 'bg-green-300' : 'bg-ink-300'}`}></div>

                    <div className="flex flex-col items-center flex-1">
                      {proposal.donorStatus === 'Approved' ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : proposal.donorStatus === 'Rejected' ? (
                        <AlertCircle size={20} className="text-red-600" />
                      ) : (
                        <div className="w-5 h-5 bg-ink-300 rounded-full"></div>
                      )}
                      <p className="text-xs font-medium text-ink-600 mt-1">Donor</p>
                      <p className={`text-xs mt-0.5 ${
                        proposal.donorStatus === 'Approved' ? 'text-green-600' :
                        proposal.donorStatus === 'Rejected' ? 'text-red-600' : 'text-ink-400'
                      }`}>
                        {proposal.donorStatus}
                      </p>
                    </div>

                    <div className={`h-0.5 flex-1 ${proposal.donorStatus === 'Approved' ? 'bg-purple-300' : 'bg-ink-300'}`}></div>

                    <div className="flex flex-col items-center flex-1">
                      {proposal.convertedToProject ? (
                        <CheckCircle size={20} className="text-purple-600" />
                      ) : (
                        <div className="w-5 h-5 bg-ink-300 rounded-full"></div>
                      )}
                      <p className="text-xs font-medium text-ink-600 mt-1">Project</p>
                      <p className={`text-xs mt-0.5 ${proposal.convertedToProject ? 'text-purple-600' : 'text-ink-400'}`}>
                        {proposal.convertedToProject ? 'Converted' : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Approval Details */}
                  <div className="space-y-3">
                    {proposal.fundraisingStatus !== 'Pending' && (
                      <div className={`p-4 rounded-lg border ${
                        proposal.fundraisingStatus === 'Approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-ink-900">Fundraising Review</p>
                          <p className="text-xs text-ink-600">{proposal.fundraisingReviewDate}</p>
                        </div>
                        <p className="text-xs text-ink-700 mb-1">Reviewer: {proposal.fundraisingReviewer}</p>
                        {proposal.fundraisingScore && (
                          <p className="text-xs text-ink-700 mb-1">Score: {proposal.fundraisingScore}/100</p>
                        )}
                        {proposal.fundraisingComments && (
                          <p className="text-sm text-ink-800 mt-2 italic">"{proposal.fundraisingComments}"</p>
                        )}
                      </div>
                    )}

                    {proposal.ceoStatus !== 'Pending' && (
                      <div className={`p-4 rounded-lg border ${
                        proposal.ceoStatus === 'Approved' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-ink-900">CEO Approval</p>
                          <p className="text-xs text-ink-600">{proposal.ceoApprovalDate}</p>
                        </div>
                        <p className="text-xs text-ink-700 mb-1">Approver: {proposal.ceoApprover}</p>
                        {proposal.approvedBudget && (
                          <p className="text-xs text-ink-700 mb-1">
                            Approved Budget: LKR {proposal.approvedBudget.toLocaleString()}
                          </p>
                        )}
                        {proposal.ceoComments && (
                          <p className="text-sm text-ink-800 mt-2 italic">"{proposal.ceoComments}"</p>
                        )}
                      </div>
                    )}

                    {proposal.donorStatus !== 'Pending' && (
                      <div className={`p-4 rounded-lg border ${
                        proposal.donorStatus === 'Approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-ink-900">Donor Decision</p>
                          <p className="text-xs text-ink-600">{proposal.donorApprovalDate}</p>
                        </div>
                        <p className="text-xs text-ink-700 mb-1">Donor: {proposal.donorName}</p>
                        {proposal.donorStatus === 'Approved' && proposal.approvedBudget && (
                          <p className="text-xs font-semibold text-green-700">
                            Final Budget: LKR {proposal.approvedBudget.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {proposal.convertedToProject && (
                      <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                        <p className="text-sm font-semibold text-purple-700 mb-1">✓ Converted to Project #{proposal.projectId}</p>
                        <p className="text-xs text-ink-700">Start Date: {proposal.projectStartDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition font-semibold"
            >
              Close
            </button>
            {proposal.workflowStage !== 'converted' && !proposal.convertedToProject && (
              <>
                {!showApprovalForm ? (
                  <button
                    onClick={() => setShowApprovalForm(true)}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
                  >
                    <FileText size={18} />
                    Review & Decide
                  </button>
                ) : (
                  <div className="flex-1 bg-ink-50 rounded-lg p-4 border border-ink-100">
                    <form onSubmit={handleApprovalSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setApprovalData({...approvalData, decision: 'approve'})}
                          className={`px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                            approvalData.decision === 'approve'
                              ? 'bg-green-600 text-white'
                              : 'bg-ink-200 text-ink-700 hover:bg-ink-300'
                          }`}
                        >
                          <ThumbsUp size={16} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setApprovalData({...approvalData, decision: 'reject'})}
                          className={`px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                            approvalData.decision === 'reject'
                              ? 'bg-red-600 text-white'
                              : 'bg-ink-200 text-ink-700 hover:bg-ink-300'
                          }`}
                        >
                          <ThumbsDown size={16} />
                          Reject
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-ink-700 mb-1">Score (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={approvalData.score}
                            onChange={(e) => setApprovalData({...approvalData, score: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-700 mb-1">Approved Budget (LKR)</label>
                          <input
                            type="number"
                            value={approvalData.approvedBudget}
                            onChange={(e) => setApprovalData({...approvalData, approvedBudget: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink-700 mb-1">Comments</label>
                        <textarea
                          value={approvalData.comments}
                          onChange={(e) => setApprovalData({...approvalData, comments: e.target.value})}
                          rows="3"
                          className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="Add your review comments..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowApprovalForm(false)}
                          className="flex-1 px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition text-sm font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`flex-1 px-4 py-2 text-white rounded-lg transition text-sm font-semibold ${
                            approvalData.decision === 'approve'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          Submit {approvalData.decision === 'approve' ? 'Approval' : 'Rejection'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetailModal;
