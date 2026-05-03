import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2, Instagram, Facebook, Twitter, Linkedin, TrendingUp, Users, Heart, MessageCircle,
  Calendar, Plus, X, Clock, Send, Image as ImageIcon, Video, FileText, BarChart2,
  ThumbsUp, MessageSquare, Eye, Share, Check, AlertCircle, Edit, Trash2, Settings
} from 'lucide-react';

const SocialMediaPage = () => {
  // Modal states
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSchedulePost, setShowSchedulePost] = useState(false);
  const [showEngagement, setShowEngagement] = useState(false);

  // Scheduled posts
  const [scheduledPosts, setScheduledPosts] = useState([]);

  // Engagement data
  const [engagementItems, setEngagementItems] = useState([]);

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h2 font-bold leading-tight">Social Media Management</h1>
              <p className="text-ink-200 text-sm mt-0.5">Manage your social media presence and engagement</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-3">
              <Link
                to="/admin/social-media/settings"
                className="px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all font-bold flex items-center gap-2"
              >
                <Settings size={20} />
                Settings
              </Link>
              <button
                onClick={() => setShowSchedulePost(true)}
                className="px-6 py-3 bg-white text-sky-600 rounded-lg hover:shadow-card transition-all font-bold flex items-center gap-2"
              >
                <Plus size={20} />
                Schedule Post
              </button>
          </div>
        </div>
      </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowCalendar(true)}
          className="p-4 bg-white border border-ink-200 rounded-xl hover:shadow-card transition-all "
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Calendar className="text-white" size={20} />
            </div>
            <span className="font-bold text-ink-900">Content Calendar</span>
          </div>
        </button>

        <button
          onClick={() => setShowAnalytics(true)}
          className="p-4 bg-white border border-ink-200 rounded-xl hover:shadow-card transition-all "
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <BarChart2 className="text-white" size={20} />
            </div>
            <span className="font-bold text-ink-900">Analytics</span>
          </div>
        </button>

        <button
          onClick={() => setShowSchedulePost(true)}
          className="p-4 bg-white border border-ink-200 rounded-xl hover:shadow-card transition-all "
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
              <Clock className="text-white" size={20} />
            </div>
            <span className="font-bold text-ink-900">Schedule Post</span>
          </div>
        </button>

        <button
          onClick={() => setShowEngagement(true)}
          className="p-4 bg-white border border-ink-200 rounded-xl hover:shadow-card transition-all "
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-white" size={20} />
            </div>
            <span className="font-bold text-ink-900">Engagement</span>
          </div>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">Total Followers</p>
              <h3 className="text-h1 text-ink-900">0</h3>
              <p className="text-xs text-ink-500 mt-1">Across all platforms</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <Users className="text-white" size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-sm font-medium text-green-600">0%</span>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">Engagement Rate</p>
              <h3 className="text-h1 text-ink-900">0%</h3>
              <p className="text-xs text-ink-500 mt-1">Average engagement</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <Heart className="text-white" size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-sm font-medium text-green-600">0%</span>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">Posts This Month</p>
              <h3 className="text-h1 text-ink-900">0</h3>
              <p className="text-xs text-ink-500 mt-1">Published content</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <MessageCircle className="text-white" size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-sm font-medium text-ink-600">0 scheduled</span>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-600 mb-2">Reach</p>
              <h3 className="text-h1 text-ink-900">0</h3>
              <p className="text-xs text-ink-500 mt-1">Total impressions</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <TrendingUp className="text-white" size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-sm font-medium text-green-600">0%</span>
          </div>
        </div>
      </div>

      {/* Platform Accounts */}
      <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
        <h2 className="text-sm font-bold text-ink-900 mb-6">Social Media Accounts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-ink-200 rounded-xl hover:shadow-card transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Facebook className="text-white" size={20} />
              </div>
              <div>
                <p className="font-bold text-ink-900">Facebook</p>
                <p className="text-xs text-ink-500"></p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Followers:</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Posts:</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-ink-200 rounded-xl hover:shadow-card transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-navy-9000 rounded-lg flex items-center justify-center">
                <Instagram className="text-white" size={20} />
              </div>
              <div>
                <p className="font-bold text-ink-900">Instagram</p>
                <p className="text-xs text-ink-500"></p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Followers:</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Posts:</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-ink-200 rounded-xl hover:shadow-card transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                <Twitter className="text-white" size={20} />
              </div>
              <div>
                <p className="font-bold text-ink-900">Twitter</p>
                <p className="text-xs text-ink-500"></p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Followers:</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Tweets:</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-2 border-blue-300 rounded-xl hover:shadow-card transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <Linkedin className="text-white" size={20} />
              </div>
              <div>
                <p className="font-bold text-ink-900">LinkedIn</p>
                <p className="text-xs text-ink-500"></p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Followers:</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Posts:</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Posts Section */}
      <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-ink-900">Scheduled Posts</h3>
            <p className="text-sm text-ink-600">Upcoming content across all platforms</p>
          </div>
          <button
            onClick={() => setShowSchedulePost(true)}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Plus size={18} />
            Schedule New
          </button>
        </div>
        <div className="space-y-3">
          {scheduledPosts.map((post) => (
            <div key={post.id} className="p-4 bg-ink-50 border border-ink-100 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-ink-900 mb-2">{post.content}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-ink-600 flex items-center gap-1">
                      {post.platform === 'Facebook' && <Facebook size={12} className="text-blue-600" />}
                      {post.platform === 'Instagram' && <Instagram size={12} className="text-pink-600" />}
                      {post.platform === 'LinkedIn' && <Linkedin size={12} className="text-blue-700" />}
                      {post.platform === 'Twitter' && <Twitter size={12} className="text-sky-500" />}
                      {post.platform}
                    </span>
                    <span className="text-xs text-ink-600 flex items-center gap-1">
                      <Calendar size={12} />
                      {post.date}
                    </span>
                    <span className="text-xs text-ink-600 flex items-center gap-1">
                      <Clock size={12} />
                      {post.time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    {post.status}
                  </span>
                  <button className="p-2 hover:bg-ink-200 rounded-lg transition-colors">
                    <Edit size={16} className="text-ink-600" />
                  </button>
                  <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Content Calendar</h2>
                  <p className="text-blue-100">View and manage your social media content schedule</p>
                </div>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="p-2 hover:bg-blue-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Calendar Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-ink-900">November 2025</h3>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-colors font-semibold">
                      Previous
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                      Today
                    </button>
                    <button className="px-4 py-2 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-colors font-semibold">
                      Next
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center font-bold text-ink-700 bg-ink-50 rounded-lg">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const dayNum = i - 2; // Starting calendar from day 1 (adjust as needed)
                    const hasPost = [].includes(dayNum);
                    return (
                      <div
                        key={i}
                        className={`p-3 min-h-24 border-2 rounded-lg transition-all ${
                          dayNum > 0 && dayNum <= 30
                            ? hasPost
                              ? 'border-blue-300 bg-blue-50 hover:shadow-card cursor-pointer'
                              : 'border-ink-100 hover:border-ink-200 cursor-pointer'
                            : 'bg-ink-50 border-ink-100'
                        }`}
                      >
                        {dayNum > 0 && dayNum <= 30 && (
                          <>
                            <div className="font-bold text-sm text-ink-700 mb-2">{dayNum}</div>
                            {hasPost && (
                              <div className="space-y-1">
                                <div className="text-xs bg-blue-500 text-white p-1 rounded flex items-center gap-1">
                                  <Facebook size={10} />
                                  <span className="truncate">Post scheduled</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Posts List */}
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-4">Upcoming Posts</h3>
                <div className="space-y-2">
                  {scheduledPosts.map((post) => (
                    <div key={post.id} className="p-3 bg-ink-50 border border-ink-100 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          {post.platform === 'Facebook' && <Facebook size={16} className="text-white" />}
                          {post.platform === 'Instagram' && <Instagram size={16} className="text-white" />}
                          {post.platform === 'LinkedIn' && <Linkedin size={16} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-ink-900">{post.content.substring(0, 60)}...</p>
                          <p className="text-xs text-ink-600">{post.date} at {post.time}</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl">
              <button
                onClick={() => setShowCalendar(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Analytics Dashboard</h2>
                  <p className="text-purple-100">Track your social media performance and engagement</p>
                </div>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-2 hover:bg-purple-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-ink-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-700">Total Reach</span>
                    <Eye size={18} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">0</p>
                  <p className="text-xs text-blue-600 mt-1">0%</p>
                </div>

                <div className="p-4 bg-ink-50 border border-pink-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-pink-700">Engagement</span>
                    <Heart size={18} className="text-pink-600" />
                  </div>
                  <p className="text-2xl font-bold text-pink-900">0</p>
                  <p className="text-xs text-pink-600 mt-1">0% engagement rate</p>
                </div>

                <div className="p-4 bg-ink-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-green-700">New Followers</span>
                    <Users size={18} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">0</p>
                  <p className="text-xs text-green-600 mt-1">This month</p>
                </div>

                <div className="p-4 bg-ink-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-700">Shares</span>
                    <Share size={18} className="text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">0</p>
                  <p className="text-xs text-purple-600 mt-1">Content shared</p>
                </div>
              </div>

              {/* Platform Performance */}
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-4">Platform Performance</h3>
                <div className="space-y-4">
                  {[].map((platform, idx) => (
                    <div key={idx} className="p-4 bg-white border border-ink-100 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-${platform.color}-500 rounded-lg flex items-center justify-center`}>
                            <platform.icon className="text-white" size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-ink-900">{platform.platform}</p>
                            <p className="text-xs text-ink-600">{platform.followers.toLocaleString()} followers</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-ink-600">Growth</p>
                            <p className="text-sm font-bold text-green-600">{platform.growth}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-ink-600">Engagement</p>
                            <p className="text-sm font-bold text-ink-900">{platform.engagement}</p>
                          </div>
                          <div className="w-24 bg-ink-200 rounded-full h-1.5">
                            <div className={`bg-${platform.color}-500 h-1.5 rounded-full`} style={{ width: platform.engagement }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing Posts */}
              <div>
                <h3 className="text-sm font-bold text-ink-900 mb-4">Top Performing Posts</h3>
                <div className="space-y-3">
                  {[].map((post, idx) => (
                    <div key={idx} className="p-4 bg-ink-50 border border-ink-100 rounded-lg">
                      <p className="font-semibold text-ink-900 mb-2">{post.content}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-ink-600 flex items-center gap-1">
                          <ThumbsUp size={14} />
                          {post.likes}
                        </span>
                        <span className="text-ink-600 flex items-center gap-1">
                          <MessageCircle size={14} />
                          {post.comments}
                        </span>
                        <span className="text-ink-600 flex items-center gap-1">
                          <Share size={14} />
                          {post.shares}
                        </span>
                        <span className="ml-auto text-xs text-ink-500">{post.platform}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl">
              <button
                onClick={() => setShowAnalytics(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Post Modal */}
      {showSchedulePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Schedule New Post</h2>
                  <p className="text-pink-100">Create and schedule content across platforms</p>
                </div>
                <button
                  onClick={() => setShowSchedulePost(false)}
                  className="p-2 hover:bg-pink-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-3">Select Platforms *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'Facebook', icon: Facebook, color: 'blue' },
                    { name: 'Instagram', icon: Instagram, color: 'pink' },
                    { name: 'Twitter', icon: Twitter, color: 'sky' },
                    { name: 'LinkedIn', icon: Linkedin, color: 'blue' }
                  ].map((platform) => (
                    <label key={platform.name} className="flex items-center gap-2 p-3 border-2 border-ink-100 rounded-lg hover:border-pink-400 cursor-pointer transition-all">
                      <input type="checkbox" className="w-4 h-4 text-pink-600" />
                      <platform.icon size={20} className={`text-${platform.color}-600`} />
                      <span className="text-sm font-medium text-ink-700">{platform.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Post Content */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Post Content *</label>
                <textarea
                  className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  rows="6"
                  placeholder="What would you like to share? Use #hashtags and @mentions..."
                ></textarea>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-ink-100 rounded-lg transition-colors">
                      <ImageIcon size={20} className="text-ink-600" />
                    </button>
                    <button className="p-2 hover:bg-ink-100 rounded-lg transition-colors">
                      <Video size={20} className="text-ink-600" />
                    </button>
                    <button className="p-2 hover:bg-ink-100 rounded-lg transition-colors">
                      <FileText size={20} className="text-ink-600" />
                    </button>
                  </div>
                  <span className="text-xs text-ink-500">0 / 280 characters</span>
                </div>
              </div>

              {/* Schedule Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Schedule Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Schedule Time *</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Post Type */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Post Type</label>
                <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-pink-500">
                  <option>Regular Post</option>
                  <option>Story</option>
                  <option>Reel/Video</option>
                  <option>Article</option>
                </select>
              </div>

              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <p className="text-sm text-pink-800 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Note:</strong> Your post will be published automatically at the scheduled time. You can edit or delete scheduled posts anytime before they go live.
                  </span>
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl flex justify-between">
              <button
                onClick={() => setShowSchedulePost(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button className="px-6 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition-all font-semibold">
                  Save Draft
                </button>
                <button
                  onClick={() => {
                    setShowSchedulePost(false);
                    alert('Post scheduled successfully!');
                  }}
                  className="px-6 py-2 bg-navy-900 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Send size={18} />
                  Schedule Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Tracking Modal */}
      {showEngagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg2 shadow-pop max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Engagement Tracking</h2>
                  <p className="text-green-100">Manage comments, messages, and interactions</p>
                </div>
                <button
                  onClick={() => setShowEngagement(false)}
                  className="p-2 hover:bg-green-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Filter Tabs */}
              <div className="flex gap-2 border-b border-ink-100">
                <button className="px-4 py-2 text-sm font-semibold text-green-600 border-b-2 border-green-600">
                  All ({engagementItems.length})
                </button>
                <button className="px-4 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900">
                  Unread (0)
                </button>
                <button className="px-4 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900">
                  Comments (0)
                </button>
                <button className="px-4 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900">
                  Messages (0)
                </button>
              </div>

              {/* Engagement Items */}
              <div className="space-y-3">
                {engagementItems.map((item) => (
                  <div key={item.id} className={`p-4 border-2 rounded-lg transition-all ${
                    item.status === 'unread' ? 'border-green-200 bg-green-50' : 'border-ink-100 bg-white'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-navy-900 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {item.user.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-ink-900">{item.user}</p>
                          <div className="flex items-center gap-2 text-xs text-ink-600">
                            {item.platform === 'Facebook' && <Facebook size={12} className="text-blue-600" />}
                            {item.platform === 'Instagram' && <Instagram size={12} className="text-pink-600" />}
                            {item.platform === 'Twitter' && <Twitter size={12} className="text-sky-500" />}
                            <span>{item.platform}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.type === 'comment' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            Comment
                          </span>
                        )}
                        {item.type === 'message' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            Message
                          </span>
                        )}
                        {item.status === 'unread' && (
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                    <p className="text-ink-700 mb-3">{item.content}</p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-1">
                        <MessageCircle size={14} />
                        Reply
                      </button>
                      <button className="px-4 py-2 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-colors text-sm font-semibold flex items-center gap-1">
                        <Check size={14} />
                        Mark Read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl">
              <button
                onClick={() => setShowEngagement(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaPage;
