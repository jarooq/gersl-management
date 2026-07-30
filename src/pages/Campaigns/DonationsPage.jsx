import React, { useState, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import {
  DollarSign,
  Users,
  TrendingUp,
  Download,
  Search,
  Filter,
  Plus,
  X,
  Eye,
  Calendar,
  Mail,
  Phone,
  CreditCard,
  Wallet,
  Banknote,
  Receipt
} from 'lucide-react';

const DonationsPage = () => {
  const {
    donations,
    donors,
    campaigns,
    addDonation,
    getDonationStats
  } = useCampaign();

  const stats = getDonationStats();

  // State Management
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [dateRange] = useState({ start: '', end: '' });

  const [donationForm, setDonationForm] = useState({
    campaignId: '',
    donorName: '',
    email: '',
    phone: '',
    amount: '',
    paymentMethod: 'Credit Card',
    isAnonymous: false,
    notes: ''
  });

  // Calculate additional statistics
  const topDonors = useMemo(() => {
    return [...donors]
      .sort((a, b) => b.totalDonations - a.totalDonations)
      .slice(0, 5);
  }, [donors]);


  // Filter donations
  const filteredDonations = useMemo(() => {
    return donations.filter(donation => {
      const matchesSearch = donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMethod = methodFilter === 'All' || donation.paymentMethod === methodFilter;
      const matchesCampaign = campaignFilter === 'All' || donation.campaignId === campaignFilter;

      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const donationDate = new Date(donation.date);
        matchesDate = donationDate >= new Date(dateRange.start) && donationDate <= new Date(dateRange.end);
      }

      return matchesSearch && matchesMethod && matchesCampaign && matchesDate;
    });
  }, [donations, searchTerm, methodFilter, campaignFilter, dateRange]);

  // Handlers
  const handleSubmitDonation = (e) => {
    e.preventDefault();
    if (!donationForm.campaignId || !donationForm.amount || !donationForm.donorName || !donationForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    addDonation({
      ...donationForm,
      amount: parseFloat(donationForm.amount)
    });

    setDonationForm({
      campaignId: '',
      donorName: '',
      email: '',
      phone: '',
      amount: '',
      paymentMethod: 'Credit Card',
      isAnonymous: false,
      notes: ''
    });
    setShowDonationModal(false);
  };

  const handleViewDonor = (donor) => {
    setSelectedDonor(donor);
    setShowDonorModal(true);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Receipt #', 'Donor Name', 'Email', 'Campaign', 'Amount', 'Payment Method'];
    const rows = filteredDonations.map(donation => {
      const campaign = campaigns.find(c => c.id === donation.campaignId);
      return [
        donation.date,
        donation.receiptNumber,
        donation.donorName,
        donation.email,
        campaign?.title || 'N/A',
        `$${donation.amount.toLocaleString()}`,
        donation.paymentMethod
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'Credit Card':
        return <CreditCard size={16} />;
      case 'Bank Transfer':
        return <Banknote size={16} />;
      case 'Cash':
        return <Wallet size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Section */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h2 font-bold leading-tight">Donations & Donors</h1>
              <p className="text-ink-200 text-sm mt-0.5">Track donations and manage donor relationships</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowDonationModal(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card transition"
            >
              <Plus size={20} />
              Record Donation
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg2 p-6 shadow-card border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Total Amount</h3>
            <p className="text-3xl font-bold text-ink-800">${stats.totalAmount.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg2 p-6 shadow-card border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Receipt className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Total Donations</h3>
            <p className="text-3xl font-bold text-ink-800">{stats.totalDonations}</p>
          </div>

          <div className="bg-white rounded-lg2 p-6 shadow-card border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Average Donation</h3>
            <p className="text-3xl font-bold text-ink-800">${stats.averageDonation.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg2 p-6 shadow-card border-l-4 border-pink-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-pink-100 p-3 rounded-xl">
                <Users className="text-pink-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Total Donors</h3>
            <p className="text-3xl font-bold text-ink-800">{donors.length}</p>
          </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg2 shadow-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by donor name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="All">All Methods</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>

            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="All">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
              ))}
            </select>

            <button
              onClick={exportToCSV}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-card"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donations List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg2 shadow-card overflow-hidden">
              <div className="p-6 bg-ink-50 border-b border-ink-100">
                <h2 className="text-2xl font-bold text-ink-800 flex items-center gap-2">
                  <Receipt size={24} className="text-purple-600" />
                  Recent Donations ({filteredDonations.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                {filteredDonations.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="bg-ink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Receipt size={40} className="text-ink-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-ink-700 mb-2">No Donations Yet</h3>
                    <p className="text-ink-500 mb-6">Start recording donations to track fundraising progress</p>
                    <button
                      onClick={() => setShowDonationModal(true)}
                      className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 inline-flex items-center gap-2"
                    >
                      <Plus size={20} />
                      Record First Donation
                    </button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-ink-50 border-b border-ink-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Donor</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Campaign</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {filteredDonations.map((donation) => {
                        const campaign = campaigns.find(c => c.id === donation.campaignId);

                        return (
                          <tr key={donation.id} className="hover:bg-ink-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-ink-400" />
                                {donation.date}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-ink-900">{donation.donorName}</div>
                              <div className="text-xs text-ink-500 flex items-center gap-1">
                                <Mail size={12} />
                                {donation.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-ink-600">
                              <div className="max-w-xs truncate">{campaign?.title || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-lg font-bold text-green-600">
                                ${donation.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getPaymentIcon(donation.paymentMethod)}
                                {donation.paymentMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-600 font-mono">
                              {donation.receiptNumber}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Top Donors Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg2 shadow-card overflow-hidden">
              <div className="p-6 bg-ink-50 border-b border-ink-100">
                <h2 className="text-xl font-bold text-ink-800 flex items-center gap-2">
                  <Users size={20} className="text-pink-600" />
                  Top Donors
                </h2>
              </div>

              <div className="p-6">
                {topDonors.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={40} className="text-ink-300 mx-auto mb-3" />
                    <p className="text-ink-500 text-sm">No donors yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topDonors.map((donor, index) => (
                      <div
                        key={donor.id}
                        className="flex items-center gap-4 p-4 bg-ink-50 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => handleViewDonor(donor)}
                      >
                        <div className="bg-purple-50 border border-purple-200 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink-800 truncate">{donor.name}</p>
                          <p className="text-sm text-ink-600 font-bold">${donor.totalDonations.toLocaleString()}</p>
                          <p className="text-xs text-ink-500">{donor.donationCount} donations</p>
                        </div>
                        <Eye size={16} className="text-ink-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Record Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={24} />
                Record New Donation
              </h2>
              <button
                onClick={() => setShowDonationModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitDonation} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Campaign <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={donationForm.campaignId}
                    onChange={(e) => setDonationForm({ ...donationForm, campaignId: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Campaign</option>
                    {campaigns.filter(c => c.status === 'Active').map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Donor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={donationForm.donorName}
                    onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={donationForm.email}
                    onChange={(e) => setDonationForm({ ...donationForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={donationForm.phone}
                    onChange={(e) => setDonationForm({ ...donationForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Payment Method</label>
                  <select
                    value={donationForm.paymentMethod}
                    onChange={(e) => setDonationForm({ ...donationForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Notes</label>
                <textarea
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  placeholder="Additional notes or comments..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={donationForm.isAnonymous}
                  onChange={(e) => setDonationForm({ ...donationForm, isAnonymous: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <label htmlFor="anonymous" className="text-sm font-medium text-ink-700">
                  Anonymous Donation
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setShowDonationModal(false)}
                  className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-xl font-semibold hover:bg-ink-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-card hover:shadow-lift"
                >
                  Record Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donor Details Modal */}
      {showDonorModal && selectedDonor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users size={24} />
                Donor Details
              </h2>
              <button
                onClick={() => setShowDonorModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-ink-50 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-ink-800 mb-4">{selectedDonor.name}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-ink-600">
                    <Mail size={18} className="text-pink-600" />
                    <span>{selectedDonor.email}</span>
                  </div>
                  {selectedDonor.phone && (
                    <div className="flex items-center gap-2 text-ink-600">
                      <Phone size={18} className="text-purple-600" />
                      <span>{selectedDonor.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-white rounded-xl">
                    <p className="text-2xl font-bold text-green-600">${selectedDonor.totalDonations.toLocaleString()}</p>
                    <p className="text-sm text-ink-600 mt-1">Total Donated</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">{selectedDonor.donationCount}</p>
                    <p className="text-sm text-ink-600 mt-1">Donations</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl">
                    <p className="text-2xl font-bold text-purple-600">${(selectedDonor.totalDonations / selectedDonor.donationCount).toFixed(0)}</p>
                    <p className="text-sm text-ink-600 mt-1">Average</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-ink-800 mb-3">Donation History</h4>
                <div className="space-y-3">
                  {donations
                    .filter(d => d.email === selectedDonor.email)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(donation => {
                      const campaign = campaigns.find(c => c.id === donation.campaignId);
                      return (
                        <div key={donation.id} className="flex items-center justify-between p-4 bg-ink-50 rounded-xl">
                          <div>
                            <p className="font-semibold text-ink-800">{campaign?.title || 'N/A'}</p>
                            <p className="text-sm text-ink-600">{donation.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">${donation.amount.toLocaleString()}</p>
                            <p className="text-xs text-ink-500">{donation.paymentMethod}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsPage;
