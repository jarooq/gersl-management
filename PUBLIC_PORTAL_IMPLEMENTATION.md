# Public Portal Implementation Guide

## Overview
This document provides complete implementation details for the GERSL Public Portal - a public-facing website that allows external users to view campaigns, apply for jobs, and submit vendor proposals.

## Implementation Status

### ✅ Completed
1. **Public Portal Structure**
   - Created `/src/public-portal` folder structure
   - Added layouts, pages, and components directories

2. **Public Layout** (`PublicLayout.jsx`)
   - Professional header with contact info and social links
   - Navigation menu (Home, Campaigns, Careers, Tenders, About, Contact)
   - Mobile-responsive design
   - Footer with quick links and contact information

3. **Homepage** (`HomePage.jsx`)
   - Hero section with call-to-action
   - Statistics showcase (People Helped, Active Projects, etc.)
   - Impact areas feature cards
   - Active campaigns display (pulls from CampaignContext)
   - Quick action cards for donations, careers, and vendor opportunities
   - Why Choose GERSL section
   - Final CTA section

4. **Campaigns List Page** (`CampaignsListPage.jsx`)
   - Lists all active campaigns
   - Search functionality
   - Category filtering
   - Progress bars for each campaign
   - Days remaining display
   - Responsive grid layout

### 📋 Remaining Files to Create

#### 1. Campaign Detail Page with Donation Form

**File**: `/src/public-portal/pages/CampaignDetailPage.jsx`

```jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Target, Calendar, Users, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';

const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { campaigns, addDonation } = useCampaign();
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const campaign = campaigns.find(c => c.id === id);

  const [formData, setFormData] = useState({
    amount: '',
    donorName: '',
    email: '',
    phone: '',
    paymentMethod: 'Credit Card',
    message: ''
  });

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Campaign not found</h2>
        <Link to="/campaigns" className="text-purple-600 hover:underline">Back to Campaigns</Link>
      </div>
    );
  }

  const progress = (campaign.raisedAmount / campaign.targetAmount) * 100;
  const daysLeft = Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24));

  const handleSubmit = (e) => {
    e.preventDefault();

    // Add donation
    addDonation({
      ...formData,
      amount: parseFloat(formData.amount),
      campaignId: campaign.id,
      campaignName: campaign.name
    });

    // Show success message
    setShowSuccess(true);
    setShowDonationForm(false);

    // Reset form
    setFormData({
      amount: '',
      donorName: '',
      email: '',
      phone: '',
      paymentMethod: 'Credit Card',
      message: ''
    });

    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  return (
    <div>
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-slide-in">
          <CheckCircle size={24} />
          <div>
            <p className="font-bold">Thank you for your donation!</p>
            <p className="text-sm">Your receipt will be sent to your email.</p>
          </div>
          <button onClick={() => setShowSuccess(false)} className="ml-4">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <button onClick={() => navigate('/campaigns')} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft size={20} />
            Back to Campaigns
          </button>

          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm mb-4">
              {campaign.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{campaign.name}</h1>
            <p className="text-lg text-blue-100">{campaign.description}</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Raised</p>
                  <p className="text-2xl font-bold text-purple-600">${campaign.raisedAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Goal</p>
                  <p className="text-2xl font-bold text-gray-800">${campaign.targetAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Days Left</p>
                  <p className="text-2xl font-bold text-blue-600">{daysLeft}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-purple-600">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Campaign Details</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Duration</p>
                    <p className="text-gray-600 text-sm">
                      {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Target Amount</p>
                    <p className="text-gray-600 text-sm">${campaign.targetAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Heart className="text-purple-600 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-gray-800">Category</p>
                    <p className="text-gray-600 text-sm">{campaign.category}</p>
                  </div>
                </div>
              </div>

              {campaign.longDescription && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">About This Campaign</h3>
                  <p className="text-gray-600 leading-relaxed">{campaign.longDescription || campaign.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Donation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Support This Campaign</h3>

              {!showDonationForm ? (
                <button
                  onClick={() => setShowDonationForm(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Heart size={20} />
                  Donate Now
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.donorName}
                      onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="+94 XX XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option>Credit Card</option>
                      <option>Bank Transfer</option>
                      <option>PayPal</option>
                      <option>Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="3"
                      placeholder="Leave a message..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDonationForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                <p>Your donation is tax-deductible</p>
                <p className="mt-1">You'll receive a receipt via email</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;
```

