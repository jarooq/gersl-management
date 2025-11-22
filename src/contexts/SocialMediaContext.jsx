import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const SocialMediaContext = createContext();

export const useSocialMedia = () => {
  const context = useContext(SocialMediaContext);
  if (!context) {
    throw new Error('useSocialMedia must be used within a SocialMediaProvider');
  }
  return context;
};

export const SocialMediaProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  // State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load social media posts from backend on mount
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const loadSocialMediaData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await API.SocialMedia.getAll();
        setPosts(response.posts || []);

      } catch (err) {
        console.error('Error loading social media data:', err);
        setError(err.message || 'Failed to load social media data');
      } finally {
        setLoading(false);
      }
    };

    loadSocialMediaData();
    }, [isLoggedIn]);

  // Post CRUD Operations
  const addPost = async (postData) => {
    try {
      const newPost = await API.SocialMedia.create(postData);
      setPosts([newPost, ...posts]); // Add to beginning for newest first
      return newPost;
    } catch (err) {
      console.error('Error adding post:', err);
      throw err;
    }
  };

  const updatePost = async (id, updatedData) => {
    try {
      const updated = await API.SocialMedia.update(id, updatedData);
      setPosts(posts.map(post =>
        post.id === id ? updated : post
      ));
      return updated;
    } catch (err) {
      console.error('Error updating post:', err);
      throw err;
    }
  };

  const deletePost = async (id) => {
    try {
      await API.SocialMedia.delete(id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  };

  const publishPost = async (id) => {
    try {
      const published = await API.SocialMedia.publish(id);
      setPosts(posts.map(post =>
        post.id === id ? published : post
      ));
      return published;
    } catch (err) {
      console.error('Error publishing post:', err);
      throw err;
    }
  };

  const schedulePost = async (id, scheduledDate) => {
    try {
      const scheduled = await updatePost(id, {
        status: 'Scheduled',
        scheduledDate: scheduledDate
      });
      return scheduled;
    } catch (err) {
      console.error('Error scheduling post:', err);
      throw err;
    }
  };

  // Engagement Operations
  const getEngagement = async (postId) => {
    try {
      const engagement = await API.SocialMedia.getEngagement(postId);
      return engagement;
    } catch (err) {
      console.error('Error fetching engagement:', err);
      throw err;
    }
  };

  // Statistics
  const getStats = async () => {
    try {
      const stats = await API.SocialMedia.getStats();
      return stats;
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Fallback to local calculation if API fails
      return calculateLocalStats();
    }
  };

  const calculateLocalStats = () => {
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(p => p.status === 'Published').length;
    const scheduledPosts = posts.filter(p => p.status === 'Scheduled').length;
    const draftPosts = posts.filter(p => p.status === 'Draft').length;

    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);

    const avgEngagement = totalPosts > 0
      ? ((totalLikes + totalShares + totalComments) / totalPosts).toFixed(2)
      : 0;

    return {
      totalPosts,
      publishedPosts,
      scheduledPosts,
      draftPosts,
      totalLikes,
      totalShares,
      totalComments,
      avgEngagement
    };
  };

  // Filter posts by status
  const getPostsByStatus = (status) => {
    return posts.filter(post => post.status === status);
  };

  // Filter posts by platform
  const getPostsByPlatform = (platform) => {
    return posts.filter(post => post.platform === platform);
  };

  // Get posts scheduled for a specific date range
  const getScheduledPosts = (startDate, endDate) => {
    return posts.filter(post => {
      if (post.status !== 'Scheduled' || !post.scheduledDate) return false;
      const postDate = new Date(post.scheduledDate);
      return postDate >= new Date(startDate) && postDate <= new Date(endDate);
    });
  };

  const value = {
    // State
    posts,
    loading,
    error,

    // Post Operations
    addPost,
    updatePost,
    deletePost,
    publishPost,
    schedulePost,

    // Engagement
    getEngagement,

    // Statistics
    getStats,

    // Filters
    getPostsByStatus,
    getPostsByPlatform,
    getScheduledPosts
  };

  return (
    <SocialMediaContext.Provider value={value}>
      {children}
    </SocialMediaContext.Provider>
  );
};
