import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Target, Clock, Users, Share2, Calendar, CheckCircle, ArrowLeft, DollarSign, Mail, Phone, User, Package } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';
import API, { getImageUrl } from '../../services/api';

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { campaigns, addDonation } = useCampaign();

  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [donorInfo, setDonorInfo] = useState({
    name: '',
    email: '',
    phone: '',
    anonymous: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const campaign = campaigns.find(c => c.id === parseInt(id));

  // Load campaign packages
  useEffect(() => {
    const loadPackages = async () => {
      if (campaign?.id) {
        try {
          setLoadingPackages(true);
          const activePackages = await API.CampaignPackage.getActive(campaign.id);
          setPackages(activePackages || []);
        } catch (error) {
          console.error('Error loading packages:', error);
          setPackages([]);
        } finally {
          setLoadingPackages(false);
        }
      }
    };
    loadPackages();
  }, [campaign?.id]);

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Heart className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
          <Link to="/campaigns" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const progress = (campaign.raisedAmount / campaign.targetAmount) * 100;
  const daysLeft = Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const donorCount = campaign.donors || 125; // Mock data for now

  const suggestedAmounts = [25, 50, 100, 250, 500, 1000];

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let amount;
    if (selectedPackage) {
      amount = parseFloat(selectedPackage.amount);
    } else if (donationAmount === 'custom') {
      amount = parseFloat(customAmount);
    } else {
      amount = parseFloat(donationAmount);
    }

    if (!amount || amount <= 0) {
      alert('Please enter a valid donation amount');
      setSubmitting(false);
      return;
    }

    try {
      // Create donation record
      const donation = {
        campaignId: campaign.id,
        campaignName: campaign.title,
        donorName: donorInfo.anonymous ? 'Anonymous' : donorInfo.name,
        email: donorInfo.email,
        phone: donorInfo.phone,
        amount: amount,
        paymentMethod: 'Online', // Will be updated when payment gateway is integrated
        anonymous: donorInfo.anonymous
      };

      addDonation(donation);

      setSubmitted(true);
      setTimeout(() => {
        navigate('/campaigns');
      }, 3000);
    } catch (error) {
      console.error('Error submitting donation:', error);
      alert('Failed to submit donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.description,
        url: window.location.href
      });
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Campaign link copied to clipboard!');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your donation of ${donationAmount === 'custom' ? customAmount : donationAmount} has been received.
            {!donorInfo.anonymous && ' You will receive a confirmation email shortly.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting you back to campaigns...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Campaigns
          </Link>
        </div>
      </div>

      {/* Hero Section with Campaign Image */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        {campaign.imageUrl && (
          <div className="absolute inset-0">
            <img
              src={getImageUrl(campaign.imageUrl)}
              alt={campaign.title}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/90 to-indigo-800/90"></div>
          </div>
        )}

        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-white">
            {/* Category Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full">
                {campaign.category}
              </span>
              {campaign.status && (
                <span className="inline-block bg-green-500/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full">
                  {campaign.status}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{campaign.title}</h1>

            {/* Short Description */}
            <p className="text-lg text-blue-100 mb-6 leading-relaxed">{campaign.description}</p>

            {/* Progress Bar */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-blue-100">Campaign Progress</span>
                <span className="text-2xl font-bold">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-100">
                  <span className="text-2xl font-bold text-white">${campaign.raisedAmount.toLocaleString()}</span>
                  <span className="text-blue-200"> raised</span>
                </span>
                <span className="text-blue-100">
                  of <span className="font-semibold text-white">${campaign.targetAmount.toLocaleString()}</span> goal
                </span>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-200" />
                  <p className="text-sm text-blue-100">Donors</p>
                </div>
                <p className="text-2xl font-bold">{donorCount}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-200" />
                  <p className="text-sm text-blue-100">Days Left</p>
                </div>
                <p className="text-2xl font-bold">{daysLeft > 0 ? daysLeft : 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-200" />
                  <p className="text-sm text-blue-100">End Date</p>
                </div>
                <p className="text-sm font-semibold">{new Date(campaign.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Campaign Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Campaign Packages - Show if available */}
            {packages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="w-6 h-6 text-purple-600" />
                  <h3 className="text-2xl font-bold text-gray-800">Campaign Packages</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-500 transition-all"
                    >
                      {pkg.imageUrl && (
                        <img
                          src={getImageUrl(pkg.imageUrl)}
                          alt={pkg.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-bold text-gray-900 mb-2">{pkg.name}</h4>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                      )}
                      <p className="text-2xl font-bold text-purple-600">
                        ${parseFloat(pkg.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About Campaign */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">About This Campaign</h3>
              <div className="prose max-w-none text-gray-600 leading-relaxed">
                <p className="mb-4 text-lg">{campaign.description}</p>
                {campaign.type && (
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 my-4">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Campaign Type</p>
                    <p className="text-blue-700">{campaign.type}</p>
                  </div>
                )}
                <p className="mb-4">
                  This campaign is part of our ongoing efforts to make a meaningful impact in the communities we serve.
                  Your generous support will help us achieve our goals and bring positive change to those who need it most.
                </p>
                <p>
                  Every contribution, no matter the size, makes a difference. Join us in this important mission and be
                  part of the solution. Together, we can create lasting change.
                </p>
              </div>
            </div>

            {/* Campaign Timeline */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Campaign Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Start Date</p>
                    <p className="text-gray-600">{new Date(campaign.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">End Date</p>
                    <p className="text-gray-600">{new Date(campaign.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Category</p>
                    <p className="text-gray-600">{campaign.category}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Donation Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="text-white" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Support This Campaign</h3>
                  <p className="text-gray-600 text-sm">Every donation makes a difference</p>
                </div>

                {!showDonationForm ? (
                  <div>
                    {/* Show Packages if available */}
                    {packages.length > 0 ? (
                      <div className="space-y-4 mb-4">
                        <h4 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
                          <Package size={16} />
                          Select a Package
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {packages.map((pkg) => (
                            <button
                              key={pkg.id}
                              onClick={() => {
                                setSelectedPackage(pkg);
                                setDonationAmount('');
                                setShowDonationForm(true);
                              }}
                              className="w-full text-left bg-white border-2 border-gray-200 hover:border-blue-500 rounded-xl p-4 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                {pkg.imageUrl && (
                                  <img
                                    src={getImageUrl(pkg.imageUrl)}
                                    alt={pkg.name}
                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {pkg.name}
                                  </h5>
                                  {pkg.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{pkg.description}</p>
                                  )}
                                  <p className="text-lg font-bold text-blue-600 mt-2">
                                    ${parseFloat(pkg.amount).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedPackage(null);
                            setDonationAmount('custom');
                            setShowDonationForm(true);
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                        >
                          Enter Custom Amount
                        </button>
                      </div>
                    ) : (
                      /* Show regular donation buttons if no packages */
                      <div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {suggestedAmounts.map(amount => (
                            <button
                              key={amount}
                              onClick={() => {
                                setDonationAmount(amount.toString());
                                setShowDonationForm(true);
                              }}
                              className="bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-800 font-semibold py-3 rounded-xl transition-all"
                            >
                              ${amount}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            setDonationAmount('custom');
                            setShowDonationForm(true);
                          }}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                        >
                          Enter Custom Amount
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleShare}
                      className="w-full mt-3 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 size={20} />
                      Share Campaign
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDonationSubmit} className="space-y-4">
                    {/* Amount Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Donation Amount
                      </label>
                      {selectedPackage ? (
                        <div className="bg-purple-50 border-2 border-purple-600 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            {selectedPackage.imageUrl && (
                              <img
                                src={getImageUrl(selectedPackage.imageUrl)}
                                alt={selectedPackage.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{selectedPackage.name}</p>
                              <p className="text-2xl font-bold text-purple-600">
                                ${parseFloat(selectedPackage.amount).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPackage(null);
                              setDonationAmount('custom');
                            }}
                            className="text-sm text-purple-600 hover:text-purple-700 mt-2 w-full text-center"
                          >
                            Change to custom amount
                          </button>
                        </div>
                      ) : donationAmount === 'custom' ? (
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="1"
                          />
                        </div>
                      ) : (
                        <div className="bg-blue-50 border-2 border-blue-600 rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-blue-600">${donationAmount}</p>
                          <button
                            type="button"
                            onClick={() => setDonationAmount('custom')}
                            className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                          >
                            Change amount
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Donor Information */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          value={donorInfo.name}
                          onChange={(e) => setDonorInfo({...donorInfo, name: e.target.value})}
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={!donorInfo.anonymous}
                          disabled={donorInfo.anonymous}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          value={donorInfo.email}
                          onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
                          placeholder="john@example.com"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="tel"
                          value={donorInfo.phone}
                          onChange={(e) => setDonorInfo({...donorInfo, phone: e.target.value})}
                          placeholder="+94 71 234 5678"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Anonymous Donation */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={donorInfo.anonymous}
                        onChange={(e) => setDonorInfo({...donorInfo, anonymous: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="anonymous" className="text-sm text-gray-700">
                        Make this donation anonymous
                      </label>
                    </div>

                    {/* Submit Buttons */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Processing...' : 'Donate Now'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDonationForm(false)}
                      className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {/* Security Note */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs text-gray-600 text-center">
                    <CheckCircle className="inline mr-1 text-green-600" size={14} />
                    Your donation is secure and tax-deductible
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CampaignDetailPage;