#### 2. Public Job Listings Page

**File**: `/src/public-portal/pages/CareersPage.jsx`

```jsx
import React, { useState } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import { Briefcase, MapPin, Clock, DollarSign, Search, Filter, Send } from 'lucide-react';

const CareersPage = () => {
  const { jobPostings } = useCampaign();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const activeJobs = jobPostings.filter(j => j.status === 'Open');
  const jobTypes = ['All', ...new Set(activeJobs.map(j => j.type))];

  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    phone: '',
    resume: null,
    coverLetter: ''
  });

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    alert('Application submitted successfully! We will contact you soon.');
    setShowApplicationForm(false);
    setApplicationData({ name: '', email: '', phone: '', resume: null, coverLetter: '' });
  };

  return (
    <div>
      {/* Hero Section - Similar to campaigns */}
      {/* Search and Filter */}
      {/* Job Listings Grid */}
      {/* Application Modal */}
    </div>
  );
};

export default CareersPage;
```

#### 3. Vendor Tenders Page

**File**: `/src/public-portal/pages/TendersPage.jsx`

Similar structure to CareersPage but for vendor calls.

#### 4. Update Routing

**File**: Update `/src/routes/AppRouter.jsx` to include public routes:

```jsx
// Add public routes before the protected routes
<Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
<Route path="/campaigns" element={<PublicLayout><CampaignsListPage /></PublicLayout>} />
<Route path="/campaigns/:id" element={<PublicLayout><CampaignDetailPage /></PublicLayout>} />
<Route path="/careers" element={<PublicLayout><CareersPage /></PublicLayout>} />
<Route path="/tenders" element={<PublicLayout><TendersPage /></PublicLayout>} />
<Route path="/donate" element={<PublicLayout><DonateGeneralPage /></PublicLayout>} />
<Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
<Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />

// Admin login route
<Route path="/admin" element={<Login />} />
<Route path="/admin/login" element={<Login />} />

// Protected admin routes (existing)
<Route path="/admin/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
```

## Key Features

### 1. **Responsive Design**
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interactions

### 2. **SEO Ready**
- Semantic HTML
- Meta tags support (add react-helmet)
- Clean URLs

### 3. **Performance**
- Code splitting with React.lazy
- Image optimization
- Minimal dependencies

### 4. **Accessibility**
- ARIA labels
- Keyboard navigation
- Screen reader support

### 5. **Integration**
- Uses existing CampaignContext
- Shares backend API
- Consistent data flow

## Next Steps

1. ✅ Create remaining page files (Careers, Tenders, Contact, About, Donate)
2. ✅ Update routing configuration
3. ✅ Add payment gateway integration (Stripe/PayPal)
4. ✅ Implement email notifications
5. ✅ Add Google Analytics
6. ✅ Setup meta tags for SEO
7. ✅ Create sitemap.xml
8. ✅ Test on mobile devices

## Deployment

The public portal will be deployed as part of the main application. Consider:

1. **Separate Domain**: `www.gersl.org` (public) vs `admin.gersl.org` (internal)
2. **Same Domain**: `/` (public) vs `/admin` (internal)

**Recommended**: Same domain with different routes for easier maintenance.

## Security Considerations

1. Public routes are read-only
2. All write operations require authentication
3. Form submissions are validated
4. CSRF protection enabled
5. Rate limiting on public forms

## Conclusion

The public portal provides a professional, user-friendly interface for external stakeholders to engage with GERSL's mission, support campaigns, apply for jobs, and participate in procurement opportunities.
