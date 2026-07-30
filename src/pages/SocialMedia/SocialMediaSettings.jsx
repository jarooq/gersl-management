import React, { useState } from 'react';
import {
  Settings, Facebook, Instagram, Key, Link, Check, X,
  AlertCircle, HelpCircle, ExternalLink, Save, RefreshCw
} from 'lucide-react';

// GERSL only posts to Facebook + Instagram in practice. Twitter and LinkedIn
// platform tabs were dropped in Apr-2026 — they were never wired to a real
// API and just added cognitive load.
const SocialMediaSettings = () => {
  const [connections, setConnections] = useState({
    facebook: {
      connected: false,
      pageId: '',
      accessToken: '',
      pageName: '',
      lastSync: null
    },
    instagram: {
      connected: false,
      businessAccountId: '',
      accessToken: '',
      username: '',
      lastSync: null
    }
  });

  const [activeTab, setActiveTab] = useState('facebook');
  const [testingConnection, setTestingConnection] = useState(false);

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'blue',
      docsUrl: 'https://developers.facebook.com/docs/pages/overview'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'pink',
      docsUrl: 'https://developers.facebook.com/docs/instagram-api'
    }
  ];

  const handleConnect = async (platform) => {
    setTestingConnection(true);

    // Simulate API connection test
    setTimeout(() => {
      setConnections(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          connected: true,
          lastSync: new Date().toISOString()
        }
      }));
      setTestingConnection(false);
      alert(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`);
    }, 2000);
  };

  const handleDisconnect = (platform) => {
    if (window.confirm(`Are you sure you want to disconnect ${platform.charAt(0).toUpperCase() + platform.slice(1)}?`)) {
      setConnections(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          connected: false,
          accessToken: '',
          lastSync: null
        }
      }));
    }
  };

  const handleSync = async (platform) => {
    setTestingConnection(true);

    // Simulate sync
    setTimeout(() => {
      setConnections(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          lastSync: new Date().toISOString()
        }
      }));
      setTestingConnection(false);
      alert(`${platform.charAt(0).toUpperCase() + platform.slice(1)} synced successfully!`);
    }, 1500);
  };

  const activePlatform = platforms.find(p => p.id === activeTab);
  const connection = connections[activeTab];

  return (
    <div className="min-h-screen bg-ink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
              <Settings className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-h1 text-ink-900">Social Media Integration Settings</h1>
              <p className="text-sm text-ink-600">Connect and manage your social media accounts</p>
            </div>
          </div>
        </div>

        {/* Connection Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {platforms.map((platform) => {
            const isConnected = connections[platform.id].connected;
            const Icon = platform.icon;

            return (
              <div
                key={platform.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isConnected
                    ? `border-${platform.color}-300 bg-${platform.color}-50`
                    : 'border-ink-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={20} className={`text-${platform.color}-600`} />
                    <span className="font-bold text-ink-900">{platform.name}</span>
                  </div>
                  {isConnected && (
                    <Check size={16} className="text-green-600" />
                  )}
                </div>
                <div className={`text-xs font-semibold ${
                  isConnected ? 'text-green-600' : 'text-ink-500'
                }`}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Configuration Area */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100">
          {/* Platform Tabs */}
          <div className="border-b border-ink-100">
            <div className="flex overflow-x-auto">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const isActive = activeTab === platform.id;

                return (
                  <button
                    key={platform.id}
                    onClick={() => setActiveTab(platform.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 ${
                      isActive
                        ? `border-${platform.color}-600 text-${platform.color}-600`
                        : 'border-transparent text-ink-600 hover:text-ink-900'
                    }`}
                  >
                    <Icon size={18} />
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="p-6 space-y-6">
            {/* Help Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle size={20} className="text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-1">How to connect {activePlatform.name}</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    You'll need to create a developer account and obtain API credentials from {activePlatform.name}.
                  </p>
                  <a
                    href={activePlatform.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    View {activePlatform.name} Documentation
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>

            {/* Facebook Settings */}
            {activeTab === 'facebook' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={connection.pageId}
                    onChange={(e) => setConnections(prev => ({
                      ...prev,
                      facebook: { ...prev.facebook, pageId: e.target.value }
                    }))}
                    placeholder="Enter your Facebook Page ID"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-ink-500 mt-1">
                    Find this in your Facebook Page Settings &gt; About
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Page Access Token
                  </label>
                  <input
                    type="password"
                    value={connection.accessToken}
                    onChange={(e) => setConnections(prev => ({
                      ...prev,
                      facebook: { ...prev.facebook, accessToken: e.target.value }
                    }))}
                    placeholder="Enter your Page Access Token"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-ink-500 mt-1">
                    Generate this from the Facebook Graph API Explorer
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Page Name
                  </label>
                  <input
                    type="text"
                    value={connection.pageName}
                    onChange={(e) => setConnections(prev => ({
                      ...prev,
                      facebook: { ...prev.facebook, pageName: e.target.value }
                    }))}
                    placeholder="Your Facebook Page Name"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Instagram Settings */}
            {activeTab === 'instagram' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Instagram integration requires a Facebook Business Account and Instagram Business Account linked together.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Instagram Business Account ID
                  </label>
                  <input
                    type="text"
                    value={connection.businessAccountId}
                    onChange={(e) => setConnections(prev => ({
                      ...prev,
                      instagram: { ...prev.instagram, businessAccountId: e.target.value }
                    }))}
                    placeholder="Enter your Instagram Business Account ID"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Access Token
                  </label>
                  <input
                    type="password"
                    value={connection.accessToken}
                    onChange={(e) => setConnections(prev => ({
                      ...prev,
                      instagram: { ...prev.instagram, accessToken: e.target.value }
                    }))}
                    placeholder="Enter your Instagram Access Token"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Instagram Username
                  </label>
                  <input
                    type="text"
                    value={connection.username}
                    onChange={(e) => setConnections(prev => ({
                      ...prev,
                      instagram: { ...prev.instagram, username: e.target.value }
                    }))}
                    placeholder="@yourusername"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Connection Status */}
            {connection.connected && connection.lastSync && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      Connected and Synced
                    </span>
                  </div>
                  <span className="text-xs text-green-700">
                    Last sync: {new Date(connection.lastSync).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-ink-100">
              {connection.connected ? (
                <>
                  <button
                    onClick={() => handleSync(activeTab)}
                    disabled={testingConnection}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={18} className={testingConnection ? 'animate-spin' : ''} />
                    {testingConnection ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(activeTab)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold flex items-center gap-2"
                  >
                    <X size={18} />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(activeTab)}
                  disabled={testingConnection}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <Link size={18} />
                  {testingConnection ? 'Testing Connection...' : 'Test & Connect'}
                </button>
              )}
              <button
                className="px-6 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition-all font-semibold flex items-center gap-2"
              >
                <Save size={18} />
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-6">
          <h2 className="text-lg font-bold text-ink-900 mb-4">Quick Integration Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-ink-900 mb-2">Facebook Integration:</h3>
              <ol className="text-sm text-ink-700 space-y-1 list-decimal list-inside">
                <li>Create a Facebook App at developers.facebook.com</li>
                <li>Add your Facebook Page as a test user</li>
                <li>Generate a Page Access Token with required permissions</li>
                <li>Copy the Page ID and Access Token</li>
                <li>Paste them in the form and connect</li>
              </ol>
            </div>
            <div>
              <h3 className="font-bold text-ink-900 mb-2">Instagram Integration:</h3>
              <ol className="text-sm text-ink-700 space-y-1 list-decimal list-inside">
                <li>Convert your Instagram account to a Business Account</li>
                <li>Link it to your Facebook Page</li>
                <li>Use Facebook Graph API to get the Instagram Business Account ID</li>
                <li>Generate an access token with Instagram permissions</li>
                <li>Enter credentials and connect</li>
              </ol>
            </div>
            <div>
              <h3 className="font-bold text-ink-900 mb-2">Twitter Integration:</h3>
              <ol className="text-sm text-ink-700 space-y-1 list-decimal list-inside">
                <li>Create a Twitter Developer Account</li>
                <li>Create a new App in the Developer Portal</li>
                <li>Generate API Keys and Access Tokens</li>
                <li>Enable OAuth 1.0a authentication</li>
                <li>Enter all credentials and connect</li>
              </ol>
            </div>
            <div>
              <h3 className="font-bold text-ink-900 mb-2">LinkedIn Integration:</h3>
              <ol className="text-sm text-ink-700 space-y-1 list-decimal list-inside">
                <li>Create a LinkedIn App at linkedin.com/developers</li>
                <li>Add your organization as verified</li>
                <li>Request necessary OAuth scopes (w_organization_social)</li>
                <li>Implement OAuth 2.0 authentication flow</li>
                <li>Use the access token to connect</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaSettings;
